/**
 * Bouton « Installer l'app » : Chrome sur Android propose d'installer la PWA sur l'écran
 * d'accueil. On capture cette proposition pour l'afficher au bon moment.
 */
import { useEffect, useState } from 'react'

interface InstallPrompt extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function useInstallation() {
  const [proposition, setProposition] = useState<InstallPrompt | null>(null)

  useEffect(() => {
    const capter = (e: Event) => {
      e.preventDefault()
      setProposition(e as InstallPrompt)
    }
    const installee = () => setProposition(null)
    window.addEventListener('beforeinstallprompt', capter)
    window.addEventListener('appinstalled', installee)
    return () => {
      window.removeEventListener('beforeinstallprompt', capter)
      window.removeEventListener('appinstalled', installee)
    }
  }, [])

  if (!proposition) return null
  return async () => {
    await proposition.prompt()
    await proposition.userChoice
    setProposition(null)
  }
}
