import { createBrowserClient } from '@supabase/ssr'

import { isSupabaseConfigured } from '@/lib/env'
import { resolveSupabaseUrl } from '@/lib/supabase/url'

export function createClient() {
  if (!isSupabaseConfigured()) {
    return null
  }

  return createBrowserClient(
    resolveSupabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
