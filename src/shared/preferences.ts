/**
 * Préférences générales de l'app (sons, vibrations), partagées par tous les jeux.
 * Un mini « store » : n'importe quel composant peut les lire avec usePreferences().
 */
import { useSyncExternalStore } from 'react'
import { ecrire, lire } from './stockage'

export interface Preferences {
  son: boolean
  vibration: boolean
}

let courant: Preferences = lire<Preferences>('preferences', { son: true, vibration: true })
const abonnes = new Set<() => void>()

export function preferences(): Preferences {
  return courant
}

export function changerPreferences(partiel: Partial<Preferences>): void {
  courant = { ...courant, ...partiel }
  ecrire('preferences', courant)
  abonnes.forEach((f) => f())
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(
    (f) => {
      abonnes.add(f)
      return () => abonnes.delete(f)
    },
    () => courant,
  )
}
