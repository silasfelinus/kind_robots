// /stores/helpers/newsfeed.ts
//
// Modular newsfeed contracts + the recommended feed/source registry, per
// conductor projects/newsfeed/DESIGN-BRIEF.md and BIAS-CONTROLS.md.
// Consumed by feedPreferenceStore (user selection/ordering/perspective) and,
// later, the server-side aggregation pipeline (t-005) and FeedCard rendering
// (t-006). Source adapters normalize into NewsFeedItem; components never see
// per-source quirks.

export type FeedSourceKind = 'rss' | 'atom'

export type PerspectiveLabel =
  'left' | 'center-left' | 'center' | 'center-right' | 'right'

/** Never presented as objective fact — always paired with its provenance. */
export interface SourcePerspective {
  label: PerspectiveLabel
  source: string
  confidence?: 'low' | 'medium' | 'high'
}

export interface FeedSourceDefinition {
  id: string
  name: string
  url: string
  kind: FeedSourceKind
  /**
   * This session's sandbox blocked outbound probes to every candidate feed
   * host (see EGRESS-BLOCKERS.md) — `verified: false` means the URL has not
   * been fetched by a live pipeline yet. Flip to true once t-005's
   * aggregation pipeline confirms it resolves and parses.
   */
  verified: boolean
  perspective?: SourcePerspective
}

export type FeedSortMode = 'recent' | 'relevance'

export interface FeedDefinition {
  slug: string
  title: string
  description: string
  icon: string
  defaultEnabled: boolean
  sourceIds: string[]
  includeTags?: string[]
  excludeTags?: string[]
  defaultSort: FeedSortMode
  /**
   * BIAS-CONTROLS.md guardrail: perspective balancing only ever applies to
   * feeds where it makes sense — a technical or health feed's ranking must
   * not be distorted by political-perspective weights.
   */
  topicPolitical: boolean
}

/** Normalized item contract every source adapter maps into (t-005). */
export interface NewsFeedItem {
  id: string
  title: string
  summary: string
  /** Display name (FeedSourceDefinition.name) -- not stable across renames. */
  source: string
  /** Stable FeedSourceDefinition.id, for preference-driven source toggles (t-008). */
  sourceId: string
  url: string
  publishedAt: string
  category: string[]
  image?: string
  author?: string
  perspective?: {
    score?: number
    label?: PerspectiveLabel
    source?: string
    confidence?: 'low' | 'medium' | 'high'
  }
  /**
   * Stamped client-side from the parent feed's FeedDefinition.topicPolitical
   * when items are grouped (newsfeed-feed.vue) -- lets applyPerspectiveBalance
   * gate on a merged, multi-feed item list without needing feed context of
   * its own. Absent/false items are never reordered by perspective weight.
   */
  topicPolitical?: boolean
}

export type PerspectiveMode = 'focused' | 'balanced' | 'broad' | 'custom'

export interface PerspectiveWeights {
  left: number
  centerLeft: number
  center: number
  centerRight: number
  right: number
}

export const DEFAULT_PERSPECTIVE_WEIGHTS: PerspectiveWeights = {
  left: 1,
  centerLeft: 1,
  center: 1,
  centerRight: 1,
  right: 1,
}

/**
 * Preset weight shapes for the three starter modes (BIAS-CONTROLS.md MVP
 * path). `custom` has no preset -- it's whatever the user dialed in via
 * setPerspectiveWeights. Weights are relative shape, not requirements: every
 * bucket stays above zero so no viewpoint is ever fully excluded, per the
 * "still surfacing major opposing coverage" / "don't force artificial
 * symmetry" guardrails.
 */
export const PERSPECTIVE_MODE_PRESETS: Record<
  Exclude<PerspectiveMode, 'custom'>,
  PerspectiveWeights
