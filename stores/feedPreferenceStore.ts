// /stores/feedPreferenceStore.ts
//
// User-facing newsfeed preferences (enabled feeds, order, perspective
// balance) per conductor projects/newsfeed/DESIGN-BRIEF.md and
// BIAS-CONTROLS.md. No Pinia-persistence plugin exists in this repo — this
// follows the established hand-rolled safeGetLocalStorage/safeSetLocalStorage
// pattern (stores/navStore.ts, stores/socialStore.ts) rather than a database
// table, per t-004's note. Rendering (t-006) and the aggregation pipeline
// (t-005) consume this store; it owns no network I/O itself.

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  DEFAULT_PERSPECTIVE_WEIGHTS,
  FEED_DEFINITIONS,
  defaultEnabledFeedSlugs,
  getFeedDefinition,
  isFeedSlug,
  type FeedDefinition,
  type PerspectiveMode,
  type PerspectiveWeights,
} from '@/stores/helpers/newsfeed'

export interface NewsfeedPreferences {
  enabledFeedSlugs: string[]
  perspectiveMode: PerspectiveMode
  perspectiveWeights: PerspectiveWeights
  labelsVisible: boolean
  contrastPreference: boolean
}

const isClient = typeof window !== 'undefined'
const storageKey = 'newsfeedPreferences'

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

function defaultPreferences(): NewsfeedPreferences {
  return {
    enabledFeedSlugs: defaultEnabledFeedSlugs(),
    perspectiveMode: 'balanced',
    perspectiveWeights: { ...DEFAULT_PERSPECTIVE_WEIGHTS },
    labelsVisible: true,
    contrastPreference: false,
  }
}

// Never trust stored slugs blindly — a shipped registry change (feed
// renamed/removed) shouldn't leave a dangling slug the UI can't resolve.
function sanitizeSlugs(slugs: unknown): string[] {
  if (!Array.isArray(slugs)) return []
  const seen = new Set<string>()
  const clean: string[] = []
  for (const slug of slugs) {
    if (typeof slug === 'string' && isFeedSlug(slug) && !seen.has(slug)) {
      seen.add(slug)
      clean.push(slug)
    }
  }
  return clean
}

function sanitizeWeights(raw: unknown): PerspectiveWeights {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_PERSPECTIVE_WEIGHTS }
  const source = raw as Partial<PerspectiveWeights>
  const weights = { ...DEFAULT_PERSPECTIVE_WEIGHTS }
  for (const key of Object.keys(weights) as Array<keyof PerspectiveWeights>) {
    const value = source[key]
    if (typeof value === 'number' && Number.isFinite(value)) {
      weights[key] = value
    }
  }
  return weights
}

function sanitizePerspectiveMode(value: unknown): PerspectiveMode {
  return value === 'focused' ||
    value === 'balanced' ||
    value === 'broad' ||
    value === 'custom'
    ? value
    : 'balanced'
}

function parsePreferences(raw: string | null): NewsfeedPreferences {
  const fallback = defaultPreferences()
  if (!raw) return fallback

  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return fallback

    const enabledFeedSlugs = sanitizeSlugs(parsed.enabledFeedSlugs)

    return {
      enabledFeedSlugs: enabledFeedSlugs.length
        ? enabledFeedSlugs
        : fallback.enabledFeedSlugs,
      perspectiveMode: sanitizePerspectiveMode(parsed.perspectiveMode),
      perspectiveWeights: sanitizeWeights(parsed.perspectiveWeights),
      labelsVisible:
        typeof parsed.labelsVisible === 'boolean'
          ? parsed.labelsVisible
          : fallback.labelsVisible,
      contrastPreference:
        typeof parsed.contrastPreference === 'boolean'
          ? parsed.contrastPreference
          : fallback.contrastPreference,
    }
  } catch {
    return fallback
  }
}

