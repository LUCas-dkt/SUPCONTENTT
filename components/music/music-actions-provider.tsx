'use client'

import { createContext, useCallback, useContext, useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import type { Collection, List, MusicItem } from '@/lib/types'
import {
  addItemToCollection,
  addItemToList,
  createCollection,
  createList,
  createReview,
  getMyCollections,
  getMyLists,
} from '@/lib/library-client'

type DialogKind = 'collection' | 'list' | 'review'

interface MusicActionsContextValue {
  openCollection: (item: MusicItem) => void
  openList: (item: MusicItem) => void
  openReview: (item: MusicItem) => void
}

const MusicActionsContext = createContext<MusicActionsContextValue | null>(null)

export function useMusicActions() {
  return useContext(MusicActionsContext)
}

interface MusicActionsProviderProps {
  children: React.ReactNode
  isLoggedIn: boolean
}

export function MusicActionsProvider({ children, isLoggedIn }: MusicActionsProviderProps) {
  const [item, setItem] = useState<MusicItem | null>(null)
  const [kind, setKind] = useState<DialogKind | null>(null)
  const [collections, setCollections] = useState<Collection[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [newName, setNewName] = useState('')
  const [rating, setRating] = useState('8')
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewContent, setReviewContent] = useState('')
  const [pending, startTransition] = useTransition()

  const requireLogin = useCallback(() => {
    toast({
      title: 'Connexion requise',
      description: 'Connectez-vous pour sauvegarder dans votre bibliotheque.',
      variant: 'destructive',
    })
  }, [])

  const open = useCallback(
    async (dialogKind: DialogKind, musicItem: MusicItem) => {
      if (!isLoggedIn) {
        requireLogin()
        return
      }
      setItem(musicItem)
      setKind(dialogKind)
      setNewName('')
      setReviewTitle('')
      setReviewContent('')
      setRating('8')
      setSelectedId('')

      if (dialogKind === 'collection') {
        const { collections: cols, error } = await getMyCollections()
        if (error) toast({ title: 'Erreur', description: error, variant: 'destructive' })
        setCollections(cols ?? [])
        if (cols?.[0]) setSelectedId(cols[0].id)
      }
      if (dialogKind === 'list') {
        const { lists: ls, error } = await getMyLists()
        if (error) toast({ title: 'Erreur', description: error, variant: 'destructive' })
        setLists(ls ?? [])
        if (ls?.[0]) setSelectedId(ls[0].id)
      }
    },
    [isLoggedIn, requireLogin],
  )

  const close = () => {
    setKind(null)
    setItem(null)
  }

  const value: MusicActionsContextValue = {
    openCollection: (i) => open('collection', i),
    openList: (i) => open('list', i),
    openReview: (i) => open('review', i),
  }

  function handleSubmit() {
    if (!item || !kind) return

    startTransition(async () => {
      if (kind === 'collection') {
        let collectionId: string | null = selectedId || null
        if (newName.trim()) {
          const created = await createCollection(newName.trim())
          if (created.error) {
            toast({ title: 'Erreur', description: created.error, variant: 'destructive' })
            return
          }
          collectionId = created.collection!.id
        }
        const result = await addItemToCollection(collectionId, item)
        if (result.error) {
          toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
          return
        }
        toast({ title: 'Ajoute a la collection', description: `${item.name} a ete enregistre.` })
        close()
        return
      }

      if (kind === 'list') {
        let listId: string | null = selectedId || null
        if (newName.trim()) {
          const created = await createList(newName.trim())
          if (created.error) {
            toast({ title: 'Erreur', description: created.error, variant: 'destructive' })
            return
          }
          listId = created.list!.id
        }
        const result = await addItemToList(listId, item)
        if (result.error) {
          toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
          return
        }
        toast({ title: 'Ajoute a la liste', description: `${item.name} a ete enregistre.` })
        close()
        return
      }

      if (kind === 'review') {
        const result = await createReview(item, {
          rating: parseInt(rating, 10),
          title: reviewTitle,
          content: reviewContent,
        })
        if (result.error) {
          toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
          return
        }
        toast({
          title: 'Critique publiee',
          description: 'Votre critique est visible sur votre profil.',
        })
        close()
      }
    })
  }

  const itemLabel = item
    ? `${item.name}${item.artist ? ` — ${item.artist}` : ''}`
    : ''

  return (
    <MusicActionsContext.Provider value={value}>
      {children}

      <Dialog open={kind !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent className="sm:max-w-md">
          {kind === 'collection' && item && (
            <>
              <DialogHeader>
                <DialogTitle>Ajouter a une collection</DialogTitle>
                <DialogDescription className="truncate">{itemLabel}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {collections.length > 0 && (
                  <div className="space-y-2">
                    <Label>Collection existante</Label>
                    <Select value={selectedId} onValueChange={setSelectedId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir..." />
                      </SelectTrigger>
                      <SelectContent>
                        {collections.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.item_count})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>
                    {collections.length > 0
                      ? 'Ou creer une nouvelle collection'
                      : 'Creer votre premiere collection'}
                  </Label>
                  <Input
                    placeholder="Nom de la collection"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                {collections.length === 0 && !newName.trim() && (
                  <p className="text-xs text-muted-foreground">
                    Laissez vide pour utiliser &quot;Ma collection&quot; automatiquement.
                  </p>
                )}
              </div>
            </>
          )}

          {kind === 'list' && item && (
            <>
              <DialogHeader>
                <DialogTitle>Ajouter a une liste</DialogTitle>
                <DialogDescription className="truncate">{itemLabel}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {lists.length > 0 && (
                  <div className="space-y-2">
                    <Label>Liste existante</Label>
                    <Select value={selectedId} onValueChange={setSelectedId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir..." />
                      </SelectTrigger>
                      <SelectContent>
                        {lists.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.title} ({l.item_count})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>
                    {lists.length > 0 ? 'Ou creer une nouvelle liste' : 'Creer votre premiere liste'}
                  </Label>
                  <Input
                    placeholder="Titre de la liste"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {kind === 'review' && item && (
            <>
              <DialogHeader>
                <DialogTitle>Ecrire une critique</DialogTitle>
                <DialogDescription className="truncate">{itemLabel}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Note (1-10)</Label>
                  <Select value={rating} onValueChange={setRating}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}/10
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Titre (optionnel)</Label>
                  <Input
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="Un titre accrocheur"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Votre avis</Label>
                  <Textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="Partagez votre ressenti..."
                    rows={4}
                  />
                </div>
              </div>
            </>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={close} disabled={pending}>
              Annuler
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={pending}>
              {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MusicActionsContext.Provider>
  )
}
