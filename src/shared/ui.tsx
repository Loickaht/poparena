/**
 * Petits composants d'interface réutilisés par tous les jeux.
 * Règle de design : grosses zones tactiles (au moins 48 px de haut), contraste fort.
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useEffect } from 'react'
import { ArrowLeft, X } from 'lucide-react'

// ---------------------------------------------------------------------------
// Bouton
// ---------------------------------------------------------------------------

type Variante = 'principal' | 'rose' | 'secondaire' | 'fantome' | 'danger'

const STYLES: Record<Variante, string> = {
  principal: 'bg-jaune text-nuit shadow-[0_6px_0_#b8901a] active:shadow-[0_2px_0_#b8901a] active:translate-y-1',
  rose: 'bg-rose text-white shadow-[0_6px_0_#a8184c] active:shadow-[0_2px_0_#a8184c] active:translate-y-1',
  secondaire: 'bg-carte-2 text-texte border-2 border-trait active:bg-trait',
  fantome: 'bg-transparent text-doux active:bg-carte-2',
  danger: 'bg-rouge text-white active:brightness-90',
}

interface PropsBouton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  grand?: boolean
  icone?: ReactNode
}

export function Bouton({ variante = 'principal', grand, icone, className = '', children, ...props }: PropsBouton) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-extrabold transition-all duration-100
        disabled:pointer-events-none disabled:opacity-40 select-none
        ${grand ? 'min-h-16 px-6 text-xl' : 'min-h-12 px-4 text-base'} ${STYLES[variante]} ${className}`}
      {...props}
    >
      {icone}
      {children}
    </button>
  )
}

/** Bouton rond avec seulement une icône (retour, fermer…). */
export function BoutonIcone({ label, className = '', children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`grid size-12 place-items-center rounded-full text-doux active:bg-carte-2 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Mise en page
// ---------------------------------------------------------------------------

/** Un écran complet : en-tête, contenu qui défile, et actions collées en bas. */
export function Ecran({ entete, pied, children, className = '' }: { entete?: ReactNode; pied?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      {entete}
      <main className={`flex flex-1 flex-col px-4 pb-6 ${className}`}>{children}</main>
      {pied && (
        <footer className="sticky bottom-0 z-10 bg-linear-to-t from-nuit via-nuit/95 to-nuit/0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6">
          {pied}
        </footer>
      )}
    </div>
  )
}

/** Zone d'actions collée en bas d'un écran de jeu. */
export function Pied({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 mt-auto flex flex-col gap-3 bg-linear-to-t from-nuit via-nuit/95 to-nuit/0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6">
      {children}
    </div>
  )
}

export function Entete({ titre, surTitre, onRetour, droite }: { titre: ReactNode; surTitre?: ReactNode; onRetour?: () => void; droite?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-1 bg-nuit/90 px-2 pt-[env(safe-area-inset-top)] backdrop-blur">
      {onRetour ? (
        <BoutonIcone label="Retour" onClick={onRetour}>
          <ArrowLeft size={24} />
        </BoutonIcone>
      ) : (
        <div className="w-3" />
      )}
      <div className="min-w-0 flex-1 py-2">
        {surTitre && <div className="text-xs font-bold uppercase tracking-widest text-doux">{surTitre}</div>}
        <h1 className="truncate text-xl font-black">{titre}</h1>
      </div>
      {droite}
    </header>
  )
}

export function Section({ titre, aide, children }: { titre: string; aide?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-extrabold uppercase tracking-widest text-doux">{titre}</h2>
      {children}
      {aide && <p className="mt-2 text-sm text-doux">{aide}</p>}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Contrôles de formulaire
// ---------------------------------------------------------------------------

/** Choix entre quelques options (thème, difficulté, type de vote…). */
export function Segment<T extends string | number>({
  options,
  valeur,
  onChange,
  label,
}: {
  options: { valeur: T; libelle: ReactNode }[]
  valeur: T
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const actif = o.valeur === valeur
        return (
          <button
            key={String(o.valeur)}
            type="button"
            role="radio"
            aria-checked={actif}
            onClick={() => onChange(o.valeur)}
            className={`min-h-12 flex-1 whitespace-nowrap rounded-xl border-2 px-3 text-base font-bold transition-colors ${
              actif ? 'border-cyan bg-cyan text-nuit' : 'border-trait bg-carte text-texte active:bg-carte-2'
            }`}
          >
            {o.libelle}
          </button>
        )
      })}
    </div>
  )
}

export function Interrupteur({
  actif,
  onChange,
  libelle,
  aide,
  desactive,
  icone,
}: {
  actif: boolean
  onChange: (v: boolean) => void
  libelle: ReactNode
  aide?: ReactNode
  desactive?: boolean
  icone?: ReactNode
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      disabled={desactive}
      onClick={() => onChange(!actif)}
      className="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-carte px-4 py-3 text-left disabled:opacity-50"
    >
      {icone && <span className="text-doux">{icone}</span>}
      <span className="flex-1">
        <span className="block text-base font-bold">{libelle}</span>
        {aide && <span className="block text-sm text-doux">{aide}</span>}
      </span>
      <span className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${actif ? 'bg-vert' : 'bg-trait'}`}>
        <span className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${actif ? 'left-7' : 'left-1'}`} />
      </span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Fenêtre de dialogue (remplace les confirm() du navigateur, moches et bloquants)
// ---------------------------------------------------------------------------

export function Dialogue({
  ouvert,
  titre,
  onFermer,
  children,
  actions,
}: {
  ouvert: boolean
  titre: ReactNode
  onFermer: () => void
  children?: ReactNode
  actions?: ReactNode
}) {
  useEffect(() => {
    if (!ouvert) return
    const echap = (e: KeyboardEvent) => e.key === 'Escape' && onFermer()
    window.addEventListener('keydown', echap)
    return () => window.removeEventListener('keydown', echap)
  }, [ouvert, onFermer])

  if (!ouvert) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={onFermer}>
      <div
        role="dialog"
        aria-modal="true"
        className="animate-monte max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-carte p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start gap-2">
          <h2 className="flex-1 text-xl font-black">{titre}</h2>
          <BoutonIcone label="Fermer" onClick={onFermer} className="-mr-2 -mt-2">
            <X size={22} />
          </BoutonIcone>
        </div>
        {children}
        {actions && <div className="mt-5 flex flex-col gap-3">{actions}</div>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Avatar : une pastille colorée avec l'initiale du joueur
// ---------------------------------------------------------------------------

const COULEURS_AVATAR = ['bg-rose', 'bg-cyan', 'bg-jaune', 'bg-vert', 'bg-violet', 'bg-rouge']

export function Avatar({ nom, index, petit }: { nom: string; index: number; petit?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full font-black text-nuit ${COULEURS_AVATAR[index % COULEURS_AVATAR.length]} ${
        petit ? 'size-8 text-sm' : 'size-11 text-lg'
      }`}
    >
      {nom.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}
