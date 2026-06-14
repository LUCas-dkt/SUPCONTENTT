'use client'

import { MusicItemActions } from '@/components/music/music-item-actions'
import type { MusicItem } from '@/lib/types'

interface ArtistActionsProps {
  item: MusicItem
  lastFmUrl: string
}

export function ArtistActions({ item, lastFmUrl }: ArtistActionsProps) {
  return <MusicItemActions item={item} lastFmUrl={lastFmUrl} layout="menu" />
}
