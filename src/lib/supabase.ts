import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

function isValidProjectUrl(value: string | undefined): value is string {
  if (!value) return false
  try {
    const u = new URL(value)
    return u.protocol === 'https:' || u.hostname === 'localhost' || u.hostname === '127.0.0.1'
  } catch {
    return false
  }
}

/**
 * The Supabase client, or null when the site runs without a backend (demo mode).
 * Only the public anon key is ever used here; data is protected by Row Level Security.
 */
export const supabase: SupabaseClient | null =
  isValidProjectUrl(url) && anonKey
    ? createClient(url, anonKey, {
        auth: { flowType: 'pkce', persistSession: true, detectSessionInUrl: true },
      })
    : null

export const isDemo = supabase === null

export const STORAGE_BUCKET = 'memories'
