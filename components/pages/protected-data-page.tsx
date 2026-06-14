'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { RequireAuth } from '@/components/auth/require-auth'

interface ProtectedDataPageProps<T> {
  redirectPath: string
  title?: string
  description?: string
  load: () => Promise<{ data?: T; error?: string }>
  children: (data: T) => ReactNode
}

export function ProtectedDataPage<T>({
  redirectPath,
  title,
  description,
  load,
  children,
}: ProtectedDataPageProps<T>) {
  return (
    <RequireAuth redirectPath={redirectPath} title={title} description={description}>
      <ProtectedDataLoader load={load}>{children}</ProtectedDataLoader>
    </RequireAuth>
  )
}

function ProtectedDataLoader<T>({
  load,
  children,
}: {
  load: () => Promise<{ data?: T; error?: string }>
  children: (data: T) => ReactNode
}) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void load()
      .then((result) => {
        if (cancelled) return
        if (result.error) setError(result.error)
        else if (result.data !== undefined) setData(result.data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [load])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (data === null) return null
  return <>{children(data)}</>
}
