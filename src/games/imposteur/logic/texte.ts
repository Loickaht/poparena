/**
 * Met un texte sous une forme comparable : sans accents, sans majuscules,
 * sans espaces ni ponctuation. « Écharpe », « echarpe » et « É-charpe » donnent « echarpe ».
 */
export function normaliser(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les accents
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[^a-z0-9]/g, '') // retire espaces, tirets, apostrophes…
}

/** Mr. White a-t-il trouvé le mot des civils ? */
export function memeMot(proposition: string, mot: string): boolean {
  const p = normaliser(proposition)
  return p.length > 0 && p === normaliser(mot)
}
