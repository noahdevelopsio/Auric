import { request } from 'sats-connect';
import { signBitcoinMessage } from '@/lib/bitcoin/signMessage';
import { buildAuthMessage } from '@/lib/auth/walletAuth';
import type { ApiResponse } from '@/types/api';
import type { PreparedListingPsbt, PreparedBuyPsbt } from '@/types/marketplace';

export const SATS_PER_BTC = 100_000_000;

// 0% platform fee on Bitcoin sales for v1 — kept as a function for symmetry
// with the Solana marketplace lib's calc helpers.
export function calcPlatformFee(): number {
  return 0;
}

export function calcSellerProceeds(priceSats: number): number {
  return priceSats;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json: ApiResponse<T> = await res.json();
  if (!res.ok || !json.success || json.data === undefined) {
    throw new Error(json.error ?? `Request to ${url} failed`);
  }

  return json.data;
}

async function signAuth(action: string, address: string): Promise<{ address: string; signature: string; timestamp: number }> {
  const timestamp = Date.now();
  const message = buildAuthMessage(action, address, timestamp);
  const signature = await signBitcoinMessage(address, message);
  return { address, signature, timestamp };
}

export interface CreateListingParams {
  inscriptionId: string;
  ordinalsAddress: string;
  paymentAddress: string;
  publicKey: string;
  priceSats: number;
  nftName: string;
  nftImage?: string;
}

export async function createListing(params: CreateListingParams): Promise<{ id: string }> {
  const prepared = await postJson<PreparedListingPsbt>('/api/marketplace/listings/prepare', {
    inscriptionId: params.inscriptionId,
    ordinalsAddress: params.ordinalsAddress,
    paymentAddress: params.paymentAddress,
    publicKey: params.publicKey,
    priceSats: params.priceSats,
  });

  const signResponse = await request('signPsbt', {
    psbt: prepared.psbt,
    signInputs: prepared.signInputs,
    broadcast: false,
  });

  if (signResponse.status !== 'success') {
    throw new Error(signResponse.error?.message ?? 'Failed to sign listing PSBT');
  }

  const auth = await signAuth('list nft', params.ordinalsAddress);

  return postJson<{ id: string }>('/api/marketplace/listings', {
    inscriptionId: params.inscriptionId,
    sellerAddress: params.ordinalsAddress,
    sellerPaymentAddress: params.paymentAddress,
    priceSats: params.priceSats,
    signedPsbt: signResponse.result.psbt,
    nftName: params.nftName,
    nftImage: params.nftImage,
    ...auth,
  });
}

export async function cancelListing(params: { listingId: string; sellerAddress: string }): Promise<void> {
  const auth = await signAuth('cancel listing', params.sellerAddress);
  await postJson<{ id: string }>(`/api/marketplace/listings/${params.listingId}/cancel`, auth);
}

export interface ExecuteBuyParams {
  listingId: string;
  buyerOrdinalsAddress: string;
  buyerPaymentAddress: string;
  buyerPublicKey: string;
}

// Read-only preview of the combined buy PSBT, used to display the estimated
// network fee before the buyer commits. executeBuy() re-fetches its own copy
// when signing, since this preview doesn't mutate any state.
export async function previewBuy(params: ExecuteBuyParams): Promise<PreparedBuyPsbt> {
  return postJson<PreparedBuyPsbt>(`/api/marketplace/listings/${params.listingId}/buy-psbt`, {
    buyerOrdinalsAddress: params.buyerOrdinalsAddress,
    buyerPaymentAddress: params.buyerPaymentAddress,
    buyerPublicKey: params.buyerPublicKey,
  });
}

export async function executeBuy(params: ExecuteBuyParams): Promise<{ txId: string }> {
  const prepared = await postJson<PreparedBuyPsbt>(`/api/marketplace/listings/${params.listingId}/buy-psbt`, {
    buyerOrdinalsAddress: params.buyerOrdinalsAddress,
    buyerPaymentAddress: params.buyerPaymentAddress,
    buyerPublicKey: params.buyerPublicKey,
  });

  const signResponse = await request('signPsbt', {
    psbt: prepared.psbt,
    signInputs: prepared.signInputs,
    broadcast: true,
  });

  if (signResponse.status !== 'success') {
    throw new Error(signResponse.error?.message ?? 'Failed to sign purchase PSBT');
  }

  const txId = signResponse.result.txid;
  if (!txId) {
    throw new Error('Wallet did not return a transaction ID');
  }

  const auth = await signAuth('complete purchase', params.buyerOrdinalsAddress);

  await postJson<{ id: string }>(`/api/marketplace/listings/${params.listingId}/complete`, {
    buyerAddress: params.buyerOrdinalsAddress,
    saleTxId: txId,
    ...auth,
  });

  return { txId };
}
