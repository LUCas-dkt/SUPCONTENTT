'use client'

import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { MusicArtwork } from '@/components/music-artwork'
import { deleteList, removeItemFromList, updateList } from '@/lib/library-client'
import { toast } from '@/hooks/use-toast'
import type { List, ListItem } from '@/lib/types'
import { coerceImageUrl } from '@/lib/lastfm'
import { Loader2, Pencil, Trash2, X } from 'lucide-react'

interface ListManageCardProps {
  list: List & { list_items: ListItem[] }
  onChanged: () => void
}

export function ListManageCard({ list, onChanged }: ListManageCardProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(list.title)
  const [description, setDescription] = useState(list.description ?? '')
  const [isPublic, setIsPublic] = useState(list.is_public)
  const [pending, startTransition] = useTransition()

  function save() {
    startTransition(async () => {
      const result = await updateList(list.id, {
        title,
        description,
        is_public: isPublic,
      })
      if (result.error) {
        toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Liste mise a jour' })
      setEditing(false)
      onChanged()
    })
  }

  function handleDelete() {
    if (!confirm('Supprimer cette liste ?')) return
    startTransition(async () => {
      const result = await deleteList(list.id)
      if (result.error) {
        toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Liste supprimee' })
      onChanged()
    })
  }

  function handleRemoveItem(itemId: string) {
    startTransition(async () => {
      const result = await removeItemFromList(list.id, itemId)
      if (result.error) {
        toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
        return
      }
      onChanged()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          {editing ? (
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9" />
          ) : (
            <span>{list.title}</span>
          )}
          <Badge variant="secondary">{list.item_count} elements</Badge>
        </CardTitle>
        {editing ? (
          <div className="space-y-3 pt-2">
            <Input
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <Label htmlFor={`public-${list.id}`}>Liste publique</Label>
              <Switch id={`public-${list.id}`} checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
          </div>
        ) : (
          <>
            {list.description && <CardDescription>{list.description}</CardDescription>}
            <p className="text-xs text-muted-foreground">
              {list.is_public ? 'Publique' : 'Privee'}
            </p>
          </>
        )}
        <div className="flex flex-wrap gap-2 pt-2">
          {editing ? (
            <>
              <Button type="button" size="sm" onClick={save} disabled={pending}>
                {pending && <Loader2 className="mr-1 size-4 animate-spin" />}
                Enregistrer
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
                Annuler
              </Button>
            </>
          ) : (
            <>
              <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="mr-1 size-4" />
                Modifier
              </Button>
              <Button type="button" size="sm" variant="destructive" onClick={handleDelete} disabled={pending}>
                <Trash2 className="mr-1 size-4" />
                Supprimer
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {(list.list_items ?? []).map((li) => (
          <div key={li.id} className="flex items-center gap-3 rounded-lg border p-2">
            <div className="relative size-10 shrink-0 overflow-hidden rounded bg-muted">
              <MusicArtwork
                src={coerceImageUrl(li.item_image)}
                alt={li.item_name}
                itemType={li.item_type}
                sizes="40px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{li.item_name}</p>
              {li.item_artist && (
                <p className="truncate text-xs text-muted-foreground">{li.item_artist}</p>
              )}
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="shrink-0"
              onClick={() => handleRemoveItem(li.id)}
              disabled={pending}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
