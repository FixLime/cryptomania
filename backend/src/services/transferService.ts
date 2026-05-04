import { Prisma, type Currency } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { audit } from './auditService.js';
import { tgNotify } from './notify.js';

export class TransferError extends Error {}

/** Внутренний перевод между пользователями (без on-chain, мгновенно, без комиссии). */
export async function internalTransfer(params: {
  fromUserId: string;
  toUsernameOrId: string; // @username или telegramId
  currency: Currency;
  amount: string;
  note?: string;
}) {
  const { fromUserId, toUsernameOrId, currency, amount, note } = params;
  const target = toUsernameOrId.replace(/^@/, '').trim();

  const recipient = await prisma.user.findFirst({
    where: { OR: [{ username: target }, { telegramId: target }] },
  });
  if (!recipient) throw new TransferError('Получатель не найден');
  if (recipient.id === fromUserId) throw new TransferError('Нельзя отправить себе');
  if (recipient.status === 'BANNED') throw new TransferError('Аккаунт получателя заблокирован');

  const amountDec = new Prisma.Decimal(amount);
  if (amountDec.lte(0)) throw new TransferError('Сумма должна быть положительной');

  const fromWallet = await prisma.wallet.findUnique({
    where: { userId_currency: { userId: fromUserId, currency } },
  });
  if (!fromWallet) throw new TransferError('Кошелёк не найден');

  const available = new Prisma.Decimal(fromWallet.balance.toString()).sub(fromWallet.lockedBalance.toString());
  if (available.lt(amountDec)) throw new TransferError('Недостаточно средств');

  // Гарантируем кошелёк у получателя
  let toWallet = await prisma.wallet.findUnique({
    where: { userId_currency: { userId: recipient.id, currency } },
  });
  if (!toWallet) {
    // Создадим заглушку (без приватника) — реальный сгенерим при первом заходе получателя
    toWallet = await prisma.wallet.create({
      data: { userId: recipient.id, currency, address: `internal:${recipient.id}:${currency}` },
    });
  }

  const result = await prisma.$transaction(async (tx) => {
    const out = await tx.transaction.create({
      data: {
        userId: fromUserId,
        walletId: fromWallet.id,
        type: 'INTERNAL_OUT',
        status: 'CONFIRMED',
        currency,
        amount: amountDec,
        counterpartyUserId: recipient.id,
        note,
      },
    });
    const incoming = await tx.transaction.create({
      data: {
        userId: recipient.id,
        walletId: toWallet!.id,
        type: 'INTERNAL_IN',
        status: 'CONFIRMED',
        currency,
        amount: amountDec,
        counterpartyUserId: fromUserId,
        pairedTxId: out.id,
        note,
      },
    });
    await tx.transaction.update({ where: { id: out.id }, data: { pairedTxId: incoming.id } });
    await tx.wallet.update({ where: { id: fromWallet.id }, data: { balance: { decrement: amountDec } } });
    await tx.wallet.update({ where: { id: toWallet!.id }, data: { balance: { increment: amountDec } } });
    return { out, incoming };
  });

  await audit({
    actorId: fromUserId,
    targetUserId: recipient.id,
    action: 'transfer.internal',
    entityType: 'Transaction',
    entityId: result.out.id,
    metadata: { currency, amount },
  });

  // Уведомления
  if (recipient.notifyDeposits) {
    tgNotify(
      recipient.telegramId,
      `💰 <b>+${amount} ${currency.replace('_', ' ')}</b>\nВнутренний перевод от пользователя`,
    );
  }

  return result;
}

/** Обмен внутри кошелька (мгновенно по курсу из rateService). */
export async function swap(params: {
  userId: string;
  fromCurrency: Currency;
  toCurrency: Currency;
  fromAmount: string;
  rate: number; // toAmount = fromAmount * rate
}) {
  const { userId, fromCurrency, toCurrency, fromAmount, rate } = params;
  if (fromCurrency === toCurrency) throw new TransferError('Одинаковые валюты');
  if (rate <= 0) throw new TransferError('Некорректный курс');

  const amountDec = new Prisma.Decimal(fromAmount);
  if (amountDec.lte(0)) throw new TransferError('Сумма должна быть положительной');

  const fromWallet = await prisma.wallet.findUnique({
    where: { userId_currency: { userId, currency: fromCurrency } },
  });
  if (!fromWallet) throw new TransferError('Исходный кошелёк не найден');

  const available = new Prisma.Decimal(fromWallet.balance.toString()).sub(fromWallet.lockedBalance.toString());
  if (available.lt(amountDec)) throw new TransferError('Недостаточно средств');

  const toWallet = await prisma.wallet.findUnique({
    where: { userId_currency: { userId, currency: toCurrency } },
  });
  if (!toWallet) throw new TransferError('Целевой кошелёк не найден');

  // 0.3% комиссия за обмен
  const FEE_RATE = 0.003;
  const grossOut = amountDec.toNumber() * rate;
  const fee = grossOut * FEE_RATE;
  const toAmount = new Prisma.Decimal(grossOut - fee);

  const result = await prisma.$transaction(async (tx) => {
    const out = await tx.transaction.create({
      data: {
        userId, walletId: fromWallet.id,
        type: 'SWAP_OUT', status: 'CONFIRMED',
        currency: fromCurrency, amount: amountDec,
        metadata: { rate, fee, toCurrency },
      },
    });
    const incoming = await tx.transaction.create({
      data: {
        userId, walletId: toWallet.id,
        type: 'SWAP_IN', status: 'CONFIRMED',
        currency: toCurrency, amount: toAmount,
        pairedTxId: out.id,
        metadata: { rate, fee, fromCurrency },
      },
    });
    await tx.transaction.update({ where: { id: out.id }, data: { pairedTxId: incoming.id } });
    await tx.wallet.update({ where: { id: fromWallet.id }, data: { balance: { decrement: amountDec } } });
    await tx.wallet.update({ where: { id: toWallet.id }, data: { balance: { increment: toAmount } } });
    return { out, incoming, toAmount: toAmount.toString(), fee };
  });

  await audit({
    actorId: userId,
    action: 'swap.completed',
    entityType: 'Transaction',
    entityId: result.out.id,
    metadata: { fromCurrency, toCurrency, fromAmount, toAmount: result.toAmount, rate, fee },
  });

  return result;
}
