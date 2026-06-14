const DEFAULT_LOCAL_SUPABASE_PORT = '30001'
const DEFAULT_LOCAL_MAILPIT_PORT = '30005'

function extractPort(url: string): string | null {
  try {
    const parsed = new URL(url)
    return parsed.port || null
  } catch {
    return null
  }
}

/** Hosts where the web app is opened from a device/emulator, not the dev machine browser. */
export function isMobileDevHost(hostname: string): boolean {
  return (
    hostname === '10.0.2.2' ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)
  )
}

/**
 * Supabase URL for browser clients.
 * On emulator/phone, 127.0.0.1 points to the device — use the same host as the web app.
 */
export function resolveSupabaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!configured) return ''

  if (typeof window === 'undefined') return configured

  const { hostname, protocol } = window.location
  const port = extractPort(configured) ?? DEFAULT_LOCAL_SUPABASE_PORT

  if (hostname === '10.0.2.2') {
    return `${protocol}//10.0.2.2:${port}`
  }

  if (isMobileDevHost(hostname)) {
    return `${protocol}//${hostname}:${port}`
  }

  return configured
}

/** Mailpit URL when viewing the app from emulator or phone on LAN. */
export function resolveMailpitUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_MAILPIT_URL?.trim() ??
    `http://127.0.0.1:${DEFAULT_LOCAL_MAILPIT_PORT}`

  if (typeof window === 'undefined') return configured

  const { hostname, protocol } = window.location
  const port = extractPort(configured) ?? DEFAULT_LOCAL_MAILPIT_PORT

  if (hostname === '10.0.2.2') {
    return `${protocol}//10.0.2.2:${port}`
  }

  if (isMobileDevHost(hostname)) {
    return `${protocol}//${hostname}:${port}`
  }

  return configured
}
