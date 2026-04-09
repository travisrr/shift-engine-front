import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build-time errors
let supabaseInstance: SupabaseClient | null = null
let configError: string | null = null

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

  // Debug logging (only in browser)
  if (typeof window !== 'undefined') {
    console.log('[Supabase] Env check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlLength: supabaseUrl?.length,
      keyLength: supabaseAnonKey?.length,
    })
  }

  // Must have both values
  if (!supabaseUrl && !supabaseAnonKey) {
    configError = 'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. If you just added these, please redeploy your app.'
    return false
  }
  if (!supabaseUrl) {
    configError = 'NEXT_PUBLIC_SUPABASE_URL is not set'
    return false
  }
  if (!supabaseAnonKey) {
    configError = 'NEXT_PUBLIC_SUPABASE_ANON_KEY is not set'
    return false
  }
  if (supabaseUrl.includes('placeholder')) {
    configError = 'NEXT_PUBLIC_SUPABASE_URL contains placeholder value'
    return false
  }
  if (supabaseAnonKey === 'placeholder') {
    configError = 'NEXT_PUBLIC_SUPABASE_ANON_KEY contains placeholder value'
    return false
  }
  if (!isValidHttpUrl(supabaseUrl)) {
    configError = `NEXT_PUBLIC_SUPABASE_URL is not a valid URL: ${supabaseUrl.substring(0, 20)}...`
    return false
  }

  configError = null
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
    configError = err instanceof Error ? err.message : 'Failed to create Supabase client'
    return null
  }
}

export function getSupabaseError(): string | null {
  return configError
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
            configError || 'Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
          )
        }
      }
      return undefined
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (client as any)[prop]
  }
})
