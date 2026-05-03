import 'dotenv/config';

function req(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env: ${key}`);
  return v;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  bot: {
    token: req('BOT_TOKEN'),
    webappUrl: req('WEBAPP_URL'),
    adminTelegramIds: (process.env.ADMIN_TELEGRAM_IDS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
  db: {
    url: req('DATABASE_URL'),
  },
  security: {
    masterKeyHex: req('MASTER_ENCRYPTION_KEY'),
    withdrawalAutoApproveLimitUsd: Number(
      process.env.WITHDRAWAL_AUTO_APPROVE_LIMIT_USD ?? 100,
    ),
  },
  ton: {
    apiKey: process.env.TON_API_KEY ?? '',
    network: (process.env.TON_NETWORK ?? 'mainnet') as 'mainnet' | 'testnet',
    hotWalletMnemonic: process.env.TON_HOT_WALLET_MNEMONIC ?? '',
  },
  tron: {
    fullHost: process.env.TRON_FULL_HOST ?? 'https://api.trongrid.io',
    apiKey: process.env.TRONGRID_API_KEY ?? '',
    hotWalletPrivateKey: process.env.TRON_HOT_WALLET_PRIVATE_KEY ?? '',
  },
  eth: {
    rpcUrl: process.env.ETH_RPC_URL ?? 'https://eth.llamarpc.com',
    hotWalletPrivateKey: process.env.ETH_HOT_WALLET_PRIVATE_KEY ?? '',
  },
  btc: {
    network: (process.env.BTC_NETWORK ?? 'mainnet') as 'mainnet' | 'testnet',
    rpcUrl: process.env.BTC_RPC_URL ?? '',
    hotWalletWif: process.env.BTC_HOT_WALLET_WIF ?? '',
  },
};
