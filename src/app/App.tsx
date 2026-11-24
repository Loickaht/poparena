/**
 * Racine de l'app : choisit l'écran selon l'URL.
 *   #/            → le hub
 *   #/jeu/<id>    → le jeu correspondant du registre (chargé à la demande)
 */
import { Suspense } from 'react'
import { trouverJeu } from '../games/registry'
import Hub from './Hub'
import { useChemin } from './routeur'

export default function App() {
  const chemin = useChemin()
  const correspondance = chemin.match(/^\/jeu\/([\w-]+)/)
  const jeu = correspondance ? trouverJeu(correspondance[1]) : undefined

  if (jeu?.composant && jeu.statut === 'disponible') {
    const Jeu = jeu.composant
    return (
      <Suspense fallback={<Chargement />}>
        <Jeu />
      </Suspense>
    )
  }
  return <Hub />
}

function Chargement() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="size-12 animate-spin rounded-full border-4 border-trait border-t-rose" aria-label="Chargement" />
    </div>
  )
}
