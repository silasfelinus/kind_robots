// /utils/arcade/games.ts
//
// The Kind Robots Arcade registry. Adding a cabinet = one module under
// ./games/ plus one row here (and one loader). Metadata stays free of canvas
// code so the scores API can import it to validate submissions.
//
// The build queue lives in conductor projects/kr-arcade/games.yaml; queued
// games appear in the hall as "coming soon" cabinets.

import type { ArcadeGameMeta, ArcadeGameModule } from './types'

export const ARCADE_GAMES: ArcadeGameMeta[] = [
  {
    slug: 'butterfly-blaster',
    title: 'Butterfly Blaster',
    riffsOn: 'Asteroids',
    blurb:
      'Fly a rainbow butterfly through the night sky and break up the mosquito swarms before they reach the village. Every wave you clear keeps a village safe.',
    howTo: [
      'LEFT/RIGHT  TURN',
      'UP  FLUTTER FORWARD',
      'A  SPARKLE   B  HOP',
      'BIG SWARMS SPLIT!',
      "CATCH AMI'S NETS",
    ],
    width: 480,
    height: 360,
    maxPlausibleScore: 2_000_000,
    titleArt: '/images/arcade/games/butterfly-blaster-title.webp',
    accent: '#f472b6',
    controls: 'Turn, flutter, sparkle, hop',
  },
  {
    slug: 'battery-maze',
    title: 'Battery Maze',
    riffsOn: 'Pac-Man',
    blurb:
      'Steer a little cat-eared robot through the maze, gathering energy sparks while four glitch gremlins hunt it. Grab a power cell and the gremlins go sleepy: bump one to reboot it back to the charging dock.',
    howTo: [
      'STEER THE ROBOT',
      'EAT EVERY SPARK',
      'POWER CELLS MAKE',
      'THE GREMLINS SLEEPY',
      'BUMP SLEEPY ONES!',
    ],
    width: 322,
    height: 340,
    maxPlausibleScore: 3_000_000,
    titleArt: '/images/arcade/games/battery-maze-title.webp',
    accent: '#facc15',
    controls: 'Steer through the maze',
  },
]

export type ComingSoonCabinet = {
  slug: string
  title: string
  riffsOn: string
  accent: string
  /** Title art, once the art pipeline has rendered it. */
  titleArt?: string
}

// Mirrors the queued rows of conductor projects/kr-arcade/games.yaml.
export const COMING_SOON: ComingSoonCabinet[] = [
  {
    slug: 'rescue-rally',
    title: 'Rescue Rally',
    riffsOn: 'Robotron',
    accent: '#22d3ee',
    titleArt: '/images/arcade/games/rescue-rally-title.webp',
  },
  {
    slug: 'sink-suds',
    title: 'Sink Suds',
    riffsOn: 'Bubbles',
    accent: '#a5f3fc',
  },
  {
    slug: 'pipe-pals',
    title: 'Pipe Pals',
    riffsOn: 'Mario Bros.',
    accent: '#4ade80',
  },
  {
    slug: 'timber-bot',
    title: 'Timber Bot',
    riffsOn: 'Timber',
    accent: '#fb923c',
  },
  {
    slug: 'butterfly-joust',
    title: 'Butterfly Joust',
    riffsOn: 'Joust',
    accent: '#c084fc',
  },
  {
    slug: 'kind-pinball',
    title: 'Kind Pinball',
    riffsOn: 'Pinball',
    accent: '#f472b6',
  },
  {
    slug: 'kindness-gauntlet',
    title: 'Kindness Gauntlet',
    riffsOn: 'Gauntlet II',
    accent: '#fbbf24',
  },
]

const LOADERS: Record<string, () => Promise<ArcadeGameModule>> = {
  'butterfly-blaster': () => import('./games/butterflyBlaster'),
  'battery-maze': () => import('./games/batteryMaze'),
}

export function findArcadeGame(slug: string): ArcadeGameMeta | undefined {
  return ARCADE_GAMES.find((game) => game.slug === slug)
}

export function loadArcadeGame(slug: string): Promise<ArcadeGameModule> {
  const loader = LOADERS[slug]
  if (!loader) return Promise.reject(new Error(`Unknown arcade game: ${slug}`))
  return loader()
}

export function isPlausibleScore(slug: string, score: unknown): boolean {
  const game = findArcadeGame(slug)
  return (
    Boolean(game) &&
    typeof score === 'number' &&
    Number.isInteger(score) &&
    score > 0 &&
    score <= game!.maxPlausibleScore
  )
}
