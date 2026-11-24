/**
 * Module du jeu de l'Imposteur (mode local : un seul téléphone).
 *
 * Ce composant fait le lien entre l'interface et la logique pure :
 *  - `session` : réglages, scores cumulés et paires déjà jouées (sauvegardés sur le téléphone) ;
 *  - `partie`  : l'état de la partie en cours, modifié UNIQUEMENT via `reducer(etat, action)`.
 * La partie est aussi sauvegardée : si la page se recharge, on reprend où on en était.
 */
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { naviguer } from '../../app/routeur'
import { usePersistant } from '../../shared/stockage'
import {
  choisirPaire,
  creerPartie,
  nouvelleGraine,
  pairesDisponibles,
  pointsDeLaManche,
  reducer,
  type Action,
  type EtatPartie,
  type Reglages,
} from './logic'
import { BIBLIOTHEQUE } from './mots'
import { SESSION_INITIALE, type Session } from './session'
import Partie from './ui/Partie'
import EcranReglages from './ui/Reglages'

export default function JeuImposteur() {
  const [session, setSession] = usePersistant<Session>('imposteur:session', SESSION_INITIALE)
  const [partie, setPartie] = usePersistant<EtatPartie | null>('imposteur:partie', null)
  const [message, setMessage] = useState<string | null>(null)
  // Copie toujours à jour de la partie : évite qu'un double tap très rapide
  // applique deux fois la même action sur un état périmé (et compte deux fois les points).
  const partieActuelle = useRef(partie)
  useLayoutEffect(() => {
    partieActuelle.current = partie
  }, [partie])

  /** Tire une paire jamais jouée, distribue les rôles et lance la partie. */
  const lancer = useCallback(
    (reglages: Reglages) => {
      const lot = pairesDisponibles(BIBLIOTHEQUE, reglages.theme, reglages.difficulte)
      const tirage = choisirPaire(lot, session.dejaJouees, nouvelleGraine())
      setSession((s) => ({ ...s, reglages, dejaJouees: tirage.dejaJouees }))
      setPartie(creerPartie(reglages, tirage.paire, tirage.graine))
      setMessage(
        tirage.recyclage ? 'Toutes les paires de ce niveau ont déjà été jouées : on reprend le paquet depuis le début.' : null,
      )
    },
    [session.dejaJouees, setSession, setPartie],
  )

  /** Envoie une action au reducer. Quand la partie se termine, on ajoute les points aux scores. */
  const envoyer = useCallback(
    (action: Action) => {
      const actuelle = partieActuelle.current
      if (!actuelle) return
      const suivant = reducer(actuelle, action)
      if (suivant === actuelle) return
      partieActuelle.current = suivant
      if (suivant.phase.nom === 'fin' && actuelle.phase.nom !== 'fin') {
        const points = pointsDeLaManche(suivant)
        setSession((s) => {
          const scores = { ...s.scores }
          for (const [nom, p] of Object.entries(points)) scores[nom] = (scores[nom] ?? 0) + p
          return { ...s, scores, manches: s.manches + 1 }
        })
      }
      setPartie(suivant)
    },
    [setPartie, setSession],
  )

  if (partie) {
    return (
      <Partie
        etat={partie}
        envoyer={envoyer}
        session={session}
        message={message}
        onFermerMessage={() => setMessage(null)}
        onRejouer={() => lancer(session.reglages)}
        onReglages={() => setPartie(null)}
        onAccueil={() => {
          setPartie(null)
          naviguer('/')
        }}
      />
    )
  }

  return (
    <EcranReglages
      session={session}
      onChangerSession={setSession}
      onLancer={lancer}
      onRetour={() => naviguer('/')}
    />
  )
}
