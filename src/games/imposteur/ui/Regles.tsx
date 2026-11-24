import { Dialogue } from '../../../shared/ui'

/** Rappel des règles, accessible depuis les réglages et pendant la partie. */
export default function Regles({ ouvert, onFermer }: { ouvert: boolean; onFermer: () => void }) {
  return (
    <Dialogue ouvert={ouvert} onFermer={onFermer} titre="Règles de l’Imposteur">
      <div className="space-y-4 text-base leading-relaxed">
        <div>
          <h3 className="font-extrabold text-cyan">Les rôles</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>
              <b>Civils</b> : ils ont tous le même mot.
            </li>
            <li>
              <b>Imposteurs</b> : ils ont un mot proche mais différent… et ne savent pas qu’ils sont imposteurs !
            </li>
            <li>
              <b>Mr. White</b> (option) : il n’a aucun mot et doit bluffer.
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-extrabold text-cyan">Un tour de jeu</h3>
          <ol className="mt-1 list-decimal space-y-1 pl-5">
            <li>Chacun regarde son mot en secret.</li>
            <li>À tour de rôle, chacun donne un indice d’un seul mot (Mr. White ne commence jamais).</li>
            <li>Discussion libre, minuteur en main.</li>
            <li>Vote : le joueur le plus désigné sort du jeu et son rôle est révélé.</li>
            <li>Égalité ? On revote entre les ex æquo. Encore égalité ? Personne ne sort.</li>
          </ol>
        </div>
        <div>
          <h3 className="font-extrabold text-cyan">Qui gagne ?</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Les civils, s’ils éliminent tous les imposteurs et Mr. White.</li>
            <li>Les imposteurs et Mr. White, s’il ne reste plus qu’un seul civil.</li>
            <li>Mr. White, seul, s’il est éliminé mais devine le mot des civils.</li>
          </ul>
        </div>
      </div>
    </Dialogue>
  )
}
