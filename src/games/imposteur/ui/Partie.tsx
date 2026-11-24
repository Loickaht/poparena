/**
 * Écran de partie : affiche l'écran qui correspond à la phase en cours de la machine à états.
 */
import { useState } from 'react'
import { BookOpen, LogOut, X } from 'lucide-react'
import { Bouton, BoutonIcone, Dialogue, Entete } from '../../../shared/ui'
import type { Session } from '../session'
import type { PropsEcran } from './commun'
import Discussion from './Discussion'
import Distribution from './Distribution'
import Fin from './Fin'
import Indices from './Indices'
import Regles from './Regles'
import ResultatVote from './ResultatVote'
import { DevinetteMrWhite, MrWhiteRate, Revelation } from './Revelation'
import { VotePublic, VoteSecret } from './Vote'

interface Props extends PropsEcran {
  session: Session
  message: string | null
  onFermerMessage: () => void
  onRejouer: () => void
  onReglages: () => void
  onAccueil: () => void
}

const TITRES: Record<string, string> = {
  distribution: 'Distribution des mots',
  indices: 'Indices',
  discussion: 'Discussion',
  vote: 'Vote',
  'resultat-vote': 'Résultat du vote',
  revelation: 'Révélation',
  mrwhite: 'Dernière chance',
  'mrwhite-rate': 'Dernière chance',
  fin: 'Fin de la manche',
}

export default function Partie({ etat, envoyer, session, message, onFermerMessage, onRejouer, onReglages, onAccueil }: Props) {
  const [quitter, setQuitter] = useState(false)
  const [regles, setRegles] = useState(false)
  const phase = etat.phase
  const enCours = phase.nom !== 'fin'

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <Entete
        surTitre={phase.nom === 'distribution' || phase.nom === 'fin' ? 'L’Imposteur' : `Tour ${etat.tour}`}
        titre={TITRES[phase.nom]}
        droite={
          <>
            <BoutonIcone label="Règles du jeu" onClick={() => setRegles(true)}>
              <BookOpen />
            </BoutonIcone>
            {enCours && (
              <BoutonIcone label="Quitter la partie" onClick={() => setQuitter(true)}>
                <LogOut />
              </BoutonIcone>
            )}
          </>
        }
      />

      {message && (
        <div className="mx-4 mt-2 flex items-start gap-2 rounded-xl bg-violet/25 p-3 text-sm font-semibold">
          <p className="flex-1">{message}</p>
          <button type="button" aria-label="Fermer le message" onClick={onFermerMessage} className="text-doux">
            <X size={18} />
          </button>
        </div>
      )}

      {/* `key` force un écran neuf à chaque changement de phase (et remet à zéro son état local). */}
      <div key={`${etat.tour}-${phase.nom}-${phase.nom === 'vote' && phase.revote}`} className="flex flex-1 flex-col">
        {phase.nom === 'distribution' && <Distribution etat={etat} envoyer={envoyer} />}
        {phase.nom === 'indices' && <Indices etat={etat} envoyer={envoyer} />}
        {phase.nom === 'discussion' && <Discussion etat={etat} envoyer={envoyer} />}
        {phase.nom === 'vote' &&
          (etat.reglages.typeVote === 'secret' ? (
            <VoteSecret etat={etat} envoyer={envoyer} />
          ) : (
            <VotePublic etat={etat} envoyer={envoyer} />
          ))}
        {phase.nom === 'resultat-vote' && <ResultatVote etat={etat} envoyer={envoyer} />}
        {phase.nom === 'revelation' && <Revelation etat={etat} envoyer={envoyer} />}
        {phase.nom === 'mrwhite' && <DevinetteMrWhite etat={etat} envoyer={envoyer} />}
        {phase.nom === 'mrwhite-rate' && <MrWhiteRate etat={etat} envoyer={envoyer} />}
        {phase.nom === 'fin' && (
          <Fin etat={etat} session={session} onRejouer={onRejouer} onReglages={onReglages} onAccueil={onAccueil} />
        )}
      </div>

      <Regles ouvert={regles} onFermer={() => setRegles(false)} />
      <Dialogue
        ouvert={quitter}
        onFermer={() => setQuitter(false)}
        titre="Quitter la partie ?"
        actions={
          <>
            <Bouton variante="danger" onClick={onReglages}>
              Abandonner la partie
            </Bouton>
            <Bouton variante="secondaire" onClick={() => setQuitter(false)}>
              Continuer à jouer
            </Bouton>
          </>
        }
      >
        <p className="text-doux">La manche en cours sera perdue et ne comptera pas dans les scores.</p>
      </Dialogue>
    </div>
  )
}
