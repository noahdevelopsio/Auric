import * as bitcoin from 'bitcoinjs-lib';

const { toXOnly } = bitcoin;

// Mainnet only, matching BITCOIN_NETWORK.
export function getBitcoinNetwork() {
  return bitcoin.networks.bitcoin;
}

export function normalizePsbtInput(psbtInput: string): string {
  const trimmed = psbtInput.trim();

  if (!trimmed) {
    throw new Error('PSBT input is empty');
  }

  try {
    return bitcoin.Psbt.fromBase64(trimmed).toBase64();
  } catch {
    try {
      return bitcoin.Psbt.fromHex(trimmed).toBase64();
    } catch {
      throw new Error('PSBT must be valid base64 or hex');
    }
  }
}

export interface OrdinalUtxoInput {
  txid: string;
  vout: number;
  value: number;
  scriptPubKey: Buffer;
  internalPubkey: Buffer;
}

export interface BuyerUtxoInput {
  txid: string;
  vout: number;
  value: number;
  scriptPubKey: Buffer;
  internalPubkey: Buffer;
}

const SIGHASH_SINGLE_ANYONECANPAY =
  bitcoin.Transaction.SIGHASH_SINGLE | bitcoin.Transaction.SIGHASH_ANYONECANPAY;

// Dust threshold below which a change output is dropped (added to the fee instead).
const DUST_THRESHOLD_SATS = 546;

// Rough vbyte costs for fee estimation, assuming taproot key-path spends/outputs.
const TX_BASE_VBYTES = 11;
const TAPROOT_INPUT_VBYTES = 58;
const TAPROOT_OUTPUT_VBYTES = 43;

function estimateVsize(inputCount: number, outputCount: number): number {
  return TX_BASE_VBYTES + inputCount * TAPROOT_INPUT_VBYTES + outputCount * TAPROOT_OUTPUT_VBYTES;
}

// P2TR output scripts are exactly `OP_1 <32-byte-x-only-pubkey>` (0x51 0x20 <32 bytes>).
function isTaprootScript(script: Buffer): boolean {
  return script.length === 34 && script[0] === 0x51 && script[1] === 0x20;
}

// Builds a single-input, single-output PSBT offering an ordinal UTXO for sale.
// Input 0 (the ordinal UTXO) is signed with SIGHASH_SINGLE | SIGHASH_ANYONECANPAY,
// binding it to output 0 (the seller's proceeds) while allowing a buyer to append
// additional inputs/outputs without invalidating the seller's signature.
export function buildListingPsbt(opts: {
  ordinalUtxo: OrdinalUtxoInput;
  sellerPaymentAddress: string;
  priceSats: number;
}): bitcoin.Psbt {
  const psbt = new bitcoin.Psbt({ network: getBitcoinNetwork() });

  psbt.addInput({
    hash: opts.ordinalUtxo.txid,
    index: opts.ordinalUtxo.vout,
    witnessUtxo: {
      script: opts.ordinalUtxo.scriptPubKey,
      value: BigInt(opts.ordinalUtxo.value),
    },
    tapInternalKey: toXOnly(opts.ordinalUtxo.internalPubkey),
    sighashType: SIGHASH_SINGLE_ANYONECANPAY,
  });

  psbt.addOutput({
    address: opts.sellerPaymentAddress,
    value: BigInt(opts.priceSats),
  });

  return psbt;
}

