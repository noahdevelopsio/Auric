import { describe, it, expect } from "vitest";
import { buildNftMetadata } from "@/lib/metadata/build";

describe("buildNftMetadata", () => {
  it("builds minimal metadata with image-derived properties", () => {
    const metadata = buildNftMetadata({ name: "  My NFT  ", image: "https://example.com/img.png" });

    expect(metadata.name).toBe("My NFT");
    expect(metadata.image).toBe("https://example.com/img.png");
    expect(metadata.description).toBeUndefined();
    expect(metadata.properties).toEqual({
      files: [{ uri: "https://example.com/img.png", type: "image/png" }],
      category: "image",
    });
  });

  it("includes description, external_url, attributes, and seller_fee_basis_points when provided", () => {
    const metadata = buildNftMetadata({
      name: "My NFT",
      description: "  A cool NFT  ",
      image: "https://example.com/img.png",
      externalUrl: "https://example.com",
      attributes: [{ trait_type: "Color", value: "Blue" }],
      sellerFeeBasisPoints: 500,
    });

    expect(metadata.description).toBe("A cool NFT");
    expect(metadata.external_url).toBe("https://example.com");
    expect(metadata.attributes).toEqual([{ trait_type: "Color", value: "Blue" }]);
    expect(metadata.seller_fee_basis_points).toBe(500);
  });

  it("categorizes video content types", () => {
    const metadata = buildNftMetadata({
      name: "Clip",
      image: "https://example.com/clip.mp4",
      contentType: "video/mp4",
    });

    expect(metadata.properties?.category).toBe("video");
    expect(metadata.properties?.files).toEqual([{ uri: "https://example.com/clip.mp4", type: "video/mp4" }]);
  });

  it("omits attributes when an empty array is given", () => {
    const metadata = buildNftMetadata({ name: "My NFT", image: "https://example.com/img.png", attributes: [] });
    expect(metadata.attributes).toBeUndefined();
  });
});
