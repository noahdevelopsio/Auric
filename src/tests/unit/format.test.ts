import { describe, it, expect } from "vitest";
import {
  shortenAddress,
  formatLamportsToSol,
  formatSatoshisToBtc,
  formatUsd,
  formatNumber,
  formatFileSize,
  formatPercentage,
} from "@/lib/utils/format";

describe("shortenAddress", () => {
  it("returns empty string for empty input", () => {
    expect(shortenAddress("")).toBe("");
  });

  it("shortens a long address with default chars=4", () => {
    const addr = "7xKpBnZq3mRm7fYd3mZqABCDEF123456789abcdef12";
    expect(shortenAddress(addr)).toBe("7xKp...ef12");
  });

  it("returns the address unchanged when it is short enough", () => {
    expect(shortenAddress("abc123")).toBe("abc123");
  });

  it("respects custom chars param", () => {
    const addr = "7xKpBnZq3mRm7fYd3mZqABCDEF";
    expect(shortenAddress(addr, 6)).toBe("7xKpBn...ABCDEF");
  });
});

describe("formatLamportsToSol", () => {
  it("formats exactly 1 SOL", () => {
    expect(formatLamportsToSol(1_000_000_000)).toBe("1.00 SOL");
  });

  it("formats sub-SOL with 4 decimals", () => {
    expect(formatLamportsToSol(500_000_000)).toBe("0.5000 SOL");
  });

  it("formats tiny amounts with 6 decimals", () => {
    expect(formatLamportsToSol(5_000)).toBe("0.000005 SOL");
  });

  it("handles bigint input", () => {
    expect(formatLamportsToSol(BigInt(2_000_000_000))).toBe("2.00 SOL");
  });
});

describe("formatSatoshisToBtc", () => {
  it("formats 1 BTC", () => {
    expect(formatSatoshisToBtc(100_000_000)).toBe("1.0000 BTC");
  });

  it("formats fractional BTC", () => {
    expect(formatSatoshisToBtc(50_000_000)).toBe("0.500000 BTC");
  });

  it("formats tiny amounts at 8 decimals", () => {
    expect(formatSatoshisToBtc(100)).toBe("0.00000100 BTC");
  });
});

describe("formatUsd", () => {
  it("formats values >= 1 with 2 decimals", () => {
    expect(formatUsd(1234.56)).toBe("≈ $1234.56");
  });

  it("formats small values with 4 decimals", () => {
    expect(formatUsd(0.0012)).toBe("≈ $0.0012");
  });
});

describe("formatNumber", () => {
  it("adds comma separators", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  it("leaves small numbers unchanged", () => {
    expect(formatNumber(42)).toBe("42");
  });
});

describe("formatFileSize", () => {
  it("formats zero bytes", () => {
    expect(formatFileSize(0)).toBe("0 B");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
  });

  it("formats megabytes", () => {
    expect(formatFileSize(2 * 1024 * 1024)).toBe("2 MB");
  });
});

describe("formatPercentage", () => {
  it("formats with default 1 decimal", () => {
    expect(formatPercentage(5)).toBe("5.0%");
  });

  it("respects custom decimals", () => {
    expect(formatPercentage(2.5, 2)).toBe("2.50%");
  });
});
