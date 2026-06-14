'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuthUser, type AuthUser } from '@/lib/hooks/use-auth-user'
import { ArrowRight, Library, Search } from 'lucide-react'

export function HomeHeroActions({ serverUser }: { serverUser: AuthUser | null }) {
  const { isLoggedIn } = useAuthUser(serverUser)

  if (isLoggedIn) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button size="lg" asChild>
          <Link href="/search">
            <Search className="mr-2 size-5" />
            Explorer la musique
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/collections">
            <Library className="mr-2 size-5" />
            Mes collections
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <Button size="lg" asChild>
        <Link href="/auth/sign-up">
          Commencer gratuitement
          <ArrowRight className="ml-2 size-5" />
        </Link>
      </Button>
      <Button size="lg" variant="outline" asChild>
        <Link href="/search">
          <Search className="mr-2 size-5" />
          Explorer
        </Link>
      </Button>
    </div>
  )
}
