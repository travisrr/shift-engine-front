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

function normalizeSupabaseUrl(url: string): string | null {
  // If it's already a valid HTTP URL, use it
  if (isValidHttpUrl(url)) {
    return url
  }

  // If it looks like just a project ref (alphanumeric, no protocol, no dots except maybe in domain)
  // Auto-complete to the standard Supabase URL format
  const projectRefPattern = /^[a-z0-9]{20,}$/i
  if (projectRefPattern.test(url)) {
    return `https://${url}.supabase.co`
  }

  return null
}

function checkConfiguration(): { valid: boolean; normalizedUrl?: string } {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Debug logging (only in browser)
  if (typeof window !== 'undefined') {
    console.log('[Supabase] Env check:', {
      hasUrl: !!rawUrl,
      hasKey: !!supabaseAnonKey,
      urlLength: rawUrl?.length,
      keyLength: supabaseAnonKey?.length,
    })
  }

  // Must have both values
  if (!rawUrl && !supabaseAnonKey) {
    configError = 'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. If you just added these, please redeploy your app.'
    return { valid: false }
  }
  if (!rawUrl) {
    configError = 'NEXT_PUBLIC_SUPABASE_URL is not set'
    return { valid: false }
  }
  if (!supabaseAnonKey) {
    configError = 'NEXT_PUBLIC_SUPABASE_ANON_KEY is not set'
    return { valid: false }
  }
  if (rawUrl.includes('placeholder')) {
    configError = 'NEXT_PUBLIC_SUPABASE_URL contains placeholder value'
    return { valid: false }
  }
  if (supabaseAnonKey === 'placeholder') {
    configError = 'NEXT_PUBLIC_SUPABASE_ANON_KEY contains placeholder value'
    return { valid: false }
  }

  // Try to normalize the URL (handle project ref vs full URL)
  const normalizedUrl = normalizeSupabaseUrl(rawUrl)
  if (!normalizedUrl) {
    configError = `NEXT_PUBLIC_SUPABASE_URL is not valid. Got: "${rawUrl.substring(0, 30)}${rawUrl.length > 30 ? '...' : ''}". Expected format: https://your-project-ref.supabase.co or just your-project-ref`
    return { valid: false }
  }

  configError = null
  return { valid: true, normalizedUrl }
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = checkConfiguration()
  if (!config.valid) return null
  if (supabaseInstance) return supabaseInstance

  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  try {
    supabaseInstance = createClient(config.normalizedUrl!, supabaseAnonKey)
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
