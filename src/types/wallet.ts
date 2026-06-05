export type SupportedChain = 'solana' | 'bitcoin' | null;
export type WalletProvider = 'phantom' | 'backpack' | 'solflare' | 'xverse' | 'leather';

export interface WalletConnection {
  chain: 'solana' | 'bitcoin';
  address: string;
  provider: WalletProvider;
  publicKey?: string;
}

export interface BitcoinWalletState {
  ordinalsAddress: string | null;
  paymentAddress: string | null;
  publicKey: string | null;
  connected: boolean;
}

export interface SolanaWalletState {
  address: string | null;
  connected: boolean;
}