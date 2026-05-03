import type { Currency } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { encryptSecret } from '../lib/crypto.js';
import { getAdapter, SUPPORTED_CURRENCIES } from '../crypto/index.js';

/** Возвращает все кошельки пользователя, создавая отсутствующие. */
export async function ensureUserWallets(userId: string) {
  const existing = await prisma.wallet.findMany({ where: { userId } });
  const existingCurrencies = new Set(existing.map((w) => w.currency));

  const toCreate = SUPPORTED_CURRENCIES.filter((c) => !existingCurrencies.has(c));
  for (const currency of toCreate) {
    const adapter = getAdapter(currency);
    try {
      const generated = await adapter.generateAddress();
      await prisma.wallet.create({
        data: {
          userId,
          currency,
          address: generated.address,
          encryptedPrivateKey: encryptSecret(generated.privateKey),
          derivationPath: generated.derivationPath,
        },
      });
    } catch (e) {
      console.error(`Failed to create ${currency} wallet`, e);
    }
  }

  return prisma.wallet.findMany({ where: { userId }, orderBy: { currency: 'asc' } });
}

export async function getWalletForCurrency(userId: string, currency: Currency) {
  return prisma.wallet.findUnique({
    where: { userId_currency: { userId, currency } },
  });
}
