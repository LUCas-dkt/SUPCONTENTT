'use client'

import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MessagesView } from '@/components/messages/messages-view'
import { useAuthUser } from '@/lib/hooks/use-auth-user'
import { authLoginPath } from '@/lib/routes'

interface MessagesPageClientProps {
  initialConversationId?: string
  initialUserId?: string
}

export function MessagesPageClient({
  initialConversationId,
  initialUserId,
}: MessagesPageClientProps) {
  const { user, isLoggedIn, authReady } = useAuthUser(null)

  if (!authReady) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h2 className="mb-2 text-xl font-semibold">Connexion requise</h2>
        <p className="mb-6 text-muted-foreground">
          Connectez-vous pour acceder a la messagerie.
        </p>
        <Button asChild>
          <Link href={authLoginPath('/messages')}>Se connecter</Link>
        </Button>
      </div>
    )
  }

  return (
    <MessagesView
      currentUserId={user.id}
      initialConversationId={initialConversationId}
      initialUserId={initialUserId}
    />
  )
}
