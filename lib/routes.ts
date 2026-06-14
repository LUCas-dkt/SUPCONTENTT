const INVALID_SLUGS = new Set(['undefined', 'null'])

/** Valeur utilisable dans une URL (pas vide, pas "undefined"). */
export function isValidSlug(value: string | null | undefined): value is string {
  if (value == null) return false
  const trimmed = String(value).trim()
  if (!trimmed) return false
  return !INVALID_SLUGS.has(trimmed.toLowerCase())
}

/** Chemin interne apres connexion (evite les open redirects). */
export function sanitizeNextPath(nextPath?: string | null): string {
  if (!nextPath) return '/'
  if (!nextPath.startsWith('/')) return '/'
  if (nextPath.startsWith('//')) return '/'
  return nextPath
}

export function authLoginPath(nextPath?: string | null): string {
  const next = sanitizeNextPath(nextPath)
  return `/auth/login?next=${encodeURIComponent(next)}`
}

export function authSignUpPath(nextPath?: string | null): string {
  const next = sanitizeNextPath(nextPath)
  return `/auth/sign-up?next=${encodeURIComponent(next)}`
}

export function profilePath(
  username: string | null | undefined,
  fallback = '/settings',
): string {
  if (!isValidSlug(username)) return fallback
  return `/profile/${encodeURIComponent(username)}`
}

export function listPath(id: string | null | undefined, fallback = '/lists/explore'): string {
  if (!isValidSlug(id)) return fallback
  return `/list/${encodeURIComponent(id)}`
}

export function messagesPath(
  userId: string | null | undefined,
  fallback = '/messages',
): string {
  if (!isValidSlug(userId)) return fallback
  return `/messages?user=${encodeURIComponent(userId)}`
}

export function artistPath(name: string | null | undefined, fallback = '/search'): string {
  if (!isValidSlug(name)) return fallback
  return `/artist/${encodeURIComponent(name)}`
}

export function albumPath(
  artist: string | null | undefined,
  name: string | null | undefined,
  fallback = '/search',
): string {
  if (!isValidSlug(artist) || !isValidSlug(name)) return fallback
  return `/album/${encodeURIComponent(artist)}/${encodeURIComponent(name)}`
}

export function trackPath(
  artist: string | null | undefined,
  name: string | null | undefined,
  fallback = '/search',
): string {
  if (!isValidSlug(artist) || !isValidSlug(name)) return fallback
  return `/track/${encodeURIComponent(artist)}/${encodeURIComponent(name)}`
}

export function searchPath(query?: string | null): string {
  if (!isValidSlug(query)) return '/search'
  return `/search?q=${encodeURIComponent(query!)}`
}

/** Valide un chemin interne (notifications, liens stockes en base). */
export function safeInternalPath(
  path: string | null | undefined,
  fallback = '/',
): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return fallback

  const profileMatch = path.match(/^\/profile\/([^/?#]+)/)
  if (profileMatch && !isValidSlug(decodeURIComponent(profileMatch[1]))) {
    return '/settings'
  }

  const listMatch = path.match(/^\/list\/([^/?#]+)/)
  if (listMatch && !isValidSlug(decodeURIComponent(listMatch[1]))) {
    return '/lists/explore'
  }

  return path
}
