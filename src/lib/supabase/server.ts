import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// Server-only client using the service role key. Bypasses RLS, so it must
// never be exposed to the browser — only use it from API route handlers.
export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY."
    );
  }

  client = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}
