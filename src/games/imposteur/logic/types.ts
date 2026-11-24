/**
 * Types du jeu de l'Imposteur.
 * Ce dossier `logic/` ne dépend PAS de React : il pourra tourner tel quel sur un serveur (phase 2).
 */

export type Role = 'civil' | 'imposteur' | 'mrwhite'
export type Theme = 'anime' | 'vie-reelle'
export type Difficulte = 'facile' | 'moyen' | 'difficile'
export type TypeVote = 'secret' | 'public'

/** Une paire de mots telle qu'écrite dans data/imposteur/*.json */
export interface PaireDeMots {
  id: string
  motA: string
  motB: string
  categorie: string
  difficulte: Difficulte
  /** Ce que les deux mots ont en commun. */
  lien: string
  /** Ce qui les distingue et peut trahir l'imposteur. */
  piege: string
}

export interface Reglages {
  /** Prénoms des joueurs, dans l'ordre de saisie. */
  joueurs: string[]
  imposteurs: number
  mrWhite: boolean
  theme: Theme
  /** Utilisé pour le thème Anime. */
  difficulte: Difficulte
  /** Durée du minuteur de discussion en secondes (0 = pas de minuteur). */
  dureeDiscussion: number
  typeVote: TypeVote
}

export interface Joueur {
  id: string
  nom: string
  role: Role
  /** Le mot reçu, `null` pour Mr. White. */
  mot: string | null
  enJeu: boolean
}

export type Gagnant = 'civils' | 'intrus' | 'mrwhite'

/** Résultat d'un vote, affiché avant la révélation. */
export type IssueVote =
  | { type: 'elimine'; joueurId: string }
  | { type: 'egalite'; exAequo: string[] }
  /** Deuxième égalité de suite : personne n'est éliminé ce tour-ci. */
  | { type: 'personne'; exAequo: string[] }

/**
 * La machine à états : `phase` dit quel écran afficher et quelles actions sont permises.
 *
 * distribution → indices → discussion → vote → resultat-vote
 *   resultat-vote → (égalité) vote entre ex æquo | (personne) indices du tour suivant | revelation
 *   revelation → mrwhite (si c'était Mr. White) | fin | indices du tour suivant
 *   mrwhite → fin (mot trouvé) | mrwhite-rate → fin | indices du tour suivant
 */
export type Phase =
  | { nom: 'distribution'; vus: string[] }
  /** `courant` = position dans `ordreParole` du joueur qui doit donner son indice. */
  | { nom: 'indices'; courant: number }
  | { nom: 'discussion' }
  | {
      nom: 'vote'
      /** Joueurs qu'on peut désigner (tous les joueurs en jeu, ou les ex æquo en cas de revote). */
      candidats: string[]
      /** Ordre dans lequel le téléphone passe de main en main (vote secret). */
      votants: string[]
      /** votes[votantId] = candidatId */
      votes: Record<string, string>
      revote: boolean
    }
  | { nom: 'resultat-vote'; decompte: Record<string, number>; issue: IssueVote }
  | { nom: 'revelation'; joueurId: string }
  | { nom: 'mrwhite'; joueurId: string }
  | { nom: 'mrwhite-rate'; joueurId: string; proposition: string }
  | { nom: 'fin'; gagnant: Gagnant }

export interface EtatPartie {
  reglages: Reglages
  paire: PaireDeMots
  motCivils: string
  motImposteurs: string
  joueurs: Joueur[]
  phase: Phase
  /** Numéro du tour de parole (1, 2, 3…). */
  tour: number
  /** Ordre de parole du tour en cours (aussi utilisé comme ordre de vote). */
  ordreParole: string[]
  /** Joueurs éliminés, dans l'ordre. */
  elimines: string[]
  /** Proposition de Mr. White quand il a trouvé le mot (pour l'écran de fin). */
  propositionGagnante?: string
  /** Graine du générateur aléatoire : garde le reducer pur et les tests reproductibles. */
  graine: number
}

export type Action =
  | { type: 'MOT_VU'; joueurId: string }
  | { type: 'COMMENCER_INDICES' }
  | { type: 'INDICE_SUIVANT' }
  | { type: 'COMMENCER_VOTE' }
  /** Vote secret : un joueur désigne quelqu'un. */
  | { type: 'VOTER'; votantId: string; cibleId: string }
  /** Vote public : le groupe désigne directement le joueur éliminé. */
  | { type: 'DECISION_PUBLIQUE'; cibleId: string }
  /** Vote public : le groupe déclare une égalité entre plusieurs joueurs. */
  | { type: 'EGALITE_PUBLIQUE'; exAequo: string[] }
  | { type: 'CONTINUER' }
  | { type: 'DEVINER'; proposition: string }
