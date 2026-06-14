'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuthUser, type AuthUser } from '@/lib/hooks/use-auth-user'
import { ArrowRight } from 'lucide-react'

export function HomeSignupCta({ serverUser }: { serverUser: AuthUser | null }) {
  const { isLoggedIn } = useAuthUser(serverUser)

  if (isLoggedIn) return null

  return (
    <section className="border-t bg-primary/5 py-16">
      <div className="mx-auto max-w-7xl px-4 text-center">
        <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
          Pret a organiser votre univers musical?
        </h2>
        <p className="mb-8 text-muted-foreground">
          Rejoignez SUPCONTENT gratuitement et commencez a creer vos collections.
        </p>
        <Button size="lg" asChild>
          <Link href="/auth/sign-up">
            Creer un compte gratuit
            <ArrowRight className="ml-2 size-5" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
