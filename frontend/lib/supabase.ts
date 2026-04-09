import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build-time errors
let supabaseInstance: SupabaseClient | null = null
let isConfigured: boolean | null = null

function checkConfiguration(): boolean {
  if (isConfigured !== null) return isConfigured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  isConfigured = !!(supabaseUrl && !supabaseUrl.includes('placeholder') && supabaseAnonKey && supabaseAnonKey !== 'placeholder')
  return isConfigured
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!checkConfiguration()) return null
  if (supabaseInstance) return supabaseInstance

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseInstance
}

// Backwards compatibility - returns null if not configured
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient()
    if (!client) return undefined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (client as any)[prop]
  }
})
