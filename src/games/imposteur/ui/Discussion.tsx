/**
 * Discussion libre avec minuteur. Le minuteur est un détail d'interface :
 * la logique du jeu ne connaît que « on passe au vote ».
 */
import { useEffect, useRef, useState } from 'react'
import { Pause, Play, Plus, Vote } from 'lucide-react'
import { retour } from '../../../shared/retours'
import { Bouton, Pied } from '../../../shared/ui'
import type { PropsEcran } from './commun'

export default function Discussion({ etat, envoyer }: PropsEcran) {
  const duree = etat.reglages.dureeDiscussion
  const voter = () => envoyer({ type: 'COMMENCER_VOTE' })

  return (
    <>
      <div className="flex flex-1 flex-col items-center px-4">
        <p className="mt-2 text-center text-lg">
          Qui a un mot différent ? Débattez, accusez, défendez-vous… puis passez au vote.
        </p>
        {duree > 0 ? (
          <Minuteur duree={duree} />
        ) : (
          <p className="mt-16 text-center text-2xl font-black text-doux">Pas de minuteur : prenez votre temps.</p>
        )}
      </div>
      <Pied>
        <Bouton grand onClick={voter} icone={<Vote />}>
          Passer au vote
        </Bouton>
      </Pied>
    </>
  )
}

function Minuteur({ duree }: { duree: number }) {
  // On stocke l'heure de fin plutôt qu'un compteur : le temps reste juste même si le
  // téléphone ralentit l'onglet ou si l'écran se met en veille.
  const [fin, setFin] = useState(() => Date.now() + duree * 1000)
  const [pauseRestant, setPauseRestant] = useState<number | null>(null)
  const [maintenant, setMaintenant] = useState(() => Date.now())
  const sonne = useRef(false)

  const restantMs = pauseRestant ?? Math.max(0, fin - maintenant)
  const restant = Math.ceil(restantMs / 1000)
  const termine = restantMs <= 0
  const total = Math.max(duree * 1000, restantMs)

  useEffect(() => {
    if (pauseRestant !== null || termine) return
    const id = window.setInterval(() => setMaintenant(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [pauseRestant, termine])

  // Signal sonore + vibration une seule fois à la fin
  useEffect(() => {
    if (termine && !sonne.current) {
      sonne.current = true
      retour('alarme')
    }
  }, [termine])

  // Empêche l'écran de s'éteindre pendant la discussion (si le navigateur le permet)
  useEffect(() => {
    let verrou: WakeLockSentinel | null = null
    navigator.wakeLock
      ?.request('screen')
      .then((v) => (verrou = v))
      .catch(() => {})
    return () => {
      void verrou?.release().catch(() => {})
    }
  }, [])

  function basculerPause() {
    if (pauseRestant === null) {
      setPauseRestant(restantMs)
    } else {
      setFin(Date.now() + pauseRestant)
      setMaintenant(Date.now())
      setPauseRestant(null)
    }
  }

  function ajouter30s() {
    sonne.current = false
    if (pauseRestant !== null) setPauseRestant(pauseRestant + 30_000)
    else {
      const base = Math.max(fin, Date.now())
      setFin(base + 30_000)
      setMaintenant(Date.now())
    }
  }

  const minutes = Math.floor(restant / 60)
  const secondes = String(restant % 60).padStart(2, '0')
  const rayon = 110
  const perimetre = 2 * Math.PI * rayon
  const fraction = restantMs / total
  const urgent = restant <= 10 && !termine

  return (
    <div className="mt-6 flex flex-col items-center">
      <div className={`relative ${termine ? 'animate-pulse-doux' : ''}`}>
        <svg width="260" height="260" viewBox="0 0 260 260" className="-rotate-90" aria-hidden="true">
          <circle cx="130" cy="130" r={rayon} fill="none" stroke="var(--color-carte-2)" strokeWidth="18" />
          <circle
            cx="130"
            cy="130"
            r={rayon}
            fill="none"
            stroke={termine ? 'var(--color-rouge)' : urgent ? 'var(--color-rose)' : 'var(--color-cyan)'}
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={perimetre}
            strokeDashoffset={perimetre * (1 - fraction)}
            style={{ transition: 'stroke-dashoffset 250ms linear' }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center" role="timer" aria-live="polite">
          {termine ? (
            <span className="text-3xl font-black text-rouge">Temps écoulé !</span>
          ) : (
            <span className={`text-6xl font-black tabular-nums ${urgent ? 'text-rose' : ''}`}>
              {minutes}:{secondes}
            </span>
          )}
        </div>
      </div>
      <div className="mt-6 flex gap-3">
        {!termine && (
          <Bouton variante="secondaire" onClick={basculerPause} icone={pauseRestant === null ? <Pause size={20} /> : <Play size={20} />}>
            {pauseRestant === null ? 'Pause' : 'Reprendre'}
          </Bouton>
        )}
        <Bouton variante="secondaire" onClick={ajouter30s} icone={<Plus size={20} />}>
          30 s
        </Bouton>
      </div>
    </div>
  )
}
