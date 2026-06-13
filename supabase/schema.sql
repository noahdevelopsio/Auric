-- Auric Supabase schema
-- Run this once against your Supabase project (SQL Editor or `supabase db push`).

-- Profiles: one row per wallet address.
create table if not exists public.profiles (
  wallet_address text primary key,
  display_name text,
  bio text,
  avatar_gradient text,
  banner_gradient text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Collections: groupings of NFTs created by a wallet.
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  chain text not null check (chain in ('solana', 'bitcoin')),
  creator_wallet text not null,
  logo_url text,
  banner_url text,
  symbol text,
  royalty_bps integer not null default 0,
  is_verified boolean not null default false,
  external_url text,
  floor_price_lamports bigint,
  total_volume_lamports bigint not null default 0,
  item_count integer not null default 0,
  owner_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists collections_chain_idx on public.collections (chain);
create index if not exists collections_creator_wallet_idx on public.collections (creator_wallet);

-- Activity: a public log of mint/list/sale/etc. events across both chains,
-- powering the site-wide activity feed.
create table if not exists public.activity (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('mint', 'list', 'delist', 'sale', 'transfer', 'inscribe')),
  chain text not null check (chain in ('solana', 'bitcoin')),
  nft_id text not null,
  nft_name text,
  nft_image text,
  from_wallet text,
  to_wallet text,
  price_lamports bigint,
  tx_signature text,
  created_at timestamptz not null default now()
);

create index if not exists activity_created_at_idx on public.activity (created_at desc);
create index if not exists activity_nft_idx on public.activity (chain, nft_id);

-- Ordinal listings: off-chain record of a seller-signed PSBT offering a
-- Bitcoin Ordinals inscription for sale. The signed_psbt column is never
-- exposed via the public GET endpoint; it's only read server-side when
-- constructing a buyer's combined PSBT.
create table if not exists public.ordinal_listings (
  id uuid primary key default gen_random_uuid(),
  inscription_id text not null,
  seller_address text not null,
  seller_payment_address text not null,
  price_sats bigint not null check (price_sats > 0),
  signed_psbt text not null,
  utxo_txid text not null,
  utxo_vout integer not null,
  utxo_value_sats bigint not null,
  status text not null default 'active' check (status in ('active', 'sold', 'cancelled')),
  nft_name text,
  nft_image text,
  buyer_address text,
  sale_tx_id text,
  sold_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ordinal_listings_inscription_idx on public.ordinal_listings (inscription_id);
create index if not exists ordinal_listings_status_idx on public.ordinal_listings (status);
create unique index if not exists ordinal_listings_active_inscription_idx
  on public.ordinal_listings (inscription_id) where (status = 'active');

-- Row Level Security: all writes go through API routes using the service
-- role key (which bypasses RLS), so these policies only need to cover
-- public read access.
alter table public.profiles enable row level security;
alter table public.collections enable row level security;
alter table public.activity enable row level security;
alter table public.ordinal_listings enable row level security;

create policy "Profiles are publicly readable" on public.profiles
  for select using (true);

create policy "Collections are publicly readable" on public.collections
  for select using (true);

create policy "Activity is publicly readable" on public.activity
  for select using (true);

create policy "Ordinal listings are publicly readable" on public.ordinal_listings
  for select using (true);

-- Table-level grants: the service role (used by API routes) bypasses RLS
-- but still needs base privileges, and anon/authenticated need SELECT for
-- the public-read policies above to take effect.
grant select, insert, update, delete on public.profiles to service_role;
grant select, insert, update, delete on public.collections to service_role;
grant select, insert on public.activity to service_role;
grant select, insert, update on public.ordinal_listings to service_role;
grant select on public.profiles to anon, authenticated;
grant select on public.collections to anon, authenticated;
grant select on public.activity to anon, authenticated;
grant select on public.ordinal_listings to anon, authenticated;

-- Storage buckets for uploaded media and generated NFT metadata JSON.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('metadata', 'metadata', true)
on conflict (id) do nothing;

create policy "Media is publicly readable" on storage.objects
  for select using (bucket_id = 'media');

create policy "Metadata is publicly readable" on storage.objects
  for select using (bucket_id = 'metadata');
