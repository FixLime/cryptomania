// @ts-ignore - tronweb has incomplete type defs in some versions
import { TronWeb } from 'tronweb';
import { config } from '../lib/config.js';
import type { CryptoAdapter, GeneratedWallet, IncomingTx, SendResult } from './types.js';

const USDT_TRC20_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

const tronWeb = new TronWeb({
  fullHost: config.tron.fullHost,
  headers: config.tron.apiKey ? { 'TRON-PRO-API-KEY': config.tron.apiKey } : {},
  privateKey: config.tron.hotWalletPrivateKey || undefined,
});

export const tronUsdtAdapter: CryptoAdapter = {
  currency: 'USDT_TRC20',
  minConfirmations: 19,

  async generateAddress(): Promise<GeneratedWallet> {
    const acc = await TronWeb.createAccount();
    return { address: acc.address.base58, privateKey: acc.privateKey };
  },

  async getBalance(address: string): Promise<string> {
    const contract = await tronWeb.contract().at(USDT_TRC20_CONTRACT);
    const raw = await contract.balanceOf(address).call();
    // USDT TRC-20 имеет 6 decimals
    return (Number(raw.toString()) / 1e6).toString();
  },

  async sendFromHot(toAddress: string, amount: string): Promise<SendResult> {
    if (!config.tron.hotWalletPrivateKey) throw new Error('TRON hot wallet not configured');
    const contract = await tronWeb.contract().at(USDT_TRC20_CONTRACT);
    const amountUnits = Math.floor(Number(amount) * 1e6);
    const tx = await contract.transfer(toAddress, amountUnits).send();
    return { txHash: tx, fee: '1' };
  },

  async scanIncoming(addresses: string[]): Promise<IncomingTx[]> {
    const results: IncomingTx[] = [];
    for (const addr of addresses) {
      try {
        const url = `${config.tron.fullHost}/v1/accounts/${addr}/transactions/trc20?limit=20&contract_address=${USDT_TRC20_CONTRACT}`;
        const headers: Record<string, string> = {};
        if (config.tron.apiKey) headers['TRON-PRO-API-KEY'] = config.tron.apiKey;
        const res = await fetch(url, { headers });
        const data: any = await res.json();
        for (const tx of data.data ?? []) {
          if (tx.to !== addr) continue;
          results.push({
            txHash: tx.transaction_id,
            toAddress: addr,
            amount: (Number(tx.value) / 1e6).toString(),
            blockNumber: tx.block_timestamp,
            confirmations: 20,
          });
        }
      } catch {
        // skip
      }
    }
    return results;
  },

  validateAddress(address: string): boolean {
    return TronWeb.isAddress(address);
  },
};
