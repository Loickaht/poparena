/**
 * Tour de parole : l'app indique qui parle, dans un ordre tiré au hasard
 * (Mr. White ne commence jamais). Chacun donne un indice d'UN seul mot, à voix haute.
 */
import { Check, MessageCircle } from 'lucide-react'
import { retour } from '../../../shared/retours'
import { Avatar, Bouton, Pied } from '../../../shared/ui'
import { trouverJoueur } from '../logic'
import { indexJoueur, type PropsEcran } from './commun'

export default function Indices({ etat, envoyer }: PropsEcran) {
  if (etat.phase.nom !== 'indices') return null
  const courant = etat.phase.courant
  const ordre = etat.ordreParole
  const orateur = trouverJoueur(etat, ordre[courant])
  const dernier = courant === ordre.length - 1

  return (
    <>
      <div className="px-4">
        <p className="mt-2 rounded-xl bg-carte p-3 text-base">
          <MessageCircle className="mr-1 inline text-cyan" size={20} />
          Chacun donne <b>un seul mot</b> qui évoque son mot. Interdit de dire le mot lui-même !
        </p>

        <div key={orateur.id} className="animate-pop mt-6 flex flex-col items-center text-center">
          <Avatar nom={orateur.nom} index={indexJoueur(etat, orateur.id)} />
          <p className="mt-3 text-lg text-doux">À toi de parler</p>
          <p className="text-5xl font-black break-all">{orateur.nom}</p>
          <p className="mt-1 text-sm font-semibold text-doux">
            {courant + 1} / {ordre.length}
          </p>
        </div>

        <ol className="mt-6 flex flex-wrap justify-center gap-2 pb-4">
          {ordre.map((id, i) => {
            const j = trouverJoueur(etat, id)
            const etatOrdre = i < courant ? 'fait' : i === courant ? 'actuel' : 'attente'
            return (
              <li
                key={id}
                className={`flex items-center gap-1 rounded-full py-1 pl-1 pr-3 text-sm font-bold ${
                  etatOrdre === 'actuel' ? 'bg-jaune text-nuit' : etatOrdre === 'fait' ? 'bg-carte text-doux' : 'bg-carte-2'
                }`}
              >
                <Avatar nom={j.nom} index={indexJoueur(etat, id)} petit />
                {j.nom}
                {etatOrdre === 'fait' && <Check size={14} />}
              </li>
            )
          })}
        </ol>
      </div>
      <Pied>
        <Bouton
          grand
          onClick={() => {
            retour('tap')
            envoyer({ type: 'INDICE_SUIVANT' })
          }}
        >
          {dernier ? 'Dernier indice donné : discussion !' : `${orateur.nom} a donné son indice`}
        </Bouton>
      </Pied>
    </>
  )
}
