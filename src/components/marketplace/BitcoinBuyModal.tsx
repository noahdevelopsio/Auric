"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useWalletStore } from "@/store/walletStore";
import { useMarketplaceStore } from "@/store/marketplaceStore";
import { useToastStore } from "@/store/toastStore";
import { executeBuy, previewBuy, SATS_PER_BTC } from "@/lib/marketplace/bitcoin";
import { signBitcoinMessage } from "@/lib/bitcoin/signMessage";
import { recordActivity } from "@/lib/utils/activity";
import { CheckCircle2, ExternalLink, Loader2, ShoppingBag } from "lucide-react";
import Image from "next/image";

type Step = "confirm" | "signing" | "success";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  inscriptionId: string;
  nftName: string;
  nftImage?: string;
  priceSats: number;
  sellerAddress: string;
}

export function BitcoinBuyModal({ isOpen, onClose, listingId, inscriptionId, nftName, nftImage, priceSats, sellerAddress }: Props) {
  const { btcAddress, btcPaymentAddress, btcPublicKey } = useWalletStore();
  const { removeListing } = useMarketplaceStore();
  const { addToast } = useToastStore();

  const [step, setStep] = useState<Step>("confirm");
  const [txId, setTxId] = useState("");
  const [error, setError] = useState("");
  const [networkFeeSats, setNetworkFeeSats] = useState<number | null>(null);

  const priceBTC = priceSats / SATS_PER_BTC;
  const networkFeeBTC = networkFeeSats !== null ? networkFeeSats / SATS_PER_BTC : null;
  const totalBTC = networkFeeBTC !== null ? priceBTC + networkFeeBTC : null;

  useEffect(() => {
    if (!isOpen || !btcAddress || !btcPaymentAddress || !btcPublicKey) return;
    setNetworkFeeSats(null);
    previewBuy({
      listingId,
      buyerOrdinalsAddress: btcAddress,
      buyerPaymentAddress: btcPaymentAddress,
      buyerPublicKey: btcPublicKey,
    })
      .then((result) => setNetworkFeeSats(result.networkFeeSats))
      .catch(() => setNetworkFeeSats(null));
  }, [isOpen, listingId, btcAddress, btcPaymentAddress, btcPublicKey]);

  const handleClose = () => {
    if (step === "signing") return;
    setStep("confirm");
    setError("");
    onClose();
  };

  const handleBuy = async () => {
    if (!btcAddress || !btcPaymentAddress || !btcPublicKey) return;
    setError("");
    setStep("signing");
    try {
      const result = await executeBuy({
        listingId,
        buyerOrdinalsAddress: btcAddress,
        buyerPaymentAddress: btcPaymentAddress,
        buyerPublicKey: btcPublicKey,
      });
      removeListing(inscriptionId);
      setTxId(result.txId);
      setStep("success");
      addToast({ type: "success", message: `You bought ${nftName} for ${priceBTC} BTC!` });
      recordActivity(
        {
          type: "sale",
          chain: "bitcoin",
          nftId: inscriptionId,
          nftName,
          nftImage,
          fromWallet: sellerAddress,
          toWallet: btcAddress,
          priceLamports: priceSats,
          txSignature: result.txId,
        },
        undefined,
        { address: btcAddress, signMessage: (m) => signBitcoinMessage(btcAddress, m) }
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Purchase failed. Please try again.");
      setStep("confirm");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={<span className="flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-text-secondary" /> Complete Purchase</span>} maxWidth="sm">
      {step === "confirm" && (
        <div className="space-y-5">
          {/* NFT Preview */}
          <div className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-overlay p-3">
            <div className="h-14 w-14 rounded-lg border border-border-subtle bg-gradient-to-br from-btc-500/20 to-btc-500/5 flex-shrink-0 flex items-center justify-center text-xl font-bold text-text-tertiary overflow-hidden">
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
              <span className="text-text-primary font-medium">{priceBTC} BTC</span>
            </div>
            <div className="flex justify-between text-text-tertiary">
              <span>Platform fee</span>
              <span>0 BTC</span>
            </div>
            <div className="flex justify-between text-text-tertiary">
              <span>Network fee (est.)</span>
              <span>{networkFeeBTC !== null ? `~${networkFeeBTC.toFixed(8)} BTC` : "Calculating…"}</span>
            </div>
            <div className="flex justify-between font-semibold text-text-primary border-t border-border-subtle pt-2.5">
              <span>You pay</span>
              <span>{totalBTC !== null ? `~${totalBTC.toFixed(8)} BTC` : `${priceBTC} BTC + network fee`}</span>
            </div>
          </div>

          {error && <p className="text-xs text-semantic-error">{error}</p>}

          <Button variant="btc" size="lg" className="w-full" onClick={handleBuy}>
            Confirm Purchase · {priceBTC} BTC
          </Button>
        </div>
      )}

      {step === "signing" && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-btc-glow">
            <Loader2 className="h-8 w-8 animate-spin text-btc-500" />
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
            href={`https://mempool.space/tx/${txId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-btc-500 hover:text-btc-500/80 transition-colors"
          >
            View transaction <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <Button variant="outline" className="w-full mt-2" onClick={handleClose}>Done</Button>
        </div>
      )}
    </Modal>
  );
}
