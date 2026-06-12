import { describe, it, expect } from "vitest";
import { estimateInscriptionVBytes, prepareInscriptionPayload } from "@/lib/bitcoin/inscription";

describe("estimateInscriptionVBytes", () => {
  it("adds base overhead to the witness-discounted content size", () => {
    expect(estimateInscriptionVBytes(0)).toBe(160);
    expect(estimateInscriptionVBytes(400)).toBe(160 + 100);
  });

  it("rounds fractional vBytes up", () => {
    expect(estimateInscriptionVBytes(1)).toBe(160 + 1);
  });
});

describe("prepareInscriptionPayload", () => {
  it("returns the inputs alongside fee estimates", () => {
    const result = prepareInscriptionPayload({
      contentType: "image/png",
      contentSizeBytes: 4000,
      recipient: "bc1qexampleaddress",
      feeRate: 25,
    });

    expect(result.recipient).toBe("bc1qexampleaddress");
    expect(result.contentType).toBe("image/png");
    expect(result.contentSizeBytes).toBe(4000);
    expect(result.feeRate).toBe(25);
    expect(result.estimatedVBytes).toBe(160 + 1000);
    expect(result.estimatedFeeSats).toBe((160 + 1000) * 25);
  });

  it("scales fee estimate with fee rate", () => {
    const base = prepareInscriptionPayload({ contentType: "image/png", contentSizeBytes: 1000, recipient: "addr", feeRate: 10 });
    const priority = prepareInscriptionPayload({ contentType: "image/png", contentSizeBytes: 1000, recipient: "addr", feeRate: 50 });

    expect(priority.estimatedFeeSats).toBe(base.estimatedFeeSats * 5);
  });
});
