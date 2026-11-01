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
    image: '/emperor-of-dust/intro/fortress.webp',
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
    route: '/play/ecotone',
    image: '/ecotone/title/key-art.webp',
    title: 'Ecotone: Weird Humboldt',
    description:
      'A strange Humboldt festival weekend where your choices shape the county.',
  },
  {
    route: '/play/shifting-desks',
    image: '/images/shifting-desks/endings/the-kind-rewrite.webp',
    title: 'Shifting Desks',
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
    image: '/images/background/memorydungeon.webp',
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
    route: '/storybook',
    image: '/storybook-art/dashboard-highlight.webp',
    title: 'Storybook',
    description: 'Weave your own worlds, characters and branching tales.',
  },
  {
    route: '/art',
    image: '/images/art/generate.webp',
    title: 'Art Gallery & Studio',
    description: 'Browse finished work, or sign in to generate your own.',
  },
]

export const SITEMAP_PATHS: readonly string[] = [
  '/',
  '/about',
  '/giving',
  '/navigation',
  ...SHARE_PREVIEWS.map((preview) => preview.route),
]

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
