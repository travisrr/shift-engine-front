import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

// createClient requires a valid URL format; auth calls will just fail at runtime
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