export const useFeedPreferenceStore = defineStore('feedPreferenceStore', () => {
  const enabledFeedSlugs = ref<string[]>(defaultEnabledFeedSlugs())
  const perspectiveMode = ref<PerspectiveMode>('balanced')
  const perspectiveWeights = ref<PerspectiveWeights>({
    ...DEFAULT_PERSPECTIVE_WEIGHTS,
  })
  const labelsVisible = ref(true)
  const contrastPreference = ref(false)
  const isHydrated = ref(false)

  const enabledFeeds = computed<FeedDefinition[]>(() =>
    enabledFeedSlugs.value
      .map((slug) => getFeedDefinition(slug))
      .filter((feed): feed is FeedDefinition => Boolean(feed)),
  )

  const availableFeeds = computed<FeedDefinition[]>(() => {
    const enabledSet = new Set(enabledFeedSlugs.value)
    return FEED_DEFINITIONS.filter((feed) => !enabledSet.has(feed.slug))
  })

  function persist(): void {
    const payload: NewsfeedPreferences = {
      enabledFeedSlugs: enabledFeedSlugs.value,
      perspectiveMode: perspectiveMode.value,
      perspectiveWeights: perspectiveWeights.value,
      labelsVisible: labelsVisible.value,
      contrastPreference: contrastPreference.value,
    }
    safeSetLocalStorage(storageKey, JSON.stringify(payload))
  }

  function hydrate(force = false): void {
    if (isHydrated.value && !force) return

    const parsed = parsePreferences(safeGetLocalStorage(storageKey))
    enabledFeedSlugs.value = parsed.enabledFeedSlugs
    perspectiveMode.value = parsed.perspectiveMode
    perspectiveWeights.value = parsed.perspectiveWeights
    labelsVisible.value = parsed.labelsVisible
    contrastPreference.value = parsed.contrastPreference
    isHydrated.value = true
  }

  function isFeedEnabled(slug: string): boolean {
    return enabledFeedSlugs.value.includes(slug)
  }

  function enableFeed(slug: string): void {
    if (!isFeedSlug(slug) || isFeedEnabled(slug)) return
    enabledFeedSlugs.value = [...enabledFeedSlugs.value, slug]
    persist()
  }

  function disableFeed(slug: string): void {
    if (!isFeedEnabled(slug)) return
    enabledFeedSlugs.value = enabledFeedSlugs.value.filter((s) => s !== slug)
    persist()
  }

  function toggleFeed(slug: string): void {
    if (isFeedEnabled(slug)) {
      disableFeed(slug)
    } else {
      enableFeed(slug)
    }
  }

  // Reorders enabled feeds in place; slugs absent from `order` keep their
  // relative order appended after the reordered ones, so a stale/partial
  // order list from a drag-reorder UI can never silently drop a feed.
  function reorderFeeds(order: string[]): void {
    const validOrder = order.filter((slug) => isFeedEnabled(slug))
    const remaining = enabledFeedSlugs.value.filter(
      (slug) => !validOrder.includes(slug),
    )
    enabledFeedSlugs.value = [...validOrder, ...remaining]
    persist()
  }

  function setPerspectiveMode(mode: PerspectiveMode): void {
    perspectiveMode.value = mode
    persist()
  }

  function setPerspectiveWeights(weights: Partial<PerspectiveWeights>): void {
    perspectiveWeights.value = { ...perspectiveWeights.value, ...weights }
    perspectiveMode.value = 'custom'
    persist()
  }

  function setLabelsVisible(value: boolean): void {
    labelsVisible.value = value
    persist()
  }

  function setContrastPreference(value: boolean): void {
    contrastPreference.value = value
    persist()
  }

  function resetToDefaults(): void {
    const fallback = defaultPreferences()
    enabledFeedSlugs.value = fallback.enabledFeedSlugs
    perspectiveMode.value = fallback.perspectiveMode
    perspectiveWeights.value = fallback.perspectiveWeights
    labelsVisible.value = fallback.labelsVisible
    contrastPreference.value = fallback.contrastPreference
    persist()
  }

  return {
    enabledFeedSlugs,
    perspectiveMode,
    perspectiveWeights,
    labelsVisible,
    contrastPreference,
    isHydrated,

    enabledFeeds,
    availableFeeds,

    hydrate,
    isFeedEnabled,
    enableFeed,
    disableFeed,
    toggleFeed,
    reorderFeeds,
    setPerspectiveMode,
    setPerspectiveWeights,
    setLabelsVisible,
    setContrastPreference,
    resetToDefaults,
  }
})
