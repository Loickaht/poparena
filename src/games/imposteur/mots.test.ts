/**
 * Contrôle qualité des fichiers data/imposteur/*.json.
 * Lance `npm test` après chaque modification à la main : si une paire est mal formée,
 * le test indique laquelle et pourquoi.
 */
import { describe, expect, it } from 'vitest'
import { normaliser } from './logic/texte'
import { BIBLIOTHEQUE } from './mots'

const DIFFICULTES = ['facile', 'moyen', 'difficile']
const CHAMPS = ['id', 'motA', 'motB', 'categorie', 'difficulte', 'lien', 'piege'] as const

const lots = [
  ['anime.json', BIBLIOTHEQUE.anime],
  ['vie-reelle.json', BIBLIOTHEQUE.vieReelle],
] as const

describe.each(lots)('%s', (_fichier, paires) => {
  it('contient des paires', () => {
    expect(paires.length).toBeGreaterThan(0)
  })

  it.each(paires.map((p) => [p.id ?? '(sans id)', p] as const))('%s est bien formée', (_id, paire) => {
    for (const champ of CHAMPS) {
      expect(typeof paire[champ], `champ « ${champ} »`).toBe('string')
      expect(paire[champ].trim(), `champ « ${champ} » vide`).not.toBe('')
    }
    expect(DIFFICULTES, 'difficulte doit être facile, moyen ou difficile').toContain(paire.difficulte)
    const a = normaliser(paire.motA)
    const b = normaliser(paire.motB)
    expect(a, 'les deux mots sont identiques').not.toBe(b)
    expect(a.includes(b) || b.includes(a), 'un mot contient l’autre').toBe(false)
  })
})

describe('ensemble des mots', () => {
  it('a des identifiants uniques', () => {
    const ids = [...BIBLIOTHEQUE.anime, ...BIBLIOTHEQUE.vieReelle].map((p) => p.id)
    const doublons = ids.filter((id, i) => ids.indexOf(id) !== i)
    expect(doublons).toEqual([])
  })

  it('n’a pas deux fois la même paire de mots', () => {
    const cles = [...BIBLIOTHEQUE.anime, ...BIBLIOTHEQUE.vieReelle].map((p) =>
      [normaliser(p.motA), normaliser(p.motB)].sort().join('|'),
    )
    const doublons = cles.filter((c, i) => cles.indexOf(c) !== i)
    expect(doublons).toEqual([])
  })

  it('a assez de paires dans chaque paquet pour enchaîner les manches', () => {
    for (const d of DIFFICULTES) {
      expect(BIBLIOTHEQUE.anime.filter((p) => p.difficulte === d).length, `Anime ${d}`).toBeGreaterThanOrEqual(10)
    }
    expect(BIBLIOTHEQUE.vieReelle.length, 'Vie réelle').toBeGreaterThanOrEqual(10)
  })
})
