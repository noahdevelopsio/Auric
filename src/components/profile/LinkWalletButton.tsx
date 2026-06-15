"use client";

import { useState } from "react";
import { Loader2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useWalletStore } from "@/store/walletStore";
import { useToastStore } from "@/store/toastStore";
import { useWallet } from "@solana/wallet-adapter-react";
import { buildAuthMessage } from "@/lib/auth/walletAuth";
import { signBitcoinMessage } from "@/lib/bitcoin/signMessage";
import { detectAddressChain } from "@/lib/utils/validation";
import type { ApiResponse } from "@/types/api";
import type { LinkedWallet, ProfileDto } from "@/types/account";

interface Props {
  address: string;
  linkedAddresses: LinkedWallet[];
  onLinked: (profile: ProfileDto) => void;
}

// Shown on a user's own profile when they have both a Solana and a Bitcoin
// wallet connected, and the other chain's wallet isn't linked to this
// account yet. Links them by collecting a signature from each wallet.
export function LinkWalletButton({ address, linkedAddresses, onLinked }: Props) {
  const { solanaAddress, btcAddress, openModal } = useWalletStore();
  const { addToast } = useToastStore();
  const wallet = useWallet();
  const [linking, setLinking] = useState(false);

  const chain = detectAddressChain(address);
  const otherChain = chain === "solana" ? "bitcoin" : "solana";
  const otherAddress = otherChain === "solana" ? solanaAddress : btcAddress;

  // The other chain has no wallet connected at all — offer to connect one
  // before a link can be attempted.
  if (!otherAddress) {
    return (
      <Button variant="outline" size="sm" className="flex items-center justify-center gap-1.5" onClick={() => openModal(otherChain)}>
        <Link2 className="w-3.5 h-3.5" />
        Connect {otherChain === "solana" ? "Solana" : "Bitcoin"} wallet
      </Button>
    );
  }

  if (linkedAddresses.some((w) => w.address === otherAddress)) return null;

  const handleLink = async () => {
    if (!wallet.signMessage) {
      addToast({ type: "error", message: "Your Solana wallet does not support message signing" });
      return;
    }

    setLinking(true);
    try {
      const timestamp = Date.now();
      const messageThis = buildAuthMessage(`link wallet ${otherAddress}`, address, timestamp);
      const messageOther = buildAuthMessage(`link wallet ${address}`, otherAddress, timestamp);

      const signatureThis =
        chain === "bitcoin"
          ? await signBitcoinMessage(address, messageThis)
          : Buffer.from(await wallet.signMessage!(new TextEncoder().encode(messageThis))).toString("base64");

      const signatureOther =
        otherChain === "bitcoin"
          ? await signBitcoinMessage(otherAddress, messageOther)
          : Buffer.from(await wallet.signMessage!(new TextEncoder().encode(messageOther))).toString("base64");

      const res = await fetch("/api/account/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          a: { address, signature: signatureThis, timestamp },
          b: { address: otherAddress, signature: signatureOther, timestamp },
        }),
      });
      const json: ApiResponse<ProfileDto> = await res.json();
      if (!json.success || !json.data) throw new Error(json.error ?? "Failed to link wallets");

      onLinked(json.data);
      addToast({ type: "success", message: "Wallets linked" });
    } catch (err: unknown) {
      addToast({ type: "error", message: err instanceof Error ? err.message : "Failed to link wallets. Please try again." });
    } finally {
      setLinking(false);
    }
  };

  return (
    <Button variant="outline" size="sm" className="flex items-center justify-center gap-1.5" onClick={handleLink} disabled={linking}>
      {linking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
      {linking ? "Linking…" : `Link ${otherChain === "solana" ? "Solana" : "Bitcoin"} wallet`}
    </Button>
  );
}
