'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ListMusic, Loader2, Search } from 'lucide-react'
import { RequireAuth } from '@/components/auth/require-auth'
import { ListManageCard } from '@/components/lists/list-manage-card'
import { requireUser } from '@/lib/authed-client'
import type { List, ListItem } from '@/lib/types'

async function loadLists(): Promise<{
  data?: (List & { list_items: ListItem[] })[]
  error?: string
}> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const { supabase, user } = auth

  const { data: lists, error } = await supabase
    .from('lists')
    .select(`*, list_items (*)`)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return { error: error.message }
  return { data: (lists ?? []) as (List & { list_items: ListItem[] })[] }
}

export function ListsPageClient() {
  const [userLists, setUserLists] = useState<(List & { list_items: ListItem[] })[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  const refresh = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void loadLists()
      .then((result) => {
        if (cancelled) return
        if (result.error) setError(result.error)
        else setUserLists(result.data ?? [])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  return (
    <RequireAuth redirectPath="/lists">
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="mx-auto max-w-4xl px-4 py-8">
          <p className="text-destructive">{error}</p>
        </div>
      ) : (
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold">
                <ListMusic className="size-8 text-primary" />
                Mes listes
              </h1>
              <p className="mt-2 text-muted-foreground">
                Listes personnalisees : renommer, visibilite publique/privee, suppression.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/search">
                <Search className="mr-2 size-4" />
                Ajouter de la musique
              </Link>
            </Button>
          </div>

          {userLists.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Aucune liste. Utilisez « Ajouter a une liste » sur une page musique.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {userLists.map((list) => (
                <ListManageCard key={list.id} list={list} onChanged={refresh} />
              ))}
            </div>
          )}
        </div>
      )}
    </RequireAuth>
  )
}
