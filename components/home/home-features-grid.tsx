'use client'

import type { ComponentType } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthUser, type AuthUser } from '@/lib/hooks/use-auth-user'
import { authLoginPath } from '@/lib/routes'
import { Library, ListMusic, Star, Users } from 'lucide-react'

function FeatureLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:bg-accent/50">
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="size-5 text-primary" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </Link>
  )
}

export function HomeFeaturesGrid({ serverUser }: { serverUser: AuthUser | null }) {
  const { isLoggedIn } = useAuthUser(serverUser)

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <FeatureLink
        href={isLoggedIn ? '/collections' : authLoginPath('/collections')}
        icon={Library}
        title="Collections"
        description="Organisez vos artistes, albums et morceaux preferes en collections personnalisees."
      />
      <FeatureLink
        href={isLoggedIn ? '/lists' : '/lists/explore'}
        icon={ListMusic}
        title="Listes"
        description="Creez des listes thematiques et partagez-les avec la communaute."
      />
      <FeatureLink
        href="/reviews"
        icon={Star}
        title="Critiques"
        description="Partagez vos avis et decouvrez les recommandations des autres."
      />
      <FeatureLink
        href={isLoggedIn ? '/discover' : authLoginPath('/discover')}
        icon={Users}
        title="Communaute"
        description="Suivez d'autres passionnes et decouvrez de nouvelles musiques."
      />
    </div>
  )
}
