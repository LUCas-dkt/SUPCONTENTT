'use client'

import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthUser } from '@/lib/hooks/use-auth-user'
import { authLoginPath } from '@/lib/routes'

interface RequireAuthProps {
  children: React.ReactNode
  redirectPath: string
  title?: string
  description?: string
}

export function RequireAuth({
  children,
  redirectPath,
  title = 'Connexion requise',
  description = 'Connectez-vous pour acceder a cette page.',
}: RequireAuthProps) {
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
        <h2 className="mb-2 text-xl font-semibold">{title}</h2>
        <p className="mb-6 text-muted-foreground">{description}</p>
        <Button asChild>
          <Link href={authLoginPath(redirectPath)}>Se connecter</Link>
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
