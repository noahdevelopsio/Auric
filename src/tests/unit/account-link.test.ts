// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";
import * as bitcoin from "bitcoinjs-lib";
import ECPairFactory from "ecpair";
import * as ecc from "@bitcoinerlab/secp256k1";
import { Signer } from "bip322-js";
import { buildAuthMessage } from "@/lib/auth/walletAuth";
import { getOrCreateAccount, attachWallet } from "@/lib/supabase/accounts";
import { FakeSupabase, asSupabaseClient } from "../helpers/fakeSupabase";
import { POST } from "@/app/api/account/link/route";

const ECPair = ECPairFactory(ecc);

let fakeSupabase: FakeSupabase;

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdmin: () => asSupabaseClient(fakeSupabase),
}));

function makeSolanaWallet() {
  const keypair = Keypair.generate();
  const address = keypair.publicKey.toBase58();
  return {
    address,
    sign: (message: string) =>
      Buffer.from(nacl.sign.detached(new TextEncoder().encode(message), new Uint8Array(keypair.secretKey))).toString("base64"),
  };
}

function makeBitcoinWallet() {
  const keyPair = ECPair.makeRandom();
  const { address } = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network: bitcoin.networks.bitcoin });
  const wif = keyPair.toWIF();
  return {
    address: address!,
    sign: (message: string) => Signer.sign(wif, address!, message),
  };
}

function linkRequest(body: unknown) {
  return new NextRequest("http://localhost/api/account/link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function proofFor(wallet: { address: string; sign: (m: string) => string }, otherAddress: string, timestamp: number) {
  const message = buildAuthMessage(`link wallet ${otherAddress}`, wallet.address, timestamp);
  return { address: wallet.address, signature: wallet.sign(message), timestamp };
}

beforeEach(() => {
  fakeSupabase = new FakeSupabase();
});

describe("POST /api/account/link", () => {
  it("links a fresh Solana wallet and a fresh Bitcoin wallet into one account", async () => {
    const sol = makeSolanaWallet();
    const btc = makeBitcoinWallet();
    const timestamp = Date.now();

    const res = await POST(
      linkRequest({
        a: proofFor(sol, btc.address, timestamp),
        b: proofFor(btc, sol.address, timestamp),
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.primaryAddress).toBe(sol.address);
    expect(json.data.linkedAddresses.map((w: { address: string }) => w.address).sort()).toEqual(
      [btc.address, sol.address].sort()
    );
  });

  it("rejects linking two wallets on the same chain", async () => {
    const solA = makeSolanaWallet();
    const solB = makeSolanaWallet();
    const timestamp = Date.now();

    const res = await POST(
      linkRequest({
        a: proofFor(solA, solB.address, timestamp),
        b: proofFor(solB, solA.address, timestamp),
      })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it("rejects a signature that doesn't match the claimed pairing", async () => {
    const sol = makeSolanaWallet();
    const btc = makeBitcoinWallet();
    const otherBtc = makeBitcoinWallet();
    const timestamp = Date.now();

    // sol signs a message linking to `otherBtc`, but the request claims it links to `btc`.
    const res = await POST(
      linkRequest({
        a: proofFor(sol, otherBtc.address, timestamp),
        b: proofFor(btc, sol.address, timestamp),
      })
    );
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it("returns 409 when the other wallet already belongs to a different multi-wallet account", async () => {
    const sol = makeSolanaWallet();
    const btc = makeBitcoinWallet();
    const otherSol = makeSolanaWallet();

    // Pre-link btc to otherSol so btc's account already has 2 wallets.
    const existing = await getOrCreateAccount(asSupabaseClient(fakeSupabase), otherSol.address, "solana");
    await attachWallet(asSupabaseClient(fakeSupabase), btc.address, existing.accountId, "bitcoin", false);

    const timestamp = Date.now();
    const res = await POST(
      linkRequest({
        a: proofFor(sol, btc.address, timestamp),
        b: proofFor(btc, sol.address, timestamp),
      })
    );
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.success).toBe(false);
  });

  it("is a no-op when the two wallets are already linked", async () => {
    const sol = makeSolanaWallet();
    const btc = makeBitcoinWallet();

    const firstTimestamp = Date.now();
    const first = await POST(
      linkRequest({
        a: proofFor(sol, btc.address, firstTimestamp),
        b: proofFor(btc, sol.address, firstTimestamp),
      })
    );
    expect(first.status).toBe(200);

    const secondTimestamp = Date.now();
    const second = await POST(
      linkRequest({
        a: proofFor(sol, btc.address, secondTimestamp),
        b: proofFor(btc, sol.address, secondTimestamp),
      })
    );
    const json = await second.json();

    expect(second.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.linkedAddresses).toHaveLength(2);
  });
});
