import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { internalTransfer, swap, TransferError } from '../services/transferService.js';
import { getUsdRate } from '../services/rateService.js';
import { prisma } from '../lib/prisma.js';

const CURRENCY_ENUM = z.enum(['TON', 'USDT_TON', 'USDT_TRC20', 'ETH', 'BTC']);

export async function transferRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  // Внутренний перевод по @username или telegramId
  app.post('/transfer', async (req, reply) => {
    const schema = z.object({
      to: z.string().min(2),
      currency: CURRENCY_ENUM,
      amount: z.string().regex(/^\d+(\.\d+)?$/),
      note: z.string().max(200).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    try {
      const r = await internalTransfer({
        fromUserId: req.user!.id,
        toUsernameOrId: parsed.data.to,
        currency: parsed.data.currency,
        amount: parsed.data.amount,
        note: parsed.data.note,
      });
      return { ok: true, transactionId: r.out.id };
    } catch (e) {
      if (e instanceof TransferError) return reply.code(400).send({ error: e.message });
      throw e;
    }
  });

  // Поиск пользователя по @username для автокомплита
  app.get('/users/lookup', async (req) => {
    const q = String((req.query as any).q ?? '').replace(/^@/, '').trim();
    if (q.length < 2) return { users: [] };
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { telegramId: q },
        ],
        status: { not: 'BANNED' },
        id: { not: req.user!.id },
      },
      select: { id: true, telegramId: true, username: true, firstName: true, lastName: true },
      take: 10,
    });
    return { users };
  });

  // Получить курс пары для swap
  app.get('/swap/quote', async (req) => {
    const schema = z.object({
      from: CURRENCY_ENUM,
      to: CURRENCY_ENUM,
      amount: z.string().regex(/^\d+(\.\d+)?$/),
    });
    const parsed = schema.parse(req.query);
    const fromUsd = await getUsdRate(parsed.from);
    const toUsd = await getUsdRate(parsed.to);
    if (fromUsd <= 0 || toUsd <= 0) throw new Error('Rate unavailable');
    const rate = fromUsd / toUsd;
    const grossOut = Number(parsed.amount) * rate;
    const fee = grossOut * 0.003;
    return {
      rate,
      fromAmount: parsed.amount,
      toAmount: (grossOut - fee).toString(),
      feePercent: 0.3,
      feeAmount: fee.toString(),
    };
  });

  // Выполнить swap
  app.post('/swap', async (req, reply) => {
    const schema = z.object({
      from: CURRENCY_ENUM,
      to: CURRENCY_ENUM,
      amount: z.string().regex(/^\d+(\.\d+)?$/),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const fromUsd = await getUsdRate(parsed.data.from);
    const toUsd = await getUsdRate(parsed.data.to);
    if (fromUsd <= 0 || toUsd <= 0) return reply.code(400).send({ error: 'Rate unavailable' });
    const rate = fromUsd / toUsd;

    try {
      const r = await swap({
        userId: req.user!.id,
        fromCurrency: parsed.data.from,
        toCurrency: parsed.data.to,
        fromAmount: parsed.data.amount,
        rate,
      });
      return { ok: true, toAmount: r.toAmount, fee: r.fee };
    } catch (e) {
      if (e instanceof TransferError) return reply.code(400).send({ error: e.message });
      throw e;
    }
  });
}
