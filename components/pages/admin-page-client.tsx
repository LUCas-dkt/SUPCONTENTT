'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getFeaturedReviews, getPendingReports } from '@/lib/social-client'
import { AdminFeaturedPanel } from '@/components/admin/admin-featured-panel'
import { requireUserWithProfile } from '@/lib/authed-client'
import { AdminPanel } from '@/components/admin/admin-panel'
import { Shield } from 'lucide-react'
import { ProtectedDataPage } from '@/components/pages/protected-data-page'

type AdminData = {
  reports: Awaited<ReturnType<typeof getPendingReports>>['reports']
  featured: Awaited<ReturnType<typeof getFeaturedReviews>>['reviews']
}

async function loadAdmin(): Promise<{ data?: AdminData; error?: string }> {
  const auth = await requireUserWithProfile()
  if ('error' in auth) return { error: auth.error }
  if (!auth.profile?.is_admin) return { error: 'Acces refuse' }

  const [{ reports, error }, { reviews: featured }] = await Promise.all([
    getPendingReports(),
    getFeaturedReviews(),
  ])
  if (error) return { error }
  return { data: { reports: reports ?? [], featured: featured ?? [] } }
}

export function AdminPageClient() {
  const router = useRouter()
  const load = useCallback(async () => {
    const auth = await requireUserWithProfile()
    if ('error' in auth) return { error: auth.error }
    if (!auth.profile?.is_admin) {
      router.replace('/')
      return { error: 'Acces refuse' }
    }
    return loadAdmin()
  }, [router])

  return (
    <ProtectedDataPage redirectPath="/admin" load={load}>
      {({ reports, featured }) => (
        <div className="mx-auto max-w-3xl px-4 py-8">
          <h1 className="mb-6 flex items-center gap-2 text-3xl font-bold">
            <Shield className="size-8 text-primary" />
            Moderation
          </h1>
          <AdminFeaturedPanel initialReviews={featured ?? []} />
          <AdminPanel reports={reports ?? []} />
        </div>
      )}
    </ProtectedDataPage>
  )
}
