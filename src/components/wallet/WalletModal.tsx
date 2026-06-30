"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { useWalletStore } from "@/store/walletStore";
import { Button } from "@/components/ui/Button";
import { Wallet, Loader2, CheckCircle2, Lock, Smartphone } from "lucide-react";
import { WalletIcon, SolanaChainIcon, BitcoinChainIcon } from "@/components/wallet/WalletIcons";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState, type WalletName } from "@solana/wallet-adapter-base";
import { connectBitcoinWallet } from "@/lib/bitcoin/wallet";
import type { ApiResponse } from "@/types/api";
import type { Profile } from "@/store/profileStore";

async function redirectIfNewProfile(address: string, router: ReturnType<typeof useRouter>) {
  try {
    const res = await fetch(`/api/profile?address=${address}`);
    const json: ApiResponse<Profile> = await res.json();
    if (json.success && json.data && !json.data.displayName) {
      router.push(`/profile/${address}?setup=1`);
    }
  } catch {}
}

const SOLANA_WALLET_NAMES: Record<string, WalletName> = {
  phantom: "Phantom" as WalletName,
  backpack: "Backpack" as WalletName,
  solflare: "Solflare" as WalletName,
  walletconnect: "WalletConnect" as WalletName,
};

// Deep links open the wallet's in-app browser at the current page URL,
// so the wallet is injected and the user can connect normally.
const MOBILE_DEEP_LINKS: Record<string, (url: string) => string> = {
  phantom: (url) => `https://phantom.app/ul/browse/${encodeURIComponent(url)}`,
  solflare: (url) => `https://solflare.com/ul/v1/browse/${encodeURIComponent(url)}`,
  backpack: (url) => `https://backpack.app/ul/v1/browse/${encodeURIComponent(url)}`,
};

const SOLANA_WALLETS = [
  { id: "phantom", name: "Phantom" },
  { id: "backpack", name: "Backpack" },
  { id: "solflare", name: "Solflare" },
];

const BITCOIN_WALLETS = [
  { id: "xverse", name: "Xverse" },
  { id: "leather", name: "Leather" },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);
  return isMobile;
}

export const WalletModal: React.FC = () => {
  const router = useRouter();
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
  const isMobile = useIsMobile();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [pendingSolanaWallet, setPendingSolanaWallet] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Check adapter readyState from the wallet adapter context — covers both
  // browser extension detection and Wallet Standard auto-discovered wallets
  // (e.g. Backpack, Phantom, Solflare in their own in-app browsers).
  const getReadyState = (walletId: string): WalletReadyState => {
    const name = SOLANA_WALLET_NAMES[walletId];
    return solanaWallet.wallets.find((w) => w.adapter.name === name)?.readyState ?? WalletReadyState.NotDetected;
  };

  const isDetected = (walletId: string) => getReadyState(walletId) === WalletReadyState.Installed;

  const hasWalletConnect = solanaWallet.wallets.some((w) => w.adapter.name === "WalletConnect");

  const handleSolanaConnect = (walletId: string) => {
    setError("");
    const readyState = getReadyState(walletId);

    if (readyState === WalletReadyState.NotDetected || readyState === WalletReadyState.Unsupported) {
      // On mobile, redirect into the wallet's in-app browser instead of
      // telling the user to install an extension they can't install.
      if (isMobile && MOBILE_DEEP_LINKS[walletId]) {
        window.location.href = MOBILE_DEEP_LINKS[walletId](window.location.href);
        return;
      }
      const label = SOLANA_WALLETS.find((w) => w.id === walletId)?.name ?? "Wallet";
      setError(`${label} not detected. Install the extension and refresh the page.`);
      return;
    }

    setConnecting(walletId);
    setPendingSolanaWallet(walletId);
    solanaWallet.select(SOLANA_WALLET_NAMES[walletId]);
  };

  // Selecting a wallet adapter is async (state update), so connect once the
  // context's `wallet` actually matches the one the user picked.
  useEffect(() => {
    if (!pendingSolanaWallet) return;
    const name = SOLANA_WALLET_NAMES[pendingSolanaWallet];
    if (!solanaWallet.wallet || solanaWallet.wallet.adapter.name !== name) return;

    if (solanaWallet.connected) {
      const pub = solanaWallet.publicKey?.toBase58() ?? null;
      if (pub) {
        setSolanaAddress(pub);
        closeModal();
        redirectIfNewProfile(pub, router);
      } else {
        setError("Could not retrieve public key. Make sure your wallet is unlocked.");
      }
      setConnecting(null);
      setPendingSolanaWallet(null);
      return;
    }

    if (solanaWallet.connecting) return;

    let cancelled = false;
    solanaWallet.connect().catch((err: unknown) => {
      if (cancelled) return;
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("User rejected") || msg.includes("closed")) {
        setError("Connection rejected.");
      } else if (msg.includes("Unexpected error")) {
        setError("Wallet extension didn't respond. Reload the page and try again.");
      } else {
        setError(msg || "Connection failed.");
      }
      setConnecting(null);
      setPendingSolanaWallet(null);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSolanaWallet, solanaWallet.wallet, solanaWallet.connected, solanaWallet.connecting, solanaWallet.publicKey]);

  const handleBitcoinConnect = async (walletId: string) => {
    setError("");
    setConnecting(walletId);
    try {
      const connection = await connectBitcoinWallet();
      setBtcState(connection.ordinalsAddress, connection.paymentAddress, connection.publicKey);
      closeModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("User rejected") || msg.includes("canceled")) {
        setError("Connection rejected.");
      } else {
        setError(msg || "Bitcoin wallet connection failed.");
      }
    } finally {
      setConnecting(null);
    }
  };

  const handleClose = () => {
    setError("");
    setConnecting(null);
    setPendingSolanaWallet(null);
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
              ) : isDetected(w.id) ? (
                <span className="rounded-full bg-semantic-successBg px-2 py-0.5 text-xs text-semantic-success">
                  Detected
                </span>
              ) : isMobile && MOBILE_DEEP_LINKS[w.id] ? (
                <span className="flex items-center gap-1 text-xs text-text-tertiary">
                  <Smartphone className="h-3 w-3" /> Open app
                </span>
              ) : null}
            </button>
          ))}

          {/* WalletConnect — only rendered when the adapter is registered
              (i.e. NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is set) */}
          {hasWalletConnect && (
            <button
              onClick={() => handleSolanaConnect("walletconnect")}
              disabled={!!connecting}
              className="flex h-14 w-full items-center gap-3 rounded-lg px-4 text-left transition-colors hover:bg-bg-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-border-strong disabled:opacity-50"
            >
              <WalletIcon id="walletconnect" size={28} />
              <div className="flex-1">
                <div className="text-sm font-medium text-text-primary">WalletConnect</div>
                <div className="text-xs text-text-tertiary">Approve in app, return here when done</div>
              </div>
              {connecting === "walletconnect" && (
                <Loader2 className="h-4 w-4 animate-spin text-text-tertiary" />
              )}
            </button>
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
