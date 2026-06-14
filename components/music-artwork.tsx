'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { coerceImageUrl } from '@/lib/lastfm'
import { Disc3, Mic2, Music } from 'lucide-react'

const icons = {
  artist: Mic2,
  album: Disc3,
  track: Music,
} as const

export type MusicArtworkType = keyof typeof icons

interface MusicArtworkProps {
  src?: unknown
  alt: string
  itemType?: MusicArtworkType
  className?: string
  sizes?: string
}

export function MusicArtwork({
  src,
  alt,
  itemType = 'artist',
  className,
  sizes = '200px',
}: MusicArtworkProps) {
  const [failed, setFailed] = useState(false)
  const imageUrl = coerceImageUrl(src)
  const showImage = Boolean(imageUrl) && !failed
  const Icon = icons[itemType]

  if (!showImage) {
    return (
      <div className={cn('flex size-full items-center justify-center bg-muted', className)}>
        <Icon className="size-8 text-muted-foreground sm:size-10" />
      </div>
    )
  }

  return (
    <Image
      src={imageUrl!}
      alt={alt}
      fill
      className={cn('object-cover', className)}
      sizes={sizes}
      unoptimized
      onError={() => setFailed(true)}
    />
  )
}
