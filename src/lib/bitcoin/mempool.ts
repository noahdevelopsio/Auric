// Server-side only: mempool.space is used for buyer UTXO lookups, fee-rate
// estimates, and raw transaction lookups when constructing marketplace PSBTs.
// Mainnet only, matching BITCOIN_NETWORK.
const MEMPOOL_API_BASE = "https://mempool.space/api";

export interface MempoolUtxo {
  txid: string;
  vout: number;
  value: number;
  status: { confirmed: boolean };
}

export interface FeeRates {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

export async function fetchAddressUtxos(address: string): Promise<MempoolUtxo[]> {
  const res = await fetch(`${MEMPOOL_API_BASE}/address/${encodeURIComponent(address)}/utxo`);
  if (!res.ok) {
    throw new Error(`Failed to fetch UTXOs for address (status ${res.status})`);
  }
  return res.json();
}

export async function fetchRecommendedFees(): Promise<FeeRates> {
  const res = await fetch(`${MEMPOOL_API_BASE}/v1/fees/recommended`);
  if (!res.ok) {
    throw new Error(`Failed to fetch recommended fees (status ${res.status})`);
  }
  return res.json();
}

export async function fetchTxHex(txid: string): Promise<string> {
  const res = await fetch(`${MEMPOOL_API_BASE}/tx/${encodeURIComponent(txid)}/hex`);
  if (!res.ok) {
    throw new Error(`Failed to fetch transaction hex for ${txid} (status ${res.status})`);
  }
  return res.text();
}
