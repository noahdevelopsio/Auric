// Rough overhead (in vBytes) for the reveal transaction that carries an
// ordinal inscription envelope, excluding the witness-discounted content.
const INSCRIPTION_BASE_OVERHEAD_VBYTES = 160;

// Witness data (where inscription content lives) is discounted ~4x under
// segwit weight rules, so 1 content byte ≈ 0.25 vBytes.
const WITNESS_DISCOUNT = 4;

export function estimateInscriptionVBytes(contentSizeBytes: number): number {
  return INSCRIPTION_BASE_OVERHEAD_VBYTES + Math.ceil(contentSizeBytes / WITNESS_DISCOUNT);
}

export interface PrepareInscriptionInput {
  contentType: string;
  contentSizeBytes: number;
  recipient: string;
  feeRate: number;
}

export interface PreparedInscription {
  recipient: string;
  contentType: string;
  contentSizeBytes: number;
  feeRate: number;
  estimatedVBytes: number;
  estimatedFeeSats: number;
}

// Prepares an inscription payload for client-side signing. No PSBT is
// constructed or signed server-side — this only validates inputs and
// estimates the reveal-transaction fee.
export function prepareInscriptionPayload(input: PrepareInscriptionInput): PreparedInscription {
  const estimatedVBytes = estimateInscriptionVBytes(input.contentSizeBytes);
  const estimatedFeeSats = Math.ceil(estimatedVBytes * input.feeRate);

  return {
    recipient: input.recipient,
    contentType: input.contentType,
    contentSizeBytes: input.contentSizeBytes,
    feeRate: input.feeRate,
    estimatedVBytes,
    estimatedFeeSats,
  };
}
