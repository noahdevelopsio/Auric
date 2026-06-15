import type { SupabaseClient } from "@supabase/supabase-js";
import { detectAddressChain } from "@/lib/utils/validation";
import { DEFAULT_PROFILE } from "@/store/profileStore";
import type { LinkedWallet, ProfileDto } from "@/types/account";

export interface AccountRecord {
  accountId: string;
  displayName: string | null;
  bio: string | null;
  avatarGradient: string | null;
  bannerGradient: string | null;
  wallets: LinkedWallet[];
  primaryAddress: string;
}

interface AccountRow {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_gradient: string | null;
  banner_gradient: string | null;
}

interface AccountWalletRow {
  wallet_address: string;
  chain: "solana" | "bitcoin";
  is_primary: boolean;
}

function toRecord(account: AccountRow, walletRows: AccountWalletRow[]): AccountRecord {
  const wallets: LinkedWallet[] = walletRows.map((w) => ({
    address: w.wallet_address,
    chain: w.chain,
    isPrimary: w.is_primary,
  }));
  const primary = wallets.find((w) => w.isPrimary) ?? wallets[0];

  return {
    accountId: account.id,
    displayName: account.display_name,
    bio: account.bio,
    avatarGradient: account.avatar_gradient,
    bannerGradient: account.banner_gradient,
    wallets,
    primaryAddress: primary.address,
  };
}

// Looks up the account_wallets row for `address`, then fetches the account
// + all sibling wallets. Returns null if the address has never been seen.
export async function findAccount(supabase: SupabaseClient, address: string): Promise<AccountRecord | null> {
  const { data: walletRow, error: walletError } = await supabase
    .from("account_wallets")
    .select("account_id")
    .eq("wallet_address", address)
    .maybeSingle();

  if (walletError) throw new Error(walletError.message);
  if (!walletRow) return null;

  const [accountResult, walletsResult] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, display_name, bio, avatar_gradient, banner_gradient")
      .eq("id", walletRow.account_id)
      .single(),
    supabase
      .from("account_wallets")
      .select("wallet_address, chain, is_primary")
      .eq("account_id", walletRow.account_id),
  ]);

  if (accountResult.error) throw new Error(accountResult.error.message);
  if (walletsResult.error) throw new Error(walletsResult.error.message);

  return toRecord(accountResult.data as AccountRow, (walletsResult.data ?? []) as AccountWalletRow[]);
}

// findAccount(), or creates a fresh single-wallet account (is_primary = true)
// if `address` has never been seen.
export async function getOrCreateAccount(
  supabase: SupabaseClient,
  address: string,
  chain: "solana" | "bitcoin"
): Promise<AccountRecord> {
  const existing = await findAccount(supabase, address);
  if (existing) return existing;

  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .insert({})
    .select("id, display_name, bio, avatar_gradient, banner_gradient")
    .single();
  if (accountError) throw new Error(accountError.message);

  const { error: walletError } = await supabase
    .from("account_wallets")
    .insert({ wallet_address: address, account_id: account.id, chain, is_primary: true });
  if (walletError) throw new Error(walletError.message);

  return toRecord(account as AccountRow, [{ wallet_address: address, chain, is_primary: true }]);
}

// Creates a brand-new, empty account row (no wallets attached yet).
export async function createAccount(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.from("accounts").insert({}).select("id").single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

// Attaches a never-before-seen wallet address to an existing account.
export async function attachWallet(
  supabase: SupabaseClient,
  address: string,
  accountId: string,
  chain: "solana" | "bitcoin",
  isPrimary: boolean
): Promise<void> {
  const { error } = await supabase
    .from("account_wallets")
    .insert({ wallet_address: address, account_id: accountId, chain, is_primary: isPrimary });
  if (error) throw new Error(error.message);
}

// Moves an existing wallet's account_wallets row to a different account.
export async function moveWalletToAccount(
  supabase: SupabaseClient,
  address: string,
  targetAccountId: string,
  isPrimary: boolean
): Promise<void> {
  const { error } = await supabase
    .from("account_wallets")
    .update({ account_id: targetAccountId, is_primary: isPrimary })
    .eq("wallet_address", address);
  if (error) throw new Error(error.message);
}

// Marks `address` as the primary wallet of `accountId`. Caller must ensure
// no other wallet on this account is currently primary (the unique partial
// index on account_wallets would otherwise reject this).
export async function setPrimaryWallet(supabase: SupabaseClient, address: string, accountId: string): Promise<void> {
  const { error } = await supabase
    .from("account_wallets")
    .update({ is_primary: true })
    .eq("wallet_address", address)
    .eq("account_id", accountId);
  if (error) throw new Error(error.message);
}

// Deletes an account row (only safe once it has no account_wallets rows left).
export async function deleteAccount(supabase: SupabaseClient, accountId: string): Promise<void> {
  const { error } = await supabase.from("accounts").delete().eq("id", accountId);
  if (error) throw new Error(error.message);
}

// Builds the API-facing profile DTO for `address`, falling back to a
// default single-wallet shape if `address` has never been seen.
export function toProfileDto(address: string, account: AccountRecord | null): ProfileDto {
  if (!account) {
    return {
      address,
      displayName: DEFAULT_PROFILE.displayName,
      bio: DEFAULT_PROFILE.bio,
      avatarGradient: DEFAULT_PROFILE.avatarGradient,
      bannerGradient: DEFAULT_PROFILE.bannerGradient,
      linkedAddresses: [{ address, chain: detectAddressChain(address)!, isPrimary: true }],
      primaryAddress: address,
    };
  }

  return {
    address,
    displayName: account.displayName ?? DEFAULT_PROFILE.displayName,
    bio: account.bio ?? DEFAULT_PROFILE.bio,
    avatarGradient: account.avatarGradient ?? DEFAULT_PROFILE.avatarGradient,
    bannerGradient: account.bannerGradient ?? DEFAULT_PROFILE.bannerGradient,
    linkedAddresses: account.wallets,
    primaryAddress: account.primaryAddress,
  };
}
