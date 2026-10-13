/**
 * Save the Plumber front-end campaign data: the eight worlds, their four
 * authored stages and bosses, the cast, the enemy toy box and the three
 * power disciplines. Mirrors conductor projects/save-the-plumber/WORLD-ATLAS.md
 * and DESIGN-BRIEF.md; these are design targets, and only the stage flagged
 * `playable` exists as code today (the Bluebell movement lab).
 */

export type StageBeat = 'Introduce' | 'Combine' | 'Subvert' | 'Boss'

export type PlumberStage = {
  code: string
  name: string
  beat: StageBeat
  idea: string
  playable?: boolean
}

export type PlumberWorld = {
  id: number
  slug: string
  name: string
  tagline: string
  mechanic: string
  boss: { name: string; tell: string }
  enemies: string[]
  stages: PlumberStage[]
  palette: {
    skyTop: string
    skyBottom: string
    far: string
    ground: string
    accent: string
    ink: string
  }
  /** Painted vignette, rendered through the art queue; SVG scene until then. */
  art: string
}

const ART_ROOT = '/images/arcade/save-the-plumber'

const beats: StageBeat[] = ['Introduce', 'Combine', 'Subvert', 'Boss']

function stages(
  world: number,
  rows: [string, string][],
  playable?: number,
): PlumberStage[] {
  return rows.map(([name, idea], index) => ({
    code: `${world}-${index + 1}`,
    name,
    beat: beats[index]!,
    idea,
    ...(playable === index ? { playable: true } : {}),
  }))
}