// Combines a seller's signed listing PSBT with buyer payment UTXOs to produce a
// complete sale transaction. The seller's input/output remain at index 0 — this
// is required for their SIGHASH_SINGLE|ANYONECANPAY signature to remain valid.
// Buyer inputs are appended after input 0, and an ordinal-recipient output
// (returning the ordinal's postage value to the buyer) plus an optional change
// output are appended after output 0.
export function buildBuyPsbt(opts: {
  sellerSignedPsbt: string;
  buyerOrdinalsAddress: string;
  buyerUtxos: BuyerUtxoInput[];
  buyerChangeAddress: string;
  feeRateSatsPerVb: number;
}): { psbt: bitcoin.Psbt; signInputIndexes: number[]; networkFeeSats: number } {
  const psbt = bitcoin.Psbt.fromBase64(normalizePsbtInput(opts.sellerSignedPsbt), {
    network: getBitcoinNetwork(),
  });

  if (psbt.txInputs.length !== 1 || psbt.txOutputs.length !== 1) {
    throw new Error('Seller PSBT must contain exactly one input and one output');
  }

  const sellerInput = psbt.data.inputs[0];
  if (sellerInput.sighashType !== SIGHASH_SINGLE_ANYONECANPAY) {
    throw new Error('Seller PSBT input has an unexpected sighash type');
  }
  if (!sellerInput.witnessUtxo) {
    throw new Error('Seller PSBT input is missing witness UTXO data');
  }

  const ordinalValueSats = Number(sellerInput.witnessUtxo.value);
  const priceSats = Number(psbt.txOutputs[0].value);

  // Output 1: return the ordinal's postage value to the buyer's ordinals address.
  psbt.addOutput({
    address: opts.buyerOrdinalsAddress,
    value: BigInt(ordinalValueSats),
  });

  const signInputIndexes: number[] = [];
  let buyerInputSum = 0;
  for (const utxo of opts.buyerUtxos) {
    signInputIndexes.push(psbt.inputCount);
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        script: utxo.scriptPubKey,
        value: BigInt(utxo.value),
      },
      // Only taproot (P2TR) payment UTXOs need a tapInternalKey for key-path
      // signing; segwit v0 (P2WPKH) inputs sign from witnessUtxo alone.
      ...(isTaprootScript(utxo.scriptPubKey) ? { tapInternalKey: toXOnly(utxo.internalPubkey) } : {}),
    });
    buyerInputSum += utxo.value;
  }

  const totalInputCount = 1 + opts.buyerUtxos.length;
  const remaining = buyerInputSum - priceSats;
  const feeWithChange = Math.ceil(estimateVsize(totalInputCount, 3) * opts.feeRateSatsPerVb);
  const feeWithoutChange = Math.ceil(estimateVsize(totalInputCount, 2) * opts.feeRateSatsPerVb);

  let networkFeeSats: number;
  if (remaining - feeWithChange >= DUST_THRESHOLD_SATS) {
    psbt.addOutput({
      address: opts.buyerChangeAddress,
      value: BigInt(remaining - feeWithChange),
    });
    networkFeeSats = feeWithChange;
  } else if (remaining >= feeWithoutChange) {
    networkFeeSats = remaining;
  } else {
    throw new Error('Selected UTXOs do not cover the price and network fee');
  }

  return { psbt, signInputIndexes, networkFeeSats };
}

// Re-checks a stored signed listing PSBT still offers the expected UTXO at the
// expected price, with the expected sighash flags and seller payment address.
export function validateListingPsbt(opts: {
  signedPsbtBase64: string;
  expectedTxid: string;
  expectedVout: number;
  expectedPriceSats: number;
  expectedSellerPaymentAddress: string;
}): { valid: boolean; error?: string } {
  let psbt: bitcoin.Psbt;
  try {
    psbt = bitcoin.Psbt.fromBase64(normalizePsbtInput(opts.signedPsbtBase64), {
      network: getBitcoinNetwork(),
    });
  } catch {
    return { valid: false, error: 'Invalid PSBT encoding' };
  }

  if (psbt.txInputs.length !== 1 || psbt.txOutputs.length !== 1) {
    return { valid: false, error: 'PSBT must contain exactly one input and one output' };
  }

  const input = psbt.data.inputs[0];
  const txInput = psbt.txInputs[0];

  if (input.sighashType !== SIGHASH_SINGLE_ANYONECANPAY) {
    return { valid: false, error: 'PSBT input must use SIGHASH_SINGLE | SIGHASH_ANYONECANPAY' };
  }

  if (!input.tapKeySig && !(input.partialSig && input.partialSig.length > 0)) {
    return { valid: false, error: 'PSBT input is not signed' };
  }

  const txidFromPsbt = Buffer.from(txInput.hash).reverse().toString('hex');
  if (txidFromPsbt !== opts.expectedTxid || txInput.index !== opts.expectedVout) {
    return { valid: false, error: 'PSBT input does not match the listed UTXO' };
  }

  const output = psbt.txOutputs[0];
  if (Number(output.value) !== opts.expectedPriceSats) {
    return { valid: false, error: 'PSBT output value does not match the listed price' };
  }

  if (output.address !== opts.expectedSellerPaymentAddress) {
    return { valid: false, error: 'PSBT output address does not match the seller payment address' };
  }

  return { valid: true };
}
