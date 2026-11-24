/**
 * Résultat du vote : décompte animé (vote secret), puis éliminé, égalité ou personne.
 */
import { useEffect } from 'react'
import { retour } from '../../../shared/retours'
import { Avatar, Bouton, Pied } from '../../../shared/ui'
import { trouverJoueur } from '../logic'
import { indexJoueur, pluriel, type PropsEcran } from './commun'

export default function ResultatVote({ etat, envoyer }: PropsEcran) {
  const phase = etat.phase
  const egalite = phase.nom === 'resultat-vote' && phase.issue.type !== 'elimine'
  useEffect(() => {
    if (egalite) retour('erreur')
  }, [egalite])

  if (phase.nom !== 'resultat-vote') return null
  const { decompte, issue } = phase
  const lignes = Object.entries(decompte).sort((a, b) => b[1] - a[1])
  const max = Math.max(1, ...lignes.map(([, n]) => n))
  const noms = (ids: string[]) =>
    ids
      .map((id) => trouverJoueur(etat, id).nom)
      .join(', ')
      .replace(/, ([^,]*)$/, ' et $1')

  return (
    <>
      <div className="px-4">
        {lignes.length > 0 && (
          <ul className="mt-4 space-y-2">
            {lignes.map(([id, n], i) => {
              const j = trouverJoueur(etat, id)
              const enTete = n === lignes[0][1] && n > 0
              return (
                <li key={id} className="flex items-center gap-3">
                  <Avatar nom={j.nom} index={indexJoueur(etat, id)} petit />
                  <span className="w-24 truncate font-bold">{j.nom}</span>
                  <div className="h-7 flex-1 overflow-hidden rounded-lg bg-carte">
                    <div
                      className={`animate-barre h-full origin-left rounded-lg ${enTete ? 'bg-rose' : 'bg-trait'}`}
                      style={{ width: `${(n / max) * 100}%`, animationDelay: `${i * 90}ms` }}
                    />
                  </div>
                  <span className="w-6 text-right text-lg font-black tabular-nums">{n}</span>
                </li>
              )
            })}
          </ul>
        )}

        <div className="animate-pop mt-8 rounded-3xl bg-carte p-6 text-center" style={{ animationDelay: '400ms' }}>
          {issue.type === 'elimine' && (
            <>
              <p className="text-lg text-doux">Le groupe a tranché</p>
              <p className="mt-1 text-4xl font-black break-all">{trouverJoueur(etat, issue.joueurId).nom}</p>
              <p className="mt-1 text-lg text-doux">
                sort du jeu
                {decompte[issue.joueurId] !== undefined && ` avec ${pluriel(decompte[issue.joueurId], 'vote')}`}.
              </p>
            </>
          )}
          {issue.type === 'egalite' && (
            <>
              <p className="text-3xl font-black text-jaune">Égalité !</p>
              <p className="mt-2 text-lg">
                {noms(issue.exAequo)} sont à égalité. On revote entre eux uniquement.
              </p>
            </>
          )}
          {issue.type === 'personne' && (
            <>
              <p className="text-3xl font-black text-jaune">Encore égalité</p>
              <p className="mt-2 text-lg">Personne ne sort ce tour-ci. On repart pour un tour d’indices.</p>
            </>
          )}
        </div>
      </div>
      <Pied>
        <Bouton grand onClick={() => envoyer({ type: 'CONTINUER' })}>
          {issue.type === 'elimine' ? 'Révéler son rôle' : issue.type === 'egalite' ? 'Revoter' : 'Tour suivant'}
        </Bouton>
      </Pied>
    </>
  )
}
