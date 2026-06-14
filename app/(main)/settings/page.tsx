import type { Metadata } from 'next'
import { SettingsPageClient } from '@/components/pages/settings-page-client'

export const metadata: Metadata = {
  title: 'Parametres',
}

export default function SettingsPage() {
  return <SettingsPageClient />
}
