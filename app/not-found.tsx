import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Music2 } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <Music2 className="size-7" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Page introuvable</h1>
        <p className="max-w-md text-muted-foreground">
          Cette page n existe pas ou le lien est invalide.
        </p>
      </div>
      <Button asChild>
        <Link href="/">
          <Home className="mr-2 size-4" />
          Retour a l accueil
        </Link>
      </Button>
    </div>
  )
}
