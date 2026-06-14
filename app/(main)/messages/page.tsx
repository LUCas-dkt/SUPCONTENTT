import { isValidSlug } from '@/lib/routes'
import { MessagesPageClient } from '@/components/messages/messages-page-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Messages',
  description: 'Messagerie privee entre membres SUPCONTENT.',
}

interface MessagesPageProps {
  searchParams: Promise<{ conversation?: string; user?: string }>
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const params = await searchParams
  const initialConversationId = isValidSlug(params.conversation)
    ? params.conversation
    : undefined
  const initialUserId = isValidSlug(params.user) ? params.user : undefined

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Messagerie</h1>
        <p className="text-muted-foreground">
          Echangez en prive avec les membres que vous suivez mutuellement.
        </p>
      </div>
      <MessagesPageClient
        initialConversationId={initialConversationId}
        initialUserId={initialUserId}
      />
    </div>
  )
}
