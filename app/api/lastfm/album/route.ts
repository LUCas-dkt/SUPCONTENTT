import { NextRequest, NextResponse } from 'next/server'
import { getAlbumInfo, normalizeAlbum, normalizeTrack, getBestImage, toLastFmArray } from '@/lib/lastfm'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const name = searchParams.get('name')
  const artist = searchParams.get('artist')
  const mbid = searchParams.get('mbid')

  if ((!name || !artist) && !mbid) {
    return NextResponse.json({ error: 'Album name and artist, or mbid is required' }, { status: 400 })
  }

  try {
    const album = await getAlbumInfo(artist || '', name || '', mbid || undefined)
    
    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    const tracks = toLastFmArray(album.tracks?.track)

    return NextResponse.json({
      album: {
        ...normalizeAlbum(album),
        image: getBestImage(album.image),
        wiki: album.wiki?.summary?.replace(/<[^>]*>/g, '') || null,
        tags: toLastFmArray(album.tags?.tag).map(t => t.name),
        stats: {
          listeners: parseInt(album.listeners || '0', 10),
          playcount: parseInt(album.playcount || '0', 10)
        }
      },
      tracks: tracks.map(t => ({
        ...normalizeTrack(t),
        duration: t.duration ? parseInt(t.duration, 10) : null,
        rank: t['@attr']?.rank ? parseInt(t['@attr'].rank, 10) : null
      }))
    })
  } catch (error) {
    console.error('Last.fm album error:', error)
    return NextResponse.json(
      { error: 'Failed to get album info' },
      { status: 500 }
    )
  }
}
