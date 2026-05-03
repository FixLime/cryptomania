import { Prisma } from '@prisma/client';
import type { Currency } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { adapters, SUPPORTED_CURRENCIES } from '../crypto/index.js';
import { audit } from '../services/auditService.js';

export async function depositMonitor() {
  for (const currency of SUPPORTED_CURRENCIES) {
    const wallets = await prisma.wallet.findMany({ where: { currency } });
    if (wallets.length === 0) continue;
    const adapter = adapters[currency];
    const addressToWallet = new Map(wallets.map((w) => [w.address, w]));

    let incoming;
    try {
      incoming = await adapter.scanIncoming(wallets.map((w) => w.address));
    } catch (e) {
      console.error(`[depositMonitor:${currency}] scan failed`, e);
      continue;
    }

    for (const tx of incoming) {
      if (tx.confirmations < adapter.minConfirmations) continue;
      const wallet = addressToWallet.get(tx.toAddress);
      if (!wallet) continue;

      const existing = await prisma.transaction.findFirst({ where: { txHash: tx.txHash } });
      if (existing) continue;

      const amountDec = new Prisma.Decimal(tx.amount);
      if (amountDec.lte(0)) continue;

      await prisma.$transaction(async (db) => {
        await db.transaction.create({
          data: {
            userId: wallet.userId,
            walletId: wallet.id,
            type: 'DEPOSIT',
            status: 'CONFIRMED',
            currency,
            amount: amountDec,
            toAddress: tx.toAddress,
            txHash: tx.txHash,
            blockNumber: tx.blockNumber ? BigInt(tx.blockNumber) : null,
            confirmations: tx.confirmations,
          },
        });
        await db.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: amountDec } },
        });
      });

      await audit({
        targetUserId: wallet.userId,
        action: 'deposit.credited',
        entityType: 'Transaction',
        metadata: { currency, amount: tx.amount, txHash: tx.txHash },
      });

      console.log(`[deposit] +${tx.amount} ${currency} -> user ${wallet.userId}`);
    }
  }
}
