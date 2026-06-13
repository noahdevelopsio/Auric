"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useWalletStore } from "@/store/walletStore";
import { useMarketplaceStore } from "@/store/marketplaceStore";
import { useToastStore } from "@/store/toastStore";
import { executeBuy, calcPlatformFee, calcRoyaltyFee } from "@/lib/marketplace/solana";
import { recordActivity } from "@/lib/utils/activity";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { CheckCircle2, ExternalLink, Loader2, ShoppingBag } from "lucide-react";
import Image from "next/image";

const NETWORK_FEE_SOL = 0.000005;

type Step = "confirm" | "signing" | "success";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mintAddress: string;
  listingAddress: string;
  nftName: string;
  nftImage?: string;
  priceSOL: number;
  sellerAddress: string;
  royaltyBps: number;
  chain?: "solana" | "bitcoin";
}

export function BuyModal({ isOpen, onClose, mintAddress, listingAddress, nftName, nftImage, priceSOL, sellerAddress, royaltyBps, chain = "solana" }: Props) {
  const { solanaAddress } = useWalletStore();
  const { removeListing } = useMarketplaceStore();
  const { addToast } = useToastStore();
  const { connection } = useConnection();
  const wallet = useWallet();

  const [step, setStep] = useState<Step>("confirm");
  const [txSig, setTxSig] = useState("");
  const [error, setError] = useState("");

  const platformFee = calcPlatformFee(priceSOL);
  const royaltyFee = calcRoyaltyFee(priceSOL, royaltyBps);
  const total = priceSOL + NETWORK_FEE_SOL;
  const currency = chain === "bitcoin" ? "BTC" : "SOL";

  const handleClose = () => {
    if (step === "signing") return;
    setStep("confirm");
    setError("");
    onClose();
  };

  const handleBuy = async () => {
    if (!solanaAddress) return;
    setError("");
    setStep("signing");
    try {
      const result = await executeBuy({
        connection,
        wallet,
        buyerPublicKey: new PublicKey(solanaAddress),
        mintAddress,
        listingAddress,
        priceSOL,
        sellerAddress,
        royaltyBps,
      });
      removeListing(mintAddress);
      setTxSig(result.txSignature);
      setStep("success");
      addToast({ type: "success", message: `You bought ${nftName} for ${priceSOL} ${currency}!` });
      recordActivity({
        type: "sale",
        chain: "solana",
        nftId: mintAddress,
        nftName,
        nftImage,
        fromWallet: sellerAddress,
        toWallet: solanaAddress,
        priceLamports: Math.round(priceSOL * 1_000_000_000),
        txSignature: result.txSignature,
      }, wallet);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed. Please try again.");
      setStep("confirm");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={<span className="flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-text-secondary" /> Complete Purchase</span>} maxWidth="sm">
      {step === "confirm" && (
        <div className="space-y-5">
          {/* NFT Preview */}
          <div className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-overlay p-3">
            <div className="h-14 w-14 rounded-lg border border-border-subtle bg-gradient-to-br from-sol-purple/20 to-sol-teal/10 flex-shrink-0 flex items-center justify-center text-xl font-bold text-text-tertiary overflow-hidden">
              {nftImage ? <Image src={nftImage} alt={nftName} width={56} height={56} className="h-full w-full object-cover" /> : "#"}
            </div>
            <div>
              <div className="font-medium text-text-primary">{nftName}</div>
              <div className="text-xs text-text-tertiary mt-0.5">
                Sold by <span className="font-mono">{sellerAddress.slice(0, 6)}…{sellerAddress.slice(-4)}</span>
              </div>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="rounded-xl border border-border-subtle bg-bg-overlay p-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Item price</span>
              <span className="text-text-primary font-medium">{priceSOL.toFixed(4)} {currency}</span>
            </div>
            <div className="flex justify-between text-text-tertiary">
              <span>Creator royalty ({(royaltyBps / 100).toFixed(1)}%)</span>
              <span>{royaltyFee.toFixed(4)} {currency} <span className="text-text-tertiary text-xs">(from seller)</span></span>
            </div>
            <div className="flex justify-between text-text-tertiary">
              <span>Platform fee (2.5%)</span>
              <span>{platformFee.toFixed(4)} {currency} <span className="text-text-tertiary text-xs">(from seller)</span></span>
            </div>
            <div className="flex justify-between text-text-tertiary">
              <span>Network fee (est.)</span>
              <span>~{NETWORK_FEE_SOL} {currency}</span>
            </div>
            <div className="flex justify-between font-semibold text-text-primary border-t border-border-subtle pt-2.5">
              <span>You pay</span>
              <span>{total.toFixed(6)} {currency}</span>
            </div>
          </div>

          <p className="text-xs text-text-tertiary">
            Royalties and platform fees are deducted from the seller&apos;s proceeds — you only pay the listed price plus network fees.
          </p>

          {error && <p className="text-xs text-semantic-error">{error}</p>}

          <Button variant="sol" size="lg" className="w-full" onClick={handleBuy}>
            Confirm Purchase · {priceSOL} {currency}
          </Button>
        </div>
      )}

      {step === "signing" && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-sol-glow">
            <Loader2 className="h-8 w-8 animate-spin text-sol-purple" />
          </div>
          <p className="font-medium text-text-primary">Processing purchase…</p>
          <p className="text-sm text-text-tertiary text-center">Please approve the transaction in your wallet.</p>
        </div>
      )}

      {step === "success" && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-semantic-successBg">
            <CheckCircle2 className="h-8 w-8 text-semantic-success" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-text-primary text-lg">Purchase complete!</p>
            <p className="text-sm text-text-secondary mt-1">{nftName} is now in your wallet.</p>
          </div>
          <a
            href={`https://solscan.io/tx/${txSig}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-sol-purple hover:text-sol-purple/80 transition-colors"
          >
            View transaction <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <Button variant="outline" className="w-full mt-2" onClick={handleClose}>Done</Button>
        </div>
      )}
    </Modal>
  );
}
