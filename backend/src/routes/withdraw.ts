import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { requestWithdrawal, WithdrawalError } from '../services/withdrawalService.js';

const schema = z.object({
  currency: z.enum(['TON', 'USDT_TON', 'USDT_TRC20', 'ETH', 'BTC']),
  toAddress: z.string().min(10).max(200),
  amount: z.string().regex(/^\d+(\.\d+)?$/),
});

export async function withdrawRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.post('/withdraw', async (req, reply) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    try {
      const tx = await requestWithdrawal({
        userId: req.user!.id,
        currency: parsed.data.currency,
        toAddress: parsed.data.toAddress,
        amount: parsed.data.amount,
      });
      return {
        ok: true,
        transactionId: tx.id,
        status: tx.status,
        requiresApproval: tx.status === 'AWAITING_APPROVAL',
      };
    } catch (e) {
      if (e instanceof WithdrawalError) return reply.code(400).send({ error: e.message });
      throw e;
    }
  });
}
