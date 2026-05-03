import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { adminOnly } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { audit } from '../services/auditService.js';
import { approveWithdrawal, rejectWithdrawal } from '../services/withdrawalService.js';

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', adminOnly);

  // === USERS ===
  app.get('/admin/users', async (req) => {
    const q = (req.query as any).q as string | undefined;
    const users = await prisma.user.findMany({
      where: q
        ? {
            OR: [
              { telegramId: { contains: q } },
              { username: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { _count: { select: { transactions: true, wallets: true } } },
    });
    return { users };
  });

  app.get('/admin/users/:id', async (req) => {
    const id = (req.params as any).id;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        wallets: true,
        transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
        kycSubmissions: { orderBy: { createdAt: 'desc' } },
      },
    });
    return { user };
  });

  app.post('/admin/users/:id/freeze', async (req) => {
    const id = (req.params as any).id;
    await prisma.user.update({ where: { id }, data: { status: 'FROZEN' } });
    await audit({ actorId: req.user!.id, targetUserId: id, action: 'user.frozen' });
    return { ok: true };
  });

  app.post('/admin/users/:id/unfreeze', async (req) => {
    const id = (req.params as any).id;
    await prisma.user.update({ where: { id }, data: { status: 'ACTIVE' } });
    await audit({ actorId: req.user!.id, targetUserId: id, action: 'user.unfrozen' });
    return { ok: true };
  });

  app.post('/admin/users/:id/ban', async (req) => {
    const id = (req.params as any).id;
    await prisma.user.update({ where: { id }, data: { status: 'BANNED' } });
    await audit({ actorId: req.user!.id, targetUserId: id, action: 'user.banned' });
    return { ok: true };
  });

  // === KYC ===
  app.get('/admin/kyc/pending', async () => {
    const subs = await prisma.kycSubmission.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: { user: true },
    });
    return { submissions: subs };
  });

  app.post('/admin/kyc/:id/approve', async (req) => {
    const id = (req.params as any).id;
    const sub = await prisma.kycSubmission.update({
      where: { id },
      data: { status: 'APPROVED', reviewedById: req.user!.id, reviewedAt: new Date() },
    });
    await prisma.user.update({ where: { id: sub.userId }, data: { kycStatus: 'APPROVED' } });
    await audit({
      actorId: req.user!.id,
      targetUserId: sub.userId,
      action: 'kyc.approved',
      entityId: id,
    });
    return { ok: true };
  });

  app.post('/admin/kyc/:id/reject', async (req) => {
    const id = (req.params as any).id;
    const body = z.object({ reason: z.string().min(2) }).parse(req.body);
    const sub = await prisma.kycSubmission.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectReason: body.reason,
        reviewedById: req.user!.id,
        reviewedAt: new Date(),
      },
    });
    await prisma.user.update({ where: { id: sub.userId }, data: { kycStatus: 'REJECTED' } });
    await audit({
      actorId: req.user!.id,
      targetUserId: sub.userId,
      action: 'kyc.rejected',
      entityId: id,
      metadata: { reason: body.reason },
    });
    return { ok: true };
  });

  // === WITHDRAWALS ===
  app.get('/admin/withdrawals/pending', async () => {
    const txs = await prisma.transaction.findMany({
      where: { type: 'WITHDRAWAL', status: 'AWAITING_APPROVAL' },
      orderBy: { createdAt: 'asc' },
      include: { user: true },
    });
    return {
      transactions: txs.map((t) => ({
        ...t,
        amount: t.amount.toString(),
        fee: t.fee.toString(),
      })),
    };
  });

  app.post('/admin/withdrawals/:id/approve', async (req, reply) => {
    const id = (req.params as any).id;
    try {
      await approveWithdrawal({ adminId: req.user!.id, transactionId: id });
      return { ok: true };
    } catch (e: any) {
      return reply.code(400).send({ error: e.message });
    }
  });

  app.post('/admin/withdrawals/:id/reject', async (req, reply) => {
    const id = (req.params as any).id;
    const body = z.object({ reason: z.string().min(2) }).parse(req.body);
    try {
      await rejectWithdrawal({ adminId: req.user!.id, transactionId: id, reason: body.reason });
      return { ok: true };
    } catch (e: any) {
      return reply.code(400).send({ error: e.message });
    }
  });

  // === AUDIT ===
  app.get('/admin/audit', async (req) => {
    const { limit = '100', action, userId } = req.query as any;
    const logs = await prisma.auditLog.findMany({
      where: {
        action: action ? { contains: String(action) } : undefined,
        OR: userId
          ? [{ actorId: String(userId) }, { targetUserId: String(userId) }]
          : undefined,
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(limit), 500),
      include: { actor: true, targetUser: true },
    });
    return { logs };
  });

  // === STATS ===
  app.get('/admin/stats', async () => {
    const [users, pendingKyc, pendingWithdrawals, totalTxs] = await Promise.all([
      prisma.user.count(),
      prisma.kycSubmission.count({ where: { status: 'PENDING' } }),
      prisma.transaction.count({ where: { status: 'AWAITING_APPROVAL' } }),
      prisma.transaction.count(),
    ]);
    return { users, pendingKyc, pendingWithdrawals, totalTxs };
  });
}
