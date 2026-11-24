/**
 * Réglages « fixes » du jeu de l'Imposteur.
 * Tu peux modifier ces valeurs à la main : la logique et l'interface les relisent partout.
 */

export const LIMITES = {
  joueursMin: 3,
  joueursMax: 20,
  /** Mr. White n'est proposé qu'à partir de ce nombre de joueurs (voir `maxIntrus`). */
  joueursMinMrWhite: 5,
  longueurNomMax: 16,
} as const

/** Durées proposées pour le minuteur de discussion, en secondes (0 = pas de minuteur). */
export const DUREES_DISCUSSION = [0, 30, 60, 90, 120, 180, 300] as const

/**
 * Barème de points d'une manche. Les points vont à tous les joueurs de l'équipe gagnante,
 * qu'ils soient encore en jeu ou déjà éliminés.
 */
export const BAREME = {
  /** Les civils ont éliminé tous les intrus. */
  victoireCivils: { civil: 2 },
  /** Il ne reste qu'un civil : imposteurs et Mr. White gagnent ensemble. */
  victoireIntrus: { imposteur: 4, mrwhite: 6 },
  /** Mr. White, éliminé, a deviné le mot des civils : il gagne seul. */
  victoireMrWhite: { mrwhite: 8 },
} as const

/**
 * Nombre maximum d'intrus (imposteurs + Mr. White) pour `n` joueurs.
 * Règle d'équilibre : il faut toujours strictement plus de civils que d'intrus au départ.
 * Ex. 5 joueurs → 2 intrus max (3 civils), 8 joueurs → 3 intrus max (5 civils).
 */
export function maxIntrus(n: number): number {
  return Math.floor((n - 1) / 2)
}

/** Nombre maximum d'imposteurs selon le nombre de joueurs et la présence de Mr. White. */
export function maxImposteurs(n: number, mrWhite: boolean): number {
  return Math.max(0, maxIntrus(n) - (mrWhite ? 1 : 0))
}

/** Mr. White est possible s'il reste au moins un imposteur à côté de lui. */
export function mrWhitePossible(n: number): boolean {
  return n >= LIMITES.joueursMinMrWhite && maxImposteurs(n, true) >= 1
}

/**
 * Répartition conseillée : environ un intrus pour trois joueurs.
 *  3-5 joueurs → 1 imposteur (+ Mr. White possible dès 5)
 *  6-8 joueurs → 2 intrus, 9-11 → 3, 12-14 → 4, etc.
 */
export function imposteursConseilles(n: number, mrWhite: boolean): number {
  const intrus = Math.max(1, Math.floor(n / 3))
  const imposteurs = mrWhite ? intrus - 1 : intrus
  return Math.min(Math.max(1, imposteurs), Math.max(1, maxImposteurs(n, mrWhite)))
}
