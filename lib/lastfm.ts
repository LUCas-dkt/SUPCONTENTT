import type { LastFmArtist, LastFmAlbum, LastFmTrack, LastFmImage, MusicItem } from './types'

const LASTFM_API_KEY = process.env.LASTFM_API_KEY
const LASTFM_BASE_URL = 'https://ws.audioscrobbler.com/2.0/'

/** Last.fm often returns a single object instead of an array when there is one result. */
export function toLastFmArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

interface LastFmResponse {
  results?: {
    artistmatches?: { artist: LastFmArtist[] }
    albummatches?: { album: LastFmAlbum[] }
    trackmatches?: { track: LastFmTrack[] }
    '@attr'?: {
      for: string
    }
    'opensearch:totalResults'?: string
  }
  artist?: LastFmArtist
  album?: LastFmAlbum
  track?: LastFmTrack
  artists?: { artist: LastFmArtist[] }
  albums?: { album: LastFmAlbum[] }
  tracks?: { track: LastFmTrack[] }
  toptracks?: { track: LastFmTrack[] }
  topalbums?: { album: LastFmAlbum[] }
  error?: number
  message?: string
}

async function fetchLastFm(method: string, params: Record<string, string>): Promise<LastFmResponse> {
  const apiBase = process.env.SUPCONTENT_API_URL?.trim()

  if (apiBase) {
    const proxyUrl = new URL('/api/lastfm/proxy', apiBase)
    proxyUrl.searchParams.set('method', method)
    Object.entries(params).forEach(([key, value]) => {
      if (value) proxyUrl.searchParams.set(key, value)
    })
    let response: Response
    try {
      response = await fetch(proxyUrl.toString(), { next: { revalidate: 3600 } })
    } catch {
      throw new Error(
        'API SUPCONTENT injoignable. Lancez npm run api:dev (ou npm run dev:all) sur le port 4000.',
      )
    }
    if (!response.ok) {
      throw new Error(
        `API SUPCONTENT erreur ${response.status}. Verifiez LASTFM_API_KEY et npm run api:dev.`,
      )
    }
    return response.json() as Promise<LastFmResponse>
  }

  if (!LASTFM_API_KEY) {
    throw new Error(
      'LASTFM_API_KEY manquante. Definissez SUPCONTENT_API_URL=http://localhost:4000 et lancez npm run api:dev.',
    )
  }

  const url = new URL(LASTFM_BASE_URL)
  url.searchParams.set('method', method)
  url.searchParams.set('api_key', LASTFM_API_KEY)
  url.searchParams.set('format', 'json')
  
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value)
  })

  const response = await fetch(url.toString(), {
    next: { revalidate: 3600 } // Cache for 1 hour
  })
  
  if (!response.ok) {
    throw new Error(`Last.fm API error: ${response.status}`)
  }
  
  const data = await response.json()
  
  if (data.error) {
    throw new Error(data.message || 'Last.fm API error')
  }
  
  return data
}

/** Last.fm default placeholder used when no artwork exists */
const LASTFM_PLACEHOLDER_HASH = '2a96cbd8b46e442fc41c2b86b821562f'

export function isValidLastFmImage(url?: unknown): boolean {
  if (typeof url !== 'string') return false
  const trimmed = url.trim()
  if (!trimmed) return false
  if (trimmed.includes(LASTFM_PLACEHOLDER_HASH)) return false
  return trimmed.startsWith('http')
}

/** Accepts a URL string or raw Last.fm image field (array/object). */
export function coerceImageUrl(value?: unknown): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') {
    return isValidLastFmImage(value) ? value.trim() : undefined
  }
  if (typeof value === 'object') {
    return getBestImage(value as LastFmImage[] | LastFmImage)
  }
  return undefined
}

