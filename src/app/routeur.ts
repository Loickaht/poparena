/**
 * Mini routeur basé sur le « # » de l'URL (ex. …/#/jeu/imposteur).
 * Avantages : 0 dépendance, marche hors ligne et sur GitHub Pages sans configuration,
 * et le bouton « retour » du téléphone ramène bien au hub.
 */
import { useSyncExternalStore } from 'react'

function cheminActuel(): string {
  return window.location.hash.replace(/^#/, '') || '/'
}

export function useChemin(): string {
  return useSyncExternalStore(
    (f) => {
      window.addEventListener('hashchange', f)
      return () => window.removeEventListener('hashchange', f)
    },
    cheminActuel,
  )
}

export function naviguer(chemin: string): void {
  window.location.hash = chemin
}
