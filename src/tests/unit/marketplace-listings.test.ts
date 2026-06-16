// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";
import { buildAuthMessage } from "@/lib/auth/walletAuth";
import { FakeSupabase, asSupabaseClient } from "../helpers/fakeSupabase";
import { GET, POST } from "@/app/api/marketplace/listings/route";
import { POST as cancelPOST } from "@/app/api/marketplace/listings/[id]/cancel/route";
import { POST as completePOST } from "@/app/api/marketplace/listings/[id]/complete/route";

let fakeSupabase: FakeSupabase;

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdmin: () => asSupabaseClient(fakeSupabase),
}));

beforeEach(() => {
  fakeSupabase = new FakeSupabase();
});

function makeSolanaWallet() {
  const keypair = Keypair.generate();
  const address = keypair.publicKey.toBase58();
  return {
    address,
    sign: (message: string) =>
      Buffer.from(nacl.sign.detached(new TextEncoder().encode(message), new Uint8Array(keypair.secretKey))).toString("base64"),
  };
}

function authFor(wallet: ReturnType<typeof makeSolanaWallet>, action: string, timestamp = Date.now()) {
  const message = buildAuthMessage(action, wallet.address, timestamp);
  return { address: wallet.address, signature: wallet.sign(message), timestamp };
}

function getRequest(query: string) {
  return new NextRequest(`http://localhost/api/marketplace/listings${query}`);
}