function imageSizeScore(img: LastFmImage): number {
  const sizeMap: Record<string, number> = {
    mega: 300,
    extralarge: 300,
    large: 174,
    medium: 64,
    small: 34,
  }
  if (img.size && sizeMap[img.size]) return sizeMap[img.size]
  const url = img['#text']
  const match = url?.match(/\/(\d+)x(\d+)\//)
  if (match) return parseInt(match[1], 10) * parseInt(match[2], 10)
  return url && isValidLastFmImage(url) ? 50 : 0
}

/** Normalize image field (array or single object from Last.fm JSON). */
export function getBestImage(
  images?: LastFmImage[] | LastFmImage | null,
): string | undefined {
  const list = toLastFmArray(images ?? undefined)
  if (list.length === 0) return undefined

  const valid = list
    .filter((i) => typeof i['#text'] === 'string' && isValidLastFmImage(i['#text']))
    .sort((a, b) => imageSizeScore(b) - imageSizeScore(a))

  const url = valid[0]?.['#text']
  return typeof url === 'string' ? url : undefined
}

/** Artist pages often lack artwork — fall back to a top album cover. */
export function resolveArtistImage(
  artist: LastFmArtist,
  topAlbums?: LastFmAlbum[],
): string | undefined {
  const direct = getBestImage(artist.image)
  if (direct) return direct

  for (const album of topAlbums ?? []) {
    const albumImage = getBestImage(album.image)
    if (albumImage) return albumImage
  }

  return undefined
}

// Search functions
export async function searchArtists(query: string, page = 1, limit = 30): Promise<{ artists: LastFmArtist[], total: number }> {
  const data = await fetchLastFm('artist.search', {
    artist: query,
    page: page.toString(),
    limit: limit.toString()
  })
  
  return {
    artists: toLastFmArray(data.results?.artistmatches?.artist),
    total: parseInt(data.results?.['opensearch:totalResults'] || '0', 10)
  }
}

export async function searchAlbums(query: string, page = 1, limit = 30): Promise<{ albums: LastFmAlbum[], total: number }> {
  const data = await fetchLastFm('album.search', {
    album: query,
    page: page.toString(),
    limit: limit.toString()
  })
  
  return {
    albums: toLastFmArray(data.results?.albummatches?.album),
    total: parseInt(data.results?.['opensearch:totalResults'] || '0', 10)
  }
}

export async function searchTracks(query: string, page = 1, limit = 30): Promise<{ tracks: LastFmTrack[], total: number }> {
  const data = await fetchLastFm('track.search', {
    track: query,
    page: page.toString(),
    limit: limit.toString()
  })
  
  return {
    tracks: toLastFmArray(data.results?.trackmatches?.track),
    total: parseInt(data.results?.['opensearch:totalResults'] || '0', 10)
  }
}

// Get details
export async function getArtistInfo(artist: string, mbid?: string): Promise<LastFmArtist | null> {
  try {
    const params: Record<string, string> = mbid ? { mbid } : { artist }
    const data = await fetchLastFm('artist.getinfo', params)
    return data.artist || null
  } catch {
    return null
  }
}

export async function getAlbumInfo(artist: string, album: string, mbid?: string): Promise<LastFmAlbum | null> {
  try {
    const params: Record<string, string> = mbid ? { mbid } : { artist, album }
    const data = await fetchLastFm('album.getinfo', params)
    return data.album || null
  } catch {
    return null
  }
}

export async function getTrackInfo(artist: string, track: string, mbid?: string): Promise<LastFmTrack | null> {
  try {
    const params: Record<string, string> = mbid ? { mbid } : { artist, track }
    const data = await fetchLastFm('track.getinfo', params)
    return data.track || null
  } catch {
    return null
  }
}

// Get top items
export async function getTopArtists(page = 1, limit = 50): Promise<LastFmArtist[]> {
  const data = await fetchLastFm('chart.gettopartists', {
    page: page.toString(),
    limit: limit.toString()
  })
  return toLastFmArray(data.artists?.artist)
}

export async function getTopTracks(page = 1, limit = 50): Promise<LastFmTrack[]> {
  const data = await fetchLastFm('chart.gettoptracks', {
    page: page.toString(),
    limit: limit.toString()
  })
  return toLastFmArray(data.tracks?.track)
}

export async function getArtistTopTracks(artist: string, limit = 10): Promise<LastFmTrack[]> {
  const data = await fetchLastFm('artist.gettoptracks', {
    artist,
    limit: limit.toString()
  })
  return toLastFmArray(data.toptracks?.track)
}

export async function getArtistTopAlbums(artist: string, limit = 10): Promise<LastFmAlbum[]> {
  const data = await fetchLastFm('artist.gettopalbums', {
    artist,
    limit: limit.toString()
  })
  return toLastFmArray(data.topalbums?.album)
}

export async function getSimilarArtists(artist: string, limit = 10): Promise<LastFmArtist[]> {
  const data = await fetchLastFm('artist.getsimilar', {
    artist,
    limit: limit.toString()
  })
  return toLastFmArray(data.artists?.artist ?? data.artist?.similar?.artist)
}

// Normalize to MusicItem for UI
export function normalizeArtist(
  artist: LastFmArtist,
  imageOverride?: string,
): MusicItem {
  return {
    type: 'artist',
    name: artist.name,
    mbid: artist.mbid,
    url: artist.url,
    image: imageOverride ?? coerceImageUrl(artist.image),
    listeners: artist.listeners ? parseInt(artist.listeners, 10) : undefined,
    playcount: artist.playcount ? parseInt(artist.playcount, 10) : undefined
  }
}

export function normalizeAlbum(album: LastFmAlbum): MusicItem {
  const artistName = typeof album.artist === 'string' ? album.artist : album.artist?.name
  return {
    type: 'album',
    name: album.name,
    artist: artistName,
    mbid: album.mbid,
    url: album.url,
    image: coerceImageUrl(album.image),
    listeners: album.listeners ? parseInt(album.listeners, 10) : undefined,
    playcount: album.playcount ? parseInt(album.playcount, 10) : undefined
  }
}

export function normalizeTrack(track: LastFmTrack): MusicItem {
  const artistName = typeof track.artist === 'string' ? track.artist : track.artist?.name
  return {
    type: 'track',
    name: track.name,
    artist: artistName,
    mbid: track.mbid,
    url: track.url,
    image: coerceImageUrl(track.image) || coerceImageUrl(track.album?.image),
    listeners: track.listeners ? parseInt(track.listeners, 10) : undefined,
    playcount: track.playcount ? parseInt(track.playcount, 10) : undefined
  }
}

// Format numbers
export function formatNumber(num: number | undefined): string {
  if (!num) return '0'
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toString()
}
