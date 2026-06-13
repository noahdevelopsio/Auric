import { Verifier } from 'bip322-js';
import { buildAuthMessage, AUTH_MESSAGE_MAX_AGE_MS } from './walletAuth';

export interface BitcoinWalletAuthInput {
  action: string;
  address: string;
  signature: string; // base64-encoded BIP-322 signature
  timestamp: number;
}

// Verifies a BIP-322 wallet-signed auth message. Returns null if valid, or an
// error message describing why verification failed.
export function verifyBitcoinWalletAuth({ action, address, signature, timestamp }: BitcoinWalletAuthInput): string | null {
  if (!Number.isFinite(timestamp)) return "Invalid timestamp";

  const age = Date.now() - timestamp;
  if (age < 0 || age > AUTH_MESSAGE_MAX_AGE_MS) return "Signed message has expired";

  const message = buildAuthMessage(action, address, timestamp);

  try {
    return Verifier.verifySignature(address, message, signature) ? null : "Signature verification failed";
  } catch {
    return "Invalid address or signature encoding";
  }
}
