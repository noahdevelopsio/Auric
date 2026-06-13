// Fetches NFTs owned/created by a wallet via Helius' DAS JSON-RPC API,
// which is exposed on the same endpoint as the Solana RPC connection.

export interface SolanaOwnedAsset {
  mintAddress: string;
  name: string;
  image?: string;
  collection?: string;
}

export interface SolanaAssetAttribute {
  trait_type: string;
  value: string;
}

export interface SolanaAssetDetail {
  mintAddress: string;
  name: string;
  description?: string;
  image?: string;
  owner?: string;
  attributes: SolanaAssetAttribute[];
  collectionAddress?: string;
  royaltyBps: number;
  jsonUri?: string;
}

interface DasAsset {
  id: string;
  content?: {
    metadata?: { name?: string };
    links?: { image?: string };
  };
  grouping?: { group_key: string; group_value: string }[];
}

interface DasAssetDetail {
  id: string;
  content?: {
    json_uri?: string;
    metadata?: {
      name?: string;
      description?: string;
      attributes?: { trait_type: string; value: string }[];
    };
    links?: { image?: string };
  };
  grouping?: { group_key: string; group_value: string }[];
  ownership?: { owner?: string };
  royalty?: { basis_points?: number };
}

async function dasRequest(rpcUrl: string, method: string, params: Record<string, unknown>): Promise<DasAsset[]> {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "auric", method, params }),
  });
  if (!res.ok) throw new Error(`DAS request failed with status ${res.status}`);

  const json: { result?: { items?: DasAsset[] }; error?: { message?: string } } = await res.json();
  if (json.error) throw new Error(json.error.message ?? "DAS request failed");
  return json.result?.items ?? [];
}

function toOwnedAsset(asset: DasAsset): SolanaOwnedAsset {
  const collection = asset.grouping?.find((g) => g.group_key === "collection")?.group_value;
  return {
    mintAddress: asset.id,
    name: asset.content?.metadata?.name || "Untitled",
    image: asset.content?.links?.image,
    collection,
  };
}

export async function fetchSolanaOwnedAssets(rpcUrl: string, ownerAddress: string): Promise<SolanaOwnedAsset[]> {
  const items = await dasRequest(rpcUrl, "getAssetsByOwner", { ownerAddress, page: 1, limit: 50 });
  return items.map(toOwnedAsset);
}

export async function fetchSolanaCreatedAssets(rpcUrl: string, creatorAddress: string): Promise<SolanaOwnedAsset[]> {
  const items = await dasRequest(rpcUrl, "getAssetsByCreator", { creatorAddress, onlyVerified: true, page: 1, limit: 50 });
  return items.map(toOwnedAsset);
}

export async function fetchSolanaAsset(rpcUrl: string, mintAddress: string): Promise<SolanaAssetDetail | null> {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "auric", method: "getAsset", params: { id: mintAddress } }),
  });
  if (!res.ok) throw new Error(`DAS request failed with status ${res.status}`);

  const json: { result?: DasAssetDetail; error?: { message?: string } } = await res.json();
  if (json.error) {
    if (/not found/i.test(json.error.message ?? "")) return null;
    throw new Error(json.error.message ?? "DAS request failed");
  }
  if (!json.result) return null;

  const asset = json.result;
  return {
    mintAddress: asset.id,
    name: asset.content?.metadata?.name || "Untitled",
    description: asset.content?.metadata?.description,
    image: asset.content?.links?.image,
    owner: asset.ownership?.owner,
    attributes: asset.content?.metadata?.attributes ?? [],
    collectionAddress: asset.grouping?.find((g) => g.group_key === "collection")?.group_value,
    royaltyBps: asset.royalty?.basis_points ?? 0,
    jsonUri: asset.content?.json_uri,
  };
}
