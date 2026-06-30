"use client";

import React, { PropsWithChildren, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork, type Adapter } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter, WalletConnectWalletAdapter } from '@solana/wallet-adapter-wallets';

const DEFAULT_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com';

export default function SolanaProviders({ children }: PropsWithChildren) {
  const network = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork) || WalletAdapterNetwork.Mainnet;

  const wallets = useMemo(() => {
    const base: Adapter[] = [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ];
    // WalletConnect enables QR-code / deep-link connection from mobile browsers.
    // Requires a free project ID from https://cloud.walletconnect.com
    const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    const wcNetwork = network === WalletAdapterNetwork.Testnet ? WalletAdapterNetwork.Devnet : network as WalletAdapterNetwork.Mainnet | WalletAdapterNetwork.Devnet;
    if (wcProjectId) {
      base.push(new WalletConnectWalletAdapter({ network: wcNetwork, options: { projectId: wcProjectId } }));
    }
    return base;
  }, [network]);

  return (
    <ConnectionProvider endpoint={DEFAULT_RPC}>
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
