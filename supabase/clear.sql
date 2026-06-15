-- Clears the Auric Supabase schema for a clean re-apply of schema.sql.
-- Run this in the SQL Editor first, then run schema.sql in full.

drop table if exists public.account_wallets cascade;
drop table if exists public.accounts cascade;
drop table if exists public.collections cascade;
drop table if exists public.activity cascade;
drop table if exists public.ordinal_listings cascade;
drop table if exists public.profiles cascade;

drop policy if exists "Media is publicly readable" on storage.objects;
drop policy if exists "Metadata is publicly readable" on storage.objects;

-- storage.objects/storage.buckets can't be cleared via direct DELETE (blocked
-- by Supabase's storage.protect_delete trigger). If the 'media'/'metadata'
-- buckets already exist with files in them, empty them via the Storage API
-- or dashboard before re-running schema.sql. schema.sql's bucket inserts use
-- `on conflict (id) do nothing`, so existing empty buckets are left as-is.
