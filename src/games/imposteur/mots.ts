/**
 * Chargement des listes de mots. Les fichiers JSON sont inclus dans le site au moment du build :
 * ils sont donc disponibles hors ligne. Après une modification à la main, relance `npm run dev`
 * (ou refais un build) et lance `npm test` : un test vérifie que tes paires sont bien formées.
 */
import anime from '../../../data/imposteur/anime.json'
import vieReelle from '../../../data/imposteur/vie-reelle.json'
import type { Bibliotheque } from './logic/paires'
import type { PaireDeMots } from './logic/types'

export const BIBLIOTHEQUE: Bibliotheque = {
  anime: anime as PaireDeMots[],
  vieReelle: vieReelle as PaireDeMots[],
}
