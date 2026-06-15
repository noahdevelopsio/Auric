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
import { getOrCreateAccount, attachWallet, findAccount } from "@/lib/supabase/accounts";
import { FakeSupabase, asSupabaseClient } from "../helpers/fakeSupabase";
import { POST } from "@/app/api/account/unlink/route";

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

function unlinkRequest(body: unknown) {
  return new NextRequest("http://localhost/api/account/unlink", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function proofFor(wallet: { address: string; sign: (m: string) => string }, timestamp: number) {
  const message = buildAuthMessage("unlink wallet", wallet.address, timestamp);
  return { address: wallet.address, signature: wallet.sign(message), timestamp };
}

beforeEach(() => {
  fakeSupabase = new FakeSupabase();
});

describe("POST /api/account/unlink", () => {
  it("splits the primary wallet off and promotes the remaining wallet", async () => {
    const sol = makeSolanaWallet();
    const btc = makeBitcoinWallet();

    const account = await getOrCreateAccount(asSupabaseClient(fakeSupabase), sol.address, "solana");
    await attachWallet(asSupabaseClient(fakeSupabase), btc.address, account.accountId, "bitcoin", false);

    const res = await POST(unlinkRequest(proofFor(sol, Date.now())));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.primaryAddress).toBe(sol.address);
    expect(json.data.linkedAddresses).toEqual([{ address: sol.address, chain: "solana", isPrimary: true }]);

    const remaining = await findAccount(asSupabaseClient(fakeSupabase), btc.address);
    expect(remaining!.accountId).toBe(account.accountId);
    expect(remaining!.primaryAddress).toBe(btc.address);
    expect(remaining!.wallets).toEqual([{ address: btc.address, chain: "bitcoin", isPrimary: true }]);
  });

  it("splits a non-primary wallet off without changing the original account's primary", async () => {
    const sol = makeSolanaWallet();
    const btc = makeBitcoinWallet();

    const account = await getOrCreateAccount(asSupabaseClient(fakeSupabase), sol.address, "solana");
    await attachWallet(asSupabaseClient(fakeSupabase), btc.address, account.accountId, "bitcoin", false);

    const res = await POST(unlinkRequest(proofFor(btc, Date.now())));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.primaryAddress).toBe(btc.address);
    expect(json.data.linkedAddresses).toEqual([{ address: btc.address, chain: "bitcoin", isPrimary: true }]);

    const remaining = await findAccount(asSupabaseClient(fakeSupabase), sol.address);
    expect(remaining!.accountId).toBe(account.accountId);
    expect(remaining!.primaryAddress).toBe(sol.address);
    expect(remaining!.wallets).toEqual([{ address: sol.address, chain: "solana", isPrimary: true }]);
  });

  it("rejects unlinking when the wallet has no linked siblings", async () => {
    const sol = makeSolanaWallet();
    await getOrCreateAccount(asSupabaseClient(fakeSupabase), sol.address, "solana");

    const res = await POST(unlinkRequest(proofFor(sol, Date.now())));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it("rejects an invalid signature", async () => {
    const sol = makeSolanaWallet();
    const btc = makeBitcoinWallet();

    const account = await getOrCreateAccount(asSupabaseClient(fakeSupabase), sol.address, "solana");
    await attachWallet(asSupabaseClient(fakeSupabase), btc.address, account.accountId, "bitcoin", false);

    const timestamp = Date.now();
    const wrongMessage = buildAuthMessage("update profile", sol.address, timestamp);
    const res = await POST(
      unlinkRequest({ address: sol.address, signature: sol.sign(wrongMessage), timestamp })
    );
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
  });
});
