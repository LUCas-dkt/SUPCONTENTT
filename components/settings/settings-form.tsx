'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateUserSettings, exportUserDataAction, exportUserDataCsvAction } from '@/lib/settings-client'
import { toast } from '@/hooks/use-toast'
import type { Profile } from '@/lib/types'
import { Download, Loader2 } from 'lucide-react'
import { useTheme } from 'next-themes'

interface SettingsFormProps {
  profile: Profile
  email: string
}

export function SettingsForm({ profile, email }: SettingsFormProps) {
  const { setTheme } = useTheme()
  const [displayName, setDisplayName] = useState(profile.display_name ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [website, setWebsite] = useState(profile.website ?? '')
  const [theme, setThemePref] = useState(profile.theme_preference ?? 'system')
  const [locale, setLocale] = useState(profile.locale ?? 'fr')
  const [emailNotif, setEmailNotif] = useState(profile.notification_email)
  const [pushNotif, setPushNotif] = useState(profile.notification_push)
  const [pending, startTransition] = useTransition()

  function save() {
    startTransition(async () => {
      const result = await updateUserSettings({
        display_name: displayName,
        bio,
        website,
        theme_preference: theme,
        locale,
        notification_email: emailNotif,
        notification_push: pushNotif,
      })
      if (result.error) {
        toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
        return
      }
      setTheme(theme)
      document.documentElement.lang = locale
      toast({ title: 'Parametres enregistres' })
    })
  }

  function downloadBlob(content: string, mime: string, filename: string) {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleExport() {
    startTransition(async () => {
      const result = await exportUserDataAction()
      if (result.error || !result.data) {
        toast({ title: 'Erreur', description: result.error ?? 'Export impossible', variant: 'destructive' })
        return
      }
      downloadBlob(result.data, 'application/json', result.filename ?? 'supcontent-export.json')
    })
  }

  function handleExportCsv() {
    startTransition(async () => {
      const result = await exportUserDataCsvAction()
      if (result.error || !result.data) {
        toast({ title: 'Erreur', description: result.error ?? 'Export impossible', variant: 'destructive' })
        return
      }
      downloadBlob(result.data, 'text/csv;charset=utf-8', result.filename ?? 'supcontent-export.csv')
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={email} disabled />
      </div>
      <div className="space-y-2">
        <Label htmlFor="display_name">Nom affiche</Label>
        <Input id="display_name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Biographie</Label>
        <Textarea id="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="website">Site web</Label>
        <Input id="website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Langue</Label>
        <Select value={locale} onValueChange={setLocale}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fr">Francais</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Theme</Label>
        <Select value={theme} onValueChange={setThemePref}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Clair</SelectItem>
            <SelectItem value="dark">Sombre</SelectItem>
            <SelectItem value="system">Systeme</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="email-notif">Notifications par email</Label>
        <Switch id="email-notif" checked={emailNotif} onCheckedChange={setEmailNotif} />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="push-notif">Notifications push</Label>
        <Switch id="push-notif" checked={pushNotif} onCheckedChange={setPushNotif} />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={save} disabled={pending}>
          {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Enregistrer
        </Button>
        <Button type="button" variant="outline" onClick={handleExport} disabled={pending}>
          <Download className="mr-2 size-4" />
          Export JSON
        </Button>
        <Button type="button" variant="outline" onClick={handleExportCsv} disabled={pending}>
          <Download className="mr-2 size-4" />
          Export CSV
        </Button>
      </div>
    </div>
  )
}
