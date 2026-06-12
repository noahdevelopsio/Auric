"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useWalletStore } from "@/store/walletStore";
import { useMarketplaceStore } from "@/store/marketplaceStore";
import { useToastStore } from "@/store/toastStore";
import { createListing, calcPlatformFee, calcRoyaltyFee, calcSellerProceeds, DEFAULT_ROYALTY_BPS } from "@/lib/marketplace/solana";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { CheckCircle2, ExternalLink, Loader2, Tag } from "lucide-react";

const DURATION_OPTIONS = [
  { label: "1 Day", value: 1 },
  { label: "7 Days", value: 7 },
  { label: "30 Days", value: 30 },
];

type Step = "form" | "confirm" | "signing" | "success";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mintAddress: string;
  nftName: string;
  nftImage?: string;
  royaltyBps?: number;
}

export function ListingModal({ isOpen, onClose, mintAddress, nftName, nftImage, royaltyBps = DEFAULT_ROYALTY_BPS }: Props) {
  const { solanaAddress } = useWalletStore();
  const { addListing } = useMarketplaceStore();
  const { addToast } = useToastStore();
  const { connection } = useConnection();
  const wallet = useWallet();

  const [step, setStep] = useState<Step>("form");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState(7);
  const [txSig, setTxSig] = useState("");
  const [error, setError] = useState("");

  const priceSOL = parseFloat(price) || 0;
  const platformFee = calcPlatformFee(priceSOL);
  const royaltyFee = calcRoyaltyFee(priceSOL, royaltyBps);
  const proceeds = calcSellerProceeds(priceSOL, royaltyBps);
  const priceValid = priceSOL > 0 && priceSOL <= 100_000;

  const handleClose = () => {
    if (step === "signing") return;
    setStep("form");
    setPrice("");
    setDuration(7);
    setError("");
    onClose();
  };

  const handleConfirm = async () => {
    if (!solanaAddress) return;
    setError("");
    setStep("signing");
    try {
      const result = await createListing({
        connection,
        wallet,
        sellerPublicKey: new PublicKey(solanaAddress),
        mintAddress,
        priceSOL,
        durationDays: duration,
        royaltyBps,
      });
      addListing({
        mintAddress,
        nftName,
        nftImage,
        chain: "solana",
        sellerAddress: solanaAddress,
        priceSOL,
        royaltyBps,
        expiresAt: Date.now() + duration * 86_400_000,
        txSignature: result.txSignature,
        listingAddress: result.listingAddress,
        listedAt: Date.now(),
      });
      setTxSig(result.txSignature);
      setStep("success");
      addToast({ type: "success", message: `${nftName} listed for ${priceSOL} SOL` });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed. Please try again.");
      setStep("confirm");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={<span className="flex items-center gap-2"><Tag className="w-4 h-4 text-text-secondary" /> List for Sale</span>} maxWidth="md">
      {step === "form" && (
        <div className="space-y-5">
          {/* NFT Preview */}
          <div className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-overlay p-3">
            <div className="h-14 w-14 rounded-lg border border-border-subtle bg-gradient-to-br from-sol-purple/20 to-sol-teal/10 flex-shrink-0 flex items-center justify-center text-xl font-bold text-text-tertiary">
              {nftImage ? <img src={nftImage} alt={nftName} className="h-full w-full object-cover rounded-lg" /> : "#"}
            </div>
            <div>
              <div className="font-medium text-text-primary">{nftName}</div>
              <div className="text-xs text-text-tertiary mt-0.5">Solana NFT · Creator royalty {(royaltyBps / 100).toFixed(1)}%</div>
            </div>
          </div>

          {/* Price Input */}
          <div>
            <label className="text-sm font-medium text-text-secondary mb-2 block">List price</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-border-default bg-bg-overlay px-4 py-3 pr-16 text-text-primary placeholder:text-text-tertiary focus:border-sol-purple focus:outline-none focus:ring-1 focus:ring-sol-purple"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-text-secondary">SOL</span>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-sm font-medium text-text-secondary mb-2 block">Duration</label>
            <div className="grid grid-cols-3 gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDuration(opt.value)}
                  className={`rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                    duration === opt.value
                      ? "border-sol-purple bg-sol-glow text-sol-purple"
                      : "border-border-default bg-bg-overlay text-text-secondary hover:border-border-strong hover:text-text-primary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fee Preview */}
          {priceValid && (
            <div className="rounded-xl border border-border-subtle bg-bg-overlay p-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>List price</span>
                <span>{priceSOL.toFixed(4)} SOL</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Platform fee (2.5%)</span>
                <span>−{platformFee.toFixed(4)} SOL</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Creator royalty ({(royaltyBps / 100).toFixed(1)}%)</span>
                <span>−{royaltyFee.toFixed(4)} SOL</span>
              </div>
              <div className="flex justify-between font-semibold text-text-primary border-t border-border-subtle pt-2.5">
                <span>You receive</span>
                <span className="text-sol-teal">{proceeds.toFixed(4)} SOL</span>
              </div>
            </div>
          )}

          <Button
            variant="sol"
            size="lg"
            className="w-full"
            disabled={!priceValid}
            onClick={() => setStep("confirm")}
          >
            Continue
          </Button>
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-5">
          <p className="text-sm text-text-secondary">Review your listing details before signing.</p>

          <div className="rounded-xl border border-border-default bg-bg-overlay p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-text-tertiary">NFT</span>
              <span className="font-medium text-text-primary">{nftName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">List price</span>
              <span className="font-medium text-text-primary">{priceSOL.toFixed(4)} SOL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">Duration</span>
              <span className="font-medium text-text-primary">{duration} {duration === 1 ? "day" : "days"}</span>
            </div>
            <div className="border-t border-border-subtle pt-3 space-y-2">
              <div className="flex justify-between text-text-secondary">
                <span>Platform fee (2.5%)</span>
                <span>−{platformFee.toFixed(4)} SOL</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Creator royalty ({(royaltyBps / 100).toFixed(1)}%)</span>
                <span>−{royaltyFee.toFixed(4)} SOL</span>
              </div>
              <div className="flex justify-between font-semibold text-text-primary border-t border-border-subtle pt-2">
                <span>You receive</span>
                <span className="text-sol-teal">{proceeds.toFixed(4)} SOL</span>
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-semantic-error">{error}</p>}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep("form")}>Back</Button>
            <Button variant="sol" className="flex-1" onClick={handleConfirm}>Sign &amp; List</Button>
          </div>
        </div>
      )}

      {step === "signing" && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-sol-glow">
            <Loader2 className="h-8 w-8 animate-spin text-sol-purple" />
          </div>
          <p className="font-medium text-text-primary">Waiting for wallet signature…</p>
          <p className="text-sm text-text-tertiary text-center">Please approve the transaction in your wallet.</p>
        </div>
      )}

      {step === "success" && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-semantic-successBg">
            <CheckCircle2 className="h-8 w-8 text-semantic-success" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-text-primary text-lg">{nftName} is now listed!</p>
            <p className="text-sm text-text-secondary mt-1">Your NFT is live on the marketplace for {priceSOL} SOL</p>
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
