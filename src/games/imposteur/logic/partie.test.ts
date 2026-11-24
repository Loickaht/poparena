import { describe, expect, it } from 'vitest'
import { imposteursConseilles, maxImposteurs, mrWhitePossible } from '../config'
import {
  creerPartie,
  ordreDeParole,
  pointsDeLaManche,
  reducer,
  resoudreVote,
  trouverJoueur,
  verifierReglages,
  verifierVictoire,
} from './partie'
import { memeMot, normaliser } from './texte'
import type { Action, EtatPartie, PaireDeMots, Reglages, Role } from './types'

// --- Outils de test -------------------------------------------------------

const PAIRE: PaireDeMots = {
  id: 'test-1',
  motA: 'Plage',
  motB: 'Piscine',
  categorie: 'Lieux',
  difficulte: 'facile',
  lien: "On s'y baigne",
  piege: 'Sel ou chlore',
}

const NOMS = ['Awa', 'Koffi', 'Yann', 'Sena', 'Ifè', 'Malik', 'Nadia', 'Tobi']

function reglages(partiel: Partial<Reglages> = {}): Reglages {
  return {
    joueurs: NOMS.slice(0, 6),
    imposteurs: 1,
    mrWhite: false,
    theme: 'vie-reelle',
    difficulte: 'facile',
    dureeDiscussion: 60,
    typeVote: 'secret',
    ...partiel,
  }
}

function jouer(etat: EtatPartie, ...actions: Action[]): EtatPartie {
  return actions.reduce(reducer, etat)
}

/** Tout le monde regarde son mot puis on lance le tour d'indices. */
function apresDistribution(etat: EtatPartie): EtatPartie {
  const vus = etat.joueurs.map((j): Action => ({ type: 'MOT_VU', joueurId: j.id }))
  return jouer(etat, ...vus, { type: 'COMMENCER_INDICES' })
}

/** Passe tous les indices et la discussion : on arrive au vote. */
function jusquAuVote(etat: EtatPartie): EtatPartie {
  let e = etat
  while (e.phase.nom === 'indices') e = reducer(e, { type: 'INDICE_SUIVANT' })
  return reducer(e, { type: 'COMMENCER_VOTE' })
}

function idsParRole(etat: EtatPartie, role: Role): string[] {
  return etat.joueurs.filter((j) => j.role === role && j.enJeu).map((j) => j.id)
}

/** Vote secret où tout le monde vote contre `cible` (et `cible` vote contre quelqu'un d'autre). */
function toutLeMondeVoteContre(etat: EtatPartie, cible: string): EtatPartie {
  if (etat.phase.nom !== 'vote') throw new Error('pas en phase de vote')
  const autre = etat.phase.candidats.find((id) => id !== cible)!
  let e = etat
  for (const votant of etat.phase.votants) {
    e = reducer(e, { type: 'VOTER', votantId: votant, cibleId: votant === cible ? autre : cible })
  }
  return e
}

/** Élimine `cible` au vote et passe la révélation. */
function eliminer(etat: EtatPartie, cible: string): EtatPartie {
  let e = toutLeMondeVoteContre(jusquAuVote(etat), cible)
  e = reducer(e, { type: 'CONTINUER' }) // résultat du vote → révélation
  return reducer(e, { type: 'CONTINUER' }) // révélation → suite
}

// --- Réglages --------------------------------------------------------------

