/**
 * Le hub : page d'accueil qui liste les jeux du registre sous forme de cartes.
 */
import { Download, Play, Users, Vibrate, VibrateOff, Volume2, VolumeX, WifiOff } from 'lucide-react'
import { JEUX, type DefinitionJeu } from '../games/registry'
import { changerPreferences, usePreferences } from '../shared/preferences'
import { BoutonIcone } from '../shared/ui'
import { useInstallation } from './installation'
import { naviguer } from './routeur'

const ACCENTS: Record<DefinitionJeu['couleur'], { texte: string; fond: string; bord: string }> = {
  rose: { texte: 'text-rose', fond: 'bg-rose', bord: 'border-rose' },
  cyan: { texte: 'text-cyan', fond: 'bg-cyan', bord: 'border-cyan' },
  jaune: { texte: 'text-jaune', fond: 'bg-jaune', bord: 'border-jaune' },
  violet: { texte: 'text-violet', fond: 'bg-violet', bord: 'border-violet' },
}

export default function Hub() {
  const prefs = usePreferences()
  const installer = useInstallation()
  const disponibles = JEUX.filter((j) => j.statut === 'disponible')
  const bientot = JEUX.filter((j) => j.statut === 'bientot')

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-1">
        <div className="flex-1">
          <h1 className="bg-linear-to-r from-rose via-violet to-cyan bg-clip-text text-4xl font-black tracking-tight text-transparent">
            PopArena
          </h1>
          <p className="text-sm font-semibold text-doux">Jeux de soirée pop culture</p>
        </div>
        <BoutonIcone
          label={prefs.son ? 'Couper le son' : 'Activer le son'}
          onClick={() => changerPreferences({ son: !prefs.son })}
        >
          {prefs.son ? <Volume2 /> : <VolumeX />}
        </BoutonIcone>
        <BoutonIcone
          label={prefs.vibration ? 'Couper les vibrations' : 'Activer les vibrations'}
          onClick={() => changerPreferences({ vibration: !prefs.vibration })}
        >
          {prefs.vibration ? <Vibrate /> : <VibrateOff />}
        </BoutonIcone>
      </header>

      <div className="mt-6 flex flex-col gap-4">
        {disponibles.map((jeu) => (
          <CarteDisponible key={jeu.id} jeu={jeu} />
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-sm font-extrabold uppercase tracking-widest text-doux">Bientôt</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {bientot.map((jeu) => (
          <CarteBientot key={jeu.id} jeu={jeu} />
        ))}
      </div>

      <footer className="mt-auto pt-10 text-center text-sm text-doux">
        {installer && (
          <button
            type="button"
            onClick={installer}
            className="mb-4 inline-flex min-h-12 items-center gap-2 rounded-2xl border-2 border-trait px-4 font-bold text-texte active:bg-carte-2"
          >
            <Download size={20} /> Installer l’app sur ce téléphone
          </button>
        )}
        <p className="flex items-center justify-center gap-2">
          <WifiOff size={16} /> Le mode « un seul téléphone » marche sans connexion.
        </p>
      </footer>
    </div>
  )
}

function CarteDisponible({ jeu }: { jeu: DefinitionJeu }) {
  const a = ACCENTS[jeu.couleur]
  const Icone = jeu.icone
  return (
    <button
      type="button"
      onClick={() => naviguer(`/jeu/${jeu.id}`)}
      className={`animate-pop group relative overflow-hidden rounded-3xl border-2 ${a.bord} bg-carte p-5 text-left active:scale-[0.98] transition-transform`}
    >
      {/* halo décoratif */}
      <span className={`pointer-events-none absolute -right-10 -top-10 size-40 rounded-full ${a.fond} opacity-20 blur-2xl`} />
      <div className="flex items-start gap-4">
        <span className={`grid size-16 shrink-0 place-items-center rounded-2xl ${a.fond} text-nuit`}>
          <Icone size={36} strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <h3 className="text-2xl font-black">{jeu.titre}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-doux">
            <Users size={16} /> {jeu.joueurs}
          </p>
        </div>
      </div>
      <p className="mt-3 text-base text-texte/90">{jeu.accroche}</p>
      <span className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-jaune px-5 text-lg font-extrabold text-nuit">
        <Play size={20} fill="currentColor" /> Jouer
      </span>
    </button>
  )
}

function CarteBientot({ jeu }: { jeu: DefinitionJeu }) {
  const a = ACCENTS[jeu.couleur]
  const Icone = jeu.icone
  return (
    <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-trait bg-carte/60 p-4 opacity-80">
      <span className={`grid size-12 shrink-0 place-items-center rounded-xl bg-carte-2 ${a.texte}`}>
        <Icone size={26} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="flex flex-wrap items-center gap-2 font-extrabold">
          {jeu.titre}
          <span className="rounded-full bg-carte-2 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-doux">
            Bientôt
          </span>
        </h3>
        <p className="text-sm text-doux">{jeu.accroche}</p>
      </div>
    </div>
  )
}
