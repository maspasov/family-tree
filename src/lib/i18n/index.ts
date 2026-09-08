import { useSyncExternalStore } from 'react'
import type { RelationType } from '../../model/person'
import * as bgLocale from './bg'
import * as enLocale from './en'
import * as deLocale from './de'

export type Locale = 'bg' | 'en' | 'de'

const ALL_MESSAGES = { bg: bgLocale.messages, en: enLocale.messages, de: deLocale.messages }
const ALL_MOTTOS = { bg: bgLocale.motto, en: enLocale.motto, de: deLocale.motto }
const ALL_RELATION_LABELS = {
  bg: bgLocale.relationLabels,
  en: enLocale.relationLabels,
  de: deLocale.relationLabels,
}

/** Each language's own name for itself — shown in the picker regardless of the active locale. */
export const LOCALE_NAMES: Record<Locale, string> = {
  bg: 'Български',
  en: 'English',
  de: 'Deutsch',
}

const STORAGE_KEY = 'ft-locale'

function detectInitialLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'bg' || stored === 'en' || stored === 'de') return stored
  const browser = navigator.language.slice(0, 2)
  if (browser === 'de') return 'de'
  if (browser === 'en') return 'en'
  return 'bg'
}

let activeLocale: Locale = detectInitialLocale()
document.documentElement.lang = activeLocale

/**
 * Live bindings, not a snapshot: reassigned by `setLocale` below, and every
 * importer (`import { messages } from '.../i18n'`) sees the new value on
 * next access — standard ES module semantics. `t()`/`useLocale()` (which
 * forces a re-render via `useSyncExternalStore`) are what make components
 * actually re-read these after a language switch.
 */
export let messages = ALL_MESSAGES[activeLocale]
export let motto = ALL_MOTTOS[activeLocale]
export let RELATION_LABELS: Record<RelationType, string> = ALL_RELATION_LABELS[activeLocale]

export type MessageKey = keyof typeof messages

/** Keys whose value is a plain string (the ones `t()` accepts). */
export type StringKey = {
  [K in MessageKey]: (typeof messages)[K] extends string ? K : never
}[MessageKey]

export function t(key: StringKey): string {
  return messages[key] as string
}

export function getLocale(): Locale {
  return activeLocale
}

const listeners = new Set<() => void>()

export function setLocale(locale: Locale) {
  if (locale === activeLocale) return
  activeLocale = locale
  messages = ALL_MESSAGES[locale]
  motto = ALL_MOTTOS[locale]
  RELATION_LABELS = ALL_RELATION_LABELS[locale]
  localStorage.setItem(STORAGE_KEY, locale)
  document.documentElement.lang = locale
  listeners.forEach((fn) => fn())
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/**
 * Subscribes to the active locale via `useSyncExternalStore`, which forces
 * this component (and everything below it) to re-render on a language
 * switch — most components call the plain `t()`/`messages` imports directly
 * rather than this hook, so it's this re-render that actually refreshes
 * them, not the returned value itself.
 */
export function useLocale(): { locale: Locale; setLocale: (l: Locale) => void } {
  const locale = useSyncExternalStore(subscribe, getLocale)
  return { locale, setLocale }
}
