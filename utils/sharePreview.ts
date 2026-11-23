export const SITE_ORIGIN = 'https://kindrobots.org'
export const SITE_NAME = 'Kind Robots'
export const DEFAULT_SHARE_IMAGE = '/images/arcade/arcade-attract-splash.webp'

export type SharePreview = {
  route: string
  image: string
  title?: string
  description?: string
}

export const SHARE_PREVIEWS: readonly SharePreview[] = [
  {
    route: '/play/arcade',
    image: '/images/arcade/arcade-attract-splash.webp',
    title: 'The Arcade',
    description: 'Original cabinets, high scores and quick-fire challenges.',
  },
  {
    route: '/play/comet-city-academy',
    image: '/comet-city-academy/front/dashboard-highlight.webp',
    title: 'Prom of Doom',
    description: 'Pick a superpower, dispatch classmates, and survive prom.',
  },
  {
    route: '/play/game-of-captains',
    image: '/game-of-captains/front/dashboard-highlight.webp',
    title: 'Space Couch',
    description:
      'Command a crew, explore strange worlds, and decide when to intervene.',
  },
  {
    route: '/play/crystal-street',
    image: '/crystal-street/cover.webp',
    title: 'Terrors on Crystal Street',
    description:
      'Survive Halloween week, 1986, against twenty-three remixed nightmares.',
  },
  {
    route: '/play/emperor-of-dust',
    image: '/emperor-of-dust/link-preview.webp',
    title: 'Emperor of Dust',
    description: 'Rule the wasteland, command followers and make hard choices.',
  },
  {
    route: '/play/save-the-plumber',
    image: '/save-the-plumber/maps/world-1.webp',
    title: 'Save the Plumber',
    description:
      'Run, jump and rescue your plumber through eight strange worlds.',
  },
  {
    route: '/play/rainbow-bullet-hell-space-princess',
    image: '/rainbow-princess-art/hero-pearl-palace.webp',
    title: 'Rainbow Bullet Hell Space Princess',
    description:
      'Pilot a pastel starfighter through ocean-born fleets and spectacular boss battles.',
  },
  {
    route: '/play/zuzu-pinball',
    image: '/images/pinball/zuzu-last-bell-backglass.webp',
    title: 'Zuzu Pinball',
    description:
      'Ring the Last Bell and brave the River Croc on a 3D pinball table.',
  },
  {
    route: '/play/zuzu-shifting-lands',
    image: '/shifting-lands/cards/the-map-in-ashes.webp',
    title: 'Zuzu: Shifting Lands',
    description:
      'Explore changing lands, encounter strangers and test your luck.',
  },
  {
    route: '/play/zuzu-gamebook',
    image: '/zuzu-gamebook/scenes/waterhole.webp',
    title: 'Zuzu Gamebook',
    description:
      'Choose the koala ronin’s road through dice, danger and branching stories.',
  },
  {
    route: '/play/zuzu-showdown',
    image: '/zuzu-showdown-art/hall-card.webp',
    title: 'Zuzu Showdown',
    description:
      'Cross the wasteland, face the bosses and chase one of many endings.',
  },
  {
    route: '/play/ecotone',
    image: '/ecotone/title/key-art.webp',
    title: 'Ecotone: Weird Humboldt',
    description:
      'A strange Humboldt festival weekend where your choices shape the county.',
  },
  {
    route: '/play/shifting-desks',
    image: '/images/shifting-desks/endings/the-kind-rewrite.webp',
    title: 'Downward Mobility',
    description:
      'Survive office politics, impossible choices and your first 90-day review.',
  },
  {
    route: '/play/aquarium',
    image: '/images/channels/admin/aquarium.webp',
    title: 'Cthulhuquarium',
    description: 'Meet strange aquatic creatures and grow your own tank.',
  },
  {
    route: '/play/memory',
    image: '/memory-dungeon/link-preview.webp',
    title: 'Memory Dungeon',
    description: 'Match cards, survive the dungeon and collect rewards.',
  },
  {
    route: '/play/mandarin',
    image: '/images/mandarin-tutor/cards/v2/f24c02b7272a3d3004079114.webp',
    title: 'Mandarin Tutor',
    description: 'Discover how Chinese characters work, then practice.',
  },
  {
    route: '/play/chessweeper',
    image: '/chessweeper/link-preview.webp',
    title: 'Chessweeper',
    description:
      'Chess against the computer on a mined board, in three dangerous worlds.',
  },
  {
    route: '/play/hopeful-hues',
    image: '/hopeful-hues/front/link-preview.webp',
    title: 'Hopeful Hues',
    description:
      'A hopecore rainbow match-three with Superkate and the Kind Robots, and a Back button.',
  },
  {
    route: '/play/ruler-hooked',
    image: '/ruler-hooked/hero.webp',
    title: 'The Ruler Is Hooked',
    description:
      'Fish first, govern eventually: cast for fish and steer a seaside kingdom.',
  },
  {
    route: '/storybook',
    image: '/storybook-art/dashboard-highlight.webp',
    title: 'Storybook',
    description: 'Weave your own worlds, characters and branching tales.',
  },
  {
    route: '/art',
    image: '/art-gallery/link-preview.webp',
    title: 'Art Gallery & Studio',
    description: 'Browse finished work, or sign in to generate your own.',
  },
]