describe('réglages', () => {
  it('accepte une configuration correcte', () => {
    expect(verifierReglages(reglages())).toEqual([])
  })

  it('refuse moins de 3 ou plus de 20 joueurs', () => {
    expect(verifierReglages(reglages({ joueurs: ['A', 'B'] }))).not.toEqual([])
    const vingtEtUn = Array.from({ length: 21 }, (_, i) => `J${i}`)
    expect(verifierReglages(reglages({ joueurs: vingtEtUn, imposteurs: 3 }))).not.toEqual([])
  })

  it('refuse les prénoms vides ou en double (accents et majuscules ignorés)', () => {
    expect(verifierReglages(reglages({ joueurs: ['Awa', 'awa', 'Koffi'] }))).not.toEqual([])
    expect(verifierReglages(reglages({ joueurs: ['Ifè', 'Ife', 'Koffi'] }))).not.toEqual([])
    expect(verifierReglages(reglages({ joueurs: ['Awa', '  ', 'Koffi'] }))).not.toEqual([])
  })

  it('garde toujours plus de civils que d’intrus', () => {
    // 6 joueurs : 2 intrus max
    expect(verifierReglages(reglages({ imposteurs: 2 }))).toEqual([])
    expect(verifierReglages(reglages({ imposteurs: 3 }))).not.toEqual([])
    expect(verifierReglages(reglages({ imposteurs: 2, mrWhite: true }))).not.toEqual([])
    expect(verifierReglages(reglages({ imposteurs: 0 }))).not.toEqual([])
  })

  it('n’autorise Mr. White qu’à partir de 5 joueurs', () => {
    expect(mrWhitePossible(4)).toBe(false)
    expect(mrWhitePossible(5)).toBe(true)
    expect(verifierReglages(reglages({ joueurs: NOMS.slice(0, 4), mrWhite: true }))).not.toEqual([])
    expect(verifierReglages(reglages({ joueurs: NOMS.slice(0, 5), mrWhite: true }))).toEqual([])
  })

  it('propose une répartition conseillée toujours valide', () => {
    for (let n = 3; n <= 20; n++) {
      for (const mrWhite of [false, true]) {
        if (mrWhite && !mrWhitePossible(n)) continue
        const imp = imposteursConseilles(n, mrWhite)
        expect(imp).toBeGreaterThanOrEqual(1)
        expect(imp).toBeLessThanOrEqual(maxImposteurs(n, mrWhite))
      }
    }
    expect(imposteursConseilles(3, false)).toBe(1)
    expect(imposteursConseilles(9, false)).toBe(3)
    expect(imposteursConseilles(9, true)).toBe(2)
  })
})

// --- Distribution des rôles -------------------------------------------------

describe('distribution des rôles', () => {
  it('donne le bon nombre de chaque rôle', () => {
    const etat = creerPartie(reglages({ joueurs: NOMS, imposteurs: 2, mrWhite: true }), PAIRE, 42)
    expect(idsParRole(etat, 'imposteur')).toHaveLength(2)
    expect(idsParRole(etat, 'mrwhite')).toHaveLength(1)
    expect(idsParRole(etat, 'civil')).toHaveLength(5)
  })

  it('donne le même mot à tous les civils, l’autre aux imposteurs, rien à Mr. White', () => {
    const etat = creerPartie(reglages({ joueurs: NOMS, imposteurs: 2, mrWhite: true }), PAIRE, 7)
    expect([etat.motCivils, etat.motImposteurs].sort()).toEqual(['Piscine', 'Plage'])
    for (const j of etat.joueurs) {
      if (j.role === 'civil') expect(j.mot).toBe(etat.motCivils)
      if (j.role === 'imposteur') expect(j.mot).toBe(etat.motImposteurs)
      if (j.role === 'mrwhite') expect(j.mot).toBeNull()
    }
  })

  it('tire au hasard lequel des deux mots va aux civils', () => {
    const motsCivils = new Set<string>()
    for (let graine = 0; graine < 40; graine++) {
      motsCivils.add(creerPartie(reglages(), PAIRE, graine).motCivils)
    }
    expect(motsCivils).toEqual(new Set(['Plage', 'Piscine']))
  })

  it('répartit les rôles au hasard entre les joueurs', () => {
    const imposteurs = new Set<string>()
    for (let graine = 0; graine < 60; graine++) {
      const etat = creerPartie(reglages(), PAIRE, graine)
      imposteurs.add(idsParRole(etat, 'imposteur')[0])
    }
    expect(imposteurs.size).toBe(6) // chacun des 6 joueurs a été imposteur au moins une fois
  })

  it('est reproductible avec la même graine', () => {
    expect(creerPartie(reglages(), PAIRE, 123)).toEqual(creerPartie(reglages(), PAIRE, 123))
  })

  it('refuse de créer une partie avec des réglages invalides', () => {
    expect(() => creerPartie(reglages({ joueurs: ['A', 'B'] }), PAIRE, 1)).toThrow()
  })

  it('attend que tout le monde ait vu son mot avant les indices', () => {
    let etat = creerPartie(reglages(), PAIRE, 1)
    etat = jouer(etat, { type: 'MOT_VU', joueurId: 'j1' }, { type: 'COMMENCER_INDICES' })
    expect(etat.phase.nom).toBe('distribution')
    etat = apresDistribution(etat)
    expect(etat.phase.nom).toBe('indices')
  })
})

// --- Ordre de parole --------------------------------------------------------

