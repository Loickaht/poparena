/**
 * Cœur du jeu : création d'une partie + reducer (état, action) → nouvel état.
 *
 * Règle d'or : aucune fonction ici ne modifie l'état reçu, ne lit l'horloge ni n'appelle
 * Math.random(). Le hasard passe par `etat.graine`. Une action interdite dans la phase
 * en cours est simplement ignorée (on renvoie l'état tel quel).
 */
import { BAREME, LIMITES, maxImposteurs, mrWhitePossible } from '../config'
import { entier, melanger, tirer } from './hasard'
import { memeMot, normaliser } from './texte'
import type {
  Action,
  EtatPartie,
  Gagnant,
  IssueVote,
  Joueur,
  PaireDeMots,
  Reglages,
  Role,
} from './types'

// ---------------------------------------------------------------------------
// Vérification des réglages
// ---------------------------------------------------------------------------

/** Renvoie la liste des problèmes (en français, prêts à afficher). Liste vide = tout va bien. */
export function verifierReglages(r: Reglages): string[] {
  const erreurs: string[] = []
  const n = r.joueurs.length

  if (n < LIMITES.joueursMin) erreurs.push(`Il faut au moins ${LIMITES.joueursMin} joueurs.`)
  if (n > LIMITES.joueursMax) erreurs.push(`${LIMITES.joueursMax} joueurs maximum.`)

  const vus = new Set<string>()
  for (const nom of r.joueurs) {
    const propre = nom.trim()
    if (!propre) {
      erreurs.push('Un prénom est vide.')
      continue
    }
    if (propre.length > LIMITES.longueurNomMax) {
      erreurs.push(`« ${propre} » est trop long (${LIMITES.longueurNomMax} caractères max).`)
    }
    const cle = normaliser(propre)
    if (vus.has(cle)) erreurs.push(`Le prénom « ${propre} » est en double.`)
    vus.add(cle)
  }

  if (r.mrWhite && !mrWhitePossible(n)) {
    erreurs.push(`Mr. White demande au moins ${LIMITES.joueursMinMrWhite} joueurs.`)
  }
  if (r.imposteurs < 1) erreurs.push('Il faut au moins un imposteur.')
  if (n >= LIMITES.joueursMin && r.imposteurs > maxImposteurs(n, r.mrWhite)) {
    erreurs.push(
      `Trop d'imposteurs : ${maxImposteurs(n, r.mrWhite)} maximum pour ${n} joueurs` +
        (r.mrWhite ? ' avec Mr. White.' : '.'),
    )
  }
  if (r.dureeDiscussion < 0) erreurs.push('La durée de discussion est invalide.')
  return erreurs
}

// ---------------------------------------------------------------------------
// Création d'une partie
// ---------------------------------------------------------------------------

/**
 * Distribue les rôles et les mots.
 * - On tire à pile ou face lequel des deux mots de la paire va aux civils.
 * - On mélange les joueurs : les premiers sont imposteurs, puis Mr. White, le reste civils.
 */
export function creerPartie(reglages: Reglages, paire: PaireDeMots, graine: number): EtatPartie {
  const erreurs = verifierReglages(reglages)
  if (erreurs.length > 0) throw new Error(erreurs.join(' '))

  let g = graine
  let pileOuFace: number
  ;[pileOuFace, g] = tirer(g)
  const civilsOntA = pileOuFace < 0.5
  const motCivils = civilsOntA ? paire.motA : paire.motB
  const motImposteurs = civilsOntA ? paire.motB : paire.motA

  const indices = reglages.joueurs.map((_, i) => i)
  let melange: number[]
  ;[melange, g] = melanger(indices, g)

  const roles: Role[] = new Array(reglages.joueurs.length).fill('civil')
  melange.forEach((indexJoueur, rang) => {
    if (rang < reglages.imposteurs) roles[indexJoueur] = 'imposteur'
    else if (reglages.mrWhite && rang === reglages.imposteurs) roles[indexJoueur] = 'mrwhite'
  })

  const joueurs: Joueur[] = reglages.joueurs.map((nom, i) => ({
    id: `j${i + 1}`,
    nom: nom.trim(),
    role: roles[i],
    mot: roles[i] === 'civil' ? motCivils : roles[i] === 'imposteur' ? motImposteurs : null,
    enJeu: true,
  }))

  return {
    reglages,
    paire,
    motCivils,
    motImposteurs,
    joueurs,
    phase: { nom: 'distribution', vus: [] },
    tour: 1,
    ordreParole: [],
    elimines: [],
    graine: g,
  }
}

// ---------------------------------------------------------------------------
// Petites fonctions utiles (exportées pour l'interface et les tests)
// ---------------------------------------------------------------------------

