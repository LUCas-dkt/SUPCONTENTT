'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MusicActionsMenu } from '@/components/music-actions-menu'
import { useMusicActions } from '@/components/music/music-actions-provider'
import { addProfileMusic } from '@/lib/profile-client'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { ExternalLink, Heart, Plus, Star } from 'lucide-react'
import type { MusicItem } from '@/lib/types'

interface MusicItemActionsProps {
  item: MusicItem
  lastFmUrl: string
  /** Boutons visibles (album) ou menu ⋯ (artiste) */
  layout?: 'buttons' | 'menu'
}

export function MusicItemActions({
  item,
  lastFmUrl,
  layout = 'buttons',
}: MusicItemActionsProps) {
  const actions = useMusicActions()
  const router = useRouter()
  const [favoritePending, startFavoriteTransition] = useTransition()

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

  const lastFmButton = (
    <Button variant="outline" asChild>
      <a href={lastFmUrl} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="mr-2 size-4" />
        Last.fm
      </a>
    </Button>
  )

  if (layout === 'menu') {
    return (
      <div className="flex flex-wrap gap-3">
        <MusicActionsMenu item={item} size="default" />
        {lastFmButton}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button type="button" onClick={handleAddFavorite} disabled={favoritePending}>
        <Heart className="mr-2 size-4" />
        Ajouter aux favoris
      </Button>
      <Button type="button" onClick={() => actions?.openCollection(item)}>
        <Plus className="mr-2 size-4" />
        Ajouter a une collection
      </Button>
      <Button type="button" variant="outline" onClick={() => actions?.openReview(item)}>
        <Star className="mr-2 size-4" />
        Ecrire une critique
      </Button>
      {lastFmButton}
    </div>
  )
}
