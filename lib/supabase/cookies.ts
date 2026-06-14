import type { CookieOptions } from '@supabase/ssr'

import { isMobileDevHost } from '@/lib/supabase/url'

/** HTTP dev on emulator/LAN: keep cookies compatible with Android WebView. */
export function adaptCookieOptionsForHost(
  host: string | null | undefined,
  options: CookieOptions,
): CookieOptions {
  if (!host) return options

  const hostname = host.split(':')[0]
  if (!isMobileDevHost(hostname)) return options

  return {
    ...options,
    secure: false,
    sameSite: 'lax',
  }
}
