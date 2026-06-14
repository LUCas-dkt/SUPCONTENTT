'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { useAuthUser } from '@/lib/hooks/use-auth-user'
import { sanitizeNextPath } from '@/lib/routes'

export function RedirectIfAuthenticated({
  nextPath = '/',
  children,
}: {
  nextPath?: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isLoggedIn, authReady } = useAuthUser(null)
  const safeNext = sanitizeNextPath(nextPath)

  useEffect(() => {
    if (authReady && isLoggedIn) {
      router.replace(safeNext)
    }
  }, [authReady, isLoggedIn, safeNext, router])

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return children
}
