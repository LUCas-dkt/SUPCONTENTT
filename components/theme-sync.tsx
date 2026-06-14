'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'

/** Applique la preference BDD apres hydratation (evite le mismatch SSR). */
export function ThemeSync({ preference }: { preference?: string | null }) {
  const { setTheme } = useTheme()

  useEffect(() => {
    if (preference) {
      setTheme(preference)
    }
  }, [preference, setTheme])

  return null
}