export const PLUMBER_WORLDS: PlumberWorld[] = [
  {
    id: 1,
    slug: 'bluebell-pipeworks',
    name: 'Bluebell Pipeworks',
    tagline: 'Where the first river ran uphill.',
    mechanic: 'Momentum, garden valves and rising pistons',
    boss: {
      name: 'Madame Pressure',
      tell: 'Her gauge needle swings to red a full beat before each steam burst.',
    },
    enemies: ['Pumpbugs', 'Rivet rollers'],
    stages: stages(
      1,
      [
        ['Rainy Courtyard', 'Learn to run, leap and bop baby pumpbugs.'],
        ['Copper Greenhouses', 'Rising pistons lift you through glass.'],
        ['Buried Meter', 'A secret route and stairs that move on you.'],
        ['The Pump Tower', 'Climb the tower and out-think Madame Pressure.'],
      ],
      0,
    ),
    palette: {
      skyTop: '#7fd3d1',
      skyBottom: '#fdf0cf',
      far: '#a7d9c4',
      ground: '#2f6f68',
      accent: '#f5bb83',
      ink: '#123c44',
    },
    art: `${ART_ROOT}/world-1-bluebell-pipeworks.webp`,
  },
  {
    id: 2,
    slug: 'tideglass-marina',
    name: 'Tideglass Marina',
    tagline: 'The harbour drains into the sky.',
    mechanic: 'Currents, driftwood and canal locks',
    boss: {
      name: 'Captain Barnaclejack',
      tell: 'His anchor glows before it swings, and the tide always pulls the same way.',
    },
    enemies: ['Clockwork minnows', 'Cork crabs', 'Glass gulls'],
    stages: stages(2, [
      ['Floating Wharves', 'Ride the current between bobbing piers.'],
      ['Glassboat Boneyard', 'Throw and ride driftwood across the wrecks.'],
      ['Moonpool Locks', 'The canal gates open backwards.'],
      ['Tidal Drydock', 'Board the dock and face Captain Barnaclejack.'],
    ]),
    palette: {
      skyTop: '#5ea9e3',
      skyBottom: '#d7f2fa',
      far: '#8ccbe8',
      ground: '#1f5a99',
      accent: '#ffe39b',
      ink: '#0d2f57',
    },
    art: `${ART_ROOT}/world-2-tideglass-marina.webp`,
  },
  {
    id: 3,
    slug: 'lantern-orchard',
    name: 'Lantern Orchard',
    tagline: 'Fruit that bounces. Trees that glow.',
    mechanic: 'Springfruit, carrying and dark-path tells',
    boss: {
      name: 'The Overripe Baron',
      tell: 'He wobbles and drips before every belly-slam.',
    },
    enemies: ['Moss lanterns', 'Spring hares'],
    stages: stages(3, [
      ['Apricot Slope', 'Bounce on springfruit up the hillside.'],
      ['Rootcellar', 'Carry fruit to the switches in the dark.'],
      ['Firefly Canopies', 'Follow the fireflies across unlit branches.'],
      ['Hanging Conservatory', 'Bring down the Overripe Baron.'],
    ]),
    palette: {
      skyTop: '#e98a77',
      skyBottom: '#ffd8a8',
      far: '#c86f7c',
      ground: '#5b2747',
      accent: '#ffcf5a',
      ink: '#3a1430',
    },
    art: `${ART_ROOT}/world-3-lantern-orchard.webp`,
  },
  {
    id: 4,
    slug: 'clockwork-fair',
    name: 'Clockwork Fair',
    tagline: 'Every ride is running on stolen water.',
    mechanic: 'Conveyor parades, coasters and reversible paths',
    boss: {
      name: 'Tick-Tock Duchess',
      tell: 'Her chimes count down, and the fourth chime is always the swing.',
    },
    enemies: ['Gasket golems', 'Rivet rollers'],
    stages: stages(4, [
      ['Parade Street', 'Hop between conveyor floats.'],
      ['Cottongear Coaster', 'Keep your footing on rides in motion.'],
      ['Mirror Ticket Hall', 'Paths that flip when you do.'],
      ['Clocktop Big Wheel', 'Ride the wheel to the Tick-Tock Duchess.'],
    ]),
    palette: {
      skyTop: '#f4b77f',
      skyBottom: '#fff0d4',
      far: '#e7a88d',
      ground: '#8e4a43',
      accent: '#ffe08a',
      ink: '#4a1f1d',
    },
    art: `${ART_ROOT}/world-4-clockwork-fair.webp`,
  },
  {
    id: 5,
    slug: 'cloudrail-commons',
    name: 'Cloudrail Commons',
    tagline: 'A town strung between the clouds.',
    mechanic: 'Lifts, wind corridors and falling cargo',
    boss: {
      name: 'Admiral Gust',
      tell: 'His sails fill and creak before each gale sweeps the deck.',
    },
    enemies: ['Paper kites', 'Umbrella mites'],
    stages: stages(5, [
      ['Ropeway Home', 'Time the lifts up the cliff face.'],
      ['Windmill Platform', 'Lean into the wind corridors.'],
      ['Airship Sorting Yard', 'Dodge, and use, the falling cargo.'],
      ['Thunder Station', 'Hold your ground against Admiral Gust.'],
    ]),
    palette: {
      skyTop: '#6f97df',
      skyBottom: '#e3f0fb',
      far: '#b9d3f2',
      ground: '#40609e',
      accent: '#fff3b8',
      ink: '#172d5a',
    },
    art: `${ART_ROOT}/world-5-cloudrail-commons.webp`,
  },
  {
    id: 6,
    slug: 'crystal-underworks',
    name: 'Crystal Underworks',
    tagline: 'The pipes go down before they go up.',
    mechanic: 'Reflections, lit bridges and echo gates',
    boss: {
      name: 'Prism Mole',
      tell: 'Light bends toward the spot it will burrow up through.',
    },
    enemies: ['Puddle mimics', 'Siphon sprites'],
    stages: stages(6, [
      ['Silica Steps', 'Reflections show you the way.'],
      ['Glowpipe Caverns', 'Cross bridges only while they are lit.'],
      ['Echo Sluice', 'Make noise to open the gates.'],
      ['The Geode Filter', 'Dig out the Prism Mole.'],
    ]),
    palette: {
      skyTop: '#2a1d4b',
      skyBottom: '#6a4b9a',
      far: '#4a3478',
      ground: '#221338',
      accent: '#c9b6ff',
      ink: '#f1eaff',
    },
    art: `${ART_ROOT}/world-6-crystal-underworks.webp`,
  },
  {
    id: 7,
    slug: 'night-market-rooftops',
    name: 'Night Market Rooftops',
    tagline: 'A midnight chase across the lanterns.',
    mechanic: 'Roof runs, vertical pursuit and three-way trades',
    boss: {
      name: 'The Umbrella Dragon',
      tell: 'It snaps its canopy shut right before it dives.',
    },
    enemies: ['Chimney spirits', 'Tea-kettle knights'],
    stages: stages(7, [
      ['Neon Tiles', 'Sprint the rooftops without missing a beat.'],
      ['Chimney Lantern Chase', 'Climb, and keep climbing.'],
      ['Midnight Plumbing Bazaar', 'Trade for one of three routes.'],
      ['Market Clock Spire', 'Outrun the Umbrella Dragon.'],
    ]),
    palette: {
      skyTop: '#1b1747',
      skyBottom: '#5d3b7c',
      far: '#33285e',
      ground: '#161233',
      accent: '#ff9fb8',
      ink: '#fbe9ff',
    },
    art: `${ART_ROOT}/world-7-night-market-rooftops.webp`,
  },
  {
    id: 8,
    slug: 'stardrain-citadel',
    name: 'Stardrain Citadel',
    tagline: 'Every river ends here. So does the rescue.',
    mechanic: 'Every trick you have learned, all at once',
    boss: {
      name: 'Lady Spigot',
      tell: 'Watch her valves: whichever one hisses is the one she will open.',
    },
    enemies: ['Gasket golems', 'Siphon sprites', 'Pumpbugs'],
    stages: stages(8, [
      ['Reservoir Assault', 'Master the currents one last time.'],
      ['The Pump Archives', 'Every power, every tool.'],
      ['The Sky Siphon', 'The full gauntlet, straight up.'],
      ['Valveheart', 'Face Lady Spigot, free Teo, run for it.'],
    ]),
    palette: {
      skyTop: '#1c2946',
      skyBottom: '#d99a5a',
      far: '#45507a',
      ground: '#1a2238',
      accent: '#ffcf82',
      ink: '#fff2dc',
    },
    art: `${ART_ROOT}/world-8-stardrain-citadel.webp`,
  },
]

