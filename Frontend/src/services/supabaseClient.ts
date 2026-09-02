import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase browser client.
 *
 * Reads the project URL and the *publishable* (safe-for-browser) key from
 * Vite env vars. The key is public by design — row-level security in the
 * Supabase project is what protects the data, not key secrecy.
 *
 * The client is created lazily and only when both env vars are present, so
 * the app still runs against the bundled mock data when Supabase is not
 * configured (e.g. a fresh checkout with no `.env.local`).
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as
  | string
  | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

let client: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  client = createClient(supabaseUrl as string, supabasePublishableKey as string, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'buildtrack.supabase.auth',
    },
  });
} else if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.info(
    '[BuildTrack] Supabase is not configured — running on bundled mock data. ' +
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local to connect.',
  );
}

/**
 * Returns the configured Supabase client, or throws if the app was built
 * without Supabase env vars. Call `isSupabaseConfigured` first when a code
 * path must degrade gracefully to mock data.
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and ' +
        'VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.',
    );
  }
  return client;
}

/** Non-throwing accessor — null when Supabase is not configured. */
export const supabase = client;
