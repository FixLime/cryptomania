import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { audit } from '../services/auditService.js';

function hashPin(pin: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${pin}`).digest('hex');
}

export async function settingsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.patch('/settings', async (req, reply) => {
    const schema = z.object({
      fiatCurrency: z.enum(['USD', 'EUR', 'RUB']).optional(),
      hideBalances: z.boolean().optional(),
      notifyDeposits: z.boolean().optional(),
      notifyWithdrawals: z.boolean().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    await prisma.user.update({ where: { id: req.user!.id }, data: parsed.data });
    return { ok: true };
  });

  app.post('/settings/pin', async (req, reply) => {
    const schema = z.object({
      pin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4-6 digits'),
      currentPin: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (user?.pinHash) {
      if (!parsed.data.currentPin) return reply.code(400).send({ error: 'Введите текущий PIN' });
      if (hashPin(parsed.data.currentPin, user.id) !== user.pinHash) {
        return reply.code(400).send({ error: 'Неверный PIN' });
      }
    }

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { pinHash: hashPin(parsed.data.pin, req.user!.id) },
    });
    await audit({ actorId: req.user!.id, action: 'pin.set' });
    return { ok: true };
  });

  app.delete('/settings/pin', async (req, reply) => {
    const schema = z.object({ pin: z.string() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'PIN required' });
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user?.pinHash || hashPin(parsed.data.pin, user.id) !== user.pinHash) {
      return reply.code(400).send({ error: 'Неверный PIN' });
    }
    await prisma.user.update({ where: { id: req.user!.id }, data: { pinHash: null } });
    await audit({ actorId: req.user!.id, action: 'pin.removed' });
    return { ok: true };
  });

  app.post('/settings/pin/verify', async (req, reply) => {
    const schema = z.object({ pin: z.string() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ ok: false });
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user?.pinHash) return { ok: true };
    return { ok: hashPin(parsed.data.pin, user.id) === user.pinHash };
  });
}
