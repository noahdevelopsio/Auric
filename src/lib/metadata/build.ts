import type { NFTAttribute, NFTMetadata } from "@/types/nft";

export interface BuildMetadataInput {
  name: string;
  description?: string;
  image: string;
  externalUrl?: string;
  attributes?: NFTAttribute[];
  contentType?: string;
  sellerFeeBasisPoints?: number;
}

export interface BuiltNftMetadata extends NFTMetadata {
  seller_fee_basis_points?: number;
}

function categoryFromContentType(contentType: string): string {
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("audio/")) return "audio";
  return "image";
}

export function buildNftMetadata(input: BuildMetadataInput): BuiltNftMetadata {
  const metadata: BuiltNftMetadata = {
    name: input.name.trim(),
    image: input.image,
  };

  if (input.description) metadata.description = input.description.trim();
  if (input.externalUrl) metadata.external_url = input.externalUrl;
  if (input.attributes && input.attributes.length > 0) metadata.attributes = input.attributes;
  if (input.sellerFeeBasisPoints !== undefined) metadata.seller_fee_basis_points = input.sellerFeeBasisPoints;

  const contentType = input.contentType ?? "image/png";
  metadata.properties = {
    files: [{ uri: input.image, type: contentType }],
    category: categoryFromContentType(contentType),
  };

  return metadata;
}
