import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const CURRENCY_ENUM = z.enum(['TON', 'USDT_TON', 'USDT_TRC20', 'ETH', 'BTC']);

export async function addressBookRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/address-book', async (req) => {
    const items = await prisma.addressBookEntry.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    return { items };
  });

  app.post('/address-book', async (req, reply) => {
    const schema = z.object({
      label: z.string().min(1).max(50),
      currency: CURRENCY_ENUM,
      address: z.string().min(5).max(200),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const item = await prisma.addressBookEntry.create({
      data: { ...parsed.data, userId: req.user!.id },
    });
    return { ok: true, item };
  });

  app.delete('/address-book/:id', async (req) => {
    const id = (req.params as any).id;
    await prisma.addressBookEntry.deleteMany({ where: { id, userId: req.user!.id } });
    return { ok: true };
  });
}
