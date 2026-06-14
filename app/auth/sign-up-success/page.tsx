'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Music2, ExternalLink } from 'lucide-react'
import { resolveMailpitUrl, resolveSupabaseUrl } from '@/lib/supabase/url'

export default function SignUpSuccessPage() {
  const supabaseUrl = resolveSupabaseUrl()
  const mailpitUrl = resolveMailpitUrl()
  const isLocalDev =
    supabaseUrl.includes('127.0.0.1') ||
    supabaseUrl.includes('localhost') ||
    supabaseUrl.includes('10.0.2.2')

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Music2 className="size-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Verifiez votre email</CardTitle>
          <CardDescription>
            {isLocalDev
              ? 'En developpement local, l email ne part pas vers Gmail'
              : 'Nous vous avons envoye un email de confirmation'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="size-8 text-primary" />
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            {isLocalDev ? (
              <>
                <p>
                  Sur votre machine, les emails sont captures par{' '}
                  <strong className="text-foreground">Mailpit</strong> (pas votre vraie boite mail).
                </p>
                <p>Ouvrez Mailpit pour trouver le lien de confirmation :</p>
                <Button asChild className="w-full">
                  <a href={mailpitUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 size-4" />
                    Ouvrir Mailpit
                  </a>
                </Button>
                <p className="text-xs">
                  Assurez-vous que Supabase tourne :{' '}
                  <code className="rounded bg-muted px-1">npm run db:start</code>
                </p>
              </>
            ) : (
              <>
                <p>
                  Cliquez sur le lien dans l&apos;email pour activer votre compte et commencer a
                  utiliser SUPCONTENT.
                </p>
                <p>Si vous ne trouvez pas l&apos;email, verifiez votre dossier spam.</p>
              </>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild variant="outline">
              <Link href="/auth/login">Retour a la connexion</Link>
            </Button>
            {isLocalDev && (
              <p className="text-xs text-muted-foreground">
                Astuce : avec la config locale actuelle, vous pouvez aussi vous connecter directement
                apres inscription si le compte est deja actif.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
