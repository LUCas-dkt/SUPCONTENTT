'use client'

import { DiscoverView } from '@/components/social/discover-view'
import { RequireAuth } from '@/components/auth/require-auth'

export function DiscoverPageClient() {
  return (
    <RequireAuth
      redirectPath="/discover"
      description="Connectez-vous pour decouvrir d'autres passionnes de musique."
    >
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Decouvrir</h1>
          <p className="text-muted-foreground">
            Trouvez des passionnes de musique, explorez leurs favoris et playlists.
          </p>
        </div>
        <DiscoverView />
      </div>
    </RequireAuth>
  )
}
