// /stores/feedPreferenceStore.ts
//
// User-facing newsfeed preferences (enabled feeds, order, perspective
// balance) per conductor projects/newsfeed/DESIGN-BRIEF.md and
// BIAS-CONTROLS.md. No Pinia-persistence plugin exists in this repo — this
// follows the established hand-rolled safeGetLocalStorage/safeSetLocalStorage
// pattern (stores/navStore.ts) rather than a database
// table, per t-004's note. Rendering (t-006) and the aggregation pipeline
// (t-005) consume this store; it owns no network I/O itself.

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  DEFAULT_PERSPECTIVE_WEIGHTS,
  FEED_DEFINITIONS,
  PERSPECTIVE_MODE_PRESETS,
  defaultEnabledFeedSlugs,
  getFeedDefinition,
  getFeedSources,
  isFeedSlug,
  isFeedSourceId,
  sanitizeKeywordList,
  type FeedDefinition,
  type FeedSortMode,
  type FeedSourceDefinition,
  type PerspectiveMode,
  type PerspectiveWeights,
} from '@/stores/helpers/newsfeed'

export interface NewsfeedPreferences {
  enabledFeedSlugs: string[]
  perspectiveMode: PerspectiveMode
  perspectiveWeights: PerspectiveWeights
  labelsVisible: boolean
  contrastPreference: boolean
  includeKeywords: string[]
  excludeKeywords: string[]
  disabledSourceIds: string[]
  selectedCategories: string[]
  sortMode: FeedSortMode
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
    includeKeywords: [],
    excludeKeywords: [],
    disabledSourceIds: [],
    selectedCategories: [],
    sortMode: 'recent',
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

// Never trust stored source ids blindly -- same "registry may change" concern
// as sanitizeSlugs above.
function sanitizeSourceIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const clean: string[] = []
  for (const value of raw) {
    if (
      typeof value === 'string' &&
      isFeedSourceId(value) &&
      !seen.has(value)
    ) {
      seen.add(value)
      clean.push(value)
    }
  }
  return clean
}

// Categories are free-form strings sourced from live feed items, not a fixed
// registry -- just bound the list length/size rather than validate membership.
function sanitizeCategories(raw: unknown): string[] {
  return sanitizeKeywordList(raw)
}

