export interface GameLinkPreview {
  title: string
  description: string
  /** Root-relative path under /public; social crawlers need raster, not SVG. */
  image: string
  /** Page path when it is not `/play/<slug>`. */
  path?: string
}

export const FALLBACK_PREVIEW_IMAGE = '/icon-512x512.png'

export const GAME_LINK_PREVIEWS: Record<string, GameLinkPreview> = {
  'crystal-street': {
    title: 'Terrors on Crystal Street | Kind Robots',
    description:
      'A free, spooky-funny neighborhood adventure. Pick your clique, meet the residents and survive the week. Plays in your browser.',
    image: '/crystal-street/endings/counselor-jess-best.webp',
  },
  ecotone: {
    title: 'Ecotone | Kind Robots',
    description:
      'A branching story of Humboldt wilds, companions and chosen family. Free to play in your browser, no account needed.',
    image: '/ecotone/scenes/prologue-meadow.webp',
  },
  'emperor-of-dust': {
    title: 'Emperor of Dust | Kind Robots',
    description:
      'Lead a band of exiles across a ruined empire. A free story game in your browser.',
    image: '/emperor-of-dust/intro/fortress.webp',
  },
  'game-of-captains': {
    title: 'Space Couch | Kind Robots',
    description:
      'Command a starship from the sofa. A free, silly-serious space adventure in your browser.',
    image: '/game-of-captains/front/splash.webp',
  },
  'comet-city-academy': {
    title: 'Prom of Doom | Capes & Tassels | Kind Robots',
    description:
      'Super-school drama, patrols and a very dangerous prom. Free to play in your browser.',
    image: '/comet-city-academy/front/splash.webp',
  },
  'rainbow-bullet-hell-space-princess': {
    title: 'Rainbow Bullet Hell Space Princess | Kind Robots',
    description:
      'A bright, brutal shoot-em-up with bosses, banter and a princess in a hurry. Free in your browser.',
    image: '/rainbow-princess-art/bosses/b08-phase1.webp',
  },
  'save-the-plumber': {
    title: 'Save the Plumber | Kind Robots Arcade',
    description:
      'A free rescue adventure across eight worlds. Plays in your browser.',
    image: '/save-the-plumber/maps/world-3.webp',
  },
  'shifting-desks': {
    title: 'Shifting Desks | Kind Robots',
    description:
      'A classroom puzzle where the furniture will not sit still. Free to play in your browser.',
    image: FALLBACK_PREVIEW_IMAGE,
  },
  'slime-city': {
    title: 'Slime City | Kind Robots',
    description:
      'Brawl, scheme and campaign through a city of slimes. Quick CPU matches and story campaigns, free in your browser, no account needed.',
    image: FALLBACK_PREVIEW_IMAGE,
  },
  'zuzu-gamebook': {
    title: 'Zuzu: Koala Assassin | The Bell That Never Rang',
    description:
      'An illustrated choose-your-path gamebook starring a koala assassin. Free to read and play.',
    image: '/zuzu-gamebook/scenes/ripples.webp',
  },
  'zuzu-showdown': {
    title: 'Zuzu Showdown | Kind Robots',
    description: 'Duels with Zuzu and friends. Free to play in your browser.',
    image: '/zuzu-showdown-art/hall-card.webp',
  },
  'zuzu-shifting-lands': {
    title: 'Zuzu: Shifting Lands | Kind Robots',
    description:
      'Draw a card, shape the land and see what the road asks of you. A free card journey in your browser.',
    image: '/shifting-lands/cards/one-place-by-the-fire.webp',
  },
  'zuzu-ghost-trail': {
    title: 'Zuzu Ghost Trail | Kind Robots',
    description:
      'Follow a koala through a haunted trail of lantern light. A free arcade cabinet in your browser.',
    image: '/crystal-street/scenes/deck-paranormal-ghost-light.webp',
  },
  aquarium: {
    title: 'Cthulhuquarium | Public Tanks | Kind Robots',
    description:
      'Browse tanks of strange, friendly deep-sea creatures built by players. Free to look around, no account needed.',
    image: '/cthulhuquarium-front/hero.webp',
    path: '/play/aquarium/browse',
  },
  'butterfly-gallery': {
    title: 'Butterfly Gallery | Kind Robots',
    description:
      'A gallery of butterflies and kind robots, drifting in motion. Free to browse in your browser.',
    image: '/butterfly-gallery-motion/butterfly-loop.webp',
    path: '/butterfly-gallery',
  },
  mandarin: {
    title: 'Mandarin Tutor | Kind Robots',
    description:
      'Practise Mandarin sounds, words and tones with a patient robot tutor. Free to try in your browser.',
    image: FALLBACK_PREVIEW_IMAGE,
    path: '/play/mandarin',
  },
  arcade: {
    title: 'Kind Robots Arcade | Free Browser Games',
    description:
      'A hall of free arcade cabinets with worldwide high scores. No account needed to play.',
    image: '/save-the-plumber/maps/world-3.webp',
  },
  'zuzu-pinball': {
    title: 'Zuzu Pinball: Last Bell | Kind Robots',
    description:
      'A story-driven pinball table with a ringing secret. Free to play in your browser.',
    image: '/zuzu-pinball/last-bell-cover.webp',
  },
}

export function gameLinkPreviewMeta(slug: string, origin: string) {
  const p = GAME_LINK_PREVIEWS[slug]
  if (!p) return null
  const base = origin.replace(/\/+$/, '')
  const image = `${base}${p.image}`
  return {
    title: p.title,
    description: p.description,
    ogTitle: p.title,
    ogDescription: p.description,
    ogType: 'website' as const,
    ogUrl: `${base}${p.path ?? `/play/${slug}`}`,
    ogImage: image,
    twitterCard: 'summary_large_image' as const,
    twitterTitle: p.title,
    twitterDescription: p.description,
    twitterImage: image,
  }
}
