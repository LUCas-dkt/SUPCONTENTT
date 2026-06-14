'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { setLibraryStatus } from '@/lib/social-client'
import { toast } from '@/hooks/use-toast'
import type { MusicItem } from '@/lib/types'
import { Bookmark, Check, Pause, X } from 'lucide-react'

const STATUSES = [
  { key: 'to_listen' as const, label: 'A ecouter', icon: Bookmark },
  { key: 'in_progress' as const, label: 'En cours', icon: Pause },
  { key: 'completed' as const, label: 'Termine', icon: Check },
  { key: 'abandoned' as const, label: 'Abandonne', icon: X },
]

interface LibraryStatusButtonsProps {
  item: MusicItem
}

export function LibraryStatusButtons({ item }: LibraryStatusButtonsProps) {
  const [pending, startTransition] = useTransition()

  function handleStatus(status: (typeof STATUSES)[number]['key']) {
    startTransition(async () => {
      const result = await setLibraryStatus(item, status)
      if (result.error) {
        toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Bibliotheque mise a jour', description: STATUSES.find((s) => s.key === status)?.label })
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {STATUSES.map(({ key, label, icon: Icon }) => (
        <Button key={key} type="button" size="sm" variant="secondary" disabled={pending} onClick={() => handleStatus(key)}>
          <Icon className="mr-1 size-4" />
          {label}
        </Button>
      ))}
    </div>
  )
}
