import { createClient } from '@supabase/supabase-js';

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | boolean | undefined> })
  .env;
const configuredSupabaseUrl = String(viteEnv?.VITE_SUPABASE_URL ?? '').trim();
const configuredSupabaseAnonKey = String(viteEnv?.VITE_SUPABASE_ANON_KEY ?? '').trim();

const hasUrl = Boolean(configuredSupabaseUrl);
const hasAnon = Boolean(configuredSupabaseAnonKey);

if (hasUrl !== hasAnon) {
  throw new Error(
    'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be configured together.',
  );
}

/**
 * #672 — no committed hosted JWT fallback.
 * Browser/Vite and production builds fail closed when env is missing.
 * Node tooling that bundles this module (no Vite env) gets inert placeholders
 * so offline checks can import the graph without real credentials.
 */
const isBrowser = typeof window !== 'undefined';
const mustHaveEnv = Boolean(viteEnv?.PROD) || isBrowser;

if (mustHaveEnv && (!hasUrl || !hasAnon)) {
  throw new Error(
    'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required (see .env.example).',
  );
}

if (
  viteEnv?.PROD &&
  hasAnon &&
  !/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\./.test(configuredSupabaseAnonKey)
) {
  throw new Error('VITE_SUPABASE_ANON_KEY must be a valid anon JWT from your Supabase project.');
}

const supabaseUrl = configuredSupabaseUrl || 'http://127.0.0.1:9';
const supabaseAnonKey = configuredSupabaseAnonKey || 'missing-vite-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Edge Functions running in Docker often sign URLs with the internal Kong host
 * (`http://supabase-kong:8000/...`). Browsers cannot resolve that — rewrite to
 * the public VITE_SUPABASE_URL origin when needed.
 */
export function rewriteBrowserStorageUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const publicOrigin = new URL(supabaseUrl).origin;
    if (parsed.origin === publicOrigin) return url;
    // Internal Docker / compose hostnames used by Edge when signing storage URLs.
    const host = parsed.hostname.toLowerCase();
    const isInternalStorageHost =
      host === 'supabase-kong' ||
      host === 'kong' ||
      host.endsWith('.supabase-kong') ||
      host === 'host.docker.internal';
    if (!isInternalStorageHost) return url;
    return `${publicOrigin}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

/** Server client for authenticated requests (same public anon config). */
export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey);
};
