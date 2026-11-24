import { describe, expect, it } from 'vitest'
import { choisirPaire, pairesDisponibles } from './paires'
import type { PaireDeMots } from './types'

const p = (id: string, difficulte: PaireDeMots['difficulte'] = 'facile'): PaireDeMots => ({
  id,
  motA: `${id}-A`,
  motB: `${id}-B`,
  categorie: 'Test',
  difficulte,
  lien: 'lien',
  piege: 'piège',
})

describe('choix des paires', () => {
  it('filtre l’Anime par difficulté, pas la Vie réelle', () => {
    const biblio = { anime: [p('a1'), p('a2', 'moyen'), p('a3', 'difficile')], vieReelle: [p('v1'), p('v2', 'difficile')] }
    expect(pairesDisponibles(biblio, 'anime', 'moyen').map((x) => x.id)).toEqual(['a2'])
    expect(pairesDisponibles(biblio, 'vie-reelle', 'facile').map((x) => x.id)).toEqual(['v1', 'v2'])
  })

  it('ne ressort jamais une paire déjà jouée tant qu’il en reste', () => {
    const lot = [p('1'), p('2'), p('3'), p('4'), p('5')]
    let jouees: string[] = []
    let graine = 99
    for (let i = 0; i < lot.length; i++) {
      const r = choisirPaire(lot, jouees, graine)
      expect(jouees).not.toContain(r.paire.id)
      expect(r.recyclage).toBe(false)
      jouees = r.dejaJouees
      graine = r.graine
    }
    expect(new Set(jouees).size).toBe(5)
  })

  it('recycle le lot quand toutes les paires ont servi, sans toucher aux autres thèmes', () => {
    const lot = [p('1'), p('2')]
    const r = choisirPaire(lot, ['1', '2', 'autre-theme'], 5)
    expect(r.recyclage).toBe(true)
    expect(r.dejaJouees).toEqual(['autre-theme', r.paire.id])
  })

  it('signale un lot vide', () => {
    expect(() => choisirPaire([], [], 1)).toThrow()
  })
})
