/**
 * Écran de préparation : joueurs, rôles, thème, minuteur, type de vote.
 */
import { useState, type FormEvent } from 'react'
import {
  BookOpen,
  Minus,
  Plus,
  RotateCcw,
  Trophy,
  UserPlus,
  Vibrate,
  Volume2,
  X,
} from 'lucide-react'
import { changerPreferences, usePreferences } from '../../../shared/preferences'
import { Avatar, Bouton, BoutonIcone, Dialogue, Ecran, Entete, Interrupteur, Section, Segment } from '../../../shared/ui'
import { DUREES_DISCUSSION, LIMITES, imposteursConseilles, maxImposteurs, mrWhitePossible } from '../config'
import { normaliser, pairesDisponibles, verifierReglages, type Reglages } from '../logic'
import { BIBLIOTHEQUE } from '../mots'
import type { Session } from '../session'
import { formaterDuree, pluriel } from './commun'
import Regles from './Regles'

interface Props {
  session: Session
  onChangerSession: (s: Session) => void
  onLancer: (r: Reglages) => void
  onRetour: () => void
}

/** Garde des réglages cohérents quand le nombre de joueurs change. */
function ajuster(r: Reglages, auto: boolean): Reglages {
  const n = r.joueurs.length
  const mrWhite = r.mrWhite && mrWhitePossible(n)
  const max = Math.max(1, maxImposteurs(Math.max(n, LIMITES.joueursMin), mrWhite))
  const imposteurs = auto
    ? imposteursConseilles(Math.max(n, LIMITES.joueursMin), mrWhite)
    : Math.min(Math.max(1, r.imposteurs), max)
  return { ...r, mrWhite, imposteurs }
}

