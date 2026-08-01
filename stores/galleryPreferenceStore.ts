// /stores/galleryPreferenceStore.ts
//
// Shared, hand-rolled localStorage persistence for kr-gallery view preferences
// (view mode, active filter) keyed per gallery instance. Extracted from
// conductor-project-gallery-page.vue (interface-vision/t-008) so every future
// kr-gallery consumer persists the same way instead of each page reaching for
// localStorage directly, which kind_robots AGENTS.md forbids -- components
// never call localStorage, stores own it. Follows the established
// safeGetLocalStorage/safeSetLocalStorage pattern (stores/feedPreferenceStore.ts,
// stores/navStore.ts) rather than a Pinia-persistence plugin, since none exists
// in this repo.

import { defineStore } from 'pinia'
import { reactive } from 'vue'

const isClient = typeof window !== 'undefined'
const storageKey = 'krGalleryPreferences'

type PreferenceMap = Record<string, Record<string, string>>

function safeGetLocalStorage(key: string): string | null {
  if (!isClient) return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetLocalStorage(key: string, value: string): void {
  if (!isClient) return
  try {
    localStorage.setItem(key, value)
  } catch {
    // Quota/private-mode failures are non-fatal; preferences stay unsaved.
  }
}

function parsePreferences(raw: string | null): PreferenceMap {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    const result: PreferenceMap = {}
    for (const [scope, fields] of Object.entries(
      parsed as Record<string, unknown>,
    )) {
      if (!fields || typeof fields !== 'object') continue
      const clean: Record<string, string> = {}
      for (const [field, value] of Object.entries(
        fields as Record<string, unknown>,
      )) {
        if (typeof value === 'string') clean[field] = value
      }
      result[scope] = clean
    }
    return result
  } catch {
    return {}
  }
}

export const useGalleryPreferenceStore = defineStore(
  'galleryPreferenceStore',
  () => {
    const preferences = reactive<PreferenceMap>({})
    let hydrated = false

    function hydrate(): void {
      if (hydrated) return
      hydrated = true
      Object.assign(preferences, parsePreferences(safeGetLocalStorage(storageKey)))
    }

    function persist(): void {
      safeSetLocalStorage(storageKey, JSON.stringify(preferences))
    }

    /** Reads a persisted field for a gallery scope, falling back if unset or invalid. */
    function get<T extends string>(
      scopeKey: string,
      field: string,
      fallback: T,
      isValid?: (value: string) => value is T,
    ): T {
      hydrate()
      const value = preferences[scopeKey]?.[field]
      if (value === undefined) return fallback
      if (isValid && !isValid(value)) return fallback
      return value as T
    }

    function set(scopeKey: string, field: string, value: string): void {
      hydrate()
      preferences[scopeKey] = { ...preferences[scopeKey], [field]: value }
      persist()
    }

    return { hydrate, get, set }
  },
)
