import type { FastifyInstance } from 'fastify';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { audit } from '../services/auditService.js';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads', 'kyc');

export async function kycRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/kyc/status', async (req) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    const latest = await prisma.kycSubmission.findFirst({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    return { status: user?.kycStatus, latest };
  });

  app.post('/kyc/submit', async (req, reply) => {
    const parts = req.parts();
    let fullName = '';
    let documentType = '';
    let documentNumber = '';
    let docPath = '';
    let selfiePath = '';

    await mkdir(path.join(UPLOADS_DIR, req.user!.id), { recursive: true });

    for await (const part of parts) {
      if (part.type === 'file') {
        const buf = await part.toBuffer();
        if (buf.length > 5 * 1024 * 1024) return reply.code(400).send({ error: 'File too large (max 5MB)' });
        const filename = `${part.fieldname}_${Date.now()}_${part.filename}`;
        const fullPath = path.join(UPLOADS_DIR, req.user!.id, filename);
        await writeFile(fullPath, buf);
        if (part.fieldname === 'document') docPath = fullPath;
        else if (part.fieldname === 'selfie') selfiePath = fullPath;
      } else {
        if (part.fieldname === 'fullName') fullName = String(part.value ?? '');
        if (part.fieldname === 'documentType') documentType = String(part.value ?? '');
        if (part.fieldname === 'documentNumber') documentNumber = String(part.value ?? '');
      }
    }

    if (!fullName || !documentType || !documentNumber || !docPath || !selfiePath) {
      return reply.code(400).send({ error: 'Missing required fields' });
    }

    const submission = await prisma.kycSubmission.create({
      data: {
        userId: req.user!.id,
        fullName,
        documentType,
        documentNumber,
        documentPhotoPath: docPath,
        selfiePhotoPath: selfiePath,
      },
    });

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { kycStatus: 'PENDING' },
    });

    await audit({
      actorId: req.user!.id,
      action: 'kyc.submitted',
      entityType: 'KycSubmission',
      entityId: submission.id,
    });

    return { ok: true, submissionId: submission.id };
  });
}
