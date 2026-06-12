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

-- Row Level Security: all writes go through API routes using the service
-- role key (which bypasses RLS), so these policies only need to cover
-- public read access.
alter table public.profiles enable row level security;
alter table public.collections enable row level security;

create policy "Profiles are publicly readable" on public.profiles
  for select using (true);

create policy "Collections are publicly readable" on public.collections
  for select using (true);

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
