/**
 * Distribution des mots sur un seul téléphone.
 * 1. Le joueur tape sur son prénom.
 * 2. « Passe le téléphone à … » : on confirme que c'est bien lui.
 * 3. Il MAINTIENT le doigt sur la carte pour voir son mot. Dès qu'il lâche, le mot disparaît.
 * 4. « J'ai retenu mon mot » : retour à la liste, le téléphone passe au suivant.
 */
import { useEffect, useState } from 'react'
import { Check, Eye, Hand, Lock } from 'lucide-react'
import { retour } from '../../../shared/retours'
import { Avatar, Bouton, Pied } from '../../../shared/ui'
import { trouverJoueur, type Joueur } from '../logic'
import { indexJoueur, type PropsEcran } from './commun'

export default function Distribution({ etat, envoyer }: PropsEcran) {
  const [selection, setSelection] = useState<string | null>(null)
  if (etat.phase.nom !== 'distribution') return null
  const vus = etat.phase.vus
  const tousOntVu = vus.length === etat.joueurs.length

  if (selection) {
    const joueur = trouverJoueur(etat, selection)
    return (
      <VoirMonMot
        joueur={joueur}
        index={indexJoueur(etat, joueur.id)}
        onTermine={() => {
          envoyer({ type: 'MOT_VU', joueurId: joueur.id })
          setSelection(null)
        }}
        onAnnuler={() => setSelection(null)}
      />
    )
  }

  return (
    <>
      <div className="px-4">
        <p className="mt-2 text-lg">
          Chacun son tour : <b>tape sur ton prénom</b> pour découvrir ton mot en secret.
        </p>
        <p className="mt-1 text-sm font-semibold text-doux">
          {vus.length}/{etat.joueurs.length} joueurs ont vu leur mot
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-carte">
          <div className="h-full bg-vert transition-all" style={{ width: `${(vus.length / etat.joueurs.length) * 100}%` }} />
        </div>

        <ul className="mt-4 grid grid-cols-2 gap-3 pb-4">
          {etat.joueurs.map((j, i) => {
            const vu = vus.includes(j.id)
            return (
              <li key={j.id}>
                <button
                  type="button"
                  onClick={() => setSelection(j.id)}
                  className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-transform active:scale-95 ${
                    vu ? 'border-trait bg-carte/50 opacity-60' : 'border-trait bg-carte'
                  }`}
                >
                  <Avatar nom={j.nom} index={i} />
                  <span className="min-w-0 flex-1 truncate text-lg font-bold">{j.nom}</span>
                  {vu && <Check className="shrink-0 text-vert" aria-label="a vu son mot" />}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      <Pied>
        <Bouton grand disabled={!tousOntVu} onClick={() => envoyer({ type: 'COMMENCER_INDICES' })}>
          {tousOntVu ? 'Tout le monde est prêt : on commence !' : 'En attente de tous les joueurs…'}
        </Bouton>
      </Pied>
    </>
  )
}

function VoirMonMot({ joueur, index, onTermine, onAnnuler }: { joueur: Joueur; index: number; onTermine: () => void; onAnnuler: () => void }) {
  const [confirme, setConfirme] = useState(false)
  const [aRegarde, setARegarde] = useState(false)

  if (!confirme) {
    return (
      <>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center animate-pop">
          <Avatar nom={joueur.nom} index={index} />
          <p className="mt-4 text-xl text-doux">Passe le téléphone à</p>
          <p className="mt-1 text-5xl font-black break-all">{joueur.nom}</p>
          <p className="mt-6 text-doux">Les autres, ne regardez pas l’écran !</p>
        </div>
        <Pied>
          <Bouton grand onClick={() => setConfirme(true)}>
            C’est moi, {joueur.nom}
          </Bouton>
          <Bouton variante="fantome" onClick={onAnnuler}>
            Retour à la liste
          </Bouton>
        </Pied>
      </>
    )
  }

  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <p className="mb-4 text-center text-lg">
          <b>{joueur.nom}</b>, maintiens le doigt sur la carte pour voir ton mot.
        </p>
        <CarteSecrete joueur={joueur} onVu={() => setARegarde(true)} />
        <p className="mt-4 text-center text-sm text-doux">Lâche la carte et le mot disparaît.</p>
      </div>
      <Pied>
        <Bouton grand disabled={!aRegarde} onClick={onTermine} icone={<Check />}>
          J’ai retenu mon mot
        </Bouton>
        <Bouton variante="fantome" onClick={onAnnuler}>
          Annuler
        </Bouton>
      </Pied>
    </>
  )
}

/**
 * La carte « maintenir pour voir ». Sécurités pour qu'aucun mot ne reste affiché par erreur :
 * - le mot n'existe dans la page QUE pendant l'appui (il n'est pas juste caché en CSS) ;
 * - il disparaît si le doigt glisse hors de la carte, si l'appui est annulé,
 *   si l'app passe en arrière-plan ou si la fenêtre perd le focus ;
 * - pas de sélection de texte ni de menu « copier » au long appui.
 * Sur ordinateur : clic maintenu, ou touche Espace / Entrée maintenue.
 */
export function CarteSecrete({ joueur, onVu }: { joueur: Joueur; onVu: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const cacher = () => setVisible(false)
    const siCache = () => document.visibilityState !== 'visible' && cacher()
    window.addEventListener('blur', cacher)
    window.addEventListener('pointerup', cacher)
    window.addEventListener('pointercancel', cacher)
    document.addEventListener('visibilitychange', siCache)
    return () => {
      window.removeEventListener('blur', cacher)
      window.removeEventListener('pointerup', cacher)
      window.removeEventListener('pointercancel', cacher)
      document.removeEventListener('visibilitychange', siCache)
    }
  }, [])

  function montrer() {
    if (!visible) retour('tap')
    setVisible(true)
    onVu()
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Maintenir pour voir ton mot"
      className={`sans-selection relative grid aspect-[4/5] w-full max-w-xs cursor-pointer place-items-center rounded-3xl border-4 p-6 text-center transition-colors ${
        visible ? 'border-jaune bg-carte-2' : 'border-dashed border-trait bg-carte animate-pulse-doux'
      }`}
      onPointerDown={(e) => {
        e.preventDefault()
        // Sur écran tactile, le navigateur « attache » le doigt à la carte : on le détache
        // pour que le mot disparaisse aussi quand le doigt glisse hors de la carte.
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
        montrer()
      }}
      onPointerUp={() => setVisible(false)}
      onPointerLeave={() => setVisible(false)}
      onPointerCancel={() => setVisible(false)}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          montrer()
        }
      }}
      onKeyUp={() => setVisible(false)}
    >
      {visible ? (
        joueur.role === 'mrwhite' ? (
          <div className="animate-pop">
            <p className="text-sm font-bold uppercase tracking-widest text-doux">Tu es</p>
            <p className="mt-2 text-4xl font-black text-white">Mr. White</p>
            <p className="mt-4 text-base text-doux">Tu n’as pas de mot. Écoute les indices des autres et bluffe !</p>
          </div>
        ) : (
          <div className="animate-pop">
            <p className="text-sm font-bold uppercase tracking-widest text-doux">Ton mot</p>
            <p className="mt-3 text-4xl font-black leading-tight text-jaune break-words">{joueur.mot}</p>
          </div>
        )
      ) : (
        <div className="flex flex-col items-center gap-3 text-doux">
          <span className="relative">
            <Lock size={48} />
          </span>
          <span className="flex items-center gap-2 text-lg font-bold">
            <Hand size={22} /> Maintiens appuyé
          </span>
          <span className="flex items-center gap-1 text-sm">
            <Eye size={16} /> Mot caché
          </span>
        </div>
      )}
    </div>
  )
}