function postRequest(url: string, body: unknown) {
  return new NextRequest(`http://localhost${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function activeSolanaRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "sol-1",
    mint_address: Keypair.generate().publicKey.toBase58(),
    listing_address: Keypair.generate().publicKey.toBase58(),
    seller_address: Keypair.generate().publicKey.toBase58(),
    price_lamports: 1_000_000_000,
    royalty_bps: 500,
    tx_signature: "tx-sol-1",
    status: "active",
    nft_name: "Cool Solana NFT",
    nft_image: "https://example.com/sol.png",
    buyer_address: null,
    sale_tx_signature: null,
    sold_at: null,
    expires_at: null,
    created_at: "2024-01-02T00:00:00.000Z",
    ...overrides,
  };
}

function activeOrdinalRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "ord-1",
    inscription_id: "inscriptionabc123i0",
    seller_address: "bc1pseller",
    seller_payment_address: "bc1pseller-payment",
    price_sats: 50_000_000,
    utxo_txid: "deadbeef",
    utxo_vout: 0,
    utxo_value_sats: 50_000_000,
    status: "active",
    nft_name: "Cool Ordinal",
    nft_image: null,
    buyer_address: null,
    sale_tx_id: null,
    sold_at: null,
    created_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("GET /api/marketplace/listings", () => {
  it("returns solana listings mapped to the shared Listing shape", async () => {
    const row = activeSolanaRow();
    fakeSupabase.solana_listings.rows.push(row);

    const res = await GET(getRequest("?chain=solana&status=active"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.data[0]).toMatchObject({
      id: "sol-1",
      mintAddress: row.mint_address,
      listingAddress: row.listing_address,
      sellerAddress: row.seller_address,
      priceSOL: 1,
      royaltyBps: 500,
      chain: "solana",
      txSignature: "tx-sol-1",
    });
  });

  it("returns bitcoin listings mapped to the shared Listing shape", async () => {
    const row = activeOrdinalRow();
    fakeSupabase.ordinal_listings.rows.push(row);

    const res = await GET(getRequest("?chain=bitcoin&status=active"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.data[0]).toMatchObject({
      id: "ord-1",
      mintAddress: row.inscription_id,
      listingAddress: "ord-1",
      sellerAddress: row.seller_address,
      priceSOL: 0.5,
      priceSats: 50_000_000,
      chain: "bitcoin",
    });
  });

  it("merges and sorts bitcoin + solana listings by recency when no chain is given", async () => {
    fakeSupabase.ordinal_listings.rows.push(activeOrdinalRow({ created_at: "2024-01-01T00:00:00.000Z" }));
    fakeSupabase.solana_listings.rows.push(activeSolanaRow({ created_at: "2024-01-02T00:00:00.000Z" }));

    const res = await GET(getRequest("?status=active"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(2);
    expect(json.data[0].chain).toBe("solana");
    expect(json.data[1].chain).toBe("bitcoin");
    expect(json.pagination.total).toBe(2);
  });
});

describe("POST /api/marketplace/listings (chain: solana)", () => {
  it("creates a new solana listing when the seller signs", async () => {
    const seller = makeSolanaWallet();
    const mintAddress = Keypair.generate().publicKey.toBase58();
    const listingAddress = Keypair.generate().publicKey.toBase58();
    const auth = authFor(seller, "list nft");

    const res = await POST(
      postRequest("/api/marketplace/listings", {
        chain: "solana",
        mintAddress,
        listingAddress,
        priceLamports: 2_000_000_000,
        royaltyBps: 250,
        txSignature: "tx-new",
        nftName: "Test NFT",
        nftImage: "https://example.com/a.png",
        expiresAt: Date.now() + 86_400_000,
        sellerAddress: seller.address,
        ...auth,
      })
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.id).toBeTruthy();
    expect(fakeSupabase.solana_listings.rows).toHaveLength(1);
    expect(fakeSupabase.solana_listings.rows[0]).toMatchObject({
      mint_address: mintAddress,
      listing_address: listingAddress,
      seller_address: seller.address,
      price_lamports: 2_000_000_000,
    });
  });

  it("rejects when the signing address does not match sellerAddress", async () => {
    const seller = makeSolanaWallet();
    const other = makeSolanaWallet();
    const auth = authFor(other, "list nft");

    const res = await POST(
      postRequest("/api/marketplace/listings", {
        chain: "solana",
        mintAddress: Keypair.generate().publicKey.toBase58(),
        listingAddress: Keypair.generate().publicKey.toBase58(),
        priceLamports: 1_000_000_000,
        royaltyBps: 0,
        txSignature: "tx-1",
        sellerAddress: seller.address,
        ...auth,
      })
    );
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.success).toBe(false);
  });

  it("rejects a duplicate active listing for the same mint", async () => {
    const seller = makeSolanaWallet();
    const mintAddress = Keypair.generate().publicKey.toBase58();
    fakeSupabase.solana_listings.rows.push(activeSolanaRow({ mint_address: mintAddress, seller_address: seller.address }));

    const auth = authFor(seller, "list nft");
    const res = await POST(
      postRequest("/api/marketplace/listings", {
        chain: "solana",
        mintAddress,
        listingAddress: Keypair.generate().publicKey.toBase58(),
        priceLamports: 1_000_000_000,
        royaltyBps: 0,
        txSignature: "tx-2",
        sellerAddress: seller.address,
        ...auth,
      })
    );
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.success).toBe(false);
  });
});

describe("POST /api/marketplace/listings/[id]/cancel (chain: solana)", () => {
  it("lets the seller cancel their active listing", async () => {
    const seller = makeSolanaWallet();
    fakeSupabase.solana_listings.rows.push(activeSolanaRow({ id: "sol-1", seller_address: seller.address }));

    const res = await cancelPOST(
      postRequest("/api/marketplace/listings/sol-1/cancel", { chain: "solana", ...authFor(seller, "cancel listing") }),
      { params: { id: "sol-1" } }
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(fakeSupabase.solana_listings.rows[0].status).toBe("cancelled");
  });

  it("rejects cancellation from a non-seller address", async () => {
    const seller = makeSolanaWallet();
    const other = makeSolanaWallet();
    fakeSupabase.solana_listings.rows.push(activeSolanaRow({ id: "sol-1", seller_address: seller.address }));

    const res = await cancelPOST(
      postRequest("/api/marketplace/listings/sol-1/cancel", { chain: "solana", ...authFor(other, "cancel listing") }),
      { params: { id: "sol-1" } }
    );
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.success).toBe(false);
    expect(fakeSupabase.solana_listings.rows[0].status).toBe("active");
  });

  it("rejects cancelling a listing that is no longer active", async () => {
    const seller = makeSolanaWallet();
    fakeSupabase.solana_listings.rows.push(activeSolanaRow({ id: "sol-1", seller_address: seller.address, status: "cancelled" }));

    const res = await cancelPOST(
      postRequest("/api/marketplace/listings/sol-1/cancel", { chain: "solana", ...authFor(seller, "cancel listing") }),
      { params: { id: "sol-1" } }
    );
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.success).toBe(false);
  });
});

describe("POST /api/marketplace/listings/[id]/complete (chain: solana)", () => {
  it("marks an active listing sold when the buyer signs", async () => {
    const seller = makeSolanaWallet();
    const buyer = makeSolanaWallet();
    fakeSupabase.solana_listings.rows.push(activeSolanaRow({ id: "sol-1", seller_address: seller.address }));

    const res = await completePOST(
      postRequest("/api/marketplace/listings/sol-1/complete", {
        chain: "solana",
        buyerAddress: buyer.address,
        saleTxSignature: "tx-sale",
        ...authFor(buyer, "complete purchase"),
      }),
      { params: { id: "sol-1" } }
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    const row = fakeSupabase.solana_listings.rows[0];
    expect(row.status).toBe("sold");
    expect(row.buyer_address).toBe(buyer.address);
    expect(row.sale_tx_signature).toBe("tx-sale");
    expect(row.sold_at).toBeTruthy();
  });

  it("rejects when the signing address does not match buyerAddress", async () => {
    const seller = makeSolanaWallet();
    const buyer = makeSolanaWallet();
    const other = makeSolanaWallet();
    fakeSupabase.solana_listings.rows.push(activeSolanaRow({ id: "sol-1", seller_address: seller.address }));

    const res = await completePOST(
      postRequest("/api/marketplace/listings/sol-1/complete", {
        chain: "solana",
        buyerAddress: buyer.address,
        saleTxSignature: "tx-sale",
        ...authFor(other, "complete purchase"),
      }),
      { params: { id: "sol-1" } }
    );
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.success).toBe(false);
    expect(fakeSupabase.solana_listings.rows[0].status).toBe("active");
  });
});
