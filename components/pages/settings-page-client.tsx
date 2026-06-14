'use client'

import Link from 'next/link'
import { useCallback } from 'react'
import { profilePath } from '@/lib/routes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SettingsForm } from '@/components/settings/settings-form'
import { Settings, User } from 'lucide-react'
import { ProtectedDataPage } from '@/components/pages/protected-data-page'
import { requireUser } from '@/lib/authed-client'
import type { Profile } from '@/lib/types'

type SettingsData = {
  profile: Profile | null
  email: string
}

async function loadSettings(): Promise<{ data?: SettingsData; error?: string }> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const { supabase, user } = auth

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('*, locale')
    .eq('id', user.id)
    .single()

  return {
    data: {
      profile: (profileRow as Profile | null) ?? null,
      email: user.email ?? '',
    },
  }
}

export function SettingsPageClient() {
  const load = useCallback(loadSettings, [])

  return (
    <ProtectedDataPage redirectPath="/settings" load={load}>
      {({ profile, email }) => (
        <div className="mx-auto max-w-lg px-4 py-8">
          <h1 className="mb-6 flex items-center gap-2 text-3xl font-bold">
            <Settings className="size-8 text-primary" />
            Parametres
          </h1>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Profil et preferences</CardTitle>
            </CardHeader>
            <CardContent>
              {profile ? (
                <SettingsForm profile={profile} email={email} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Le profil est en cours de creation. Rechargez la page dans quelques secondes.
                </p>
              )}
            </CardContent>
          </Card>
          {profile?.username && (
            <Button asChild variant="outline">
              <Link href={profilePath(profile.username)}>
                <User className="mr-2 size-4" />
                Voir mon profil public
              </Link>
            </Button>
          )}
        </div>
      )}
    </ProtectedDataPage>
  )
}
