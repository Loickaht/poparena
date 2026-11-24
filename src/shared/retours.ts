/**
 * Retours sonores et vibrations.
 * Les sons sont synthétisés par le navigateur (Web Audio) : aucun fichier à télécharger,
 * donc 0 Ko de plus et ça marche hors ligne.
 */
import { preferences } from './preferences'

export type Retour = 'tap' | 'revele' | 'vote' | 'alarme' | 'victoire' | 'defaite' | 'erreur'

// [fréquence en Hz, début en s, durée en s]
const SONS: Record<Retour, [number, number, number][]> = {
  tap: [[660, 0, 0.05]],
  vote: [[520, 0, 0.07], [780, 0.07, 0.09]],
  revele: [[330, 0, 0.12], [494, 0.1, 0.12], [740, 0.2, 0.25]],
  alarme: [[880, 0, 0.18], [880, 0.28, 0.18], [1175, 0.56, 0.4]],
  victoire: [[523, 0, 0.14], [659, 0.12, 0.14], [784, 0.24, 0.14], [1047, 0.36, 0.4]],
  defaite: [[392, 0, 0.2], [330, 0.18, 0.2], [262, 0.36, 0.45]],
  erreur: [[200, 0, 0.18]],
}

const VIBRATIONS: Record<Retour, number[]> = {
  tap: [10],
  vote: [25],
  revele: [40, 60, 80],
  alarme: [300, 150, 300, 150, 600],
  victoire: [60, 60, 60, 60, 200],
  defaite: [200, 100, 200],
  erreur: [80, 50, 80],
}

let audio: AudioContext | null = null

function contexteAudio(): AudioContext | null {
  try {
    if (!audio) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return null
      audio = new AC()
    }
    // Les navigateurs bloquent le son tant que l'utilisateur n'a pas touché l'écran.
    if (audio.state === 'suspended') void audio.resume()
    return audio
  } catch {
    return null
  }
}

function jouer(type: Retour): void {
  const ctx = contexteAudio()
  if (!ctx) return
  const t0 = ctx.currentTime + 0.01
  for (const [freq, debut, duree] of SONS[type]) {
    const osc = ctx.createOscillator()
    const volume = ctx.createGain()
    osc.type = type === 'erreur' ? 'square' : 'triangle'
    osc.frequency.value = freq
    // petite enveloppe pour éviter les « clics »
    volume.gain.setValueAtTime(0.0001, t0 + debut)
    volume.gain.exponentialRampToValueAtTime(0.25, t0 + debut + 0.015)
    volume.gain.exponentialRampToValueAtTime(0.0001, t0 + debut + duree)
    osc.connect(volume).connect(ctx.destination)
    osc.start(t0 + debut)
    osc.stop(t0 + debut + duree + 0.02)
  }
}

/** Joue le son et/ou la vibration correspondant à l'événement, selon les préférences. */
export function retour(type: Retour): void {
  const prefs = preferences()
  if (prefs.son) jouer(type)
  if (prefs.vibration && 'vibrate' in navigator) {
    try {
      navigator.vibrate(VIBRATIONS[type])
    } catch {
      // certains navigateurs refusent : sans importance
    }
  }
}
