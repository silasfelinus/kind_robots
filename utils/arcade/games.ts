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
  {
    slug: 'timber-bot',
    title: 'Timber Bot',
    riffsOn: 'Timber',
    blurb:
      'A storm left the grove full of dead trees. Chop every trunk down a log at a time before the clock runs out, duck the grumpy bees, and step clear when a treetop creaks. Plant a sapling in every stump for a green-grove bonus.',
    howTo: [
      'WALK LEFT AND RIGHT',
      'A  CHOP OR PLANT',
      'DOWN  DUCK THE BEES',
      'CREAK? STEP ASIDE!',
      'CLEAR EVERY TRUNK',
      'PLANT STUMPS FOR BONUS',
    ],
    width: 420,
    height: 360,
    maxPlausibleScore: 3_000_000,
    titleArt: '/images/arcade/games/timber-bot-title.webp',
    accent: '#86efac',
    controls: 'Walk, chop, duck',
  },
  {
    slug: 'butterfly-joust',
    title: 'Butterfly Joust',
    riffsOn: 'Joust',
    blurb:
      'Ride a rainbow butterfly over the pond and joust the grumpy moth riders. Whoever is higher wins: bonk them from above and they curl into cocoons you can scoop up before they hatch. Dawdle too long and a storm cloud comes hunting.',
    howTo: [
      'TAP A TO FLAP',
      'STEER LEFT AND RIGHT',
      'HIGHER RIDER WINS',
      'SCOOP UP THE COCOONS',
      'MIND THE POND',
      'BONK STORMS FROM ABOVE',
    ],
    width: 448,
    height: 336,
    maxPlausibleScore: 5_000_000,
    titleArt: '/images/arcade/games/butterfly-joust-title.webp',
    accent: '#f9a8d4',
    controls: 'Flap, steer, joust',
  },
  {
    slug: 'kind-pinball',
    title: 'Kind Pinball',
    riffsOn: 'pinball',
    blurb:
      'AMI Village Rescue, a full Kind Robots pinball table with a dot-matrix display, two crossing ramps and two orbits. Plunge into the blinking lane for the skill shot. Roll through the N-E-T lanes to raise your bonus, hit the A-M-I targets to ready the saucer, then shoot the saucer to light a village. Light all five villages for the jackpot. Every third ramp shot starts a timed mode; play all four for the super jackpot. Chain ramps and orbits for combos. The third village lights AMI multiball: three balls, and every ramp or saucer shot flies a mosquito net to a village.',
    howTo: [
      'LEFT/RIGHT  FLIPPERS',
      'A  BOTH FLIPPERS',
      'HOLD DOWN, LET GO',
      'UP  NUDGE THE TABLE',
      'BLINKING LANE = SKILL',
      'A-M-I READIES SAUCER',
      '5 VILLAGES = JACKPOT',
      '3 RAMPS START A MODE',
      'RAMP + ORBIT = COMBO',
      '3 VILLAGES = MULTIBALL',
    ],
    width: 288,
    height: 488,
    maxPlausibleScore: 50_000_000,
    titleArt: '/images/arcade/games/kind-pinball-title.webp',
    accent: '#facc15',
    controls: 'Flip, plunge, nudge',
  },
  {
    slug: 'gloom-invaders',
    title: 'Gloom Invaders',
    riffsOn: 'Space Invaders',
    blurb:
      'Rows of grumpy gloom clouds march down the sky. Shine sunbeams up at them to turn each one into a smiling rain cloud that waters the garden, and shelter under rainbow umbrellas that wear away. Each wave starts lower and marches faster, and a rainbow kite crosses the top for a mystery bonus.',
    howTo: [
      'LEFT/RIGHT  MOVE',
      'A OR UP  SUNBEAM',
      'ONE BEAM AT A TIME',
      'UMBRELLAS WEAR AWAY',
      'KITE = MYSTERY BONUS',
    ],
    width: 288,
    height: 384,
    maxPlausibleScore: 2_000_000,
    titleArt: '/images/arcade/games/gloom-invaders-title.webp',
    accent: '#fde047',
    controls: 'Move, shine',
  },
  {
    slug: 'hedgehog-crossing',
    title: 'Hedgehog Crossing',
    riffsOn: 'Frogger',
    blurb:
      'Walk a family of hedgehogs home, one at a time: across a busy road of robot traffic, then over a creek of drifting logs and paddling turtles to the five burrows in the hedge. Turtles dive, a fox snoozes in a burrow from level two, and a ladybug visits for a bonus.',
    howTo: [
      'ARROWS  HOP',
      'A  HOP FORWARD',
      'RIDE LOGS AND TURTLES',
      'TURTLES DIVE!',
      'FILL ALL 5 BURROWS',
      'DONT WAKE THE FOX',
    ],
    width: 280,
    height: 320,
    maxPlausibleScore: 2_000_000,
    titleArt: '/images/arcade/games/hedgehog-crossing-title.webp',
    accent: '#86efac',
    controls: 'Hop',
  },
  {
    slug: 'ribbon-riders',
    title: 'Ribbon Riders',
    riffsOn: 'Tron light cycles',
    blurb:
      'Ride a light-bike that unrolls a glowing rainbow ribbon. Anyone who bumps into a ribbon or the wall is out of the round, so box the rival riders in before you bump into something yourself. Each round brings another rival, smarter steering, faster bikes and an arena wall that closes in.',
    howTo: [
      'ARROWS  STEER',
      'HOLD A  TURBO',
      'DONT BUMP A RIBBON',
      'BOX THE RIVALS IN',
      'THE WALL CLOSES IN',
    ],
    width: 288,
    height: 312,
    maxPlausibleScore: 5_000_000,
    titleArt: '/images/arcade/games/ribbon-riders-title.webp',
    accent: '#22d3ee',
    controls: 'Steer, turbo',
  },
  {
    slug: 'burrow-buddy',
    title: 'Burrow Buddy',
    riffsOn: 'Dig Dug',
    blurb:
      'Tunnel through a garden in layers of soil. Puff bubbles at grumpy grubs until they swell up and float gently away, or dig under a turnip and drop it on a whole group for a bonus. Grubs drift through the soil as ghosts when they get bored, beetles breathe fire from the second garden, and two turnips bring out a veggie bonus.',
    howTo: [
      'ARROWS  DIG',
      'A  PUFF BUBBLES',
      'PUFF 4 TIMES = POP',
      'DROP TURNIPS ON GRUBS',
      'WATCH FOR FIRE',
    ],
    width: 256,
    height: 262,
    maxPlausibleScore: 5_000_000,
    titleArt: '/images/arcade/games/burrow-buddy-title.webp',
    accent: '#fb923c',
    controls: 'Dig, puff',
  },
  {
    slug: 'repair-rampage',
    title: 'Repair Rampage',
    riffsOn: 'Rampage',
    blurb:
      'A storm has wrecked the city. Bolt, a giant friendly robot, climbs the towers and fixes them window by window, rescues kittens from the ledges and shoos the news drones whose flashbulbs dazzle it off the wall. Broken towers wobble and fall if you dawdle, and every dazzle, long drop and fallen tower costs charge.',
    howTo: [
      'LEFT/RIGHT  WALK',
      'UP AT A TOWER  CLIMB',
      'A  FIX A WINDOW',
      'A BY A DRONE  SHOO IT',
      'FIX THE WINDOW = KITTEN',
      'WOBBLING TOWERS FALL!',
    ],
    width: 320,
    height: 240,
    maxPlausibleScore: 5_000_000,
    titleArt: '/images/arcade/games/repair-rampage-title.webp',
    accent: '#f87171',
    controls: 'Climb, fix, shoo',
  },
  {
    slug: 'kindness-gauntlet',
    title: 'Kindness Gauntlet',
    riffsOn: 'Gauntlet II',
    blurb:
      'Choose your repair bot (mighty Hugs, sturdy Fix, magical Sage or speedy Zip) and explore a glitchy old server dungeon floor by floor. Throw wrench sparks to fix the glitches swarming out of broken generators, shut the generators down, free the bots trapped in cages, find the keys to the locked doors, and reach the stairs. The battery drains all the time and faster when glitches cling on, so grab the snacks. Up to four can play on one device: roll up to a flat partner to share a charge.',
    howTo: [
      'PICK HUGS FIX SAGE OR ZIP',
      'ARROWS  MOVE',
      'A  SPARKS  HOLD A TO AIM',
      'B  KINDNESS PULSE',
      'SHUT DOWN GENERATORS',
      'SNACKS RECHARGE YOU',
      'KEYS OPEN LOCKED DOORS',
      'CO-OP: SHARE A CHARGE',
    ],
    width: 320,
    height: 240,
    maxPlausibleScore: 10_000_000,
    titleArt: '/images/arcade/games/kindness-gauntlet-title.webp',
    accent: '#fbbf24',
    controls: 'Pick a bot, move, spark, pulse',
    maxPlayers: 4,
  },
  {
    slug: 'prize-show-panic',
    title: 'Prize Show Panic',
    riffsOn: 'Smash TV',
    blurb:
      "A robot game show where the studio floods with party crashers. Spray the confetti cannon and the crashers get happy and dance off the set, grab the prizes that drop, and reach the exit before the host's countdown runs out. Every fourth studio ends with a parade float.",
    howTo: [
      'ARROWS  MOVE',
      'A  CONFETTI CANNON',
      'HOLD B  LOCK YOUR AIM',
      'GRAB THE PRIZES',
      'BEAT THE COUNTDOWN',
    ],
    width: 320,
    height: 240,
    maxPlausibleScore: 20_000_000,
    titleArt: '/images/arcade/games/prize-show-panic-title.webp',
    accent: '#e879f9',
    controls: 'Move, spray, lock aim',
  },
  {
    slug: 'zuzu-ghost-trail',
    title: 'Zuzu: Ghost Trail',
    riffsOn: "Ghosts 'n Goblins",
    blurb:
      'Zuzu, the koala ronin, walks four haunted weird-west trails (a ghost town at dusk, the bone yard, a drowned watering hole and the old bell tower), throwing kunai at restless spirits clawing up from the dirt, storm crows and bone hyenas. The first hit knocks his poncho and kasa off; a second sends him back to the checkpoint. Crates and the bundles some crows carry hold new gear: three-way shuriken, a boomerang kasa, a lantern that leaves a ground fire, or the short, strong iai cut. At the mission gate a boss from the thin places blocks the way: the whirling Dust Devil or the charging Bone Bull. Jumps are committed once he leaves the ground.',
    howTo: [
      'LEFT/RIGHT  WALK',
      'UP OR B  JUMP',
      'A  THROW OR CUT',
      'ONE HIT LOSES THE PONCHO',
      'BREAK CRATES FOR A NEW ONE',
      'CROWS AND CRATES HOLD GEAR',
      'A BOSS GUARDS THE GATE',
    ],
    width: 320,
    height: 240,
    maxPlausibleScore: 5_000_000,
    titleArt: '/images/arcade/games/zuzu-ghost-trail-title.webp',
    accent: '#ea580c',
    controls: 'Walk, jump, throw, cut',
  },
  {
    slug: 'station-sweep',
    title: 'Station Sweep',
    riffsOn: 'Xenophobe',
    blurb:
      'Mop, the station cleaning robot, sweeps a space station overrun by glitch critters, deck by deck. Egg sacs hatch rollers that bowl along the floor (crouch to sweep them), biters that spit, and ceiling crawlers that drop and cling until Mop jumps. Critters left alone grow big, and the station is on a clock. Ride the lifts between decks; clean every one before time runs out. Up to three can sweep on one device, split screen, each on a deck of their own.',
    howTo: [
      'LEFT/RIGHT  WALK',
      'DOWN  CROUCH, SWEEP LOW',
      'UP OR B  JUMP',
      'A  SWEEPER BEAM',
      'JUMP TO SHAKE CRAWLERS',
      'IN A LIFT UP OR DOWN RIDES',
      'CLEAN EVERY DECK IN TIME',
      'UP TO 3: SPLIT SCREEN',
    ],
    width: 320,
    height: 240,
    maxPlausibleScore: 10_000_000,
    titleArt: '/images/arcade/games/station-sweep-title.webp',
    accent: '#34d399',
    controls: 'Walk, crouch, jump, sweep, ride',
    maxPlayers: 3,
  },
  {
    slug: 'rain-catcher',
    title: 'Rain Catcher',
    riffsOn: 'Missile Command',
    blurb:
      'Storm clouds drop hailstones toward six seedling beds. Steer the sight and pop rainbow umbrella bursts from three sprout launchers to catch the hail in midair. Hail splits, a grumpy thunder-goose drops more, and lightning sprites swerve around your umbrellas. Spare umbrellas and saved beds pay a bonus between waves.',
    howTo: [
      'ARROWS  MOVE THE SIGHT',
      'A OR B  UMBRELLA BURST',
      'BURSTS CATCH THE HAIL',
      'NEAREST LAUNCHER FIRES',
      'SAVE THE SEEDLINGS',
      'BEDS REGROW EVERY 10000',
    ],
    width: 320,
    height: 240,
    maxPlausibleScore: 3_000_000,
    titleArt: '/images/arcade/games/rain-catcher-title.webp',
    accent: '#38bdf8',
    controls: 'Aim, burst',
  },
  {
    slug: 'brick-bloom',
    title: 'Brick Bloom',
    riffsOn: 'Breakout / Arkanoid',
    blurb:
      'A paddle bot bounces a pollen ball into walls of glitch crates, and every crate cracked frees a flower. Where the ball meets the paddle sets its angle. Catch falling seeds for a wide paddle, a sticky paddle, three balls or a calmer ball. Tough crates take several hits, bolted crates never break, and a drifting gloom puff knocks the ball off course.',
    howTo: [
      'LEFT/RIGHT  MOVE',
      'A  LAUNCH THE BALL',
      'EDGES ANGLE IT',
      'SEEDS  W S M C +',
      'BOLTS NEVER BREAK',
      'CRACK EVERY CRATE',
    ],
    width: 256,
    height: 320,
    maxPlausibleScore: 3_000_000,
    titleArt: '/images/arcade/games/brick-bloom-title.webp',
    accent: '#f472b6',
    controls: 'Move, launch',
  },
  {
    slug: 'seed-lander',
    title: 'Seed Lander',
    riffsOn: 'Lunar Lander',
    blurb:
      'Pilot a seed pod down onto the garden pads of a windy hillside, leaning and puffing to slow the fall. Land soft, slow and level to plant the seed; the narrower the pad, the bigger the bloom. Every planting refills a little sunlight and moves on to a rougher, gustier hill.',
    howTo: [
      'LEFT/RIGHT  LEAN',
      'UP OR A  PUFF',
      'LAND SLOW AND LEVEL',
      'GREEN GAUGES = SAFE',
      'NARROW PADS PAY MORE',
      'WATCH THE WIND',
    ],
    width: 320,
    height: 240,
    maxPlausibleScore: 2_000_000,
    titleArt: '/images/arcade/games/seed-lander-title.webp',
    accent: '#84cc16',
    controls: 'Lean, puff',
  },
  {
    slug: 'pixel-hop',
    title: 'Pixel Hop',
    riffsOn: 'Q*bert',
    blurb:
      'Hop a pyramid of tiles diagonally and repaint every top to the target colour. Gumballs bounce down from the top, and a purple one hatches into Boing, a grumpy spring bot who follows you hop by hop; lure him off the edge from a floating disc. Green gumballs freeze everyone, and the repaint gremlin undoes your work until you catch it.',
    howTo: [
      'UP  HOP UP-RIGHT',
      'RIGHT  HOP DOWN-RIGHT',
      'DOWN  HOP DOWN-LEFT',
      'LEFT  HOP UP-LEFT',
      'PAINT EVERY TILE',
      'DISCS RIDE TO THE TOP',
      'GREEN = FREEZE',
    ],
    width: 256,
    height: 240,
    maxPlausibleScore: 3_000_000,
    titleArt: '/images/arcade/games/pixel-hop-title.webp',
    accent: '#fb923c',
    controls: 'Hop diagonally',
  },
  {
    slug: 'glitch-garden',
    title: 'Glitch Garden',
    riffsOn: 'Centipede',
    blurb:
      'A long glitch-worm winds down through a garden of glitchy mushroom lamps. Spray fix-it beams up from the flowerbed: every fixed segment drops out as a sprout and the worm splits, and sprayed lamps and sprouts bloom into flowers. A beetle zig-zags through the bed nibbling lamps, and a moth dives down planting new ones.',
    howTo: [
      'ARROWS  MOVE',
      'A  FIX-IT SPRAY',
      'FIX EVERY SEGMENT',
      'WORMS SPLIT IN TWO',
      'SPRAY LAMPS TO BLOOM',
      'MIND THE BEETLE',
    ],
    width: 240,
    height: 304,
    maxPlausibleScore: 3_000_000,
    titleArt: '/images/arcade/games/glitch-garden-title.webp',
    accent: '#a855f7',
    controls: 'Move, spray',
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
export const COMING_SOON: ComingSoonCabinet[] = []

/**
 * Unlisted preview cabinets: playable by direct link
 * (/play/arcade?game=<slug>) but not shown in the hall or the hall of fame,
 * and with no plausible score, so they never post to a leaderboard. Kind
 * Pinball's 3D rebuild lives here until it replaces the Canvas table
 * (conductor kind-pinball/t-004; the Canvas game is the rollback path).
 */
export const PREVIEW_GAMES: ArcadeGameMeta[] = [
  {
    slug: 'kind-pinball-3d',
    title: 'Kind Pinball 3D',
    riffsOn: 'pinball',
    blurb:
      'A preview of the 3D Kind Pinball table: a real perspective playfield with a steel ball, flippers and pop bumpers on a physics engine. Greybox for now; the full AMI Village Rescue table is being built on it.',
    howTo: [
      'LEFT/RIGHT  FLIPPERS',
      'A  BOTH FLIPPERS',
      'HOLD DOWN, LET GO',
      'UP  NUDGE THE TABLE',
      '3D PREVIEW: NO SCORES',
    ],
    width: 360,
    height: 640,
    maxPlausibleScore: 0,
    titleArt: '/images/arcade/games/kind-pinball-title.webp',
    accent: '#facc15',
    controls: 'Flip, plunge, nudge',
    renderMode: 'webgl',
  },
]

const LOADERS: Record<string, () => Promise<ArcadeGameModule>> = {
  'butterfly-blaster': () => import('./games/butterflyBlaster'),
  'battery-maze': () => import('./games/batteryMaze'),
  'rescue-rally': () => import('./games/rescueRally'),
  'sink-suds': () => import('./games/sinkSuds'),
  'pipe-pals': () => import('./games/pipePals'),
  'timber-bot': () => import('./games/timberBot'),
  'butterfly-joust': () => import('./games/butterflyJoust'),
  'kind-pinball': () => import('./games/kindPinball'),
  'gloom-invaders': () => import('./games/gloomInvaders'),
  'hedgehog-crossing': () => import('./games/hedgehogCrossing'),
  'ribbon-riders': () => import('./games/ribbonRiders'),
  'burrow-buddy': () => import('./games/burrowBuddy'),
  'repair-rampage': () => import('./games/repairRampage'),
  'kindness-gauntlet': () => import('./games/kindnessGauntlet'),
  'prize-show-panic': () => import('./games/prizeShowPanic'),
  'zuzu-ghost-trail': () => import('./games/zuzuGhostTrail'),
  'station-sweep': () => import('./games/stationSweep'),
  'rain-catcher': () => import('./games/rainCatcher'),
  'brick-bloom': () => import('./games/brickBloom'),
  'seed-lander': () => import('./games/seedLander'),
  'pixel-hop': () => import('./games/pixelHop'),
  'glitch-garden': () => import('./games/glitchGarden'),
  'kind-pinball-3d': () =>
    import('./games/kindPinball3d').then(async (module) => {
      await module.prepare()
      return module
    }),
}

export function findArcadeGame(slug: string): ArcadeGameMeta | undefined {
  return (
    ARCADE_GAMES.find((game) => game.slug === slug) ??
    PREVIEW_GAMES.find((game) => game.slug === slug)
  )
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