export type PlumberCastMember = {
  key: 'teo' | 'spigot'
  name: string
  role: string
  line: string
  bio: string
  art: string
}

export const PLUMBER_CAST: PlumberCastMember[] = [
  {
    key: 'teo',
    name: 'Teo',
    role: 'The plumber',
    line: '"Water does not run uphill. Somebody is making it."',
    bio: "A freelance plumber and tinkerer who found Stardrain's safety-valve network, hid the first blueprint, and got grabbed before he could open it. He is still working from inside the machine.",
    art: `${ART_ROOT}/cast-teo.webp`,
  },
  {
    key: 'spigot',
    name: 'Lady Spigot',
    role: 'Curator of Stardrain',
    line: '"A tidy planet is a dry one, darling."',
    bio: "Stardrain's mechanical curator believes that pulling every river into her sky-pump will make the world perfectly neat. She is wrong, she is polite about it, and she has eight worlds of help.",
    art: `${ART_ROOT}/cast-lady-spigot.webp`,
  },
]

export type PlumberEnemy = {
  key: string
  name: string
  toy: string
}

/** Enemies are toys: each entry names how you can play with it. */
export const PLUMBER_ENEMIES: PlumberEnemy[] = [
  {
    key: 'pumpbug',
    name: 'Pumpbug',
    toy: 'Speeds up downhill. Bop it, or let it bowl into its friends.',
  },
  {
    key: 'rivet-roller',
    name: 'Rivet roller',
    toy: 'A runaway wheel. Stun it and throw it.',
  },
  {
    key: 'umbrella-mite',
    name: 'Umbrella mite',
    toy: 'Floats on its own rain. Close the canopy and it drops.',
  },
  {
    key: 'moss-lantern',
    name: 'Moss lantern',
    toy: 'Lights the dark for a while, then you can stand on it.',
  },
  {
    key: 'glass-gull',
    name: 'Glass gull',
    toy: 'Steals your tokens. Catch it and it drops them all.',
  },
  {
    key: 'cork-crab',
    name: 'Cork crab',
    toy: 'Plugs pipe mouths. Pop it out to open a shortcut.',
  },
]

export type PlumberPower = {
  key: string
  name: string
  does: string
}

export const PLUMBER_POWERS: PlumberPower[] = [
  {
    key: 'springstep',
    name: 'Springstep',
    does: 'Higher, floatier, more precise jumps for platform mastery.',
  },
  {
    key: 'bottled-storm',
    name: 'Bottled Storm',
    does: 'A charged burst that stuns enemies and spins machinery.',
  },
  {
    key: 'pocket-lift',
    name: 'Pocket Lift',
    does: 'Carry crates, enemies and keys, and turn them into puzzles.',
  },
]

export const PLUMBER_STAGE_COUNT = PLUMBER_WORLDS.reduce(
  (sum, world) => sum + world.stages.length,
  0,
)
