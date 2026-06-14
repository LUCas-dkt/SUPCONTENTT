/**
 * Point d'entree unique vers l'API SUPCONTENT (Express).
 * Les routes Next /api/lastfm/* deleguent ici pour respecter l'architecture 3 briques.
 */

export function getSupcontentApiUrl(): string | null {
  const url = process.env.SUPCONTENT_API_URL?.trim()
  return url || null
}

export async function fetchSupcontentApi(
  path: string,
  init?: RequestInit & { searchParams?: Record<string, string | undefined> },
): Promise<Response | null> {
  const base = getSupcontentApiUrl()
  if (!base) return null

  const url = new URL(path.startsWith('/') ? path : `/${path}`, base)
  if (init?.searchParams) {
    for (const [key, value] of Object.entries(init.searchParams)) {
      if (value != null && value !== '') url.searchParams.set(key, value)
    }
  }

  const { searchParams: _s, ...rest } = init ?? {}
  return fetch(url.toString(), {
    ...rest,
    headers: { Accept: 'application/json', ...(rest.headers ?? {}) },
    next: rest.next ?? { revalidate: 3600 },
  })
}

export async function fetchSupcontentJson<T>(
  path: string,
  searchParams?: Record<string, string | undefined>,
): Promise<T | null> {
  const response = await fetchSupcontentApi(path, { searchParams })
  if (!response?.ok) return null
  return response.json() as Promise<T>
}