export function joueursEnJeu(etat: EtatPartie): Joueur[] {
  return etat.joueurs.filter((j) => j.enJeu)
}

export function trouverJoueur(etat: EtatPartie, id: string): Joueur {
  const joueur = etat.joueurs.find((j) => j.id === id)
  if (!joueur) throw new Error(`Joueur inconnu : ${id}`)
  return joueur
}

/**
 * Conditions de victoire :
 * - plus aucun intrus (imposteur ou Mr. White) en jeu → les civils gagnent ;
 * - il ne reste qu'un seul civil (ou aucun) → les intrus gagnent.
 */
export function verifierVictoire(joueurs: Joueur[]): Gagnant | null {
  const enJeu = joueurs.filter((j) => j.enJeu)
  const intrus = enJeu.filter((j) => j.role !== 'civil').length
  const civils = enJeu.length - intrus
  if (intrus === 0) return 'civils'
  if (civils <= 1) return 'intrus'
  return null
}

/**
 * Ordre de parole aléatoire parmi les joueurs en jeu, Mr. White jamais en premier.
 * Si le mélange le place en tête, on l'échange avec un autre joueur tiré au hasard.
 */
export function ordreDeParole(joueurs: Joueur[], graine: number): [string[], number] {
  const enJeu = joueurs.filter((j) => j.enJeu)
  let [ordre, g] = melanger(
    enJeu.map((j) => j.id),
    graine,
  )
  const premier = enJeu.find((j) => j.id === ordre[0])
  if (premier?.role === 'mrwhite' && ordre.length > 1) {
    let autre: number
    ;[autre, g] = entier(ordre.length - 1, g)
    const k = autre + 1 // une position entre 1 et la fin
    ordre = [...ordre]
    ;[ordre[0], ordre[k]] = [ordre[k], ordre[0]]
  }
  return [ordre, g]
}

/** Compte les votes et désigne l'éliminé, ou les ex æquo. */
export function resoudreVote(
  candidats: string[],
  votes: Record<string, string>,
  revote: boolean,
): { decompte: Record<string, number>; issue: IssueVote } {
  const decompte: Record<string, number> = Object.fromEntries(candidats.map((id) => [id, 0]))
  for (const cible of Object.values(votes)) {
    if (cible in decompte) decompte[cible]++
  }
  const max = Math.max(...Object.values(decompte))
  const entete = candidats.filter((id) => decompte[id] === max)
  if (entete.length === 1) return { decompte, issue: { type: 'elimine', joueurId: entete[0] } }
  return { decompte, issue: { type: revote ? 'personne' : 'egalite', exAequo: entete } }
}

/** Points gagnés pendant cette manche, par prénom (0 pour les perdants). */
export function pointsDeLaManche(etat: EtatPartie): Record<string, number> {
  const points: Record<string, number> = {}
  const gagnant = etat.phase.nom === 'fin' ? etat.phase.gagnant : null
  for (const j of etat.joueurs) {
    let p = 0
    if (gagnant === 'civils' && j.role === 'civil') p = BAREME.victoireCivils.civil
    if (gagnant === 'intrus' && j.role === 'imposteur') p = BAREME.victoireIntrus.imposteur
    if (gagnant === 'intrus' && j.role === 'mrwhite') p = BAREME.victoireIntrus.mrwhite
    if (gagnant === 'mrwhite' && j.role === 'mrwhite') p = BAREME.victoireMrWhite.mrwhite
    points[j.nom] = p
  }
  return points
}

// ---------------------------------------------------------------------------
// Transitions internes
// ---------------------------------------------------------------------------

function demarrerTour(etat: EtatPartie, tour: number): EtatPartie {
  const [ordre, graine] = ordreDeParole(etat.joueurs, etat.graine)
  return { ...etat, tour, ordreParole: ordre, graine, phase: { nom: 'indices', courant: 0 } }
}

/** Après une élimination : victoire ? sinon on repart pour un tour de parole. */
function finOuTourSuivant(etat: EtatPartie): EtatPartie {
  const gagnant = verifierVictoire(etat.joueurs)
  if (gagnant) return { ...etat, phase: { nom: 'fin', gagnant } }
  return demarrerTour(etat, etat.tour + 1)
}

function ouvrirVote(etat: EtatPartie, candidats: string[], revote: boolean): EtatPartie {
  // Le téléphone passe dans l'ordre de parole du tour (seulement les joueurs encore en jeu).
  const votants = etat.ordreParole.filter((id) => trouverJoueur(etat, id).enJeu)
  return { ...etat, phase: { nom: 'vote', candidats, votants, votes: {}, revote } }
}