> = {
  balanced: { left: 1, centerLeft: 1, center: 1, centerRight: 1, right: 1 },
  focused: {
    left: 0.6,
    centerLeft: 1,
    center: 1.4,
    centerRight: 1,
    right: 0.6,
  },
  broad: { left: 1.3, centerLeft: 1, center: 0.7, centerRight: 1, right: 1.3 },
}

// --- Source registry --------------------------------------------------
// Candidate RSS sources for the recommended presets below. See the
// `verified` doc comment on FeedSourceDefinition — none of these have been
// fetched by a live pipeline yet.

export const FEED_SOURCES: FeedSourceDefinition[] = [
  {
    id: 'techcrunch-ai',
    name: 'TechCrunch — AI',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    kind: 'rss',
    verified: false,
  },
  {
    id: 'technologyreview-ai',
    name: 'MIT Technology Review — AI',
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed',
    kind: 'rss',
    verified: false,
  },
  {
    id: 'marktechpost',
    name: 'MarkTechPost',
    url: 'https://www.marktechpost.com/feed/',
    kind: 'rss',
    verified: false,
  },
  {
    id: 'huggingface-blog',
    name: 'Hugging Face Blog',
    url: 'https://huggingface.co/blog/feed.xml',
    kind: 'rss',
    verified: false,
  },
  {
    id: 'globalcitizen',
    name: 'Global Citizen',
    url: 'https://www.globalcitizen.org/en/rss/',
    kind: 'rss',
    verified: false,
    perspective: {
      label: 'center-left',
      source: 'Media Bias/Fact Check (mediabiasfactcheck.com/global-citizen)',
      confidence: 'medium',
    },
  },
  {
    // Media Bias/Fact Check has no profile for Devex, and Ground News reports
    // its bias/factuality as unrated too (checked 2026-07-19) -- no `perspective`
    // per BIAS-CONTROLS.md "unrated sources remain usable and visibly unrated".
    id: 'devex-news',
    name: 'Devex — Global Development News',
    url: 'https://www.devex.com/rss/news',
    kind: 'rss',
    verified: false,
  },
  {
    id: 'who-news',
    name: 'World Health Organization — News',
    url: 'https://www.who.int/rss-feeds/news-english.xml',
    kind: 'rss',
    verified: false,
  },
  {
    id: 'gatesfoundation-ideas',
    name: 'Gates Foundation — Ideas',
    url: 'https://www.gatesfoundation.org/ideas/rss',
    kind: 'rss',
    verified: false,
  },
  {
    id: 'kotaku-ai',
    name: 'Kotaku — AI tag',
    url: 'https://kotaku.com/tag/artificial-intelligence/rss',
    kind: 'rss',
    verified: false,
  },
  {
    id: 'pcgamer-ai',
    name: 'PC Gamer — AI tag',
    url: 'https://www.pcgamer.com/tag/ai/rss/',
    kind: 'rss',
    verified: false,
  },
  {
    id: 'arxiv-cs-lg',
    name: 'arXiv — cs.LG (Machine Learning)',
    url: 'http://export.arxiv.org/rss/cs.LG',
    kind: 'rss',
    verified: false,
  },
  {
    id: 'openai-blog',
    name: 'OpenAI Blog',
    url: 'https://openai.com/blog/rss.xml',
    kind: 'rss',
    verified: false,
  },
  {
    id: 'anthropic-news',
    name: 'Anthropic News',
    url: 'https://www.anthropic.com/news/rss.xml',
    kind: 'rss',
    verified: false,
  },
  {
    id: 'devto-tips',
    name: 'DEV Community',
    url: 'https://dev.to/feed',
    kind: 'rss',
    verified: false,
  },
  {
    id: 'css-tricks',
    name: 'CSS-Tricks',
    url: 'https://css-tricks.com/feed/',
    kind: 'rss',
    verified: false,
  },
]

// --- Recommended feed presets -------------------------------------------
// Silas's six starter feeds (DESIGN-BRIEF.md). All default-enabled so a new
// user sees a useful mix immediately.

