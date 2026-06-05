"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useWalletStore } from "@/store/walletStore";
import { Button } from "@/components/ui/Button";
import { Wallet, Loader2, CheckCircle2, Lock } from "lucide-react";
import { WalletIcon, SolanaChainIcon, BitcoinChainIcon } from "@/components/wallet/WalletIcons";
import { useWallet } from "@solana/wallet-adapter-react";
import { connectBitcoinWallet } from "@/lib/bitcoin/wallet";

interface WalletOption {
  id: string;
  name: string;
  detected: boolean;
}

function useDetectedWallets() {
  const [detected, setDetected] = useState<Record<string, boolean>>({
    phantom: false,
    backpack: false,
    solflare: false,
    xverse: false,
    leather: false,
  });

  useEffect(() => {
    const check = () => {
      const w = window as any;
      setDetected({
        phantom: !!(w.phantom?.solana?.isPhantom || w.solana?.isPhantom),
        backpack: !!(w.backpack?.isBackpack),
        solflare: !!(w.solflare?.isSolflare),
        xverse: !!(w.XverseProviders?.BitcoinProvider || w.BitcoinProvider),
        leather: !!(w.LeatherProvider),
      });
    };

    if (document.readyState === "complete") {
      check();
    } else {
      window.addEventListener("load", check);
      return () => window.removeEventListener("load", check);
    }
  }, []);

  return detected;
}

const SOLANA_WALLETS: Omit<WalletOption, "detected">[] = [
  { id: "phantom", name: "Phantom" },
  { id: "backpack", name: "Backpack" },
  { id: "solflare", name: "Solflare" },
];

const BITCOIN_WALLETS: Omit<WalletOption, "detected">[] = [
  { id: "xverse", name: "Xverse" },
  { id: "leather", name: "Leather" },
];

