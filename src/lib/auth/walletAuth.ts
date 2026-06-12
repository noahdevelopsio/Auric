import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";

// How long a signed auth message remains valid for. Bounds replay of a
// captured signature to a short window.
export const AUTH_MESSAGE_MAX_AGE_MS = 5 * 60 * 1000;

// The message a wallet signs to prove ownership of `address` for a given
// `action`. Both client and server must build this identically.
export function buildAuthMessage(action: string, address: string, timestamp: number): string {
  return `Auric: ${action}\nAddress: ${address}\nTimestamp: ${timestamp}`;
}

export interface WalletAuthInput {
  action: string;
  address: string;
  signature: string; // base64-encoded signature bytes
  timestamp: number;
}

// Verifies a wallet-signed auth message. Returns null if valid, or an error
// message describing why verification failed.
export function verifyWalletAuth({ action, address, signature, timestamp }: WalletAuthInput): string | null {
  if (!Number.isFinite(timestamp)) return "Invalid timestamp";

  const age = Date.now() - timestamp;
  if (age < 0 || age > AUTH_MESSAGE_MAX_AGE_MS) return "Signed message has expired";

  let publicKeyBytes: Uint8Array;
  let signatureBytes: Uint8Array;
  try {
    publicKeyBytes = new PublicKey(address).toBytes();
    signatureBytes = new Uint8Array(Buffer.from(signature, "base64"));
  } catch {
    return "Invalid address or signature encoding";
  }

  if (signatureBytes.length !== nacl.sign.signatureLength) {
    return "Invalid signature length";
  }

  const message = buildAuthMessage(action, address, timestamp);
  const messageBytes = new TextEncoder().encode(message);

  const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  return isValid ? null : "Signature verification failed";
}
