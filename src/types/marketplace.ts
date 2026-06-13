export interface OrdinalListing {
  id: string;
  inscriptionId: string;
  sellerAddress: string;
  sellerPaymentAddress: string;
  priceSats: number;
  utxoTxid: string;
  utxoVout: number;
  utxoValueSats: number;
  status: "active" | "sold" | "cancelled";
  nftName?: string;
  nftImage?: string;
  buyerAddress?: string;
  saleTxId?: string;
  soldAt?: string;
  createdAt: string;
}

export interface PreparedListingPsbt {
  psbt: string; // base64, unsigned
  signInputs: Record<string, number[]>; // { [ordinalsAddress]: [0] }
}

export interface PreparedBuyPsbt {
  psbt: string; // base64, combined PSBT (seller input/output + buyer inputs/outputs)
  signInputs: Record<string, number[]>; // { [buyerPaymentAddress]: [...] }
  totalSats: number; // price + network fee buyer pays
  networkFeeSats: number;
}
