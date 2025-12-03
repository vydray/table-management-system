import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Browser client (singleton pattern to avoid multiple GoTrueClient instances)
let browserClient: SupabaseClient | null = null

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined')
  return url
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined')
  return key
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    // Server-side: create a new client each time
    return createClient(getSupabaseUrl(), getSupabaseAnonKey())
  }

  // Client-side: reuse the same instance
  if (!browserClient) {
    browserClient = createClient(getSupabaseUrl(), getSupabaseAnonKey())
  }
  return browserClient
}

// Lazy-initialized supabase client for browser usage
// Uses a getter to avoid evaluating at module load time (which happens during build)
let _supabase: SupabaseClient | null = null

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!_supabase) {
      _supabase = getSupabaseBrowserClient()
    }
    return (_supabase as unknown as Record<string | symbol, unknown>)[prop]
  }
})

// Server-side client with service role key (for API routes)
export function getSupabaseServerClient(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined')
  return createClient(getSupabaseUrl(), serviceRoleKey)
}
