import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Politique de confidentialite' }

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 prose prose-neutral dark:prose-invert">
      <h1>Politique de confidentialite</h1>
      <p>
        Nous collectons les donnees necessaires au fonctionnement du compte (email, profil, bibliotheque, critiques).
        Vous pouvez exporter vos donnees depuis la page Parametres (conformite RGPD).
      </p>
      <p>
        Les cookies de session sont utilises pour l&apos;authentification via Supabase. Aucune revente de donnees
        personnelles.
      </p>
      <p className="text-sm text-muted-foreground">Document provisoire — projet academique Culture Connect.</p>
    </div>
  )
}
