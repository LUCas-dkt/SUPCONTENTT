import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
})

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-heading',
})

export const metadata: Metadata = {
  title: {
    default: 'SUPCONTENT - Gerez votre collection musicale',
    template: '%s | SUPCONTENT'
  },
  description: 'Decouvrez, collectionnez et partagez votre passion pour la musique. Creez des collections, des listes et des critiques avec SUPCONTENT.',
  keywords: ['musique', 'collection', 'albums', 'artistes', 'critiques', 'listes', 'lastfm'],
  authors: [{ name: 'SUPCONTENT' }],
  creator: 'SUPCONTENT',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://supcontent.app',
    siteName: 'SUPCONTENT',
    title: 'SUPCONTENT - Gerez votre collection musicale',
    description: 'Decouvrez, collectionnez et partagez votre passion pour la musique.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SUPCONTENT - Gerez votre collection musicale',
    description: 'Decouvrez, collectionnez et partagez votre passion pour la musique.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f7ff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1625' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
