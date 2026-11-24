/**
 * Écran de fin : gagnants, tous les rôles, les deux mots, le lien entre eux, et les scores.
 */
import { useEffect } from 'react'
import { House, RotateCcw, Settings, Skull } from 'lucide-react'
import { retour } from '../../../shared/retours'
import { Avatar, Bouton, Pied } from '../../../shared/ui'
import { pointsDeLaManche, type EtatPartie } from '../logic'
import type { Session } from '../session'
import { ROLES } from './commun'
import { TableauScores } from './Reglages'

const TITRES = {
  civils: { titre: 'Victoire des civils !', couleur: 'text-cyan' },
  intrus: { titre: 'Victoire des imposteurs !', couleur: 'text-rose' },
  mrwhite: { titre: 'Mr. White a trouvé le mot !', couleur: 'text-white' },
} as const

interface Props {
  etat: EtatPartie
  session: Session
  onRejouer: () => void
  onReglages: () => void
  onAccueil: () => void
}

export default function Fin({ etat, session, onRejouer, onReglages, onAccueil }: Props) {
  const gagnant = etat.phase.nom === 'fin' ? etat.phase.gagnant : null
  useEffect(() => retour('victoire'), [])
  if (!gagnant) return null

  const titre = TITRES[gagnant]
  const gains = pointsDeLaManche(etat)
  const avecMrWhite = etat.joueurs.some((j) => j.role === 'mrwhite')
  // Ordre d'affichage : intrus d'abord, puis civils
  const ordreRoles = { mrwhite: 0, imposteur: 1, civil: 2 }
  const joueurs = [...etat.joueurs].sort((a, b) => ordreRoles[a.role] - ordreRoles[b.role])

  return (
    <>
      <div className="px-4">
        <div className="animate-pop relative mt-4 overflow-hidden rounded-3xl bg-carte p-6 text-center">
          <Confettis />
          <p className={`relative text-3xl font-black ${titre.couleur}`}>
            {gagnant === 'intrus' && avecMrWhite ? 'Victoire des intrus !' : titre.titre}
          </p>
          {gagnant === 'mrwhite' && etat.propositionGagnante && (
            <p className="relative mt-1 text-doux">Réponse : « {etat.propositionGagnante} »</p>
          )}
        </div>

        {/* Les deux mots et leur lien */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border-2 border-cyan bg-carte p-3 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan">Mot des civils</p>
            <p className="mt-1 text-2xl font-black break-words">{etat.motCivils}</p>
          </div>
          <div className="rounded-2xl border-2 border-rose bg-carte p-3 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-rose">Mot des imposteurs</p>
            <p className="mt-1 text-2xl font-black break-words">{etat.motImposteurs}</p>
          </div>
        </div>
        <div className="mt-3 space-y-2 rounded-2xl bg-carte p-4 text-base">
          <p>
            <b className="text-jaune">Le lien :</b> {etat.paire.lien}
          </p>
          <p>
            <b className="text-jaune">Le piège :</b> {etat.paire.piege}
          </p>
        </div>

        {/* Tous les rôles */}
        <h2 className="mb-2 mt-6 text-sm font-extrabold uppercase tracking-widest text-doux">Les rôles</h2>
        <ul className="overflow-hidden rounded-2xl bg-carte">
          {joueurs.map((j) => {
            const r = ROLES[j.role]
            const tour = etat.elimines.indexOf(j.id)
            return (
              <li key={j.id} className="flex items-center gap-3 border-b border-trait/50 px-3 py-2 last:border-0">
                <Avatar nom={j.nom} index={etat.joueurs.indexOf(j)} petit />
                <span className={`flex-1 font-bold ${j.enJeu ? '' : 'text-doux line-through decoration-2'}`}>{j.nom}</span>
                {!j.enJeu && tour >= 0 && <Skull size={16} className="text-doux" aria-label="éliminé" />}
                <span className={`rounded-full px-2 py-0.5 text-xs font-black text-nuit ${r.fond}`}>{r.nom}</span>
                <span className={`w-8 text-right text-sm font-bold ${gains[j.nom] > 0 ? 'text-vert' : 'text-doux'}`}>
                  +{gains[j.nom]}
                </span>
              </li>
            )
          })}
        </ul>

        <h2 className="mb-2 mt-6 text-sm font-extrabold uppercase tracking-widest text-doux">
          Scores ({session.manches} {session.manches > 1 ? 'manches' : 'manche'})
        </h2>
        <TableauScores scores={session.scores} gains={gains} />
        <div className="h-4" />
      </div>
      <Pied>
        <Bouton grand onClick={onRejouer} icone={<RotateCcw />}>
          Rejouer
        </Bouton>
        <div className="grid grid-cols-2 gap-3">
          <Bouton variante="secondaire" onClick={onReglages} icone={<Settings size={20} />}>
            Réglages
          </Bouton>
          <Bouton variante="secondaire" onClick={onAccueil} icone={<House size={20} />}>
            Accueil
          </Bouton>
        </div>
      </Pied>
    </>
  )
}

/** Confettis en pur CSS (pas d'image, pas de librairie). */
function Confettis() {
  const couleurs = ['bg-rose', 'bg-cyan', 'bg-jaune', 'bg-vert', 'bg-violet']
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {Array.from({ length: 18 }, (_, i) => (
        <span
          key={i}
          className={`absolute block h-3 w-1.5 rounded-sm ${couleurs[i % couleurs.length]}`}
          style={{
            left: `${(i * 53) % 100}%`,
            top: '-10%',
            animation: `tombe ${1.4 + (i % 5) * 0.25}s ease-in ${(i % 6) * 0.12}s both`,
            transform: `rotate(${i * 37}deg)`,
          }}
        />
      ))}
    </div>
  )
}
