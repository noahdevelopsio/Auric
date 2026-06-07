import * as bitcoin from 'bitcoinjs-lib';

export type Network = 'mainnet' | 'testnet';

export function getBitcoinNetwork(network: Network) {
  return network === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
}

export function normalizePsbtInput(psbtInput: string) {
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

// Create a basic PSBT for a single recipient from provided UTXOs.
// This is a helper; real production code must handle fee estimation and dust limits too.
export function createPsbtFromUtxos(opts: {
  utxos: Array<{ txid: string; vout: number; value: number; scriptPubKey?: string }>;
  toAddress: string;
  changeAddress: string;
  amount: number; // sats
  fee: number; // sats
  network?: Network;
}) {
  const net = getBitcoinNetwork(opts.network ?? 'testnet');
  const psbt = new bitcoin.Psbt({ network: net });

  let inputSum = 0;
  for (const u of opts.utxos) {
    // For PSBT.addInput we need nonWitnessUtxo or witnessUtxo; here we add minimal witnessUtxo when value available.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    psbt.addInput({ hash: u.txid, index: u.vout, witnessUtxo: { script: Buffer.from(u.scriptPubKey ?? '', 'hex'), value: BigInt(u.value) } } as any);
    inputSum += u.value;
  }

  const change = inputSum - opts.amount - opts.fee;
  if (change < 0) {
    throw new Error('Insufficient UTXO value to cover amount and fee');
  }

  psbt.addOutput({ address: opts.toAddress, value: BigInt(opts.amount) });
  if (change > 0) {
    psbt.addOutput({ address: opts.changeAddress, value: BigInt(change) });
  }

  return psbt;
}

export function finalizePsbt(psbt: bitcoin.Psbt) {
  try {
    psbt.finalizeAllInputs();
  } catch {
    // finalize may fail if inputs are not fully signed
  }
  return psbt.extractTransaction().toHex();
}
