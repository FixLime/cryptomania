import type { Currency } from '@prisma/client';

export interface GeneratedWallet {
  address: string;
  /** Plaintext private key / mnemonic / WIF — caller MUST encrypt before saving. */
  privateKey: string;
  derivationPath?: string;
}

export interface SendResult {
  txHash: string;
  fee: string;
}

export interface IncomingTx {
  txHash: string;
  toAddress: string;
  amount: string;
  blockNumber?: number;
  confirmations: number;
}

export interface CryptoAdapter {
  currency: Currency;
  /** Минимальное количество подтверждений, после которых депозит зачисляется. */
  minConfirmations: number;
  generateAddress(): Promise<GeneratedWallet>;
  getBalance(address: string): Promise<string>;
  sendFromHot(toAddress: string, amount: string): Promise<SendResult>;
  /** Сканирует входящие транзакции для списка адресов. */
  scanIncoming(addresses: string[]): Promise<IncomingTx[]>;
  validateAddress(address: string): boolean;
}
