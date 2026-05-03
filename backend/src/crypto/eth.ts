import { ethers, Wallet, JsonRpcProvider, formatEther, parseEther, isAddress } from 'ethers';
import { config } from '../lib/config.js';
import type { CryptoAdapter, GeneratedWallet, IncomingTx, SendResult } from './types.js';

const provider = new JsonRpcProvider(config.eth.rpcUrl);

export const ethAdapter: CryptoAdapter = {
  currency: 'ETH',
  minConfirmations: 12,

  async generateAddress(): Promise<GeneratedWallet> {
    const w = Wallet.createRandom();
    return { address: w.address, privateKey: w.privateKey };
  },

  async getBalance(address: string): Promise<string> {
    const balance = await provider.getBalance(address);
    return formatEther(balance);
  },

  async sendFromHot(toAddress: string, amount: string): Promise<SendResult> {
    if (!config.eth.hotWalletPrivateKey) throw new Error('ETH hot wallet not configured');
    const wallet = new Wallet(config.eth.hotWalletPrivateKey, provider);
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: parseEther(amount),
    });
    return { txHash: tx.hash, fee: '0' };
  },

  async scanIncoming(addresses: string[]): Promise<IncomingTx[]> {
    // Простой подход: проверяем последние блоки. В проде лучше Etherscan API или собственный node + log subscriptions.
    const results: IncomingTx[] = [];
    const latest = await provider.getBlockNumber();
    const set = new Set(addresses.map((a) => a.toLowerCase()));
    for (let i = 0; i < 5; i++) {
      const block = await provider.getBlock(latest - i, true);
      if (!block) continue;
      for (const txHash of block.transactions) {
        const tx = await provider.getTransaction(txHash);
        if (!tx?.to) continue;
        if (set.has(tx.to.toLowerCase())) {
          results.push({
            txHash: tx.hash,
            toAddress: tx.to,
            amount: formatEther(tx.value),
            blockNumber: tx.blockNumber ?? undefined,
            confirmations: latest - (tx.blockNumber ?? latest),
          });
        }
      }
    }
    return results;
  },

  validateAddress(address: string): boolean {
    return isAddress(address);
  },
};
