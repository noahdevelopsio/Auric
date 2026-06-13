import { request, MessageSigningProtocols } from 'sats-connect';

// Signs a message with the connected Bitcoin wallet using BIP-322, which
// works for taproot (ordinals) addresses unlike legacy ECDSA message signing.
export async function signBitcoinMessage(address: string, message: string): Promise<string> {
  const response = await request('signMessage', {
    address,
    message,
    protocol: MessageSigningProtocols.BIP322,
  });

  if (response.status !== 'success') {
    throw new Error(response.error?.message ?? 'Message signing failed');
  }

  return response.result.signature;
}
