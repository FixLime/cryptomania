import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { ensureUserWallets } from '../services/walletService.js';
import { getAllRates } from '../services/rateService.js';

export async function meRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/me', async (req) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    return { user };
  });

  app.get('/me/wallets', async (req) => {
    const wallets = await ensureUserWallets(req.user!.id);
    const rates = await getAllRates();
    return {
      wallets: wallets.map((w) => ({
        id: w.id,
        currency: w.currency,
        address: w.address,
        balance: w.balance.toString(),
        lockedBalance: w.lockedBalance.toString(),
        usdRate: rates[w.currency],
        usdValue: Number(w.balance.toString()) * rates[w.currency],
      })),
    };
  });

  app.get('/me/transactions', async (req) => {
    const txs = await prisma.transaction.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return {
      transactions: txs.map((t) => ({
        ...t,
        amount: t.amount.toString(),
        fee: t.fee.toString(),
        blockNumber: t.blockNumber?.toString() ?? null,
      })),
    };
  });
}
