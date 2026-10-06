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
  {
    slug: 'rescue-rally',
    title: 'Rescue Rally',
    riffsOn: 'Robotron',
    blurb:
      'Zip around a neon arena firing a kindness beam that reboots glitched drones into friendly bots, while you rescue the people, pets and little bots wandering through the chaos for a growing bonus.',
    howTo: [
      'MOVE TO AIM',
      'A  KINDNESS BEAM',
      'HOLD B TO STRAFE',
      'RESCUE EVERYONE!',
      'AVOID THE GLITCHES',
    ],
    width: 480,
    height: 360,
    maxPlausibleScore: 5_000_000,
    titleArt: '/images/arcade/games/rescue-rally-title.webp',
    accent: '#22d3ee',
    controls: 'Move to aim, beam, strafe',
  },
  {
    slug: 'sink-suds',
    title: 'Sink Suds',
    riffsOn: 'Bubbles',
    blurb:
      'Drift a soap bubble around a robot kitchen sink, scrubbing up crumbs and grease to grow. Little bubbles fear the rust mites; big ones swallow them. Fill up on suds, then sail down the glowing drain to the next sink.',
    howTo: [
      'STEER THE BUBBLE',
      'A  PUFF OF SPEED',
      'EAT CRUMBS TO GROW',
      'BIG BUBBLES EAT MITES',
      'AVOID SCRUB BRUSHES',
      'FULL? FIND THE DRAIN!',
    ],
    width: 420,
    height: 360,
    maxPlausibleScore: 3_000_000,
    titleArt: '/images/arcade/games/sink-suds-title.webp',
    accent: '#a5f3fc',
    controls: 'Steer, puff, grow',
  },
  {
    slug: 'pipe-pals',
    title: 'Pipe Pals',
    riffsOn: 'Mario Bros.',
    blurb:
      'Grumpy critters are crawling out of the Kind Robots plumbing. Bump the floor under one to flip it, then tap it to send it home. Crab bots take two bumps, the KIND block flips the whole floor, and every fourth pipe is a bonus coin round.',
    howTo: [
      'RUN LEFT AND RIGHT',
      'A  JUMP',
      'BUMP FLOORS FROM BELOW',
      'TOUCH FLIPPED CRITTERS',
      'CRABS NEED TWO BUMPS',
      'KIND BLOCK FLIPS ALL',
    ],
    width: 448,
    height: 336,
    maxPlausibleScore: 2_000_000,
    titleArt: '/images/arcade/games/pipe-pals-title.webp',
    accent: '#4ade80',
    controls: 'Run, jump, bump',
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
  'rescue-rally': () => import('./games/rescueRally'),
  'sink-suds': () => import('./games/sinkSuds'),
  'pipe-pals': () => import('./games/pipePals'),
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
