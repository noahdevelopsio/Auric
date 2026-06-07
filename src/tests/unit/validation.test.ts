import { describe, it, expect } from "vitest";
import {
  validateName,
  validateDescription,
  validateRoyalty,
  validateAttributes,
  validateSolanaAddress,
  validateBtcAddress,
  validateMintForm,
} from "@/lib/utils/validation";

describe("validateName", () => {
  it("accepts a valid name", () => {
    expect(validateName("My NFT")).toBeNull();
  });

  it("rejects empty string", () => {
    expect(validateName("")).not.toBeNull();
  });

  it("rejects whitespace-only string", () => {
    expect(validateName("   ")).not.toBeNull();
  });

  it("rejects name over 100 characters", () => {
    expect(validateName("a".repeat(101))).not.toBeNull();
  });

  it("accepts name at exactly 100 characters", () => {
    expect(validateName("a".repeat(100))).toBeNull();
  });
});

describe("validateDescription", () => {
  it("returns null for empty description (optional field)", () => {
    expect(validateDescription("")).toBeNull();
  });

  it("accepts a valid description", () => {
    expect(validateDescription("A great NFT")).toBeNull();
  });

  it("rejects description over 2000 characters", () => {
    expect(validateDescription("a".repeat(2001))).not.toBeNull();
  });
});

describe("validateRoyalty", () => {
  it("accepts 0%", () => {
    expect(validateRoyalty(0)).toBeNull();
  });

  it("accepts 500 bps (5%)", () => {
    expect(validateRoyalty(500)).toBeNull();
  });

  it("accepts max 5000 bps (50%)", () => {
    expect(validateRoyalty(5000)).toBeNull();
  });

  it("rejects negative bps", () => {
    expect(validateRoyalty(-1)).not.toBeNull();
  });

  it("rejects more than 5000 bps", () => {
    expect(validateRoyalty(5001)).not.toBeNull();
  });

  it("rejects NaN", () => {
    expect(validateRoyalty(NaN)).not.toBeNull();
  });
});

describe("validateAttributes", () => {
  it("accepts empty array", () => {
    expect(validateAttributes([])).toBeNull();
  });

  it("accepts valid attributes", () => {
    expect(validateAttributes([{ trait_type: "Color", value: "Blue" }])).toBeNull();
  });

  it("rejects more than 20 attributes", () => {
    const attrs = Array.from({ length: 21 }, (_, i) => ({ trait_type: `T${i}`, value: "v" }));
    expect(validateAttributes(attrs)).not.toBeNull();
  });

  it("rejects attribute with empty trait_type", () => {
    expect(validateAttributes([{ trait_type: "", value: "Blue" }])).not.toBeNull();
  });

  it("rejects attribute with empty value", () => {
    expect(validateAttributes([{ trait_type: "Color", value: "" }])).not.toBeNull();
  });

  it("rejects trait_type over 50 characters", () => {
    expect(validateAttributes([{ trait_type: "a".repeat(51), value: "v" }])).not.toBeNull();
  });
});

describe("validateSolanaAddress", () => {
  it("accepts a real on-curve Solana public key", () => {
    expect(validateSolanaAddress("AmbEbesfEKs7vo7HJ1xqvDgUqAs7UAv1ts3KcgLvcLwf")).toBeNull();
  });

  it("rejects empty address", () => {
    expect(validateSolanaAddress("")).not.toBeNull();
  });

  it("rejects a non-base58 / malformed string", () => {
    expect(validateSolanaAddress("short")).not.toBeNull();
  });

  it("rejects an address that is the wrong byte length", () => {
    expect(validateSolanaAddress("a".repeat(45))).not.toBeNull();
  });
});

describe("validateBtcAddress", () => {
  it("accepts native segwit (bech32) address", () => {
    expect(validateBtcAddress("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4")).toBeNull();
  });

  it("accepts legacy (1) address", () => {
    expect(validateBtcAddress("1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf" + "Na")).toBeNull();
  });

  it("rejects empty address", () => {
    expect(validateBtcAddress("")).not.toBeNull();
  });

  it("rejects a malformed address", () => {
    expect(validateBtcAddress("xpubinvalidaddress123456789012345")).not.toBeNull();
  });
});

describe("validateMintForm", () => {
  const makeFile = (type: string, size: number) =>
    new File(["x".repeat(size)], "test.png", { type });

  it("returns no errors for a valid Solana mint form", () => {
    const errors = validateMintForm({
      name: "My NFT",
      chain: "solana",
      file: makeFile("image/png", 1024),
      royaltyBps: 500,
      attributes: [{ trait_type: "Color", value: "Red" }],
    });
    expect(errors).toHaveLength(0);
  });

  it("errors when name is missing", () => {
    const errors = validateMintForm({
      name: "",
      chain: "solana",
      file: makeFile("image/png", 1024),
    });
    expect(errors.some((e) => e.field === "name")).toBe(true);
  });

  it("errors when file is null", () => {
    const errors = validateMintForm({ name: "Valid", chain: "solana", file: null });
    expect(errors.some((e) => e.field === "file")).toBe(true);
  });

  it("errors on unsupported file type for Solana", () => {
    const errors = validateMintForm({
      name: "Valid",
      chain: "solana",
      file: makeFile("application/pdf", 1024),
    });
    expect(errors.some((e) => e.field === "file")).toBe(true);
  });

  it("errors when file exceeds 4MB limit for Bitcoin", () => {
    const errors = validateMintForm({
      name: "Valid",
      chain: "bitcoin",
      file: makeFile("image/png", 5 * 1024 * 1024),
    });
    expect(errors.some((e) => e.field === "file")).toBe(true);
  });
});