describe('ordre de parole', () => {
  it('ne fait jamais parler Mr. White en premier', () => {
    for (let graine = 0; graine < 300; graine++) {
      const etat = creerPartie(reglages({ joueurs: NOMS.slice(0, 5), mrWhite: true }), PAIRE, graine)
      const [ordre] = ordreDeParole(etat.joueurs, graine * 7 + 3)
      expect(trouverJoueur(etat, ordre[0]).role).not.toBe('mrwhite')
      expect(new Set(ordre).size).toBe(5)
    }
  })

  it('ne contient que les joueurs encore en jeu', () => {
    let etat = apresDistribution(creerPartie(reglages(), PAIRE, 5))
    const civil = idsParRole(etat, 'civil')[0]
    etat = eliminer(etat, civil)
    expect(etat.phase.nom).toBe('indices')
    expect(etat.ordreParole).toHaveLength(5)
    expect(etat.ordreParole).not.toContain(civil)
    expect(etat.tour).toBe(2)
  })

  it('passe à la discussion après le dernier indice', () => {
    let etat = apresDistribution(creerPartie(reglages(), PAIRE, 9))
    for (let i = 0; i < 5; i++) etat = reducer(etat, { type: 'INDICE_SUIVANT' })
    expect(etat.phase).toEqual({ nom: 'indices', courant: 5 })
    etat = reducer(etat, { type: 'INDICE_SUIVANT' })
    expect(etat.phase.nom).toBe('discussion')
  })
})

// --- Vote et égalités -------------------------------------------------------

describe('vote', () => {
  it('compte les votes et élimine celui qui en a le plus', () => {
    const { issue, decompte } = resoudreVote(['a', 'b', 'c'], { a: 'b', b: 'c', c: 'b' }, false)
    expect(issue).toEqual({ type: 'elimine', joueurId: 'b' })
    expect(decompte).toEqual({ a: 0, b: 2, c: 1 })
  })

  it('déclare une égalité, puis personne éliminé si l’égalité se répète', () => {
    expect(resoudreVote(['a', 'b', 'c', 'd'], { a: 'b', b: 'a', c: 'a', d: 'b' }, false).issue).toEqual({
      type: 'egalite',
      exAequo: ['a', 'b'],
    })
    expect(resoudreVote(['a', 'b'], { a: 'b', b: 'a' }, true).issue).toEqual({
      type: 'personne',
      exAequo: ['a', 'b'],
    })
  })

  it('refuse de voter pour soi, deux fois, ou pour un non-candidat', () => {
    const etat = jusquAuVote(apresDistribution(creerPartie(reglages(), PAIRE, 3)))
    expect(reducer(etat, { type: 'VOTER', votantId: 'j1', cibleId: 'j1' })).toBe(etat)
    expect(reducer(etat, { type: 'VOTER', votantId: 'j1', cibleId: 'j99' })).toBe(etat)
    const apres = reducer(etat, { type: 'VOTER', votantId: 'j1', cibleId: 'j2' })
    expect(reducer(apres, { type: 'VOTER', votantId: 'j1', cibleId: 'j3' })).toBe(apres)
  })

  it('en cas d’égalité, revote uniquement entre les ex æquo', () => {
    let etat = jusquAuVote(apresDistribution(creerPartie(reglages(), PAIRE, 11)))
    // 6 joueurs : 3 votes contre j1, 3 votes contre j2
    const votes: Record<string, string> = { j1: 'j2', j2: 'j1', j3: 'j1', j4: 'j2', j5: 'j1', j6: 'j2' }
    for (const [votant, cible] of Object.entries(votes)) {
      etat = reducer(etat, { type: 'VOTER', votantId: votant, cibleId: cible })
    }
    expect(etat.phase).toMatchObject({ nom: 'resultat-vote', issue: { type: 'egalite' } })
    expect(etat.joueurs.every((j) => j.enJeu)).toBe(true)

    etat = reducer(etat, { type: 'CONTINUER' })
    expect(etat.phase).toMatchObject({ nom: 'vote', candidats: ['j1', 'j2'], revote: true })
    // Un vote contre un joueur qui n'est pas ex æquo est refusé
    expect(reducer(etat, { type: 'VOTER', votantId: 'j3', cibleId: 'j4' })).toBe(etat)

    // Nouvelle égalité → personne n'est éliminé, on passe au tour suivant
    for (const [votant, cible] of Object.entries(votes)) {
      etat = reducer(etat, { type: 'VOTER', votantId: votant, cibleId: cible })
    }
    expect(etat.phase).toMatchObject({ nom: 'resultat-vote', issue: { type: 'personne' } })
    etat = reducer(etat, { type: 'CONTINUER' })
    expect(etat.phase.nom).toBe('indices')
    expect(etat.tour).toBe(2)
    expect(etat.joueurs.every((j) => j.enJeu)).toBe(true)
  })

  it('vote public : le groupe désigne directement, ou déclare une égalité', () => {
    const base = jusquAuVote(apresDistribution(creerPartie(reglages({ typeVote: 'public' }), PAIRE, 4)))
    // Les votes individuels sont ignorés en vote public
    expect(reducer(base, { type: 'VOTER', votantId: 'j1', cibleId: 'j2' })).toBe(base)

    const direct = reducer(base, { type: 'DECISION_PUBLIQUE', cibleId: 'j3' })
    expect(direct.phase).toMatchObject({ nom: 'resultat-vote', issue: { type: 'elimine', joueurId: 'j3' } })
    expect(trouverJoueur(direct, 'j3').enJeu).toBe(false)

    let egalite = reducer(base, { type: 'EGALITE_PUBLIQUE', exAequo: ['j2', 'j5'] })
    expect(egalite.phase).toMatchObject({ issue: { type: 'egalite', exAequo: ['j2', 'j5'] } })
    egalite = reducer(egalite, { type: 'CONTINUER' })
    expect(egalite.phase).toMatchObject({ nom: 'vote', candidats: ['j2', 'j5'], revote: true })
    const encore = reducer(egalite, { type: 'EGALITE_PUBLIQUE', exAequo: ['j2', 'j5'] })
    expect(encore.phase).toMatchObject({ issue: { type: 'personne' } })
    // Une « égalité » avec un seul joueur n'a pas de sens
    expect(reducer(base, { type: 'EGALITE_PUBLIQUE', exAequo: ['j2'] })).toBe(base)
  })
})

