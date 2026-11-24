/**
 * Vote secret (le téléphone passe de main en main) et vote public (le groupe décide).
 */
import { useState } from 'react'
import { Equal, EyeOff, Vote as IconeVote } from 'lucide-react'
import { retour } from '../../../shared/retours'
import { Avatar, Bouton, Dialogue, Pied } from '../../../shared/ui'
import { trouverJoueur } from '../logic'
import { indexJoueur, type PropsEcran } from './commun'

function BandeauRevote({ etat }: PropsEcran) {
  if (etat.phase.nom !== 'vote' || !etat.phase.revote) return null
  const noms = etat.phase.candidats.map((id) => trouverJoueur(etat, id).nom)
  return (
    <p className="mx-4 mt-2 rounded-xl bg-rose/20 p-3 text-base font-bold">
      Revote entre {noms.join(', ').replace(/, ([^,]*)$/, ' et $1')}. Si l’égalité continue, personne ne sort.
    </p>
  )
}

// ---------------------------------------------------------------------------
// Vote secret
// ---------------------------------------------------------------------------

export function VoteSecret({ etat, envoyer }: PropsEcran) {
  if (etat.phase.nom !== 'vote') return null
  const { votants, votes } = etat.phase
  const votantId = votants.find((id) => !(id in votes))
  if (!votantId) return null
  const numero = Object.keys(votes).length + 1
  // `key` : un écran tout neuf pour chaque votant, pour ne jamais laisser voir le choix du précédent
  return <TourDeVote key={votantId} etat={etat} envoyer={envoyer} votantId={votantId} numero={numero} total={votants.length} />
}

function TourDeVote({ etat, envoyer, votantId, numero, total }: PropsEcran & { votantId: string; numero: number; total: number }) {
  const [pret, setPret] = useState(false)
  const [choix, setChoix] = useState<string | null>(null)
  if (etat.phase.nom !== 'vote') return null
  const votant = trouverJoueur(etat, votantId)
  const cibles = etat.phase.candidats.filter((id) => id !== votantId)

  if (!pret) {
    return (
      <>
        <BandeauRevote etat={etat} envoyer={envoyer} />
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center animate-pop">
          <p className="text-sm font-bold uppercase tracking-widest text-doux">
            Vote secret · {numero}/{total}
          </p>
          <EyeOff className="mt-4 text-doux" size={40} />
          <p className="mt-4 text-xl text-doux">Passe le téléphone à</p>
          <p className="mt-1 text-5xl font-black break-all">{votant.nom}</p>
        </div>
        <Pied>
          <Bouton grand onClick={() => setPret(true)}>
            C’est moi, {votant.nom}
          </Bouton>
        </Pied>
      </>
    )
  }

  return (
    <>
      <BandeauRevote etat={etat} envoyer={envoyer} />
      <div className="px-4">
        <p className="mt-3 text-xl">
          <b>{votant.nom}</b>, contre qui votes-tu ?
        </p>
        <ListeCandidats etat={etat} ids={cibles} onChoisir={setChoix} />
      </div>
      <Dialogue
        ouvert={choix !== null}
        onFermer={() => setChoix(null)}
        titre={choix ? `Voter contre ${trouverJoueur(etat, choix).nom} ?` : ''}
        actions={
          <>
            <Bouton
              variante="rose"
              grand
              onClick={() => {
                if (!choix) return
                retour('vote')
                envoyer({ type: 'VOTER', votantId, cibleId: choix })
              }}
            >
              Confirmer mon vote
            </Bouton>
            <Bouton variante="secondaire" onClick={() => setChoix(null)}>
              Changer
            </Bouton>
          </>
        }
      >
        <p className="text-doux">Ton vote reste secret. Ensuite, passe le téléphone au joueur suivant.</p>
      </Dialogue>
    </>
  )
}

// ---------------------------------------------------------------------------
// Vote public
// ---------------------------------------------------------------------------

export function VotePublic({ etat, envoyer }: PropsEcran) {
  const [choix, setChoix] = useState<string | null>(null)
  const [modeEgalite, setModeEgalite] = useState(false)
  const [exAequo, setExAequo] = useState<string[]>([])
  if (etat.phase.nom !== 'vote') return null
  const { candidats, revote } = etat.phase

  function basculer(id: string) {
    setExAequo((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]))
  }

  return (
    <>
      <BandeauRevote etat={etat} envoyer={envoyer} />
      <div className="px-4">
        <p className="mt-3 text-xl">
          {modeEgalite ? (
            <>
              Touchez les joueurs <b>à égalité</b>.
            </>
          ) : (
            <>
              Votez à voix haute, puis touchez le joueur <b>éliminé</b>.
            </>
          )}
        </p>
        <ListeCandidats
          etat={etat}
          ids={candidats}
          selection={modeEgalite ? exAequo : undefined}
          onChoisir={modeEgalite ? basculer : setChoix}
        />
      </div>
      <Pied>
        {revote ? (
          <Bouton
            variante="secondaire"
            icone={<Equal size={20} />}
            onClick={() => envoyer({ type: 'EGALITE_PUBLIQUE', exAequo: candidats })}
          >
            Encore égalité : personne ne sort
          </Bouton>
        ) : modeEgalite ? (
          <>
            <Bouton
              grand
              disabled={exAequo.length < 2}
              onClick={() => envoyer({ type: 'EGALITE_PUBLIQUE', exAequo })}
            >
              Valider l’égalité ({exAequo.length} joueurs)
            </Bouton>
            <Bouton variante="fantome" onClick={() => setModeEgalite(false)}>
              Annuler
            </Bouton>
          </>
        ) : (
          <Bouton variante="secondaire" icone={<Equal size={20} />} onClick={() => setModeEgalite(true)}>
            Il y a égalité
          </Bouton>
        )}
      </Pied>
      <Dialogue
        ouvert={choix !== null}
        onFermer={() => setChoix(null)}
        titre={choix ? `Éliminer ${trouverJoueur(etat, choix).nom} ?` : ''}
        actions={
          <>
            <Bouton
              variante="rose"
              grand
              onClick={() => {
                if (!choix) return
                retour('vote')
                envoyer({ type: 'DECISION_PUBLIQUE', cibleId: choix })
              }}
            >
              Oui, éliminer
            </Bouton>
            <Bouton variante="secondaire" onClick={() => setChoix(null)}>
              Annuler
            </Bouton>
          </>
        }
      />
    </>
  )
}

// ---------------------------------------------------------------------------

function ListeCandidats({
  etat,
  ids,
  selection,
  onChoisir,
}: Pick<PropsEcran, 'etat'> & { ids: string[]; selection?: string[]; onChoisir: (id: string) => void }) {
  return (
    <ul className="mt-4 grid grid-cols-2 gap-3 pb-4">
      {ids.map((id) => {
        const j = trouverJoueur(etat, id)
        const coche = selection?.includes(id)
        return (
          <li key={id}>
            <button
              type="button"
              onClick={() => onChoisir(id)}
              aria-pressed={selection ? coche : undefined}
              className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-transform active:scale-95 ${
                coche ? 'border-rose bg-rose/20' : 'border-trait bg-carte'
              }`}
            >
              <Avatar nom={j.nom} index={indexJoueur(etat, id)} />
              <span className="min-w-0 flex-1 truncate text-lg font-bold">{j.nom}</span>
              {coche && <IconeVote className="shrink-0 text-rose" size={20} />}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
