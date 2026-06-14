'use client'

import { useCallback, useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { UserCard } from '@/components/social/user-card'
import { getSuggestedUsers, searchUsers } from '@/lib/profile-client'
import type { Profile, ProfileMusic } from '@/lib/types'
import { Loader2, Search, Users } from 'lucide-react'

type DiscoverUser = Profile & {
  favorites_preview?: ProfileMusic[]
  now_playing?: ProfileMusic | null
}

export function DiscoverView() {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<DiscoverUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSuggested = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { users: results, error: loadError } = await getSuggestedUsers()
    if (loadError) {
      setError(loadError)
      setUsers([])
    } else if (results) {
      setUsers(results as DiscoverUser[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadSuggested()
  }, [loadSuggested])

  useEffect(() => {
    if (query.trim().length < 2) {
      loadSuggested()
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      const { users: results, error: searchError } = await searchUsers(query)
      if (searchError) {
        setError(searchError)
        setUsers([])
      } else if (results) {
        setUsers(results as DiscoverUser[])
      }
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, loadSuggested])

  const isSearching = query.trim().length >= 2

  return (
    <div className="space-y-6">
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher des membres par nom ou pseudo..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 pl-10"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {!isSearching && users.length > 0 && (
            <p className="text-sm text-muted-foreground">Membres recents de la communaute</p>
          )}

          {!isSearching && users.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
              <Users className="mb-4 size-12 text-muted-foreground opacity-40" />
              <p className="text-lg font-medium">Aucun membre pour le moment</p>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Creez un compte ou invitez des amis a rejoindre SUPCONTENT.
              </p>
            </div>
          )}

          {isSearching && users.length === 0 && !error && (
            <p className="py-12 text-center text-muted-foreground">Aucun membre trouve.</p>
          )}

          {users.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {users.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
