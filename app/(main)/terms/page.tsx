import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Conditions d\'utilisation' }

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 prose prose-neutral dark:prose-invert">
      <h1>Conditions d&apos;utilisation</h1>
      <p>
        SUPCONTENT est un reseau social de decouverte musicale. En utilisant le service, vous acceptez de respecter
        les autres membres et de ne pas publier de contenu illicite ou offensant.
      </p>
      <p>
        Les metadonnees musicales sont fournies par Last.fm. SUPCONTENT n&apos;heberge pas les fichiers audio.
      </p>
      <p className="text-sm text-muted-foreground">Document provisoire — projet academique Culture Connect.</p>
    </div>
  )
}