export const FEED_DEFINITIONS: FeedDefinition[] = [
  {
    slug: 'ai-news',
    title: 'AI News',
    description: 'What is shipping and changing across the AI industry.',
    icon: 'kind-icon:terminal',
    defaultEnabled: true,
    sourceIds: ['techcrunch-ai', 'technologyreview-ai', 'marktechpost'],
    defaultSort: 'recent',
    topicPolitical: false,
  },
  {
    slug: 'activism',
    title: 'Activism',
    description:
      'Movements, campaigns, and organizing making a real difference.',
    icon: 'kind-icon:megaphone',
    defaultEnabled: true,
    sourceIds: ['globalcitizen', 'devex-news'],
    defaultSort: 'recent',
    topicPolitical: true,
  },
  {
    slug: 'malaria-activism',
    title: 'Malaria & Global Health',
    description: 'Progress on malaria and global-health efforts worldwide.',
    icon: 'kind-icon:heart-pulse',
    defaultEnabled: true,
    sourceIds: ['who-news', 'gatesfoundation-ideas'],
    defaultSort: 'recent',
    topicPolitical: false,
  },
  {
    slug: 'ai-gaming',
    title: 'AI Gaming',
    description: 'AI showing up in games — NPCs, tools, and player experience.',
    icon: 'kind-icon:players',
    defaultEnabled: true,
    sourceIds: ['kotaku-ai', 'pcgamer-ai'],
    defaultSort: 'recent',
    topicPolitical: false,
  },
  {
    slug: 'ai-model-creation',
    title: 'AI Model Creation',
    description: 'New model releases, research, and training breakthroughs.',
    icon: 'kind-icon:brain',
    defaultEnabled: true,
    sourceIds: [
      'arxiv-cs-lg',
      'openai-blog',
      'anthropic-news',
      'huggingface-blog',
    ],
    defaultSort: 'recent',
    topicPolitical: false,
  },
  {
    slug: 'developer-tips',
    title: 'Developer Tips',
    description: 'Practical engineering guidance worth reading today.',
    icon: 'kind-icon:code',
    defaultEnabled: true,
    sourceIds: ['devto-tips', 'css-tricks'],
    defaultSort: 'recent',
    topicPolitical: false,
  },
]

const feedsBySlug = new Map(FEED_DEFINITIONS.map((feed) => [feed.slug, feed]))
const sourcesById = new Map(FEED_SOURCES.map((source) => [source.id, source]))

export function getFeedDefinition(slug: string): FeedDefinition | undefined {
  return feedsBySlug.get(slug)
}

export function getFeedSource(id: string): FeedSourceDefinition | undefined {
  return sourcesById.get(id)
}

export function getFeedSources(feed: FeedDefinition): FeedSourceDefinition[] {
  return feed.sourceIds
    .map((id) => sourcesById.get(id))
    .filter((source): source is FeedSourceDefinition => Boolean(source))
}

export function defaultEnabledFeedSlugs(): string[] {
  return FEED_DEFINITIONS.filter((feed) => feed.defaultEnabled).map(
    (feed) => feed.slug,
  )
}

export function isFeedSlug(value: string): boolean {
  return feedsBySlug.has(value)
}

export function isFeedSourceId(value: string): boolean {
  return sourcesById.has(value)
}

// --- Programmable feed filters (t-008) -----------------------------------
// A declarative configuration layer applied client-side to already-fetched
// items -- never arbitrary executable user code (DESIGN-BRIEF.md). Kept here
// (not in the store or a component) so it stays a pure, dependency-free
// function the store, feed component, and a tsx verify script can all share.

export interface NewsfeedFilterPreferences {
  /** Item matches if title/summary/category contains ANY of these (OR). Empty = no restriction. */
  includeKeywords: string[]
  /** Item is dropped if title/summary/category contains ANY of these. */
  excludeKeywords: string[]
  /** Source ids to hide even when their parent feed is enabled. */
  disabledSourceIds: string[]
  /** Item must carry at least one of these categories. Empty = no restriction. */
  selectedCategories: string[]
  sortMode: FeedSortMode
}

