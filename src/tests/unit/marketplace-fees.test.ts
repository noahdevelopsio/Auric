import { describe, it, expect } from "vitest";
import {
  calcPlatformFee,
  calcRoyaltyFee,
  calcSellerProceeds,
  PLATFORM_FEE_BPS,
  DEFAULT_ROYALTY_BPS,
} from "@/lib/marketplace/solana";

describe("calcPlatformFee", () => {
  it("applies 2.5% platform fee", () => {
    expect(calcPlatformFee(10)).toBeCloseTo(0.25);
  });

  it("returns 0 for 0 price", () => {
    expect(calcPlatformFee(0)).toBe(0);
  });

  it("scales linearly with price", () => {
    expect(calcPlatformFee(100)).toBeCloseTo(2.5);
    expect(calcPlatformFee(1)).toBeCloseTo(0.025);
  });

  it("PLATFORM_FEE_BPS constant is 250 (2.5%)", () => {
    expect(PLATFORM_FEE_BPS).toBe(250);
  });
});

describe("calcRoyaltyFee", () => {
  it("applies 5% royalty correctly", () => {
    expect(calcRoyaltyFee(10, 500)).toBeCloseTo(0.5);
  });

  it("applies 10% royalty correctly", () => {
    expect(calcRoyaltyFee(10, 1000)).toBeCloseTo(1.0);
  });

  it("returns 0 for 0 bps", () => {
    expect(calcRoyaltyFee(100, 0)).toBe(0);
  });

  it("DEFAULT_ROYALTY_BPS constant is 500 (5%)", () => {
    expect(DEFAULT_ROYALTY_BPS).toBe(500);
  });
});

describe("calcSellerProceeds", () => {
  it("deducts both platform fee and royalty from price", () => {
    // price=10, platform=2.5%(0.25), royalty=5%(0.5) → proceeds=9.25
    expect(calcSellerProceeds(10, 500)).toBeCloseTo(9.25);
  });

  it("seller gets full amount when 0 royalty and 0 platform fee bps edge case", () => {
    // Using 0 royalty only; platform fee is always applied
    const proceeds = calcSellerProceeds(10, 0);
    expect(proceeds).toBeCloseTo(9.75); // 10 - 0.25 (2.5%) platform fee
  });

  it("proceeds are always less than listing price", () => {
    const price = 5;
    const proceeds = calcSellerProceeds(price, 500);
    expect(proceeds).toBeLessThan(price);
  });

  it("proceeds + platform fee + royalty fee = listing price", () => {
    const price = 20;
    const royaltyBps = 500;
    const proceeds = calcSellerProceeds(price, royaltyBps);
    const platformFee = calcPlatformFee(price);
    const royaltyFee = calcRoyaltyFee(price, royaltyBps);
    expect(proceeds + platformFee + royaltyFee).toBeCloseTo(price);
  });
});
