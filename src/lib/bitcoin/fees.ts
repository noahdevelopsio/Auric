import { PLATFORM_FEE_ADDRESS_BTC } from "@/lib/utils/constants";

// Marketplace fee rate in basis points (PRD §7: 2% of sale on Bitcoin sales),
// shared with the Solana marketplace's NEXT_PUBLIC_PLATFORM_FEE_BPS.
export const PLATFORM_FEE_BPS = Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_BPS) || 0;

// Outputs below this are non-standard dust that relay nodes reject.
export const DUST_THRESHOLD_SATS = 546;

// The platform's cut of a sale, in sats. Returns 0 if no fee-collection
// address is configured yet, or if the computed fee would itself be a dust
// output (too small for a separate output to be worth adding).
export function calcPlatformFee(priceSats: number): number {
  if (!PLATFORM_FEE_ADDRESS_BTC || PLATFORM_FEE_BPS <= 0) return 0;
  const fee = Math.floor((priceSats * PLATFORM_FEE_BPS) / 10_000);
  return fee >= DUST_THRESHOLD_SATS ? fee : 0;
}

export function calcSellerProceeds(priceSats: number): number {
  return priceSats - calcPlatformFee(priceSats);
}