export const MAX_KEYWORD_FILTERS = 20
export const MAX_KEYWORD_LENGTH = 60

function itemHaystack(item: NewsFeedItem): string {
  return [item.title, item.summary, ...item.category].join(' ').toLowerCase()
}

function matchesKeywordFilters(
  item: NewsFeedItem,
  includeKeywords: string[],
  excludeKeywords: string[],
): boolean {
  const haystack = itemHaystack(item)

  if (excludeKeywords.some((word) => haystack.includes(word.toLowerCase()))) {
    return false
  }
  if (includeKeywords.length) {
    return includeKeywords.some((word) => haystack.includes(word.toLowerCase()))
  }
  return true
}

function matchesCategoryFilter(
  item: NewsFeedItem,
  selectedCategories: string[],
): boolean {
  if (!selectedCategories.length) return true
  const itemCategories = new Set(item.category.map((c) => c.toLowerCase()))
  return selectedCategories.some((category) =>
    itemCategories.has(category.toLowerCase()),
  )
}

function keywordMatchCount(
  item: NewsFeedItem,
  includeKeywords: string[],
): number {
  if (!includeKeywords.length) return 0
  const haystack = itemHaystack(item)
  return includeKeywords.reduce(
    (count, word) => count + (haystack.includes(word.toLowerCase()) ? 1 : 0),
    0,
  )
}

/**
 * Applies a user's declarative filters and sort mode to already-fetched
 * items. Pure and side-effect-free -- safe to call on every render.
 * `relevance` ranks by include-keyword match count (ties broken by
 * recency) and behaves identically to `recent` when no include keywords
 * are set, since there is nothing to rank by.
 */
export function applyNewsfeedFilters(
  items: NewsFeedItem[],
  prefs: NewsfeedFilterPreferences,
): NewsFeedItem[] {
  const filtered = items.filter(
    (item) =>
      !prefs.disabledSourceIds.includes(item.sourceId) &&
      matchesKeywordFilters(
        item,
        prefs.includeKeywords,
        prefs.excludeKeywords,
      ) &&
      matchesCategoryFilter(item, prefs.selectedCategories),
  )

  if (prefs.sortMode === 'relevance' && prefs.includeKeywords.length) {
    return filtered.sort((a, b) => {
      const scoreDiff =
        keywordMatchCount(b, prefs.includeKeywords) -
        keywordMatchCount(a, prefs.includeKeywords)
      if (scoreDiff !== 0) return scoreDiff
      return a.publishedAt < b.publishedAt ? 1 : -1
    })
  }

  return filtered.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
}

// --- Perspective balance (t-011) -----------------------------------------
// A second, independent ranking pass layered on top of applyNewsfeedFilters'
// recency/relevance ordering. Only ever reorders items among themselves
// where item.topicPolitical is true -- non-political items keep their exact
// index, so balancing one feed's mix can never distort another (BIAS-
// CONTROLS.md guardrail). Unrated political items (no source perspective
// label) are their own bucket, weighted as the average of the five named
// buckets, so they're never excluded or penalized to zero -- "unrated
// sources remain usable and visibly unrated."

type PerspectiveBucketKey = PerspectiveLabel | 'unrated'

const LABEL_TO_WEIGHT_KEY: Record<PerspectiveLabel, keyof PerspectiveWeights> =
  {
    left: 'left',
    'center-left': 'centerLeft',
    center: 'center',
    'center-right': 'centerRight',
    right: 'right',
  }

function bucketKeyFor(item: NewsFeedItem): PerspectiveBucketKey {
  return item.perspective?.label ?? 'unrated'
}

