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
  source: string
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
  },
  {
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
