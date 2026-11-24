import { entier } from './hasard'
import type { Difficulte, PaireDeMots, Theme } from './types'

export interface Bibliotheque {
  anime: PaireDeMots[]
  vieReelle: PaireDeMots[]
}

/** Paires jouables selon le thème (et la difficulté pour l'Anime). */
export function pairesDisponibles(
  biblio: Bibliotheque,
  theme: Theme,
  difficulte: Difficulte,
): PaireDeMots[] {
  if (theme === 'anime') return biblio.anime.filter((p) => p.difficulte === difficulte)
  return biblio.vieReelle
}

/**
 * Tire une paire qui n'a pas encore été jouée pendant la session.
 * Si toutes les paires du lot ont déjà servi, on « recycle » ce lot (et on le signale).
 * Renvoie la nouvelle liste des paires déjà jouées : la fonction ne modifie rien.
 */
export function choisirPaire(
  candidates: PaireDeMots[],
  dejaJouees: string[],
  graine: number,
): { paire: PaireDeMots; dejaJouees: string[]; graine: number; recyclage: boolean } {
  if (candidates.length === 0) throw new Error('Aucune paire de mots pour ce thème.')

  const jouees = new Set(dejaJouees)
  let libres = candidates.filter((p) => !jouees.has(p.id))
  let base = dejaJouees
  const recyclage = libres.length === 0
  if (recyclage) {
    const idsDuLot = new Set(candidates.map((p) => p.id))
    base = dejaJouees.filter((id) => !idsDuLot.has(id))
    libres = candidates
  }
  const [i, g] = entier(libres.length, graine)
  const paire = libres[i]
  return { paire, dejaJouees: [...base, paire.id], graine: g, recyclage }
}
