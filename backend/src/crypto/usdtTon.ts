import { mnemonicNew } from '@ton/crypto';
import { Address, fromNano } from '@ton/core';
import { TonClient, JettonMaster, JettonWallet, WalletContractV4 } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { config } from '../lib/config.js';
import type { CryptoAdapter, GeneratedWallet, IncomingTx, SendResult } from './types.js';

const USDT_JETTON_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs'; // USDT TON

const endpoint = config.ton.network === 'mainnet'
  ? 'https://toncenter.com/api/v2/jsonRPC'
  : 'https://testnet.toncenter.com/api/v2/jsonRPC';
const client = new TonClient({ endpoint, apiKey: config.ton.apiKey || undefined });

async function getJettonWalletAddress(owner: Address): Promise<Address> {
  const master = client.open(JettonMaster.create(Address.parse(USDT_JETTON_MASTER)));
  return master.getWalletAddress(owner);
}

export const usdtTonAdapter: CryptoAdapter = {
  currency: 'USDT_TON',
  minConfirmations: 1,

  async generateAddress(): Promise<GeneratedWallet> {
    const mnemonic = await mnemonicNew(24);
    const kp = await mnemonicToPrivateKey(mnemonic);
    const wallet = WalletContractV4.create({ workchain: 0, publicKey: kp.publicKey });
    return {
      address: wallet.address.toString({ bounceable: false }),
      privateKey: mnemonic.join(' '),
    };
  },

  async getBalance(address: string): Promise<string> {
    try {
      const owner = Address.parse(address);
      const jettonWalletAddr = await getJettonWalletAddress(owner);
      const jw = client.open(JettonWallet.create(jettonWalletAddr));
      const data = await jw.getBalance();
      return (Number(data) / 1e6).toString();
    } catch {
      return '0';
    }
  },

  async sendFromHot(_toAddress: string, _amount: string): Promise<SendResult> {
    // Для production: построить jetton transfer message и отправить через хот-кошелёк
    throw new Error('USDT-TON send: TODO — implement Jetton transfer message');
  },

  async scanIncoming(addresses: string[]): Promise<IncomingTx[]> {
    const results: IncomingTx[] = [];
    for (const addr of addresses) {
      try {
        const owner = Address.parse(addr);
        const jettonWalletAddr = await getJettonWalletAddress(owner);
        const txs = await client.getTransactions(jettonWalletAddr, { limit: 10 });
        for (const tx of txs) {
          // Парсинг jetton transfer notifications — упрощённый
          const inMsg = tx.inMessage;
          if (!inMsg) continue;
          results.push({
            txHash: tx.hash().toString('hex'),
            toAddress: addr,
            amount: '0', // TODO: распарсить amount из jetton notification body
            confirmations: 1,
          });
        }
      } catch {
        // skip
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
