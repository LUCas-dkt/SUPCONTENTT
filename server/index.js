import express from 'express'
import cors from 'cors'
import { config as loadEnv } from 'dotenv'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
loadEnv({ path: resolve(__dirname, '.env') })
loadEnv({ path: resolve(__dirname, '../.env.local') })
loadEnv({ path: resolve(__dirname, '../.env') })

const app = express()
const PORT = process.env.PORT || 4000
const LASTFM_API_KEY = process.env.LASTFM_API_KEY
const LASTFM_BASE = 'https://ws.audioscrobbler.com/2.0/'

const cache = new Map()
const CACHE_TTL_MS = 60 * 60 * 1000

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'supcontent-api' })
})

async function lastFmRequest(method, params = {}) {
  if (!LASTFM_API_KEY) {
    throw new Error('LASTFM_API_KEY non configuree')
  }

  const cacheKey = `${method}:${JSON.stringify(params)}`
  const cached = cache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }

  const url = new URL(LASTFM_BASE)
  url.searchParams.set('method', method)
  url.searchParams.set('api_key', LASTFM_API_KEY)
  url.searchParams.set('format', 'json')
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, String(v))
  }

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Last.fm HTTP ${response.status}`)
  }

  const data = await response.json()
  if (data.error) {
    throw new Error(data.message || 'Erreur Last.fm')
  }

  cache.set(cacheKey, { data, expires: Date.now() + CACHE_TTL_MS })
  return data
}

app.get('/api/lastfm/proxy', async (req, res) => {
  try {
    const method = req.query.method
    if (!method || typeof method !== 'string') {
      return res.status(400).json({ error: 'method requis' })
    }
    const params = { ...req.query }
    delete params.method
    const data = await lastFmRequest(method, params)
    res.json(data)
  } catch (err) {
    res.status(502).json({ error: err.message || 'Erreur API media' })
  }
})

function sortResults(items, sort) {
  const list = Array.isArray(items) ? [...items] : items ? [items] : []
  if (sort === 'name') {
    return list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
  }
  if (sort === 'listeners') {
    return list.sort(
      (a, b) =>
        parseInt(String(b.listeners || b.playcount || 0), 10) -
        parseInt(String(a.listeners || a.playcount || 0), 10),
    )
  }
  return list
}

app.get('/api/lastfm/search', async (req, res) => {
  try {
    const q = String(req.query.q || '')
    const type = String(req.query.type || 'all')
    const page = String(req.query.page || '1')
    const limit = String(req.query.limit || '20')
    const sort = String(req.query.sort || 'relevance')
    if (!q.trim()) return res.json({ artists: [], albums: [], tracks: [], total: 0 })

    const [artistRes, albumRes, trackRes] = await Promise.all([
      type === 'all' || type === 'artist'
        ? lastFmRequest('artist.search', { artist: q, page, limit })
        : Promise.resolve(null),
      type === 'all' || type === 'album'
        ? lastFmRequest('album.search', { album: q, page, limit })
        : Promise.resolve(null),
      type === 'all' || type === 'track'
        ? lastFmRequest('track.search', { track: q, page, limit })
        : Promise.resolve(null),
    ])

    const artists = sortResults(artistRes?.results?.artistmatches?.artist, sort)
    const albums = sortResults(albumRes?.results?.albummatches?.album, sort)
    const tracks = sortResults(trackRes?.results?.trackmatches?.track, sort)

    const total = Math.max(
      parseInt(artistRes?.results?.['opensearch:totalResults'] || '0', 10),
      parseInt(albumRes?.results?.['opensearch:totalResults'] || '0', 10),
      parseInt(trackRes?.results?.['opensearch:totalResults'] || '0', 10),
    )

    res.json({ artists, albums, tracks, total, page: parseInt(page, 10), limit: parseInt(limit, 10) })
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

app.get('/api/lastfm/charts', async (req, res) => {
  try {
    const type = String(req.query.type || 'artists')
    const limit = String(req.query.limit || '20')
    if (type === 'tracks') {
      const data = await lastFmRequest('chart.gettoptracks', { limit })
      return res.json({ tracks: data.tracks?.track ?? [] })
    }
    const data = await lastFmRequest('chart.gettopartists', { limit })
    res.json({ artists: data.artists?.artist ?? [] })
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

app.get('/api/lastfm/artist', async (req, res) => {
  try {
    const artist = String(req.query.name || '')
    const data = await lastFmRequest('artist.getinfo', { artist, autocorrect: '1' })
    res.json(data.artist ?? null)
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

app.get('/api/lastfm/album', async (req, res) => {
  try {
    const artist = String(req.query.artist || '')
    const album = String(req.query.album || '')
    const data = await lastFmRequest('album.getinfo', { artist, album, autocorrect: '1' })
    res.json(data.album ?? null)
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

app.get('/api/lastfm/track', async (req, res) => {
  try {
    const artist = String(req.query.artist || '')
    const track = String(req.query.track || '')
    const data = await lastFmRequest('track.getinfo', { artist, track, autocorrect: '1' })
    res.json(data.track ?? null)
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`SUPCONTENT API ecoute sur le port ${PORT}`)
})
