/**
 * Générateur aléatoire « à graine » (algorithme mulberry32).
 *
 * Pourquoi pas Math.random() ? Un reducer doit être pur : même état + même action = même résultat.
 * On garde donc la graine dans l'état de la partie, et chaque tirage renvoie la nouvelle graine.
 * Bonus : les tests sont reproductibles (même graine = même partie).
 */

/** Renvoie [nombre entre 0 inclus et 1 exclu, nouvelle graine]. */
export function tirer(graine: number): [number, number] {
  const nouvelle = (graine + 0x6d2b79f5) >>> 0
  let t = nouvelle
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, nouvelle]
}

/** Entier entre 0 inclus et `max` exclu. */
export function entier(max: number, graine: number): [number, number] {
  const [x, g] = tirer(graine)
  return [Math.floor(x * max), g]
}

/** Mélange de Fisher-Yates, sans modifier le tableau d'origine. */
export function melanger<T>(liste: readonly T[], graine: number): [T[], number] {
  const copie = [...liste]
  let g = graine
  for (let i = copie.length - 1; i > 0; i--) {
    let j: number
    ;[j, g] = entier(i + 1, g)
    ;[copie[i], copie[j]] = [copie[j], copie[i]]
  }
  return [copie, g]
}

/** Graine de départ « vraiment » aléatoire (utilisée par l'interface, jamais par la logique). */
export function nouvelleGraine(): number {
  return Math.floor(Math.random() * 4294967296) >>> 0
}
