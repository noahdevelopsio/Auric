import type { WalletContextState } from "@solana/wallet-adapter-react";
import { buildAuthMessage } from "@/lib/auth/walletAuth";
import type { Activity, ChainType } from "@/types/nft";

export interface RecordActivityInput {
  type: Activity["type"];
  chain: ChainType;
  nftId: string;
  nftName: string;
  nftImage?: string;
  fromWallet?: string;
  toWallet?: string;
  priceLamports?: number;
  txSignature?: string;
}

const AUTH_ACTION = "record activity";

// Fire-and-forget: activity logging is best-effort and must never block or
// fail the calling mint/list/buy/cancel flow. Solana activity requires a
// signed auth message (matching /api/profile and /api/collections) so the
// public activity feed and platform stats can't be spoofed anonymously.
export async function recordActivity(input: RecordActivityInput, wallet?: WalletContextState): Promise<void> {
  let auth: { address: string; signature: string; timestamp: number } | undefined;

  if (input.chain === "solana") {
    if (!wallet?.signMessage || !wallet.publicKey) return;
    try {
      const address = wallet.publicKey.toBase58();
      const timestamp = Date.now();
      const message = buildAuthMessage(AUTH_ACTION, address, timestamp);
      const signatureBytes = await wallet.signMessage(new TextEncoder().encode(message));
      auth = { address, signature: Buffer.from(signatureBytes).toString("base64"), timestamp };
    } catch {
      return;
    }
  }

  fetch("/api/activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, ...auth }),
  }).catch(() => {});
}
