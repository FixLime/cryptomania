import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { ensureUserWallets } from '../services/walletService.js';
import { getAllRates } from '../services/rateService.js';

export async function meRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/me', async (req) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    return {
      user: {
        id: user!.id,
        telegramId: user!.telegramId,
        username: user!.username,
        firstName: user!.firstName,
        lastName: user!.lastName,
        status: user!.status,
        kycStatus: user!.kycStatus,
        isAdmin: user!.isAdmin,
        fiatCurrency: user!.fiatCurrency,
        hideBalances: user!.hideBalances,
        notifyDeposits: user!.notifyDeposits,
        notifyWithdrawals: user!.notifyWithdrawals,
        hasPin: !!user!.pinHash,
        referralCode: user!.referralCode,
      },
    };
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
    const q = z.object({
      currency: z.enum(['TON', 'USDT_TON', 'USDT_TRC20', 'ETH', 'BTC']).optional(),
      type: z.string().optional(),
      limit: z.coerce.number().min(1).max(500).default(100),
    }).parse(req.query);

    const txs = await prisma.transaction.findMany({
      where: {
        userId: req.user!.id,
        currency: q.currency,
        type: q.type as any,
      },
      orderBy: { createdAt: 'desc' },
      take: q.limit,
    });

    // Подгружаем контрагентов одним запросом
    const counterIds = Array.from(new Set(txs.map((t) => t.counterpartyUserId).filter(Boolean))) as string[];
    const counters = counterIds.length
      ? await prisma.user.findMany({
          where: { id: { in: counterIds } },
          select: { id: true, username: true, firstName: true, telegramId: true },
        })
      : [];
    const counterMap = new Map(counters.map((u) => [u.id, u]));

    return {
      transactions: txs.map((t) => ({
        ...t,
        amount: t.amount.toString(),
        fee: t.fee.toString(),
        blockNumber: t.blockNumber?.toString() ?? null,
        counterparty: t.counterpartyUserId ? counterMap.get(t.counterpartyUserId) : null,
      })),
    };
  });
}