export const WalletModal: React.FC = () => {
  const {
    isModalOpen,
    closeModal,
    activeChain,
    setActiveChain,
    setSolanaAddress,
    setBtcState,
    solanaAddress,
    btcAddress,
  } = useWalletStore();
  const solanaWallet = useWallet();
  const detected = useDetectedWallets();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSolanaConnect = async (walletId: string) => {
    setError("");
    setConnecting(walletId);
    try {
      if (!solanaWallet.connected) {
        await solanaWallet.connect();
      }
      const pub =
        solanaWallet.publicKey?.toBase58?.() ??
        (solanaWallet.publicKey as any)?.toString?.();
      if (pub) {
        setSolanaAddress(pub);
        closeModal();
      } else {
        setError("Could not retrieve public key. Make sure your wallet is unlocked.");
      }
    } catch (err: any) {
      if (err?.message?.includes("User rejected")) {
        setError("Connection rejected.");
      } else {
        setError(err?.message ?? "Connection failed.");
      }
    } finally {
      setConnecting(null);
    }
  };

  const handleBitcoinConnect = async (walletId: string) => {
    setError("");
    setConnecting(walletId);
    try {
      const connection = await connectBitcoinWallet();
      setBtcState(connection.ordinalsAddress, connection.paymentAddress, connection.publicKey);
      closeModal();
    } catch (err: any) {
      if (err?.message?.includes("User rejected") || err?.message?.includes("canceled")) {
        setError("Connection rejected.");
      } else {
        setError(err?.message ?? "Bitcoin wallet connection failed.");
      }
    } finally {
      setConnecting(null);
    }
  };

  const handleClose = () => {
    setError("");
    setConnecting(null);
    closeModal();
  };

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-text-secondary" />
          <span>Connect Wallet</span>
        </div>
      }
      maxWidth="sm"
    >
      {!activeChain ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-text-secondary mb-1">
            Connect a Solana or Bitcoin wallet to get started.
          </p>

          <button
            onClick={() => { setError(""); setActiveChain("solana"); }}
            className="group flex items-center gap-4 rounded-xl border border-border-default bg-bg-overlay px-4 py-4 text-left transition-all hover:border-sol-purple hover:bg-sol-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-sol-purple"
          >
            <SolanaChainIcon size={40} />
            <div className="flex-1">
              <div className="text-sm font-semibold text-text-primary">Solana</div>
              <div className="text-xs text-text-tertiary">Phantom, Backpack, Solflare</div>
            </div>
            {solanaAddress && (
              <CheckCircle2 className="h-4 w-4 text-semantic-success flex-shrink-0" />
            )}
          </button>

          <button
            onClick={() => { setError(""); setActiveChain("bitcoin"); }}
            className="group flex items-center gap-4 rounded-xl border border-border-default bg-bg-overlay px-4 py-4 text-left transition-all hover:border-btc-500 hover:bg-btc-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-btc-500"
          >
            <BitcoinChainIcon size={40} />
            <div className="flex-1">
              <div className="text-sm font-semibold text-text-primary">Bitcoin Ordinals</div>
              <div className="text-xs text-text-tertiary">Xverse, Leather</div>
            </div>
            {btcAddress && (
              <CheckCircle2 className="h-4 w-4 text-semantic-success flex-shrink-0" />
            )}
          </button>

          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-text-tertiary mt-2">
            <Lock className="h-3 w-3 flex-shrink-0" />
            Non-custodial · We never access your private keys.
          </p>
        </div>
      ) : activeChain === "solana" ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wider text-text-tertiary mb-1 px-1">Solana Wallets</p>

          {SOLANA_WALLETS.map((w) => (
            <button
              key={w.id}
              onClick={() => handleSolanaConnect(w.id)}
              disabled={!!connecting}
              className="flex h-14 w-full items-center gap-3 rounded-lg px-4 text-left transition-colors hover:bg-bg-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-border-strong disabled:opacity-50"
            >
              <WalletIcon id={w.id} size={28} />
              <span className="flex-1 text-sm font-medium text-text-primary">{w.name}</span>
              {connecting === w.id ? (
                <Loader2 className="h-4 w-4 animate-spin text-text-tertiary" />
              ) : detected[w.id] ? (
                <span className="rounded-full bg-semantic-successBg px-2 py-0.5 text-xs text-semantic-success">
                  Detected
                </span>
              ) : null}
            </button>
          ))}

          {error && (
            <p className="mt-1 text-xs text-semantic-error px-1">{error}</p>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-text-tertiary"
            onClick={() => { setError(""); setActiveChain(null); }}
          >
            ← Back
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wider text-text-tertiary mb-1 px-1">Bitcoin Wallets</p>

          {BITCOIN_WALLETS.map((w) => (
            <button
              key={w.id}
              onClick={() => handleBitcoinConnect(w.id)}
              disabled={!!connecting}
              className="flex h-14 w-full items-center gap-3 rounded-lg px-4 text-left transition-colors hover:bg-bg-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-border-strong disabled:opacity-50"
            >
              <WalletIcon id={w.id} size={28} />
              <span className="flex-1 text-sm font-medium text-text-primary">{w.name}</span>
              {connecting === w.id ? (
                <Loader2 className="h-4 w-4 animate-spin text-text-tertiary" />
              ) : detected[w.id] ? (
                <span className="rounded-full bg-semantic-successBg px-2 py-0.5 text-xs text-semantic-success">
                  Detected
                </span>
              ) : null}
            </button>
          ))}

          {btcAddress && (
            <div className="mt-2 rounded-lg border border-border-subtle bg-bg-overlay px-3 py-2">
              <p className="text-xs text-text-tertiary">Connected</p>
              <p className="font-mono text-xs text-text-primary break-all mt-0.5">{btcAddress}</p>
            </div>
          )}

          {error && (
            <p className="mt-1 text-xs text-semantic-error px-1">{error}</p>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-text-tertiary"
            onClick={() => { setError(""); setActiveChain(null); }}
          >
            ← Back
          </Button>
        </div>
      )}
    </Modal>
  );
};
