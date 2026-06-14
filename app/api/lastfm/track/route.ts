import { NextRequest, NextResponse } from 'next/server'
import { getTrackInfo, normalizeTrack, getBestImage, toLastFmArray } from '@/lib/lastfm'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const name = searchParams.get('name')
  const artist = searchParams.get('artist')
  const mbid = searchParams.get('mbid')

  if ((!name || !artist) && !mbid) {
    return NextResponse.json({ error: 'Track name and artist, or mbid is required' }, { status: 400 })
  }

  try {
    const track = await getTrackInfo(artist || '', name || '', mbid || undefined)
    
    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 })
    }

    return NextResponse.json({
      track: {
        ...normalizeTrack(track),
        image: getBestImage(track.image) || getBestImage(track.album?.image),
        duration: track.duration ? parseInt(track.duration, 10) : null,
        wiki: track.wiki?.summary?.replace(/<[^>]*>/g, '') || null,
        tags: toLastFmArray(track.toptags?.tag).map(t => t.name),
        album: track.album ? {
          name: track.album.title,
          artist: track.album.artist,
          image: getBestImage(track.album.image),
          url: track.album.url
        } : null,
        stats: {
          listeners: parseInt(track.listeners || '0', 10),
          playcount: parseInt(track.playcount || '0', 10)
        }
      }
    })
  } catch (error) {
    console.error('Last.fm track error:', error)
    return NextResponse.json(
      { error: 'Failed to get track info' },
      { status: 500 }
    )
  }
}
