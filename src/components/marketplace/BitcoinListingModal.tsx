"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useWalletStore } from "@/store/walletStore";
import { useMarketplaceStore } from "@/store/marketplaceStore";
import { useToastStore } from "@/store/toastStore";
import { createListing, SATS_PER_BTC } from "@/lib/marketplace/bitcoin";
import { signBitcoinMessage } from "@/lib/bitcoin/signMessage";
import { recordActivity } from "@/lib/utils/activity";
import { CheckCircle2, Loader2, Tag } from "lucide-react";
import Image from "next/image";

// Bitcoin listings are off-chain PSBT records with no on-chain expiry, so we
// give them a long shelf life rather than a user-selectable duration.
const LISTING_DURATION_MS = 365 * 24 * 60 * 60 * 1000;

type Step = "form" | "confirm" | "signing" | "success";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  inscriptionId: string;
  nftName: string;
  nftImage?: string;
}

export function BitcoinListingModal({ isOpen, onClose, inscriptionId, nftName, nftImage }: Props) {
  const { btcAddress, btcPaymentAddress, btcPublicKey } = useWalletStore();
  const { addListing } = useMarketplaceStore();
  const { addToast } = useToastStore();

  const [step, setStep] = useState<Step>("form");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");

  const priceBTC = parseFloat(price) || 0;
  const priceSats = Math.round(priceBTC * SATS_PER_BTC);
  const priceValid = priceSats > 0 && priceBTC <= 21_000_000;

  const handleClose = () => {
    if (step === "signing") return;
    setStep("form");
    setPrice("");
    setError("");
    onClose();
  };

  const handleConfirm = async () => {
    if (!btcAddress || !btcPaymentAddress || !btcPublicKey) return;
    setError("");
    setStep("signing");
    try {
      const result = await createListing({
        inscriptionId,
        ordinalsAddress: btcAddress,
        paymentAddress: btcPaymentAddress,
        publicKey: btcPublicKey,
        priceSats,
        nftName,
        nftImage,
      });
      addListing({
        mintAddress: inscriptionId,
        nftName,
        nftImage,
        chain: "bitcoin",
        sellerAddress: btcAddress,
        priceSOL: priceSats / SATS_PER_BTC,
        priceSats,
        royaltyBps: 0,
        expiresAt: Date.now() + LISTING_DURATION_MS,
        txSignature: "",
        listingAddress: result.id,
        listedAt: Date.now(),
      });
      setStep("success");
      addToast({ type: "success", message: `${nftName} listed for ${priceBTC} BTC` });
      recordActivity(
        {
          type: "list",
          chain: "bitcoin",
          nftId: inscriptionId,
          nftName,
          nftImage,
          fromWallet: btcAddress,
          priceLamports: priceSats,
        },
        undefined,
        { address: btcAddress, signMessage: (m) => signBitcoinMessage(btcAddress, m) }
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create listing. Please try again.");
      setStep("confirm");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={<span className="flex items-center gap-2"><Tag className="w-4 h-4 text-text-secondary" /> List for Sale</span>} maxWidth="md">
      {step === "form" && (
        <div className="space-y-5">
          {/* NFT Preview */}
          <div className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-overlay p-3">
            <div className="h-14 w-14 rounded-lg border border-border-subtle bg-gradient-to-br from-btc-500/20 to-btc-500/5 flex-shrink-0 flex items-center justify-center text-xl font-bold text-text-tertiary overflow-hidden">
              {nftImage ? <Image src={nftImage} alt={nftName} width={56} height={56} className="h-full w-full object-cover rounded-lg" /> : "#"}
            </div>
            <div>
              <div className="font-medium text-text-primary">{nftName}</div>
              <div className="text-xs text-text-tertiary mt-0.5">Bitcoin Ordinal · No platform fee</div>
            </div>
          </div>

          {/* Price Input */}
          <div>
            <label className="text-sm font-medium text-text-secondary mb-2 block">List price</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.00000001"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00000000"
                className="w-full rounded-lg border border-border-default bg-bg-overlay px-4 py-3 pr-16 text-text-primary placeholder:text-text-tertiary focus:border-btc-500 focus:outline-none focus:ring-1 focus:ring-btc-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-text-secondary">BTC</span>
            </div>
            {priceValid && (
              <p className="mt-1.5 text-xs text-text-tertiary">{priceSats.toLocaleString()} sats</p>
            )}
          </div>

          {/* Fee Preview */}
          {priceValid && (
            <div className="rounded-xl border border-border-subtle bg-bg-overlay p-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>List price</span>
                <span>{priceBTC} BTC</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Platform fee</span>
                <span>0 BTC</span>
              </div>
              <div className="flex justify-between font-semibold text-text-primary border-t border-border-subtle pt-2.5">
                <span>You receive</span>
                <span className="text-btc-500">{priceBTC} BTC</span>
              </div>
              <p className="text-xs text-text-tertiary pt-1">
                The buyer pays the Bitcoin network fee when completing the purchase.
              </p>
            </div>
          )}

          <Button
            variant="btc"
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
              <span className="text-text-tertiary">Inscription</span>
              <span className="font-medium text-text-primary">{nftName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">List price</span>
              <span className="font-medium text-text-primary">{priceBTC} BTC</span>
            </div>
            <div className="flex justify-between font-semibold text-text-primary border-t border-border-subtle pt-3">
              <span>You receive</span>
              <span className="text-btc-500">{priceBTC} BTC</span>
            </div>
          </div>

          <p className="text-xs text-text-tertiary">
            You&apos;ll sign a partial transaction with your wallet. The inscription stays in your wallet until someone buys it.
          </p>

          {error && <p className="text-xs text-semantic-error">{error}</p>}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep("form")}>Back</Button>
            <Button variant="btc" className="flex-1" onClick={handleConfirm}>Sign &amp; List</Button>
          </div>
        </div>
      )}

      {step === "signing" && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-btc-glow">
            <Loader2 className="h-8 w-8 animate-spin text-btc-500" />
          </div>
          <p className="font-medium text-text-primary">Waiting for wallet signature…</p>
          <p className="text-sm text-text-tertiary text-center">Please approve the signature request in your wallet.</p>
        </div>
      )}

      {step === "success" && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-semantic-successBg">
            <CheckCircle2 className="h-8 w-8 text-semantic-success" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-text-primary text-lg">{nftName} is now listed!</p>
            <p className="text-sm text-text-secondary mt-1">Your inscription is live on the marketplace for {priceBTC} BTC</p>
          </div>
          <Button variant="outline" className="w-full mt-2" onClick={handleClose}>Done</Button>
        </div>
      )}
    </Modal>
  );
}
