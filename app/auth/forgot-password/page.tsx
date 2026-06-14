'use client'

import { useState } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from '@/lib/auth-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail, Music2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    setMessage(null)

    const result = await requestPasswordReset(email)
    if (result.error) {
      setError(result.error)
    } else {
      setMessage(
        'Si un compte existe avec cet email, un lien de reinitialisation a ete envoye. En local, consultez Mailpit.',
      )
    }
    setPending(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Music2 className="size-6" />
          </div>
          <CardTitle>Mot de passe oublie</CardTitle>
          <CardDescription>Entrez votre email pour recevoir un lien de reinitialisation.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          {message && <div className="mb-4 rounded-lg bg-primary/10 p-3 text-sm">{message}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
              />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Mail className="mr-2 size-4" />}
              Envoyer le lien
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/auth/login" className="text-sm text-primary hover:underline">
            Retour a la connexion
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