function sanitizeSortMode(value: unknown): FeedSortMode {
  return value === 'relevance' ? 'relevance' : 'recent'
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
      includeKeywords: sanitizeKeywordList(parsed.includeKeywords),
      excludeKeywords: sanitizeKeywordList(parsed.excludeKeywords),
      disabledSourceIds: sanitizeSourceIds(parsed.disabledSourceIds),
      selectedCategories: sanitizeCategories(parsed.selectedCategories),
      sortMode: sanitizeSortMode(parsed.sortMode),
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
  const includeKeywords = ref<string[]>([])
  const excludeKeywords = ref<string[]>([])
  const disabledSourceIds = ref<string[]>([])
  const selectedCategories = ref<string[]>([])
  const sortMode = ref<FeedSortMode>('recent')
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

  // Sources across every currently-enabled feed, deduped -- what the source
  // toggle UI offers. A source disabled here stays disabled even if it also
  // belongs to another enabled feed.
  const availableSources = computed<FeedSourceDefinition[]>(() => {
    const seen = new Set<string>()
    const sources: FeedSourceDefinition[] = []
    for (const feed of enabledFeeds.value) {
      for (const source of getFeedSources(feed)) {
        if (seen.has(source.id)) continue
        seen.add(source.id)
        sources.push(source)
      }
    }
    return sources
  })

  function persist(): void {
    const payload: NewsfeedPreferences = {
      enabledFeedSlugs: enabledFeedSlugs.value,
      perspectiveMode: perspectiveMode.value,
      perspectiveWeights: perspectiveWeights.value,
      labelsVisible: labelsVisible.value,
      contrastPreference: contrastPreference.value,
      includeKeywords: includeKeywords.value,
      excludeKeywords: excludeKeywords.value,
      disabledSourceIds: disabledSourceIds.value,
      selectedCategories: selectedCategories.value,
      sortMode: sortMode.value,
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
    includeKeywords.value = parsed.includeKeywords
    excludeKeywords.value = parsed.excludeKeywords
    disabledSourceIds.value = parsed.disabledSourceIds
    selectedCategories.value = parsed.selectedCategories
    sortMode.value = parsed.sortMode
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

  // Focused/Balanced/Broad apply their preset weight shape (BIAS-CONTROLS.md
  // MVP path); Custom keeps whatever weights setPerspectiveWeights last set,
  // since it's the user's own dial-in rather than a preset.
  function setPerspectiveMode(mode: PerspectiveMode): void {
    perspectiveMode.value = mode
    if (mode !== 'custom') {
      perspectiveWeights.value = { ...PERSPECTIVE_MODE_PRESETS[mode] }
    }
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

  function addIncludeKeyword(word: string): void {
    includeKeywords.value = sanitizeKeywordList([
      ...includeKeywords.value,
      word,
    ])
    persist()
  }

  function removeIncludeKeyword(word: string): void {
    includeKeywords.value = includeKeywords.value.filter((w) => w !== word)
    persist()
  }

  function addExcludeKeyword(word: string): void {
    excludeKeywords.value = sanitizeKeywordList([
      ...excludeKeywords.value,
      word,
    ])
    persist()
  }

  function removeExcludeKeyword(word: string): void {
    excludeKeywords.value = excludeKeywords.value.filter((w) => w !== word)
    persist()
  }

  function isSourceDisabled(sourceId: string): boolean {
    return disabledSourceIds.value.includes(sourceId)
  }

  function toggleSource(sourceId: string): void {
    disabledSourceIds.value = isSourceDisabled(sourceId)
      ? disabledSourceIds.value.filter((id) => id !== sourceId)
      : [...disabledSourceIds.value, sourceId]
    persist()
  }

  function toggleCategory(category: string): void {
    const trimmed = category.trim()
    if (!trimmed) return
    const exists = selectedCategories.value.some(
      (c) => c.toLowerCase() === trimmed.toLowerCase(),
    )
    selectedCategories.value = exists
      ? selectedCategories.value.filter(
          (c) => c.toLowerCase() !== trimmed.toLowerCase(),
        )
      : sanitizeKeywordList([...selectedCategories.value, trimmed])
    persist()
  }

  function setSortMode(mode: FeedSortMode): void {
    sortMode.value = mode
    persist()
  }

  function resetToDefaults(): void {
    const fallback = defaultPreferences()
    enabledFeedSlugs.value = fallback.enabledFeedSlugs
    perspectiveMode.value = fallback.perspectiveMode
    perspectiveWeights.value = fallback.perspectiveWeights
    labelsVisible.value = fallback.labelsVisible
    contrastPreference.value = fallback.contrastPreference
    includeKeywords.value = fallback.includeKeywords
    excludeKeywords.value = fallback.excludeKeywords
    disabledSourceIds.value = fallback.disabledSourceIds
    selectedCategories.value = fallback.selectedCategories
    sortMode.value = fallback.sortMode
    persist()
  }

  return {
    enabledFeedSlugs,
    perspectiveMode,
    perspectiveWeights,
    labelsVisible,
    contrastPreference,
    includeKeywords,
    excludeKeywords,
    disabledSourceIds,
    selectedCategories,
    sortMode,
    isHydrated,

    enabledFeeds,
    availableFeeds,
    availableSources,

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
    addIncludeKeyword,
    removeIncludeKeyword,
    addExcludeKeyword,
    removeExcludeKeyword,
    isSourceDisabled,
    toggleSource,
    toggleCategory,
    setSortMode,
    resetToDefaults,
  }
})
