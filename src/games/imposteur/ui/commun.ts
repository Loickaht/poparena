/**
 * Éléments d'interface partagés par les écrans de l'Imposteur.
 */
import type { Action, EtatPartie, Role } from '../logic'

export const ROLES: Record<Role, { nom: string; pluriel: string; texte: string; fond: string; bord: string }> = {
  civil: { nom: 'Civil', pluriel: 'Civils', texte: 'text-cyan', fond: 'bg-cyan', bord: 'border-cyan' },
  imposteur: { nom: 'Imposteur', pluriel: 'Imposteurs', texte: 'text-rose', fond: 'bg-rose', bord: 'border-rose' },
  mrwhite: { nom: 'Mr. White', pluriel: 'Mr. White', texte: 'text-white', fond: 'bg-white', bord: 'border-white' },
}

/** Les écrans de partie reçoivent tous l'état et une fonction pour envoyer des actions. */
export interface PropsEcran {
  etat: EtatPartie
  envoyer: (action: Action) => void
}

/** Index d'un joueur dans la liste d'origine (pour garder la même couleur d'avatar partout). */
export function indexJoueur(etat: EtatPartie, id: string): number {
  return etat.joueurs.findIndex((j) => j.id === id)
}

/** Mise en forme française d'une durée : 90 → « 1 min 30 ». */
export function formaterDuree(secondes: number): string {
  if (secondes === 0) return 'Sans'
  const m = Math.floor(secondes / 60)
  const s = secondes % 60
  if (m === 0) return `${s} s`
  return s === 0 ? `${m} min` : `${m} min ${s}`
}

/** « 1 imposteur », « 2 imposteurs »… */
export function pluriel(n: number, singulier: string, plurielForme = `${singulier}s`): string {
  return `${n} ${n > 1 ? plurielForme : singulier}`
}
