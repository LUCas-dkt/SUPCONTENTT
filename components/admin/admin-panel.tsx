'use client'

import { useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { banUserAsAdmin, deleteReviewAsAdmin, resolveReport } from '@/lib/social-client'
import { toast } from '@/hooks/use-toast'

interface Report {
  id: string
  target_type: string
  target_id: string
  reason: string
  details: string | null
  created_at: string
}

export function AdminPanel({ reports: initialReports }: { reports: Report[] }) {
  const [reports, setReports] = useState(initialReports)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setReports(initialReports)
  }, [initialReports])

  function handleResolve(id: string, action: 'resolved' | 'dismissed') {
    startTransition(async () => {
      const result = await resolveReport(id, action)
      if (result.error) {
        toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
        return
      }
      setReports((prev) => prev.filter((r) => r.id !== id))
      toast({ title: 'Signalement traite' })
    })
  }

  function handleBanProfile(userId: string, reportId: string) {
    if (!confirm('Bannir cet utilisateur ?')) return
    startTransition(async () => {
      const ban = await banUserAsAdmin(userId, true)
      if (ban.error) {
        toast({ title: 'Erreur', description: ban.error, variant: 'destructive' })
        return
      }
      await resolveReport(reportId, 'resolved')
      setReports((prev) => prev.filter((r) => r.id !== reportId))
      toast({ title: 'Utilisateur banni' })
    })
  }

  function handleDeleteReview(reviewId: string, reportId: string) {
    startTransition(async () => {
      const del = await deleteReviewAsAdmin(reviewId)
      if (del.error) {
        toast({ title: 'Erreur', description: del.error, variant: 'destructive' })
        return
      }
      await resolveReport(reportId, 'resolved')
      setReports((prev) => prev.filter((r) => r.id !== reportId))
      toast({ title: 'Critique supprimee' })
    })
  }

  if (!reports.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Aucun signalement en attente.
        </CardContent>
      </Card>
    )
  }

  return (
    <ul className="space-y-3">
      {reports.map((r) => (
        <li key={r.id}>
          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="font-medium">
                {r.target_type} — {r.reason}
              </p>
              {r.details && <p className="text-sm text-muted-foreground">{r.details}</p>}
              <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString('fr-FR')}</p>
              <div className="flex flex-wrap gap-2">
                {r.target_type === 'review' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={pending}
                    onClick={() => handleDeleteReview(r.target_id, r.id)}
                  >
                    Supprimer la critique
                  </Button>
                )}
                {r.target_type === 'profile' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={pending}
                    onClick={() => handleBanProfile(r.target_id, r.id)}
                  >
                    Bannir l&apos;utilisateur
                  </Button>
                )}
                <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => handleResolve(r.id, 'dismissed')}>
                  Ignorer
                </Button>
                <Button type="button" size="sm" disabled={pending} onClick={() => handleResolve(r.id, 'resolved')}>
                  Marquer resolu
                </Button>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  )
}