// --- Conditions de victoire -------------------------------------------------

describe('conditions de victoire', () => {
  it('les civils gagnent quand tous les intrus sont éliminés', () => {
    let etat = apresDistribution(creerPartie(reglages({ imposteurs: 2 }), PAIRE, 21))
    const [imp1, imp2] = idsParRole(etat, 'imposteur')
    etat = eliminer(etat, imp1)
    expect(etat.phase.nom).toBe('indices') // il reste un imposteur
    etat = eliminer(etat, imp2)
    expect(etat.phase).toEqual({ nom: 'fin', gagnant: 'civils' })
  })

  it('les intrus gagnent quand il ne reste qu’un civil', () => {
    // 3 joueurs : 2 civils + 1 imposteur. Éliminer un civil suffit.
    let etat = apresDistribution(creerPartie(reglages({ joueurs: NOMS.slice(0, 3) }), PAIRE, 8))
    etat = eliminer(etat, idsParRole(etat, 'civil')[0])
    expect(etat.phase).toEqual({ nom: 'fin', gagnant: 'intrus' })
  })

  it('les intrus gagnent ensemble (imposteurs + Mr. White)', () => {
    let etat = apresDistribution(creerPartie(reglages({ joueurs: NOMS.slice(0, 5), mrWhite: true }), PAIRE, 13))
    const [c1, c2] = idsParRole(etat, 'civil')
    etat = eliminer(etat, c1)
    expect(etat.phase.nom).toBe('indices')
    etat = eliminer(etat, c2)
    expect(etat.phase).toEqual({ nom: 'fin', gagnant: 'intrus' })
    const points = pointsDeLaManche(etat)
    const imposteur = etat.joueurs.find((j) => j.role === 'imposteur')!
    const mrWhite = etat.joueurs.find((j) => j.role === 'mrwhite')!
    expect(points[imposteur.nom]).toBe(4)
    expect(points[mrWhite.nom]).toBe(6)
  })

  it('verifierVictoire : cas limites', () => {
    const j = (role: Role, enJeu = true) => ({ id: role, nom: role, role, mot: null, enJeu })
    expect(verifierVictoire([j('civil'), j('civil'), j('imposteur', false)])).toBe('civils')
    expect(verifierVictoire([j('civil'), j('civil', false), j('imposteur')])).toBe('intrus')
    expect(verifierVictoire([j('civil'), j('civil'), j('mrwhite')])).toBeNull()
  })
})

// --- Mr. White --------------------------------------------------------------