export default function EcranReglages({ session, onChangerSession, onLancer, onRetour }: Props) {
  const { reglages: r, repartitionAuto } = session
  const prefs = usePreferences()
  const [nouveauNom, setNouveauNom] = useState('')
  const [erreurNom, setErreurNom] = useState<string | null>(null)
  const [reglesOuvertes, setReglesOuvertes] = useState(false)
  const [confirmerRaz, setConfirmerRaz] = useState(false)

  const n = r.joueurs.length
  const conseille = imposteursConseilles(Math.max(n, LIMITES.joueursMin), r.mrWhite)
  const max = maxImposteurs(Math.max(n, LIMITES.joueursMin), r.mrWhite)
  const civils = Math.max(0, n - r.imposteurs - (r.mrWhite ? 1 : 0))
  const erreurs = verifierReglages(r)
  const lot = pairesDisponibles(BIBLIOTHEQUE, r.theme, r.difficulte)
  const restantes = lot.filter((p) => !session.dejaJouees.includes(p.id)).length

  function maj(partiel: Partial<Reglages>, auto = repartitionAuto) {
    onChangerSession({ ...session, repartitionAuto: auto, reglages: ajuster({ ...r, ...partiel }, auto) })
  }

  function ajouterJoueur(e: FormEvent) {
    e.preventDefault()
    const nom = nouveauNom.trim().replace(/\s+/g, ' ')
    if (!nom) return
    if (n >= LIMITES.joueursMax) return setErreurNom(`${LIMITES.joueursMax} joueurs maximum.`)
    if (r.joueurs.some((j) => normaliser(j) === normaliser(nom))) return setErreurNom(`« ${nom} » joue déjà.`)
    maj({ joueurs: [...r.joueurs, nom.slice(0, LIMITES.longueurNomMax)] })
    setNouveauNom('')
    setErreurNom(null)
  }

  return (
    <Ecran
      entete={
        <Entete
          titre="L’Imposteur"
          surTitre="Préparer la partie"
          onRetour={onRetour}
          droite={
            <BoutonIcone label="Règles du jeu" onClick={() => setReglesOuvertes(true)}>
              <BookOpen />
            </BoutonIcone>
          }
        />
      }
      pied={
        <>
          {n >= LIMITES.joueursMin && erreurs.length > 0 && (
            <ul className="mb-3 space-y-1 rounded-xl bg-rouge/15 p-3 text-sm font-semibold text-rouge">
              {erreurs.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
          <Bouton grand className="w-full" disabled={erreurs.length > 0} onClick={() => onLancer(r)}>
            {n < LIMITES.joueursMin
              ? `Ajoute encore ${pluriel(LIMITES.joueursMin - n, 'joueur')}`
              : 'Lancer la partie'}
          </Bouton>
        </>
      }
    >
      {/* ------------------------------------------------------------ Joueurs */}
      <Section titre={`Joueurs (${n}/${LIMITES.joueursMax})`}>
        <form onSubmit={ajouterJoueur} className="flex gap-2">
          <input
            value={nouveauNom}
            onChange={(e) => {
              setNouveauNom(e.target.value)
              setErreurNom(null)
            }}
            maxLength={LIMITES.longueurNomMax}
            placeholder="Prénom du joueur"
            aria-label="Prénom du joueur"
            autoComplete="off"
            enterKeyHint="done"
            className="min-h-14 min-w-0 flex-1 rounded-2xl border-2 border-trait bg-carte px-4 text-lg font-semibold text-texte placeholder:text-doux/60 focus:border-cyan focus:outline-none"
          />
          <Bouton type="submit" variante="rose" className="min-h-14 w-14 shrink-0 px-0" aria-label="Ajouter le joueur">
            <UserPlus size={24} />
          </Bouton>
        </form>
        {erreurNom && <p className="mt-2 text-sm font-semibold text-rouge">{erreurNom}</p>}

        {n > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {r.joueurs.map((nom, i) => (
              <li key={nom} className="animate-pop flex items-center gap-2 rounded-full bg-carte py-1 pl-1 pr-1">
                <Avatar nom={nom} index={i} petit />
                <span className="font-bold">{nom}</span>
                <button
                  type="button"
                  aria-label={`Retirer ${nom}`}
                  onClick={() => maj({ joueurs: r.joueurs.filter((_, k) => k !== i) })}
                  className="grid size-9 place-items-center rounded-full text-doux active:bg-carte-2"
                >
                  <X size={18} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-doux">
            Ajoute les prénoms de {LIMITES.joueursMin} à {LIMITES.joueursMax} joueurs. Ils sont gardés pour la prochaine
            partie.
          </p>
        )}
      </Section>

      {/* ------------------------------------------------------------ Rôles */}
      <Section titre="Rôles">
        <div className="flex items-center gap-3 rounded-2xl bg-carte p-3">
          <div className="flex-1 pl-1">
            <div className="text-base font-bold">Imposteurs</div>
            <button
              type="button"
              onClick={() => maj({}, true)}
              className={`mt-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                repartitionAuto ? 'bg-vert text-nuit' : 'bg-carte-2 text-doux underline'
              }`}
            >
              {repartitionAuto ? `Conseillé : ${conseille}` : `Revenir au conseillé (${conseille})`}
            </button>
          </div>
          <BoutonIcone
            label="Un imposteur de moins"
            className="bg-carte-2"
            disabled={r.imposteurs <= 1}
            onClick={() => maj({ imposteurs: r.imposteurs - 1 }, false)}
          >
            <Minus />
          </BoutonIcone>
          <span className="w-8 text-center text-3xl font-black tabular-nums">{r.imposteurs}</span>
          <BoutonIcone
            label="Un imposteur de plus"
            className="bg-carte-2"
            disabled={r.imposteurs >= max}
            onClick={() => maj({ imposteurs: r.imposteurs + 1 }, false)}
          >
            <Plus />
          </BoutonIcone>
        </div>
        <div className="mt-2">
          <Interrupteur
            actif={r.mrWhite}
            onChange={(v) => maj({ mrWhite: v })}
            desactive={!mrWhitePossible(n)}
            libelle="Mr. White"
            aide={
              mrWhitePossible(n)
                ? 'Un joueur sans mot, qui doit bluffer.'
                : `Disponible à partir de ${LIMITES.joueursMinMrWhite} joueurs.`
            }
          />
        </div>
        {n >= LIMITES.joueursMin && (
          <p className="mt-2 text-center text-sm font-semibold text-doux">
            <span className="text-cyan">{pluriel(civils, 'civil')}</span> ·{' '}
            <span className="text-rose">{pluriel(r.imposteurs, 'imposteur')}</span>
            {r.mrWhite && <span className="text-white"> · Mr. White</span>}
          </p>
        )}
      </Section>

      {/* ------------------------------------------------------------ Mots */}
      <Section
        titre="Thème des mots"
        aide={`${pluriel(lot.length, 'paire')} dans ce paquet, ${pluriel(restantes, 'pas encore jouée', 'pas encore jouées')}.`}
      >
        <Segment
          label="Thème"
          valeur={r.theme}
          onChange={(theme) => maj({ theme })}
          options={[
            { valeur: 'anime', libelle: 'Anime' },
            { valeur: 'vie-reelle', libelle: 'Vie réelle' },
          ]}
        />
        {r.theme === 'anime' && (
          <div className="mt-2">
            <Segment
              label="Difficulté"
              valeur={r.difficulte}
              onChange={(difficulte) => maj({ difficulte })}
              options={[
                { valeur: 'facile', libelle: 'Facile' },
                { valeur: 'moyen', libelle: 'Moyen' },
                { valeur: 'difficile', libelle: 'Difficile' },
              ]}
            />
          </div>
        )}
      </Section>

      {/* ------------------------------------------------------------ Déroulement */}
      <Section titre="Minuteur de discussion">
        <Segment
          label="Durée de la discussion"
          valeur={r.dureeDiscussion}
          onChange={(dureeDiscussion) => maj({ dureeDiscussion })}
          options={DUREES_DISCUSSION.map((d) => ({ valeur: d, libelle: formaterDuree(d) }))}
        />
      </Section>

      <Section
        titre="Vote"
        aide={
          r.typeVote === 'secret'
            ? 'Le téléphone passe de main en main : chacun vote en cachette.'
            : 'Le groupe vote à voix haute et désigne directement le joueur éliminé.'
        }
      >
        <Segment
          label="Type de vote"
          valeur={r.typeVote}
          onChange={(typeVote) => maj({ typeVote })}
          options={[
            { valeur: 'secret', libelle: 'Secret' },
            { valeur: 'public', libelle: 'Public' },
          ]}
        />
      </Section>

      <Section titre="Sons et vibrations">
        <div className="flex flex-col gap-2">
          <Interrupteur
            icone={<Volume2 />}
            actif={prefs.son}
            onChange={(son) => changerPreferences({ son })}
            libelle="Sons"
          />
          <Interrupteur
            icone={<Vibrate />}
            actif={prefs.vibration}
            onChange={(vibration) => changerPreferences({ vibration })}
            libelle="Vibrations"
            aide="Selon les téléphones (pas sur iPhone)."
          />
        </div>
      </Section>

      {/* ------------------------------------------------------------ Scores */}
      {session.manches > 0 && (
        <Section titre={`Scores de la session (${pluriel(session.manches, 'manche')})`}>
          <TableauScores scores={session.scores} />
          <Bouton variante="fantome" className="mt-2 w-full" icone={<RotateCcw size={18} />} onClick={() => setConfirmerRaz(true)}>
            Nouvelle session (scores à zéro)
          </Bouton>
        </Section>
      )}

      <Regles ouvert={reglesOuvertes} onFermer={() => setReglesOuvertes(false)} />
      <Dialogue
        ouvert={confirmerRaz}
        onFermer={() => setConfirmerRaz(false)}
        titre="Nouvelle session ?"
        actions={
          <>
            <Bouton
              variante="danger"
              onClick={() => {
                onChangerSession({ ...session, scores: {}, manches: 0, dejaJouees: [] })
                setConfirmerRaz(false)
              }}
            >
              Remettre les scores à zéro
            </Bouton>
            <Bouton variante="secondaire" onClick={() => setConfirmerRaz(false)}>
              Annuler
            </Bouton>
          </>
        }
      >
        <p className="text-doux">Les scores sont effacés et toutes les paires de mots redeviennent disponibles.</p>
      </Dialogue>
    </Ecran>
  )
}

export function TableauScores({ scores, gains }: { scores: Record<string, number>; gains?: Record<string, number> }) {
  const lignes = Object.entries(scores).sort((a, b) => b[1] - a[1])
  const meilleur = lignes[0]?.[1] ?? 0
  return (
    <ol className="overflow-hidden rounded-2xl bg-carte">
      {lignes.map(([nom, points], i) => (
        <li key={nom} className="flex items-center gap-3 border-b border-trait/50 px-4 py-3 last:border-0">
          <span className="w-6 text-center font-black text-doux">{i + 1}</span>
          <span className="flex-1 font-bold">
            {nom} {points === meilleur && meilleur > 0 && <Trophy size={16} className="inline text-jaune" />}
          </span>
          {gains && gains[nom] > 0 && <span className="text-sm font-bold text-vert">+{gains[nom]}</span>}
          <span className="w-10 text-right text-lg font-black tabular-nums">{points}</span>
        </li>
      ))}
    </ol>
  )
}
