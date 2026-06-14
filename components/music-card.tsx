'use client'

import Link from 'next/link'
import { MusicArtwork } from '@/components/music-artwork'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Music, Disc3, Mic2, MoreHorizontal, Plus, Star, ListPlus, ExternalLink, Users, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MusicItem } from '@/lib/types'
import { formatNumber } from '@/lib/lastfm'
import { artistPath } from '@/lib/routes'
import { useMusicActions } from '@/components/music/music-actions-provider'
import { addProfileMusic } from '@/lib/profile-client'
import { toast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

interface MusicCardProps {
  item: MusicItem
  showType?: boolean
  showActions?: boolean
  variant?: 'default' | 'compact' | 'horizontal'
  onAddToCollection?: (item: MusicItem) => void
  onAddToList?: (item: MusicItem) => void
  onReview?: (item: MusicItem) => void
}

const typeIcons = {
  artist: Mic2,
  album: Disc3,
  track: Music,
}

const typeLabels = {
  artist: 'Artiste',
  album: 'Album',
  track: 'Morceau',
}

function getItemLink(item: MusicItem): string {
  switch (item.type) {
    case 'artist':
      return `/artist/${encodeURIComponent(item.name)}`
    case 'album':
      return `/album/${encodeURIComponent(item.artist || '')}/${encodeURIComponent(item.name)}`
    case 'track':
      return `/track/${encodeURIComponent(item.artist || '')}/${encodeURIComponent(item.name)}`
  }
}

export function MusicCard({ 
  item, 
  showType = true, 
  showActions = true,
  variant = 'default',
  onAddToCollection,
  onAddToList,
  onReview
}: MusicCardProps) {
  const musicActions = useMusicActions()
  const router = useRouter()
  const [favoritePending, startFavoriteTransition] = useTransition()
  const Icon = typeIcons[item.type]
  const link = getItemLink(item)

  const handleCollection = onAddToCollection ?? musicActions?.openCollection
  const handleList = onAddToList ?? musicActions?.openList
  const handleReview = onReview ?? musicActions?.openReview

  function handleAddFavorite() {
    startFavoriteTransition(async () => {
      const result = await addProfileMusic(item, 'favorite')
      if (result.error) {
        toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
        return
      }
      toast({
        title: 'Ajoute aux favoris',
        description: 'Retrouvez-le dans Mes favoris (menu en haut).',
      })
      router.refresh()
    })
  }

  if (variant === 'horizontal') {
    return (
      <Card className="group overflow-hidden transition-colors hover:bg-accent/50">
        <CardContent className="flex items-center gap-4 p-3">
          <Link href={link} className="relative flex-shrink-0">
            <div className="relative size-16 overflow-hidden rounded-lg bg-muted">
              <MusicArtwork
                src={item.image}
                alt={item.name}
                itemType={item.type}
                sizes="64px"
                className="transition-transform group-hover:scale-105"
              />
            </div>
          </Link>

          <div className="min-w-0 flex-1">
            <Link href={link}>
              <h3 className="truncate font-medium hover:text-primary">
                {item.name}
              </h3>
            </Link>
            {item.artist && (
              <Link 
                href={artistPath(item.artist)}
                className="truncate text-sm text-muted-foreground hover:text-foreground"
              >
                {item.artist}
              </Link>
            )}
            {item.listeners && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="size-3" />
                {formatNumber(item.listeners)} auditeurs
              </p>
            )}
          </div>

          {showType && (
            <Badge variant="secondary" className="flex-shrink-0">
              <Icon className="mr-1 size-3" />
              {typeLabels[item.type]}
            </Badge>
          )}

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleAddFavorite} disabled={favoritePending}>
                  <Heart className="mr-2 size-4" />
                  Ajouter aux favoris
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCollection?.(item)}>
                  <Plus className="mr-2 size-4" />
                  Ajouter a une collection
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleList?.(item)}>
                  <ListPlus className="mr-2 size-4" />
                  Ajouter a une liste
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleReview?.(item)}>
                  <Star className="mr-2 size-4" />
                  Ecrire une critique
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 size-4" />
                    Voir sur Last.fm
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardContent>
      </Card>
    )
  }

  if (variant === 'compact') {
    return (
      <Link href={link} className="group block">
        <div className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent">
          <div className="relative size-10 flex-shrink-0 overflow-hidden rounded bg-muted">
            <MusicArtwork src={item.image} alt={item.name} itemType={item.type} sizes="40px" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium group-hover:text-primary">
              {item.name}
            </p>
            {item.artist && (
              <p className="truncate text-xs text-muted-foreground">{item.artist}</p>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Card className={cn(
      "group overflow-hidden transition-all hover:shadow-lg",
      item.type === 'artist' && "hover:shadow-primary/10"
    )}>
      <Link href={link} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <MusicArtwork
            src={item.image}
            alt={item.name}
            itemType={item.type}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="transition-transform duration-300 group-hover:scale-105"
          />
          
          {showType && (
            <Badge 
              variant="secondary" 
              className="absolute left-2 top-2 bg-background/80 backdrop-blur-sm"
            >
              <Icon className="mr-1 size-3" />
              {typeLabels[item.type]}
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link href={link}>
              <h3 className="truncate font-semibold group-hover:text-primary">
                {item.name}
              </h3>
            </Link>
            {item.artist && (
              <Link 
                href={artistPath(item.artist)}
                className="truncate text-sm text-muted-foreground hover:text-foreground"
              >
                {item.artist}
              </Link>
            )}
            {item.listeners && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="size-3" />
                {formatNumber(item.listeners)} auditeurs
              </p>
            )}
          </div>

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleAddFavorite} disabled={favoritePending}>
                  <Heart className="mr-2 size-4" />
                  Ajouter aux favoris
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCollection?.(item)}>
                  <Plus className="mr-2 size-4" />
                  Ajouter a une collection
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleList?.(item)}>
                  <ListPlus className="mr-2 size-4" />
                  Ajouter a une liste
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleReview?.(item)}>
                  <Star className="mr-2 size-4" />
                  Ecrire une critique
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 size-4" />
                    Voir sur Last.fm
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface MusicGridProps {
  items: MusicItem[]
  showType?: boolean
  showActions?: boolean
  variant?: 'default' | 'compact' | 'horizontal'
  columns?: 2 | 3 | 4 | 5 | 6
}

export function MusicGrid({ 
  items, 
  showType = true, 
  showActions = true, 
  variant = 'default',
  columns = 5
}: MusicGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
  }

  if (variant === 'horizontal') {
    return (
      <div className="space-y-2">
        {items.map((item, index) => (
          <MusicCard 
            key={`${item.type}-${item.name}-${item.artist || ''}-${index}`}
            item={item} 
            showType={showType}
            showActions={showActions}
            variant="horizontal"
          />
        ))}
      </div>
    )
  }

  return (
    <div className={cn('grid gap-4', gridCols[columns])}>
      {items.map((item, index) => (
        <MusicCard 
          key={`${item.type}-${item.name}-${item.artist || ''}-${index}`}
          item={item} 
          showType={showType}
          showActions={showActions}
          variant={variant}
        />
      ))}
    </div>
  )
}
