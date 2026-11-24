/**
 * Registre des jeux : c'est la seule liste que le hub lit.
 * Pour ajouter un jeu : crée son dossier dans src/games/<id>/ avec un composant par défaut
 * dans index.tsx, puis ajoute une entrée ici avec `statut: 'disponible'`.
 */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { Clapperboard, Drama, CircleQuestionMark, VenetianMask, type LucideIcon } from 'lucide-react'

export interface DefinitionJeu {
  id: string
  titre: string
  accroche: string
  joueurs: string
  icone: LucideIcon
  /** Couleur d'accent de la carte dans le hub. */
  couleur: 'rose' | 'cyan' | 'jaune' | 'violet'
  statut: 'disponible' | 'bientot'
  /** Chargé à la demande : le code d'un jeu n'est téléchargé que quand on l'ouvre. */
  composant?: LazyExoticComponent<ComponentType>
}

export const JEUX: DefinitionJeu[] = [
  {
    id: 'imposteur',
    titre: "L'Imposteur",
    accroche: 'Tout le monde a le même mot… sauf toi. Démasque les imposteurs avant qu’ils ne vous piègent.',
    joueurs: '3 à 20 joueurs',
    icone: VenetianMask,
    couleur: 'rose',
    statut: 'disponible',
    composant: lazy(() => import('./imposteur')),
  },
  {
    id: 'qui-suis-je',
    titre: 'Qui suis-je ?',
    accroche: 'Un personnage sur le front, des questions en oui ou non.',
    joueurs: '3 à 12 joueurs',
    icone: CircleQuestionMark,
    couleur: 'cyan',
    statut: 'bientot',
  },
  {
    id: 'quiz-express',
    titre: 'Quiz Express',
    accroche: 'Anime, séries, musique : la culture pop en équipes, chrono en main.',
    joueurs: '2 équipes ou plus',
    icone: Clapperboard,
    couleur: 'jaune',
    statut: 'bientot',
  },
  {
    id: 'mimes',
    titre: 'Mimes & Répliques',
    accroche: 'Fais deviner une scène culte sans dire un mot.',
    joueurs: '4 joueurs ou plus',
    icone: Drama,
    couleur: 'violet',
    statut: 'bientot',
  },
]

export function trouverJeu(id: string): DefinitionJeu | undefined {
  return JEUX.find((j) => j.id === id)
}
