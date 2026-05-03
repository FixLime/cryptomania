import { mnemonicNew, mnemonicToPrivateKey } from '@ton/crypto';
import { TonClient, WalletContractV4, internal, fromNano, toNano } from '@ton/ton';
import { Address } from '@ton/core';
import { config } from '../lib/config.js';
import { decryptSecret } from '../lib/crypto.js';
import type { CryptoAdapter, GeneratedWallet, IncomingTx, SendResult } from './types.js';

const endpoint = config.ton.network === 'mainnet'
  ? 'https://toncenter.com/api/v2/jsonRPC'
  : 'https://testnet.toncenter.com/api/v2/jsonRPC';

const client = new TonClient({ endpoint, apiKey: config.ton.apiKey || undefined });

async function walletFromMnemonic(mnemonic: string) {
  const words = mnemonic.trim().split(/\s+/);
  const keyPair = await mnemonicToPrivateKey(words);
  const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
  return { wallet, keyPair };
}

export const tonAdapter: CryptoAdapter = {
  currency: 'TON',
  minConfirmations: 1,

  async generateAddress(): Promise<GeneratedWallet> {
    const mnemonic = await mnemonicNew(24);
    const { wallet } = await walletFromMnemonic(mnemonic.join(' '));
    return {
      address: wallet.address.toString({ bounceable: false }),
      privateKey: mnemonic.join(' '),
    };
  },

  async getBalance(address: string): Promise<string> {
    const balance = await client.getBalance(Address.parse(address));
    return fromNano(balance);
  },

  async sendFromHot(toAddress: string, amount: string): Promise<SendResult> {
    if (!config.ton.hotWalletMnemonic) throw new Error('TON hot wallet not configured');
    const { wallet, keyPair } = await walletFromMnemonic(config.ton.hotWalletMnemonic);
    const contract = client.open(wallet);
    const seqno = await contract.getSeqno();
    await contract.sendTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      messages: [internal({ to: toAddress, value: toNano(amount), bounce: false })],
    });
    // TonClient does not return tx hash directly here; in production track via getTransactions
    return { txHash: `pending-${Date.now()}`, fee: '0.005' };
  },

  async scanIncoming(addresses: string[]): Promise<IncomingTx[]> {
    const results: IncomingTx[] = [];
    for (const addr of addresses) {
      try {
        const txs = await client.getTransactions(Address.parse(addr), { limit: 10 });
        for (const tx of txs) {
          const inMsg = tx.inMessage;
          if (!inMsg || inMsg.info.type !== 'internal') continue;
          if (inMsg.info.value.coins === 0n) continue;
          results.push({
            txHash: tx.hash().toString('hex'),
            toAddress: addr,
            amount: fromNano(inMsg.info.value.coins),
            blockNumber: undefined,
            confirmations: 1,
          });
        }
      } catch {
        // skip address on error
      }
    }
    return results;
  },

  validateAddress(address: string): boolean {
    try {
      Address.parse(address);
      return true;
    } catch {
      return false;
    }
  },
};

/** Helper for unlocking a per-user TON wallet (used internally if нужно делать Sweeping). */
export async function unlockUserTonWallet(encryptedMnemonic: string) {
  const mnemonic = decryptSecret(encryptedMnemonic);
  return walletFromMnemonic(mnemonic);
}
