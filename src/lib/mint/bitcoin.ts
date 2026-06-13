import { createInscription, BitcoinNetworkType } from "sats-connect";
import { BTC_PLATFORM_FEE, PLATFORM_FEE_ADDRESS_BTC, BITCOIN_NETWORK } from "@/lib/utils/constants";

export interface InscribeParams {
  contentType: string;
  content: string; // base64-encoded file content
  feeRateSatsPerVb: number;
}

export interface InscribeResult {
  txId: string;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function inscribeOnBitcoin(params: InscribeParams): Promise<InscribeResult> {
  const { contentType, content, feeRateSatsPerVb } = params;

  return new Promise((resolve, reject) => {
    createInscription({
      payload: {
        network: { type: BITCOIN_NETWORK === "mainnet" ? BitcoinNetworkType.Mainnet : BitcoinNetworkType.Testnet },
        contentType,
        content,
        payloadType: "BASE_64",
        suggestedMinerFeeRate: feeRateSatsPerVb,
        ...(PLATFORM_FEE_ADDRESS_BTC
          ? { appFee: Math.round(BTC_PLATFORM_FEE * 1e8), appFeeAddress: PLATFORM_FEE_ADDRESS_BTC }
          : {}),
      },
      onFinish: (response) => resolve(response),
      onCancel: () => reject(new Error("Inscription cancelled")),
    }).catch(reject);
  });
}