describe('devinette de Mr. White', () => {
  function mrWhiteElimine(graine: number): EtatPartie {
    let etat = apresDistribution(creerPartie(reglages({ mrWhite: true }), PAIRE, graine))
    const mrWhite = idsParRole(etat, 'mrwhite')[0]
    etat = toutLeMondeVoteContre(jusquAuVote(etat), mrWhite)
    etat = reducer(etat, { type: 'CONTINUER' })
    expect(etat.phase).toEqual({ nom: 'revelation', joueurId: mrWhite })
    etat = reducer(etat, { type: 'CONTINUER' })
    expect(etat.phase).toEqual({ nom: 'mrwhite', joueurId: mrWhite })
    return etat
  }

  it('gagne tout de suite s’il trouve le mot (accents et majuscules ignorés)', () => {
    const etat = mrWhiteElimine(31)
    const proposition = etat.motCivils === 'Plage' ? '  PLAGE ' : 'pîscine'
    const fin = reducer(etat, { type: 'DEVINER', proposition })
    expect(fin.phase).toEqual({ nom: 'fin', gagnant: 'mrwhite' })
    expect(fin.propositionGagnante).toBe(proposition.trim())
  })

  it('donne les points de la victoire solo à Mr. White seulement', () => {
    const etat = mrWhiteElimine(31)
    const fin = reducer(etat, { type: 'DEVINER', proposition: etat.motCivils })
    const points = pointsDeLaManche(fin)
    for (const j of fin.joueurs) expect(points[j.nom]).toBe(j.role === 'mrwhite' ? 8 : 0)
  })

  it('le mot des imposteurs ne compte pas', () => {
    const etat = mrWhiteElimine(32)
    const rate = reducer(etat, { type: 'DEVINER', proposition: etat.motImposteurs })
    expect(rate.phase.nom).toBe('mrwhite-rate')
  })

  it('s’il se trompe, la partie continue (ou les civils gagnent s’il était le dernier intrus)', () => {
    // Avec 1 imposteur encore en jeu, la partie continue
    let etat = mrWhiteElimine(33)
    etat = reducer(etat, { type: 'DEVINER', proposition: 'Montagne' })
    etat = reducer(etat, { type: 'CONTINUER' })
    expect(etat.phase.nom).toBe('indices')

    // On élimine d'abord l'imposteur, puis Mr. White qui se trompe → victoire des civils
    let e = apresDistribution(creerPartie(reglages({ mrWhite: true }), PAIRE, 34))
    e = eliminer(e, idsParRole(e, 'imposteur')[0])
    const mrWhite = idsParRole(e, 'mrwhite')[0]
    e = toutLeMondeVoteContre(jusquAuVote(e), mrWhite)
    e = jouer(e, { type: 'CONTINUER' }, { type: 'CONTINUER' }, { type: 'DEVINER', proposition: 'Montagne' })
    e = reducer(e, { type: 'CONTINUER' })
    expect(e.phase).toEqual({ nom: 'fin', gagnant: 'civils' })
  })

  it('ignore une proposition vide', () => {
    const etat = mrWhiteElimine(35)
    expect(reducer(etat, { type: 'DEVINER', proposition: '   ' })).toBe(etat)
  })
})

describe('normalisation du texte', () => {
  it('ignore accents, majuscules, espaces et ponctuation', () => {
    expect(normaliser('Écharpe')).toBe('echarpe')
    expect(normaliser("L'Œuf")).toBe('loeuf')
    expect(memeMot('lampe-torche', 'Lampe torche')).toBe(true)
    expect(memeMot('Pokeballs', 'Pokéballs')).toBe(true)
    expect(memeMot('', 'Plage')).toBe(false)
    expect(memeMot('Plages', 'Plage')).toBe(false)
  })
})

describe('reducer', () => {
  it('ignore les actions qui n’ont pas de sens dans la phase en cours', () => {
    const etat = creerPartie(reglages(), PAIRE, 1)
    expect(reducer(etat, { type: 'COMMENCER_VOTE' })).toBe(etat)
    expect(reducer(etat, { type: 'DEVINER', proposition: 'Plage' })).toBe(etat)
  })

  it('ne modifie jamais l’état reçu', () => {
    const etat = apresDistribution(creerPartie(reglages(), PAIRE, 1))
    const copie = structuredClone(etat)
    eliminer(etat, 'j1')
    expect(etat).toEqual(copie)
  })
})
