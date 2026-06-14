'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getFollowers, getFollowing } from '@/lib/profile-client'
import type { Profile } from '@/lib/types'
import { profilePath } from '@/lib/routes'
import { Loader2 } from 'lucide-react'

interface FollowListDialogProps {
  userId: string
  type: 'followers' | 'following'
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FollowListDialog({ userId, type, open, onOpenChange }: FollowListDialogProps) {
  const [users, setUsers] = useState<Profile[]>([])
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    startTransition(async () => {
      setError(null)
      const result = type === 'followers' ? await getFollowers(userId) : await getFollowing(userId)
      if (result.error) {
        setError(result.error)
        setUsers([])
        return
      }
      setUsers(result.users ?? [])
    })
  }, [open, userId, type])

  const title = type === 'followers' ? 'Abonnes' : 'Abonnements'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {pending ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="py-4 text-sm text-destructive">{error}</p>
        ) : users.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            {type === 'followers' ? 'Aucun abonne pour le moment.' : 'Aucun abonnement pour le moment.'}
          </p>
        ) : (
          <ul className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
            {users.map((user) => (
              <li key={user.id}>
                <Link
                  href={profilePath(user.username)}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
                >
                  <Avatar className="size-10">
                    <AvatarImage src={user.avatar_url ?? undefined} />
                    <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{user.display_name || user.username}</p>
                    <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