/** Applique l'issue du vote : l'éliminé sort du jeu tout de suite. */
function appliquerIssue(
  etat: EtatPartie,
  decompte: Record<string, number>,
  issue: IssueVote,
): EtatPartie {
  let joueurs = etat.joueurs
  let elimines = etat.elimines
  if (issue.type === 'elimine') {
    joueurs = joueurs.map((j) => (j.id === issue.joueurId ? { ...j, enJeu: false } : j))
    elimines = [...elimines, issue.joueurId]
  }
  return { ...etat, joueurs, elimines, phase: { nom: 'resultat-vote', decompte, issue } }
}

// ---------------------------------------------------------------------------
// Le reducer
// ---------------------------------------------------------------------------

export function reducer(etat: EtatPartie, action: Action): EtatPartie {
  const phase = etat.phase

  switch (phase.nom) {
    case 'distribution': {
      if (action.type === 'MOT_VU') {
        const existe = etat.joueurs.some((j) => j.id === action.joueurId)
        if (!existe || phase.vus.includes(action.joueurId)) return etat
        return { ...etat, phase: { nom: 'distribution', vus: [...phase.vus, action.joueurId] } }
      }
      if (action.type === 'COMMENCER_INDICES') {
        // Tout le monde doit avoir vu son mot avant de commencer.
        if (phase.vus.length < etat.joueurs.length) return etat
        return demarrerTour(etat, 1)
      }
      return etat
    }

    case 'indices': {
      if (action.type !== 'INDICE_SUIVANT') return etat
      const suivant = phase.courant + 1
      if (suivant >= etat.ordreParole.length) return { ...etat, phase: { nom: 'discussion' } }
      return { ...etat, phase: { nom: 'indices', courant: suivant } }
    }

    case 'discussion': {
      if (action.type !== 'COMMENCER_VOTE') return etat
      return ouvrirVote(
        etat,
        joueursEnJeu(etat).map((j) => j.id),
        false,
      )
    }

    case 'vote': {
      const secret = etat.reglages.typeVote === 'secret'

      if (action.type === 'VOTER' && secret) {
        const { votantId, cibleId } = action
        if (!phase.votants.includes(votantId)) return etat
        if (votantId in phase.votes) return etat // un seul vote par personne
        if (!phase.candidats.includes(cibleId) || cibleId === votantId) return etat
        const votes = { ...phase.votes, [votantId]: cibleId }
        if (Object.keys(votes).length < phase.votants.length) {
          return { ...etat, phase: { ...phase, votes } }
        }
        const { decompte, issue } = resoudreVote(phase.candidats, votes, phase.revote)
        return appliquerIssue(etat, decompte, issue)
      }

      if (action.type === 'DECISION_PUBLIQUE' && !secret) {
        if (!phase.candidats.includes(action.cibleId)) return etat
        return appliquerIssue(etat, {}, { type: 'elimine', joueurId: action.cibleId })
      }

      if (action.type === 'EGALITE_PUBLIQUE' && !secret) {
        const exAequo = [...new Set(action.exAequo)].filter((id) => phase.candidats.includes(id))
        if (exAequo.length < 2) return etat
        return appliquerIssue(etat, {}, { type: phase.revote ? 'personne' : 'egalite', exAequo })
      }
      return etat
    }

    case 'resultat-vote': {
      if (action.type !== 'CONTINUER') return etat
      const issue = phase.issue
      if (issue.type === 'elimine') return { ...etat, phase: { nom: 'revelation', joueurId: issue.joueurId } }
      if (issue.type === 'egalite') return ouvrirVote(etat, issue.exAequo, true)
      return demarrerTour(etat, etat.tour + 1) // personne n'est éliminé
    }

    case 'revelation': {
      if (action.type !== 'CONTINUER') return etat
      const elimine = trouverJoueur(etat, phase.joueurId)
      // Mr. White éliminé : il a une dernière chance de deviner le mot des civils.
      if (elimine.role === 'mrwhite') return { ...etat, phase: { nom: 'mrwhite', joueurId: elimine.id } }
      return finOuTourSuivant(etat)
    }

    case 'mrwhite': {
      if (action.type !== 'DEVINER') return etat
      const proposition = action.proposition.trim()
      if (!proposition) return etat
      if (memeMot(proposition, etat.motCivils)) {
        return { ...etat, propositionGagnante: proposition, phase: { nom: 'fin', gagnant: 'mrwhite' } }
      }
      return { ...etat, phase: { nom: 'mrwhite-rate', joueurId: phase.joueurId, proposition } }
    }

    case 'mrwhite-rate': {
      if (action.type !== 'CONTINUER') return etat
      return finOuTourSuivant(etat)
    }

    case 'fin':
      return etat
  }
}
