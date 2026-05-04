import { prisma } from '../lib/prisma.js';
import { getAdapter } from '../crypto/index.js';
import { audit } from '../services/auditService.js';
import { tgNotify } from '../services/notify.js';

export async function withdrawalProcessor() {
  const pending = await prisma.transaction.findMany({
    where: { type: 'WITHDRAWAL', status: 'APPROVED' },
    take: 20,
  });

  for (const tx of pending) {
    try {
      await prisma.transaction.update({
        where: { id: tx.id },
        data: { status: 'BROADCASTING' },
      });

      const adapter = getAdapter(tx.currency);
      const result = await adapter.sendFromHot(tx.toAddress!, tx.amount.toString());

      await prisma.$transaction(async (db) => {
        await db.transaction.update({
          where: { id: tx.id },
          data: {
            status: 'CONFIRMED',
            txHash: result.txHash,
            fee: result.fee,
          },
        });
        await db.wallet.update({
          where: { id: tx.walletId },
          data: {
            balance: { decrement: tx.amount },
            lockedBalance: { decrement: tx.amount },
          },
        });
      });

      await audit({
        targetUserId: tx.userId,
        action: 'withdrawal.sent',
        entityType: 'Transaction',
        entityId: tx.id,
        metadata: { txHash: result.txHash },
      });

      const u = await prisma.user.findUnique({ where: { id: tx.userId } });
      if (u?.notifyWithdrawals) {
        tgNotify(u.telegramId, `📤 <b>Вывод выполнен</b>\n−${tx.amount} ${tx.currency.replace('_', ' ')}\n<code>${result.txHash}</code>`);
      }
    } catch (e: any) {
      console.error('[withdrawalProcessor]', tx.id, e);
      await prisma.transaction.update({
        where: { id: tx.id },
        data: { status: 'FAILED', rejectedReason: String(e?.message ?? e) },
      });
    }
  }
}
