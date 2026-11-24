/**
 * Révélation du rôle de l'éliminé, et dernière chance de Mr. White.
 */
import { useEffect, useState, type FormEvent } from 'react'
import { retour } from '../../../shared/retours'
import { Bouton, Pied } from '../../../shared/ui'
import { trouverJoueur, verifierVictoire } from '../logic'
import { ROLES, pluriel, type PropsEcran } from './commun'

export function Revelation({ etat, envoyer }: PropsEcran) {
  const id = etat.phase.nom === 'revelation' ? etat.phase.joueurId : null
  const [retournee, setRetournee] = useState(false)

  // Petit suspense avant de retourner la carte
  useEffect(() => {
    const t = window.setTimeout(() => {
      setRetournee(true)
      retour('revele')
    }, 900)
    return () => window.clearTimeout(t)
  }, [])

  if (!id) return null
  const joueur = trouverJoueur(etat, id)
  const role = ROLES[joueur.role]
  const mrWhite = joueur.role === 'mrwhite'
  // La partie continue-t-elle ? (Mr. White doit d'abord tenter sa chance)
  const continue_ = !mrWhite && verifierVictoire(etat.joueurs) === null
  const restants = etat.joueurs.filter((j) => j.enJeu)
  const imposteurs = restants.filter((j) => j.role === 'imposteur').length
  const mrWhiteEnJeu = restants.some((j) => j.role === 'mrwhite')

  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-2xl font-bold text-doux">{joueur.nom} était…</p>
        <div className="mt-6 h-56 w-full max-w-xs">
          {retournee ? (
            <div className={`animate-flip grid h-full place-items-center rounded-3xl border-4 ${role.bord} bg-carte p-6`}>
              <div>
                <p className={`text-5xl font-black ${role.texte}`}>{role.nom}</p>
                {joueur.role === 'civil' && <p className="mt-3 text-doux">Un innocent est tombé…</p>}
                {joueur.role === 'imposteur' && <p className="mt-3 text-doux">Bien joué, un imposteur démasqué !</p>}
                {mrWhite && <p className="mt-3 text-doux">Il a encore une chance de gagner…</p>}
              </div>
            </div>
          ) : (
            <div className="animate-pulse-doux grid h-full place-items-center rounded-3xl border-4 border-dashed border-trait bg-carte text-6xl font-black text-doux">
              ?
            </div>
          )}
        </div>
        {retournee && continue_ && (
          <p className="animate-monte mt-6 text-lg">
            Il reste {imposteurs > 0 ? pluriel(imposteurs, 'imposteur') : ''}
            {imposteurs > 0 && mrWhiteEnJeu ? ' et ' : ''}
            {mrWhiteEnJeu ? 'Mr. White' : ''} parmi vous.
          </p>
        )}
      </div>
      <Pied>
        <Bouton grand disabled={!retournee} onClick={() => envoyer({ type: 'CONTINUER' })}>
          {mrWhite ? 'Mr. White tente sa chance' : continue_ ? 'Tour suivant' : 'Voir le résultat'}
        </Bouton>
      </Pied>
    </>
  )
}

export function DevinetteMrWhite({ etat, envoyer }: PropsEcran) {
  const [proposition, setProposition] = useState('')
  if (etat.phase.nom !== 'mrwhite') return null
  const joueur = trouverJoueur(etat, etat.phase.joueurId)

  function valider(e: FormEvent) {
    e.preventDefault()
    if (proposition.trim()) envoyer({ type: 'DEVINER', proposition })
  }

  return (
    <form onSubmit={valider} className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col justify-center px-6 text-center">
        <p className="text-4xl font-black text-white">Mr. White</p>
        <p className="mt-3 text-lg">
          <b>{joueur.nom}</b>, si tu trouves le mot des civils, tu gagnes tout seul !
        </p>
        <input
          value={proposition}
          onChange={(e) => setProposition(e.target.value)}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="go"
          placeholder="Le mot des civils"
          aria-label="Le mot des civils"
          className="mt-6 min-h-16 rounded-2xl border-2 border-trait bg-carte px-4 text-center text-2xl font-bold text-texte placeholder:text-doux/60 focus:border-jaune focus:outline-none"
        />
        <p className="mt-2 text-sm text-doux">Une seule tentative. Les accents et majuscules ne comptent pas.</p>
      </div>
      <Pied>
        <Bouton grand type="submit" disabled={!proposition.trim()}>
          Valider ma réponse
        </Bouton>
      </Pied>
    </form>
  )
}

export function MrWhiteRate({ etat, envoyer }: PropsEcran) {
  useEffect(() => retour('defaite'), [])
  if (etat.phase.nom !== 'mrwhite-rate') return null
  const joueur = trouverJoueur(etat, etat.phase.joueurId)
  return (
    <>
      <div className="animate-pop flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-5xl font-black text-rouge">Raté !</p>
        <p className="mt-4 text-lg">
          « {etat.phase.proposition} » n’est pas le mot des civils. {joueur.nom} sort définitivement du jeu.
        </p>
      </div>
      <Pied>
        <Bouton grand onClick={() => envoyer({ type: 'CONTINUER' })}>
          Continuer
        </Bouton>
      </Pied>
    </>
  )
}
