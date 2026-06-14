import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Music2 } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-destructive text-destructive-foreground">
            <Music2 className="size-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Erreur d&apos;authentification</CardTitle>
          <CardDescription>
            Une erreur s&apos;est produite lors de l&apos;authentification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="size-8 text-destructive" />
          </div>
          
          <p className="text-sm text-muted-foreground">
            Le lien de connexion a peut-etre expire ou est invalide. Veuillez reessayer.
          </p>

          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/auth/login">
                Retour a la connexion
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/auth/sign-up">
                Creer un compte
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
