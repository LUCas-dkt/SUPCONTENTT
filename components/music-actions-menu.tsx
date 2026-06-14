'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { addProfileMusic } from '@/lib/profile-client'
import { useMusicActions } from '@/components/music/music-actions-provider'
import { toast } from '@/hooks/use-toast'
import type { MusicItem } from '@/lib/types'
import { Heart, Headphones, ListPlus, MoreHorizontal, Plus, Star } from 'lucide-react'

interface MusicActionsMenuProps {
  item: MusicItem
  size?: 'icon' | 'default'
}

export function MusicActionsMenu({ item, size = 'icon' }: MusicActionsMenuProps) {
  const [pending, startTransition] = useTransition()
  const musicActions = useMusicActions()
  const router = useRouter()

  function run(
    action: () => Promise<{ error?: string; success?: boolean }>,
    successMessage: string,
    hint?: string,
  ) {
    startTransition(async () => {
      const result = await action()
      if (result.error) {
        toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
        return
      }
      toast({ title: successMessage, description: hint })
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={size} disabled={pending} className={size === 'icon' ? 'size-8' : ''}>
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() =>
            run(
              () => addProfileMusic(item, 'favorite'),
              'Ajoute aux favoris',
              'Retrouvez-le dans Mes favoris (menu en haut).',
            )
          }
        >
          <Heart className="mr-2 size-4" />
          Ajouter aux favoris
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => run(() => addProfileMusic(item, 'now_playing'), 'Marque en ecoute')}>
          <Headphones className="mr-2 size-4" />
          Marquer en ecoute
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => run(() => addProfileMusic(item, 'recent'), 'Ajoute aux ecoutes recentes')}>
          <Plus className="mr-2 size-4" />
          Ajouter aux ecoutes recentes
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => musicActions?.openCollection(item)}>
          <Plus className="mr-2 size-4" />
          Ajouter a une collection
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => musicActions?.openList(item)}>
          <ListPlus className="mr-2 size-4" />
          Ajouter a une liste
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => musicActions?.openReview(item)}>
          <Star className="mr-2 size-4" />
          Ecrire une critique
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
