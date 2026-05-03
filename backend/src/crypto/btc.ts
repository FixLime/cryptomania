import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { config } from '../lib/config.js';
import type { CryptoAdapter, GeneratedWallet, IncomingTx, SendResult } from './types.js';

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

const network = config.btc.network === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
const apiBase = config.btc.network === 'mainnet'
  ? 'https://blockstream.info/api'
  : 'https://blockstream.info/testnet/api';

export const btcAdapter: CryptoAdapter = {
  currency: 'BTC',
  minConfirmations: 3,

  async generateAddress(): Promise<GeneratedWallet> {
    const keyPair = ECPair.makeRandom({ network });
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: Buffer.from(keyPair.publicKey),
      network,
    });
    if (!address) throw new Error('Failed to generate BTC address');
    return { address, privateKey: keyPair.toWIF() };
  },

  async getBalance(address: string): Promise<string> {
    const res = await fetch(`${apiBase}/address/${address}`);
    const data: any = await res.json();
    const sats =
      (data.chain_stats?.funded_txo_sum ?? 0) - (data.chain_stats?.spent_txo_sum ?? 0);
    return (sats / 1e8).toString();
  },

  async sendFromHot(_toAddress: string, _amount: string): Promise<SendResult> {
    // Полноценная отправка BTC требует UTXO selection + подписание + broadcast.
    // Для MVP: заглушка. Продакшн — использовать собственный node или сервис типа Blockstream Esplora с подписанием.
    throw new Error('BTC send not implemented in MVP — use admin UI to broadcast manually or integrate node');
  },

  async scanIncoming(addresses: string[]): Promise<IncomingTx[]> {
    const results: IncomingTx[] = [];
    for (const addr of addresses) {
      try {
        const res = await fetch(`${apiBase}/address/${addr}/txs`);
        const txs: any[] = await res.json();
        for (const tx of txs.slice(0, 10)) {
          for (const out of tx.vout ?? []) {
            if (out.scriptpubkey_address === addr) {
              results.push({
                txHash: tx.txid,
                toAddress: addr,
                amount: (out.value / 1e8).toString(),
                blockNumber: tx.status?.block_height,
                confirmations: tx.status?.confirmed ? 6 : 0,
              });
            }
          }
        }
      } catch {
        // skip
      }
    }
    return results;
  },

  validateAddress(address: string): boolean {
    try {
      bitcoin.address.toOutputScript(address, network);
      return true;
    } catch {
      return false;
    }
  },
};
