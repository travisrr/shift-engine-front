import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build-time errors
let supabaseInstance: SupabaseClient | null = null

function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function checkConfiguration(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Must have both values, URL must not be placeholder, and must be valid HTTP/HTTPS
  if (!supabaseUrl || !supabaseAnonKey) return false
  if (supabaseUrl.includes('placeholder') || supabaseAnonKey === 'placeholder') return false
  if (!isValidHttpUrl(supabaseUrl)) return false

  return true
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!checkConfiguration()) return null
  if (supabaseInstance) return supabaseInstance

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
    return supabaseInstance
  } catch (err) {
    console.error('Failed to create Supabase client:', err)
    return null
  }
}

// Backwards compatibility - returns null if not configured
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient()
    if (!client) {
      // Return a function that throws when called, for better error messages
      if (prop === 'from' || prop === 'auth' || prop === 'rpc') {
        return () => {
          throw new Error(
            'Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
          )
        }
      }
      return undefined
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (client as any)[prop]
  }
})
