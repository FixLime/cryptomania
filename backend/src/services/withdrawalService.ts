import type { Currency } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { config } from '../lib/config.js';
import { getAdapter } from '../crypto/index.js';
import { audit } from './auditService.js';
import { getUsdRate } from './rateService.js';

export class WithdrawalError extends Error {}

export async function requestWithdrawal(params: {
  userId: string;
  currency: Currency;
  toAddress: string;
  amount: string;
}) {
  const { userId, currency, toAddress, amount } = params;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new WithdrawalError('User not found');
  if (user.status !== 'ACTIVE') throw new WithdrawalError('Account is not active');
  if (user.kycStatus !== 'APPROVED') throw new WithdrawalError('KYC required');

  const adapter = getAdapter(currency);
  if (!adapter.validateAddress(toAddress)) {
    throw new WithdrawalError('Invalid destination address');
  }

  const wallet = await prisma.wallet.findUnique({
    where: { userId_currency: { userId, currency } },
  });
  if (!wallet) throw new WithdrawalError('Wallet not found');

  const amountDec = new Prisma.Decimal(amount);
  if (amountDec.lte(0)) throw new WithdrawalError('Amount must be positive');

  const available = new Prisma.Decimal(wallet.balance.toString()).sub(wallet.lockedBalance.toString());
  if (available.lt(amountDec)) throw new WithdrawalError('Insufficient balance');

  const usdRate = await getUsdRate(currency);
  const usdValue = amountDec.toNumber() * usdRate;
  const requiresApproval = usdValue >= config.security.withdrawalAutoApproveLimitUsd;

  const status = requiresApproval ? 'AWAITING_APPROVAL' : 'APPROVED';

  const tx = await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { lockedBalance: { increment: amountDec } },
    });
    return tx.transaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type: 'WITHDRAWAL',
        status,
        currency,
        amount: amountDec,
        toAddress,
        metadata: { usdValueAtRequest: usdValue },
      },
    });
  });

  await audit({
    actorId: userId,
    action: 'withdrawal.requested',
    entityType: 'Transaction',
    entityId: tx.id,
    metadata: { currency, amount, toAddress, usdValue, requiresApproval },
  });

  return tx;
}

export async function approveWithdrawal(params: {
  adminId: string;
  transactionId: string;
}) {
  const tx = await prisma.transaction.findUnique({ where: { id: params.transactionId } });
  if (!tx) throw new WithdrawalError('Transaction not found');
  if (tx.status !== 'AWAITING_APPROVAL') throw new WithdrawalError('Tx not awaiting approval');

  await prisma.transaction.update({
    where: { id: tx.id },
    data: { status: 'APPROVED', approvedById: params.adminId },
  });

  await audit({
    actorId: params.adminId,
    targetUserId: tx.userId,
    action: 'withdrawal.approved',
    entityType: 'Transaction',
    entityId: tx.id,
  });
}

export async function rejectWithdrawal(params: {
  adminId: string;
  transactionId: string;
  reason: string;
}) {
  const tx = await prisma.transaction.findUnique({ where: { id: params.transactionId } });
  if (!tx) throw new WithdrawalError('Transaction not found');
  if (tx.status !== 'AWAITING_APPROVAL') throw new WithdrawalError('Tx not awaiting approval');

  await prisma.$transaction(async (db) => {
    await db.transaction.update({
      where: { id: tx.id },
      data: { status: 'REJECTED', rejectedReason: params.reason, approvedById: params.adminId },
    });
    await db.wallet.update({
      where: { id: tx.walletId },
      data: { lockedBalance: { decrement: tx.amount } },
    });
  });

  await audit({
    actorId: params.adminId,
    targetUserId: tx.userId,
    action: 'withdrawal.rejected',
    entityType: 'Transaction',
    entityId: tx.id,
    metadata: { reason: params.reason },
  });
}
