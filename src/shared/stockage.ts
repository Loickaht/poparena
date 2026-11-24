/**
 * Sauvegarde locale (localStorage) protégée : en navigation privée ou si le stockage est plein,
 * l'app continue de marcher, elle oublie simplement les données.
 */
import { useEffect, useState } from 'react'

const PREFIXE = 'poparena:'

export function lire<T>(cle: string, defaut: T): T {
  try {
    const brut = localStorage.getItem(PREFIXE + cle)
    return brut === null ? defaut : (JSON.parse(brut) as T)
  } catch {
    return defaut
  }
}

export function ecrire(cle: string, valeur: unknown): void {
  try {
    if (valeur === null || valeur === undefined) localStorage.removeItem(PREFIXE + cle)
    else localStorage.setItem(PREFIXE + cle, JSON.stringify(valeur))
  } catch {
    // stockage indisponible : on ignore
  }
}

/** Comme useState, mais la valeur survit au rechargement de la page. */
export function usePersistant<T>(cle: string, defaut: T) {
  const [valeur, setValeur] = useState<T>(() => lire(cle, defaut))
  useEffect(() => ecrire(cle, valeur), [cle, valeur])
  return [valeur, setValeur] as const
}
