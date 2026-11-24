/**
 * La « session » : tout ce qui dure entre plusieurs manches (réglages, scores, paires déjà jouées).
 * Elle est sauvegardée sur le téléphone.
 */
import { imposteursConseilles } from './config'
import type { Reglages } from './logic'

export interface Session {
  reglages: Reglages
  /** Si vrai, le nombre d'imposteurs suit la répartition conseillée. */
  repartitionAuto: boolean
  /** Points cumulés par prénom. */
  scores: Record<string, number>
  manches: number
  /** Identifiants des paires déjà tirées pendant la session. */
  dejaJouees: string[]
}

export const SESSION_INITIALE: Session = {
  reglages: {
    joueurs: [],
    imposteurs: imposteursConseilles(3, false),
    mrWhite: false,
    theme: 'anime',
    difficulte: 'facile',
    dureeDiscussion: 90,
    typeVote: 'secret',
  },
  repartitionAuto: true,
  scores: {},
  manches: 0,
  dejaJouees: [],
}
