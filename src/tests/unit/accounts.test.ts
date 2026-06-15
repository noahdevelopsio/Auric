import { describe, it, expect } from "vitest";
import {
  findAccount,
  getOrCreateAccount,
  attachWallet,
  moveWalletToAccount,
  setPrimaryWallet,
  deleteAccount,
  createAccount,
  toProfileDto,
} from "@/lib/supabase/accounts";
import { FakeSupabase, asSupabaseClient } from "../helpers/fakeSupabase";

const client = asSupabaseClient;

describe("findAccount", () => {
  it("returns null for an address that has never been seen", async () => {
    const supabase = new FakeSupabase();
    expect(await findAccount(client(supabase), "sol1")).toBeNull();
  });

  it("returns the account and all sibling wallets for a linked address", async () => {
    const supabase = new FakeSupabase();
    const account = await getOrCreateAccount(client(supabase), "sol1", "solana");
    await attachWallet(client(supabase), "btc1", account.accountId, "bitcoin", false);

    const result = await findAccount(client(supabase), "btc1");
    expect(result).not.toBeNull();
    expect(result!.accountId).toBe(account.accountId);
    expect(result!.primaryAddress).toBe("sol1");
    expect(result!.wallets).toEqual([
      { address: "sol1", chain: "solana", isPrimary: true },
      { address: "btc1", chain: "bitcoin", isPrimary: false },
    ]);
  });
});

describe("getOrCreateAccount", () => {
  it("creates a fresh single-wallet account on first use", async () => {
    const supabase = new FakeSupabase();
    const account = await getOrCreateAccount(client(supabase), "sol1", "solana");
    expect(account.wallets).toEqual([{ address: "sol1", chain: "solana", isPrimary: true }]);
    expect(account.primaryAddress).toBe("sol1");
  });

  it("returns the existing account on repeat calls instead of creating a duplicate", async () => {
    const supabase = new FakeSupabase();
    const first = await getOrCreateAccount(client(supabase), "sol1", "solana");
    const second = await getOrCreateAccount(client(supabase), "sol1", "solana");
    expect(second.accountId).toBe(first.accountId);
    expect(supabase.accounts.rows).toHaveLength(1);
  });
});

describe("linking and unlinking wallets", () => {
  it("merges a single-wallet account into another via moveWalletToAccount + deleteAccount", async () => {
    const supabase = new FakeSupabase();
    const a = await getOrCreateAccount(client(supabase), "sol1", "solana");
    const b = await getOrCreateAccount(client(supabase), "btc1", "bitcoin");

    await moveWalletToAccount(client(supabase), "btc1", a.accountId, false);
    await deleteAccount(client(supabase), b.accountId);

    const merged = await findAccount(client(supabase), "sol1");
    expect(merged!.wallets).toHaveLength(2);
    expect(merged!.primaryAddress).toBe("sol1");

    const fromOtherSide = await findAccount(client(supabase), "btc1");
    expect(fromOtherSide!.accountId).toBe(a.accountId);
    expect(supabase.accounts.rows.map((r) => r.id)).not.toContain(b.accountId);
  });

  it("splits a primary wallet off into its own account and promotes the remaining wallet", async () => {
    const supabase = new FakeSupabase();
    const account = await getOrCreateAccount(client(supabase), "sol1", "solana");
    await attachWallet(client(supabase), "btc1", account.accountId, "bitcoin", false);

    // Unlink sol1 (the primary): move it to a new account, then promote btc1.
    const newAccountId = await createAccount(client(supabase));
    await moveWalletToAccount(client(supabase), "sol1", newAccountId, true);
    await setPrimaryWallet(client(supabase), "btc1", account.accountId);

    const split = await findAccount(client(supabase), "sol1");
    expect(split!.accountId).toBe(newAccountId);
    expect(split!.primaryAddress).toBe("sol1");
    expect(split!.wallets).toEqual([{ address: "sol1", chain: "solana", isPrimary: true }]);

    const remaining = await findAccount(client(supabase), "btc1");
    expect(remaining!.accountId).toBe(account.accountId);
    expect(remaining!.primaryAddress).toBe("btc1");
    expect(remaining!.wallets).toEqual([{ address: "btc1", chain: "bitcoin", isPrimary: true }]);
  });
});

describe("toProfileDto", () => {
  it("falls back to a default single-wallet profile for an unknown address", () => {
    const address = "AmbEbesfEKs7vo7HJ1xqvDgUqAs7UAv1ts3KcgLvcLwf";
    const dto = toProfileDto(address, null);
    expect(dto.address).toBe(address);
    expect(dto.primaryAddress).toBe(address);
    expect(dto.linkedAddresses).toEqual([{ address, chain: "solana", isPrimary: true }]);
  });

  it("maps an account record's fields and linked wallets onto the DTO", () => {
    const dto = toProfileDto("btc1", {
      accountId: "acct-1",
      displayName: "Alice",
      bio: "hi",
      avatarGradient: "from-a-to-b",
      bannerGradient: "from-c-to-d",
      wallets: [
        { address: "sol1", chain: "solana", isPrimary: true },
        { address: "btc1", chain: "bitcoin", isPrimary: false },
      ],
      primaryAddress: "sol1",
    });

    expect(dto.address).toBe("btc1");
    expect(dto.displayName).toBe("Alice");
    expect(dto.primaryAddress).toBe("sol1");
    expect(dto.linkedAddresses).toHaveLength(2);
  });
});
