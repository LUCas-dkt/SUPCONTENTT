import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { isSupabaseConfigured } from '@/lib/env'
import { adaptCookieOptionsForHost } from '@/lib/supabase/cookies'

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  if (!isSupabaseConfigured()) {
    return null
  }

  const cookieStore = await cookies()
  const host = (await headers()).get('host')

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(
                name,
                value,
                adaptCookieOptionsForHost(host, options),
              ),
            )
          } catch {
            // The "setAll" method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  )
}
