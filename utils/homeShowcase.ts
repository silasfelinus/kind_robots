// /utils/homeShowcase.ts
//
// The vocabulary the home page and its API agree on.
//
// Silas, 2026-08-28: "I want a home page that really shows off all the little
// parts of our website and its progress ... These displays should always lead
// to something, not just static displays of images and text."
//
// That second sentence is why `showcaseHref` lives here rather than being
// computed per-rail in the template: every card on the home page resolves to a
// destination through one function, so a rail can never quietly ship a tile
// that goes nowhere. Adding a kind to ShowcaseKind without adding it to
// SHOWCASE_DESTINATIONS is a type error, not a dead link discovered later.

export type ShowcaseKind =
  | 'art'
  | 'animation'
  | 'dream'
  | 'character'
  | 'bot'
  | 'reward'
  | 'scenario'
  | 'facet'
  | 'project'

/**
 * The art fields every showcase card carries. Deliberately the shape
 * `resolveArtVariantSrc` (utils/artImageSrc.ts) already understands, so
 * kr-art-plate can render a card straight from the API payload with the same
 * variant fallback chain every gallery uses -- no per-rail image handling.
 */
export type ShowcaseArt = {
  imagePath: string | null
  cardPath: string | null
  heroPath: string | null
  iconPath: string | null
  fileType: string | null
}

export type ShowcaseCard = {
  kind: ShowcaseKind
  id: number
  title: string
  subtitle: string | null
  slug: string | null
  badge: string | null
  createdAt: string
  /**
   * The daisyUI theme this card wears, straight from the record's own `theme`
   * column where it has one. Silas, 2026-08-10, on the object cards: "it looks
   * very pretty to have the bots with their custom theme backgrounds ... each
   * card when viewed should have a theme shift to distinguish it from
   * neighbours" -- and again 2026-08-29 on the home page: "The lack of
   * different theme colors is notable, it would give us more variety easily."
   * Null falls back to resolveEntityTheme's id-derived pick, which is stable
   * rather than random so a rail does not strobe on re-render.
   */
  theme: string | null
  art: ShowcaseArt
  /**
   * An explicit destination that overrides the kind's default.
   *
   * Set for projects, whose real home is the tool itself: a conductor slug
   * resolves through PROJECT_PLACEMENTS to an in-app route (/taskmaster,
   * /coloring, /music-mentor...), and sending someone to a project record when
   * the thing it describes is one click away would be exactly the "buried
   * under nav paths" problem this page exists to fix.
   */
  href: string | null
  /**
   * Projects only: the conductor project this record mirrors. The home strip
   * joins on it to show conductor's own progress percentage rather than
   * inventing a second definition of "how far along is this".
   */
  conductorSlug: string | null
}

/**
 * A showcase card as a rail tile, optionally carrying a pipeline state.
 *
 * Only the art shelf's queue mode sets `status`: an ArtJob has a lifecycle
 * (PENDING/RUNNING/DONE/FAILED/CANCELLED) where a finished object simply
 * exists. Every other shelf passes cards through untouched and renders no chip.
 *
 * It lives here rather than in home-rail.vue because `<script setup>` cannot
 * export types -- and because the art shelf and the rail both need to name it.
 */
export type RailItem = ShowcaseCard & { status?: string | null }

export type ShowcaseHero = {
  dream: ShowcaseCard
  /** Everything the dream cycle built around it, in reading order. */
  cast: ShowcaseCard[]
  hook: string | null
  pitch: string | null
  /**
   * The dream's actual description, at paragraph length rather than the
   * one-line `hook`/`pitch` summaries beside it.
   *
   * Silas, 2026-08-29: "make it a little wider because we want to add the
   * descrition for the dream, that is missing." Both existing fields run
   * through `summarize`, which keeps the FIRST LINE only and caps at 160
   * characters -- fine for a card subtitle, not a description. This is the same
   * source text at paragraph length.
   */
  description: string | null
  /** How many cast members resolved art -- the "is it ready" signal. */
  castWithArt: number
}

export type ShowcaseRailKey =
  | 'art'
  | 'animations'
  | 'dreams'
  | 'characters'
  | 'bots'
  | 'rewards'
  | 'scenarios'
  | 'facets'

export type HomeShowcase = {
  hero: ShowcaseHero | null
  rails: Record<ShowcaseRailKey, ShowcaseCard[]>
  projects: ShowcaseCard[]
  generatedAt: string
}

/**
 * Where a card of each kind goes when clicked.
 *
 * `query` names the route-query key that preselects the object on the
 * destination page. Character, Bot and Facet managers already honoured one;
 * dream/reward/scenario managers gained the same handling alongside this file
 * so a home card lands ON the object rather than merely near it.
 *
 * `slugParam: true` means the destination keys off the slug rather than the id.
 */
export const SHOWCASE_DESTINATIONS: Record<
  ShowcaseKind,
  { path: string; query: string | null; slugParam?: boolean }
> = {
  art: { path: '/art', query: 'art' },
  animation: { path: '/art', query: 'art' },
  dream: { path: '/dreams', query: 'dream' },
  character: { path: '/characters', query: 'characterId' },
  bot: { path: '/bots', query: 'botId' },
  reward: { path: '/rewards', query: 'reward' },
  scenario: { path: '/stories', query: 'scenario' },
  facet: { path: '/facets', query: 'facet', slugParam: true },
  project: { path: '/conductor', query: 'project' },
}

/** The destination for one card. Always a real route, never ''. */
export function showcaseHref(card: {
  kind: ShowcaseKind
  id: number
  slug?: string | null
  href?: string | null
}): string {
  if (card.href) return card.href

  const destination = SHOWCASE_DESTINATIONS[card.kind]
  if (!destination) return '/'

  const { path, query, slugParam } = destination
  if (!query) return path

  const value = slugParam ? (card.slug ?? '') : String(card.id)
  if (!value) return path

  return `${path}?${query}=${encodeURIComponent(value)}`
}

/** Empty rails render nothing at all rather than an apologetic empty box. */
export function emptyShowcase(): HomeShowcase {
  return {
    hero: null,
    rails: {
      art: [],
      animations: [],
      dreams: [],
      characters: [],
      bots: [],
      rewards: [],
      scenarios: [],
      facets: [],
    },
    projects: [],
    generatedAt: new Date(0).toISOString(),
  }
}