/**
 * Public arcade games with their own page and link preview but no
 * SHARE_PREVIEWS entry (their pages set their own share meta). Without this
 * list, search engines were never told they exist.
 */
export const STANDALONE_GAME_PATHS: readonly string[] = [
  '/play/zuzu-ghost-trail',
  '/play/sliding-tile-gallery',
  // 2026-11-21 PT: three public arcade games had a page, an arcade tab and a
  // link preview but were missing from the sitemap.
  '/play/slime-city',
  '/play/monstrique',
  '/play/hybridizer',
]

export const SITEMAP_PATHS: readonly string[] = [
  '/',
  '/about',
  '/giving',
  '/navigation',
  // 2026-11-23 PT: public pages a first-time visitor looks for before
  // trusting a site (who makes it, how data is handled, how to join) were
  // reachable from the footer but never listed in the sitemap.
  '/silas',
  '/privacy',
  '/register',
  ...SHARE_PREVIEWS.map((preview) => preview.route),
  ...STANDALONE_GAME_PATHS,
]

/**
 * Browser-tab, bookmark and search-result title. Content pages ("Storybook",
 * "Memory Dungeon", "Support") used to show no site name at all, while
 * dedicated pages appended " | Kind Robots" by hand. Titles that already
 * name the site are left alone.
 */
export function siteTabTitle(title?: string | null): string {
  const trimmed = (title ?? '').trim()
  if (!trimmed) return SITE_NAME
  if (trimmed.toLowerCase().includes(SITE_NAME.toLowerCase())) return trimmed
  return `${trimmed} | ${SITE_NAME}`
}

/**
 * schema.org WebSite data for the home page. Search engines use it to show
 * "Kind Robots" as the result's site name instead of guessing from the URL.
 */
export function buildWebsiteJsonLd(): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: 'kindrobots.org',
    url: `${SITE_ORIGIN}/`,
    description:
      'Free handmade browser games, illustrated stories and a robot-made art gallery. No ads, no account needed.',
  })
}

export function normalizeSharePath(path: string): string {
  const pathname = (path.split(/[?#]/)[0] ?? '')
    .replace(/\/{2,}/g, '/')
    .replace(/\/+$/, '')
  if (!pathname) return '/'
  return pathname.startsWith('/') ? pathname : `/${pathname}`
}

export function absoluteSiteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_ORIGIN}${normalizeSharePath(path)}`
}

export function findSharePreview(path: string): SharePreview | null {
  const pathname = normalizeSharePath(path)
  let match: SharePreview | null = null
  for (const preview of SHARE_PREVIEWS) {
    const covers =
      pathname === preview.route || pathname.startsWith(`${preview.route}/`)
    if (covers && (!match || preview.route.length > match.route.length)) {
      match = preview
    }
  }
  return match
}

export function sharePreviewImageUrl(path: string): string {
  return absoluteSiteUrl(findSharePreview(path)?.image ?? DEFAULT_SHARE_IMAGE)
}

export function buildRobotsTxt(): string {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/',
    '',
    `Sitemap: ${absoluteSiteUrl('/sitemap.xml')}`,
    '',
  ].join('\n')
}

export function buildSitemapXml(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...SITEMAP_PATHS.map(
      (path) => `  <url><loc>${absoluteSiteUrl(path)}</loc></url>`,
    ),
    '</urlset>',
    '',
  ].join('\n')
}