function averageWeight(weights: PerspectiveWeights): number {
  const values = Object.values(weights)
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function weightFor(
  key: PerspectiveBucketKey,
  weights: PerspectiveWeights,
): number {
  if (key === 'unrated') return Math.max(0, averageWeight(weights))
  return Math.max(0, weights[LABEL_TO_WEIGHT_KEY[key]])
}

/**
 * Smooth weighted round-robin merge (the same algorithm nginx uses for
 * weighted load balancing): each bucket accumulates its weight every round
 * and the highest accumulator is picked next, then debited by the total.
 * This guarantees output proportion tracks input weight while preserving
 * each bucket's own relative (already recency/relevance-sorted) order.
 */
function weightedRoundRobinMerge<T>(
  buckets: Array<{ key: string; items: T[]; weight: number }>,
): T[] {
  const total = buckets.reduce((sum, bucket) => sum + bucket.weight, 0)
  const cursors = new Map(buckets.map((bucket) => [bucket.key, 0]))
  const currents = new Map(buckets.map((bucket) => [bucket.key, 0]))
  const remaining = buckets.reduce(
    (sum, bucket) => sum + bucket.items.length,
    0,
  )
  const result: T[] = []

  while (result.length < remaining) {
    let winner: (typeof buckets)[number] | null = null
    let winnerCurrent = -Infinity

    for (const bucket of buckets) {
      if ((cursors.get(bucket.key) ?? 0) >= bucket.items.length) continue
      const next = (currents.get(bucket.key) ?? 0) + bucket.weight
      currents.set(bucket.key, next)
      if (next > winnerCurrent) {
        winner = bucket
        winnerCurrent = next
      }
    }

    if (!winner) break // safety net: every non-empty bucket has weight <= 0

    const index = cursors.get(winner.key) ?? 0
    result.push(winner.items[index] as T)
    cursors.set(winner.key, index + 1)
    currents.set(winner.key, winnerCurrent - (total || 1))
  }

  return result
}

/**
 * Reorders the political subset of `items` (those with `topicPolitical:
 * true`) by perspective weight via weighted round-robin, leaving every
 * non-political item pinned at its original index. Pure and
 * side-effect-free -- pass the output of applyNewsfeedFilters straight in.
 */
export function applyPerspectiveBalance(
  items: NewsFeedItem[],
  weights: PerspectiveWeights,
): NewsFeedItem[] {
  const politicalIndices: number[] = []
  const politicalItems: NewsFeedItem[] = []

  items.forEach((item, index) => {
    if (item.topicPolitical) {
      politicalIndices.push(index)
      politicalItems.push(item)
    }
  })

  if (politicalItems.length < 2) return items

  const byBucket = new Map<PerspectiveBucketKey, NewsFeedItem[]>()
  for (const item of politicalItems) {
    const key = bucketKeyFor(item)
    const bucket = byBucket.get(key)
    if (bucket) {
      bucket.push(item)
    } else {
      byBucket.set(key, [item])
    }
  }

  const buckets = [...byBucket.entries()].map(([key, bucketItems]) => ({
    key,
    items: bucketItems,
    weight: weightFor(key, weights),
  }))

  const hasWeight = buckets.some((bucket) => bucket.weight > 0)
  const merged = hasWeight ? weightedRoundRobinMerge(buckets) : politicalItems // every bucket weighted to zero -- leave order untouched

  const result = [...items]
  politicalIndices.forEach((originalIndex, i) => {
    const replacement = merged[i]
    if (replacement) result[originalIndex] = replacement
  })
  return result
}

/** Trims, dedupes (case-insensitive), drops empties, and bounds a keyword list. */
export function sanitizeKeywordList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const clean: string[] = []
  for (const value of raw) {
    if (typeof value !== 'string') continue
    const trimmed = value.trim().slice(0, MAX_KEYWORD_LENGTH)
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    clean.push(trimmed)
    if (clean.length >= MAX_KEYWORD_FILTERS) break
  }
  return clean
}
