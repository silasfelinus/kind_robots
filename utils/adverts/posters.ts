// /utils/adverts/posters.ts
//
// The social-media advert posters ("splashes") for every Play game and the
// Arcade, as one typed registry. Silas, 2026-11-15 PT: "give me an admin page
// that permanently displays, builds, and where I can submit requests to edit
// or queue art changes". pages/admin/adverts.vue renders these through
// components/adverts/advert-poster.vue at their native 1080x1350 size and
// exports PNGs at 2x; stores/advertStore.ts swaps in chosen slot art.
//
// Every hero and card image is an art slot `adverts/<poster>/<image>`. The
// default source below is what the poster shows until an admin chooses a
// render for that slot in the Advert Studio (or /admin/art-slots). Wall images
// (Arcade, Hybridizer) are fixed collages, not slots.
//
// `asset:<path>` sources are files under assets/images bundled by Vite; the
// store resolves them through its own import.meta.glob.
//
// Copy is the poster configs' copy verbatim, except: the Hybridizer chips say
// browsing is free without an account; Downward Mobility keeps the original
// Shifting Desks route, so its hook no longer repeats the former title.
// Slime City, Crystal Street and Downward Mobility use new hero renders.

export const ADVERT_PROJECT_SLUG = 'adverts'
export const ADVERT_SLOT_PREFIX = 'adverts/'
export const ADVERT_STUDIO_COVER_SLOT = 'adverts/studio/hero'
export const ADVERT_REQUEST_KEY_PREFIX = 'advert-studio:'
export const ADVERT_POSTER_WIDTH = 1080
export const ADVERT_POSTER_HEIGHT = 1350
export const ADVERT_EXPORT_PIXEL_RATIO = 2
export const ADVERT_LOGO_SRC = '/icon-512x512.png'
export const ADVERT_SITE_HOST = 'kindrobots.org'
export const ADVERT_MAX_CHIPS = 5

export const ADVERT_SLOT_NAMES = ['hero', 'card-1', 'card-2', 'card-3'] as const
export type AdvertSlotName = (typeof ADVERT_SLOT_NAMES)[number]
export const ADVERT_SLOT_KEY_PATTERN =
  /^adverts\/([a-z0-9][a-z0-9-]*)\/(hero|card-[123])$/

export const ADVERT_ENGINES = ['krea2', 'flux2', 'zimage'] as const
export type AdvertEngine = (typeof ADVERT_ENGINES)[number]
export const ADVERT_DEFAULT_ENGINE: AdvertEngine = 'krea2'
export const ADVERT_HERO_SIZE = { width: 1344, height: 768 } as const
export const ADVERT_CARD_SIZE = { width: 1024, height: 1024 } as const

export const ADVERT_EDIT_FIELDS = [
  'headline',
  'stat',
  'chips',
  'cards',
  'colors',
  'other',
] as const
export type AdvertEditField = (typeof ADVERT_EDIT_FIELDS)[number]

export type AdvertSlot = {
  name: AdvertSlotName
  key: string
  label: string
  defaultSrc: string
  position: string
  prompt: string
  width: number
  height: number
}

export type AdvertCard = {
  label: string
  slot: AdvertSlot
  labelSize: number | null
  tag: [string, string] | null
  glow: string | null
}

export type AdvertPalette = {
  bg: string
  a1: string
  a2: string
  a3: string
  ink: string
}

export type AdvertCopy = {
  ribbon: string
  kicker: string
  title: string
  title2: string
  statValue: string
  statUnit: string
  hook: string
  hookHighlight: string
  blurb: string
  chips: string[]
  strip: string[]
}

export type AdvertType = {
  fontQuery: string
  titleFont: string
  titleSize: number
  titleSpacing: string
  titleGradient: boolean
  statSize: number
  hookSize: number
  urlSize: number
}

export type AdvertLayout = {
  heroHeight: number
  heroPosition: string
  cardsTop: number
  cardsScale: number
  contentTop: number
  contentBottom: number
  contentGap: number
}

export type AdvertPoster = {
  slug: string
  name: string
  variant: 'splash' | 'arcade'
  path: string
  conductorSlug: string
  style: string
  copy: AdvertCopy
  palette: AdvertPalette
  type: AdvertType
  layout: AdvertLayout
  hero: AdvertSlot | null
  wall: string[]
  cards: AdvertCard[]
}

export function advertPlayPath(poster: AdvertPoster): string {
  return `/play${poster.path}`
}

type CardInput = {
  label: string
  src: string
  subject: string
  pos?: string
  size?: number
  tag?: [string, string]
  glow?: string
}

type PosterInput = {
  slug: string
  name: string
  variant?: 'splash' | 'arcade'
  path: string
  conductorSlug: string
  style: string
  hero?: { src: string; subject: string; pos?: string }
  wall?: string[]
  cards: [CardInput, CardInput, CardInput]
  copy: Partial<AdvertCopy> &
    Pick<
      AdvertCopy,
      'title' | 'statValue' | 'statUnit' | 'hook' | 'hookHighlight' | 'blurb'
    >
  palette: Partial<AdvertPalette>
  type?: Partial<AdvertType>
  layout?: Partial<AdvertLayout>
}

const DEFAULT_PALETTE: AdvertPalette = {
  bg: '#120a26',
  a1: '#f472b6',
  a2: '#facc15',
  a3: '#22d3ee',
  ink: '#ffffff',
}

const DEFAULT_TYPE: AdvertType = {
  fontQuery: 'Bungee+Shade',
  titleFont: "'Bungee Shade',sans-serif",
  titleSize: 150,
  titleSpacing: '2px',
  titleGradient: true,
  statSize: 96,
  hookSize: 42,
  urlSize: 36,
}

const DEFAULT_LAYOUT: AdvertLayout = {
  heroHeight: 780,
  heroPosition: 'center',
  cardsTop: 380,
  cardsScale: 1,
  contentTop: 690,
  contentBottom: 168,
  contentGap: 26,
}

const BASE_FONT_QUERY =
  'family=Press+Start+2P&family=Baloo+2:wght@600;700;800&family=Bungee&family=Bungee+Shade'

export function advertSlotKey(posterSlug: string, name: AdvertSlotName) {
  return `${ADVERT_SLOT_PREFIX}${posterSlug}/${name}`
}

export function parseAdvertSlotKey(
  key: string,
): { posterSlug: string; slotName: AdvertSlotName } | null {
  const match = ADVERT_SLOT_KEY_PATTERN.exec(key)
  if (!match) return null
  return { posterSlug: match[1]!, slotName: match[2] as AdvertSlotName }
}

export function heroPrompt(subject: string, style: string): string {
  return `${subject}, ${style}, wide cinematic establishing view, dramatic lighting, rich color`
}

export function cardPrompt(subject: string, style: string): string {
  return `${subject}, ${style}, square close framing, centered subject, rich color`
}

function makeSlot(
  posterSlug: string,
  name: AdvertSlotName,
  label: string,
  src: string,
  prompt: string,
  position: string,
): AdvertSlot {
  const size = name === 'hero' ? ADVERT_HERO_SIZE : ADVERT_CARD_SIZE
  return {
    name,
    key: advertSlotKey(posterSlug, name),
    label,
    defaultSrc: src,
    position,
    prompt,
    width: size.width,
    height: size.height,
  }
}

function poster(input: PosterInput): AdvertPoster {
  const type = { ...DEFAULT_TYPE, ...input.type }
  const layout = { ...DEFAULT_LAYOUT, ...input.layout }
  return {
    slug: input.slug,
    name: input.name,
    variant: input.variant ?? 'splash',
    path: input.path,
    conductorSlug: input.conductorSlug,
    style: input.style,
    copy: {
      ribbon: 'NOW OPEN TO PLAYTESTERS',
      kicker: 'KIND ROBOTS PRESENTS',
      title2: '',
      chips: [],
      strip: [],
      ...input.copy,
    },
    palette: { ...DEFAULT_PALETTE, ...input.palette },
    type,
    layout,
    hero: input.hero
      ? makeSlot(
          input.slug,
          'hero',
          'Hero',
          input.hero.src,
          heroPrompt(input.hero.subject, input.style),
          input.hero.pos ?? layout.heroPosition,
        )
      : null,
    wall: input.wall ?? [],
    cards: input.cards.map((card, index) => ({
      label: card.label,
      labelSize: card.size ?? null,
      tag: card.tag ?? null,
      glow: card.glow ?? null,
      slot: makeSlot(
        input.slug,
        `card-${index + 1}` as AdvertSlotName,
        card.label,
        card.src,
        cardPrompt(card.subject, input.style),
        card.pos ?? 'center',
      ),
    })),
  }
}

const ARCADE_WALL_SLUGS = [
  'battery-maze',
  'sink-suds',
  'pipe-pals',
  'butterfly-joust',
  'gloom-invaders',
  'hedgehog-crossing',
  'ribbon-riders',
  'burrow-buddy',
  'repair-rampage',
  'kindness-gauntlet',
  'prize-show-panic',
  'zuzu-ghost-trail',
  'station-sweep',
  'rain-catcher',
  'brick-bloom',
  'seed-lander',
  'pixel-hop',
  'glitch-garden',
  'quilt-quest',
  'cocoa-counter',
  'seed-burst',
  'lantern-swarm',
  'rover-ramble',
  'cable-crawler',
  'petal-post',
  'bumper-bubbles',
  'crate-stack-shuffle',
  'lamp-lighter-run',
  'dune-digger-dash',
  'zuzu-last-bell',
  'butterfly-blaster',
  'rescue-rally',
  'kind-pinball',
  'zuzu-ghost-trail',
]

const ARCADE_WALL_TILES = 63

function arcadeTitleArt(slug: string): string {
  return `/images/arcade/games/${slug}-title.webp`
}

const ARCADE_WALL = Array.from({ length: ARCADE_WALL_TILES }, (_, i) =>
  arcadeTitleArt(ARCADE_WALL_SLUGS[(i * 7) % ARCADE_WALL_SLUGS.length]!),
)

const ARCADE_MARQUEE = [
  'Battery Maze',
  'Sink Suds',
  'Pipe Pals',
  'Butterfly Joust',
  'Gloom Invaders',
  'Hedgehog Crossing',
  'Ribbon Riders',
  'Burrow Buddy',
  'Repair Rampage',
  'Kindness Gauntlet',
  'Prize Show Panic',
  'Butterfly Blaster',
  'Station Sweep',
  'Rain Catcher',
  'Brick Bloom',
  'Seed Lander',
  'Pixel Hop',
  'Glitch Garden',
  'Quilt Quest',
  'Cocoa Counter',
  'Seed Burst',
  'Lantern Swarm',
  'Rover Ramble',
  'Cable Crawler',
  'Petal Post',
  'Bumper Bubbles',
  'Crate Stack Shuffle',
  'Lamp Lighter Run',
  'Dune Digger Dash',
  'Zuzu: The Last Bell',
  'Zuzu Showdown',
  'Save the Plumber',
  'Rainbow Bullet Hell Space Princess',
].map((name) => name.toUpperCase())

const HYBRID_WALL = [
  '268548-e40cccc0',
  '268595-e13111ed',
  '268616-8d1544be',
  '268560-851c2ccf',
  '268524-43fcabcf',
  '268708-7c430153',
  '268538-13508c13',
  '268612-e866b9c0',
  '268669-1353abae',
  '268806-6ec1586f',
  '268508-406e29f1',
  '268785-6d52708e',
  '268552-4834774a',
  '268641-97c26851',
  '268803-a02c67d7',
  '268701-9449ab76',
  '268742-e39bb93e',
  '268608-155c31d5',
  '268747-dbbcceab',
  '268679-852cb48b',
  '268540-2c4598e6',
  '268628-233741b4',
  '268754-3e90f584',
  '268633-8b7d2070',
  '268563-89be3daf',
  '268516-9e0514c8',
  '268631-2a2a2b35',
  '268732-2e1f2aaa',
  '268513-ebc4e9e3',
  '268511-ff481095',
  '268995-ff72cdb6',
  '268711-4445b2ee',
  '268557-cbee9129',
  '268656-fac4b533',
  '268548-e40cccc0',
  '268595-e13111ed',
  '268616-8d1544be',
  '268560-851c2ccf',
  '268524-43fcabcf',
  '268708-7c430153',
  '268538-13508c13',
  '268612-e866b9c0',
  '268669-1353abae',
  '268806-6ec1586f',
  '268508-406e29f1',
  '268785-6d52708e',
  '268552-4834774a',
  '268641-97c26851',
].map(hybridRender)

function hybridRender(id: string): string {
  return `/images/generated/2026/11/artimage-${id}.webp`
}

function artImageFile(id: number): string {
  return `/api/art/images/${id}/file`
}

export const ADVERT_POSTERS: AdvertPoster[] = [
  poster({
    slug: 'arcade',
    name: 'Kind Robots Arcade',
    variant: 'arcade',
    path: '/arcade',
    conductorSlug: 'kr-arcade',
    style:
      'premium cinematic hand-painted arcade fantasy key art, neon theatrical lighting, bold silhouettes, maximalist adventure',
    hero: {
      src: '/images/arcade/arcade-attract-splash.webp',
      pos: 'center 45%',
      subject:
        'an immense dazzling midnight arcade hall extending into impossible worlds, heroic silhouettes from distinct original cabinet adventures bursting out into the aisle, a koala ronin raising a glowing lantern, shimmering pinball planets, a gigantic holographic prize wheel, an overhead galaxy of luminous pixels, dramatic low-angle cinematic composition, extraordinary depth, saturated electric violet cyan and molten gold, beautifully hand-painted theatrical key art, clear central negative space for a title',
    },
    wall: ARCADE_WALL,
    cards: [
      {
        label: 'Zuzu: Ghost Trail',
        src: arcadeTitleArt('zuzu-ghost-trail'),
        subject:
          'a koala ronin following a trail of ghost lanterns through a desert night',
        tag: ['#fed7aa', '#fb923c'],
        glow: 'rgba(234,88,12,.55)',
      },
      {
        label: 'Prize Show Panic',
        src: arcadeTitleArt('prize-show-panic'),
        subject:
          'a dazzling game show stage with spinning prize wheels and confetti',
        tag: ['#f5d0fe', '#e879f9'],
        glow: 'rgba(232,121,249,.6)',
      },
      {
        label: 'Zuzu: The Last Bell',
        src: arcadeTitleArt('zuzu-last-bell'),
        subject: 'a koala ronin ringing a huge bronze bell at sunset',
        tag: ['#fde3c8', '#e0a874'],
        glow: 'rgba(199,142,98,.6)',
      },
    ],
    copy: {
      kicker: 'KIND ROBOTS',
      title: 'ARCADE',
      statValue: '36',
      statUnit: 'GAMES',
      hook: 'Classic arcade thrills where',
      hookHighlight: 'winning means helping.',
      blurb:
        'Rescue, repair, grow and glow. Pinball, mazes, shooters, brawlers and more.',
      chips: ['FREE', 'IN YOUR BROWSER', '4-PLAYER CO-OP', 'HIGH SCORES'],
      strip: ARCADE_MARQUEE,
    },
    palette: {
      bg: '#140a2e',
      a1: '#f472b6',
      a2: '#facc15',
      a3: '#22d3ee',
      ink: '#ffffff',
    },
    type: { titleSize: 168, titleSpacing: '4px', statSize: 118, urlSize: 42 },
  }),
  poster({
    slug: 'slime-city',
    name: 'Slime City',
    path: '/slime-city',
    conductorSlug: 'slime-city',
    style:
      'grungy neon comic-book illustration, bold ink lines, toxic green and hot magenta glow',
    hero: {
      src: artImageFile(272640),
      pos: 'center 40%',
      subject:
        'six rival street crews facing off across a radioactive neon megacity plaza at night',
    },
    cards: [
      {
        label: 'Catgirls',
        src: artImageFile(258339),
        subject:
          'a crew of cat-eared medics in blue coats crouched in a rusty rooftop garden',
      },
      {
        label: 'Ironjaw',
        src: artImageFile(267360),
        subject:
          'a hulking lizard brawler in patched overalls swinging a steel girder through flames',
      },
      {
        label: 'Undertow',
        src: artImageFile(258343),
        subject:
          'hooded sewer scouts with brass spyglasses riding a raft through glowing canal water',
      },
    ],
    copy: {
      title: 'Slime City',
      statValue: '300',
      statUnit: 'CARDS TO COLLECT',
      hook: 'Six crews. One radioactive city.',
      hookHighlight: 'Winner eats.',
      blurb:
        'Pick a rival crew and fight for a grungy neon megacity in fast, punchy card battles.',
      chips: [
        'FREE',
        'IN YOUR BROWSER',
        'PVP DUELS',
        'STORY CAMPAIGNS',
        'VS CPU',
      ],
      strip: ['6 CREWS', '7 DISTRICTS', '90 ENDINGS', '3 CARD LEVELS'],
    },
    palette: { bg: '#160d1f', a1: '#b6ff5c', a2: '#e05ab0', a3: '#5ce1ff' },
    type: {
      fontQuery: 'Rubik+Wet+Paint',
      titleFont: "'Rubik Wet Paint',cursive",
      titleSize: 150,
      statSize: 96,
    },
  }),
  poster({
    slug: 'emperor-of-dust',
    name: 'Emperor of Dust',
    path: '/emperor-of-dust',
    conductorSlug: 'emperor-of-dust',
    style:
      'dusty post-apocalyptic western painting, warm amber light, weathered salvage textures',
    hero: {
      src: '/emperor-of-dust/intro/fortress.webp',
      pos: 'center 45%',
      subject:
        'a salvage fortress of rusted metal towering over a wasteland at golden hour',
    },
    cards: [
      {
        label: 'Rook Bramble',
        src: '/emperor-of-dust/cast/followers/F001/illustrated/neutral.webp',
        pos: 'center 20%',
        subject:
          'a scarred wasteland scout holding a bramble-wrapped spear, head and shoulders portrait',
      },
      {
        label: 'Young Komodo',
        src: '/emperor-of-dust/cast/npcs/young-komodo/illustrated/neutral.webp',
        pos: 'center 20%',
        subject:
          'a young komodo dragon warrior in scrap armor, head and shoulders portrait',
      },
      {
        label: 'Kiyo',
        src: '/emperor-of-dust/cast/followers/F003/illustrated/neutral.webp',
        pos: 'center 20%',
        subject:
          'a quiet wasteland mechanic with goggles and grease-streaked cheeks, head and shoulders portrait',
      },
    ],
    copy: {
      title: 'Emperor of Dust',
      title2: 'Fifty Days',
      statValue: '50',
      statUnit: 'DAYS TO RULE',
      hook: 'Fifty days to rule the wasteland.',
      hookHighlight: 'Trust no one.',
      blurb:
        'Hold court in a salvage fortress, send followers questing, and outlast a betrayal on Day 40.',
      chips: ['FREE', 'IN YOUR BROWSER', 'SAVE & REWIND', '8 ENDINGS'],
      strip: ['25 FOLLOWERS', '15 FACTIONS', '76 QUESTS', '30 MARKET WARES'],
    },
    palette: {
      bg: '#1c120c',
      a1: '#e0a04a',
      a2: '#f3d27a',
      a3: '#b3312a',
      ink: '#f6d7a0',
    },
    type: {
      fontQuery: 'Rye',
      titleFont: "'Rye',serif",
      titleSize: 118,
      titleGradient: false,
      statSize: 110,
    },
  }),
  poster({
    slug: 'memory-dungeon',
    name: 'Memory Dungeon',
    path: '/memory',
    conductorSlug: 'memory-dungeon',
    style:
      'rich storybook fantasy painting, violet shadows and golden candlelight',
    hero: {
      src: '/memory-dungeon/front/hero.webp',
      pos: 'center 55%',
      subject:
        'a vast glowing dungeon gate opening onto twelve floating worlds',
    },
    cards: [
      {
        label: 'Char',
        src: '/images/memory-dungeon/portraits/char.webp',
        pos: 'center 22%',
        subject: 'a fiery salamander adventurer holding a brass lantern',
      },
      {
        label: 'Mosswick',
        src: '/images/memory-dungeon/portraits/mosswick.webp',
        pos: 'center 22%',
        subject:
          'a gentle moss-covered forest spirit leaning on a walking stick',
      },
      {
        label: 'Scylla',
        src: '/images/memory-dungeon/portraits/scylla.webp',
        pos: 'center 22%',
        subject: 'a sea witch with coiling tentacle hair in a sunken library',
      },
    ],
    copy: {
      title: 'Memory Dungeon',
      statValue: '12',
      statUnit: 'LINKED WORLDS',
      hook: 'Your memory is your',
      hookHighlight: 'sharpest weapon.',
      blurb:
        'A story RPG where every fight is a card-matching duel, across twelve worlds of riddles, companions and hard choices.',
      chips: [
        'FREE',
        'IN YOUR BROWSER',
        'SAVES PROGRESS',
        'CLASSIC MATCH MODE',
      ],
      strip: [
        '768 SITES TO EXPLORE',
        '36-ROOM HAUNTED HOUSE',
        '384 GALLERY CARDS',
        '32 ENDINGS',
      ],
    },
    palette: { bg: '#120c26', a1: '#9b7bff', a2: '#f2b544', a3: '#5fd4ff' },
    type: {
      fontQuery: 'Uncial+Antiqua',
      titleFont: "'Uncial Antiqua',serif",
      titleSize: 118,
      statSize: 110,
    },
  }),
  poster({
    slug: 'crystal-street',
    name: 'Terrors on Crystal Street',
    path: '/crystal-street',
    conductorSlug: 'crystal-street',
    style:
      '1980s Halloween horror-comedy painting, purple dusk, glowing jack-o-lanterns',
    hero: {
      src: artImageFile(272634),
      pos: 'center 60%',
      subject:
        'a suburban cul-de-sac on Halloween night with glowing windows and kids in costumes on bikes',
    },
    cards: [
      {
        label: 'Mister Fuzzbutton',
        src: '/crystal-street/villains/mister-fuzzbutton-poster.webp',
        pos: 'center 25%',
        size: 15,
        subject:
          'a sinister plush teddy bear with a stitched grin under a flickering streetlight',
      },
      {
        label: 'The Hungry House',
        src: '/crystal-street/villains/hungry-house-poster.webp',
        pos: 'center 30%',
        size: 15,
        subject: 'a creaking Victorian house with a glowing doorway mouth',
      },
      {
        label: 'Lou Tran',
        src: '/crystal-street/companions/lou-tran-poster.webp',
        pos: 'center 25%',
        subject:
          'a brave kid in a homemade astronaut costume holding a flashlight',
      },
    ],
    copy: {
      kicker: 'HALLOWEEN WEEK · 1986',
      title: 'Terrors on',
      title2: 'Crystal Street',
      statValue: '23',
      statUnit: 'NIGHTMARES',
      hook: 'Survive Halloween week.',
      hookHighlight: 'Bring friends. Bring snacks.',
      blurb:
        'One perfect 80s cul-de-sac. Seven nights of card-dealt scares. Something under the street just woke up.',
      chips: ['FREE', 'IN YOUR BROWSER', 'SHAREABLE RUNS', 'SAVES PROGRESS'],
      strip: ['92 ENDINGS', '22 FRIENDS', '96 KIDS TO PLAY', '13 LOCATIONS'],
    },
    palette: { bg: '#1a0c2e', a1: '#ff4fb8', a2: '#ffb547', a3: '#3fe0e8' },
    type: {
      fontQuery: 'Creepster',
      titleFont: "'Creepster',cursive",
      titleSize: 120,
      titleSpacing: '3px',
      statSize: 110,
    },
  }),
  poster({
    slug: 'prom-of-doom',
    name: 'Prom of Doom',
    path: '/comet-city-academy',
    conductorSlug: 'comet-city-academy',
    style:
      'bright superhero comic painting, violet night sky, orange spotlight glow',
    hero: {
      src: '/comet-city-academy/front/splash.webp',
      pos: 'center 40%',
      subject:
        'teen superheroes in capes and graduation tassels flying over a comet-lit city skyline',
    },
    cards: [
      {
        label: 'The Psychic',
        src: '/comet-city-academy/origins/psychic.webp',
        subject: 'a teen psychic with glowing violet eyes and floating books',
      },
      {
        label: 'The Comet Ball',
        src: '/comet-city-academy/prom-of-doom/ct-prom-d30-the-chandelier-turns.webp',
        subject:
          'a grand ballroom with a giant chandelier turning under comet light',
      },
      {
        label: 'Tidemaker',
        src: '/comet-city-academy/villains/tidemaker-portrait.webp',
        pos: 'center 25%',
        subject:
          'a sea-themed supervillain in coral armor commanding a towering wave',
      },
    ],
    copy: {
      kicker: 'A CAPES & TASSELS STORY',
      title: 'Prom of Doom',
      statValue: '48',
      statUnit: 'HEROES, EACH WITH A VILLAIN PATH',
      hook: 'Thirty days to graduation.',
      hookHighlight: 'Save the city. Survive prom.',
      blurb:
        'Become a super-student, run night patrols with classmates, and outlast a city-wrecking villain at the Comet Ball.',
      chips: ['FREE', 'IN YOUR BROWSER', 'HERO OR VILLAIN', 'AUTO-SAVES'],
      strip: ['30 DAYS', '8 VILLAINS', '12 ENDINGS', '24 CITY SITES'],
    },
    palette: { bg: '#140f2c', a1: '#8f7bff', a2: '#f2a93b', a3: '#ff6f91' },
    type: {
      fontQuery: 'Bangers',
      titleFont: "'Bangers',cursive",
      titleSize: 160,
      titleSpacing: '4px',
      statSize: 104,
    },
  }),
  poster({
    slug: 'space-couch',
    name: 'Space Couch',
    path: '/game-of-captains',
    conductorSlug: 'game-of-captains',
    style:
      'retro sci-fi painting, warm red and amber cockpit light, colorful starfield',
    hero: {
      src: '/game-of-captains/front/dashboard-highlight.webp',
      pos: 'center 50%',
      subject:
        'a long red couch flying as a starship through a colorful nebula with its crew aboard',
    },
    cards: [
      {
        label: 'Sickbay',
        src: '/game-of-captains/portraits/pair-vela-rue.webp',
        subject:
          'two alien medics tending a patient in a cozy starship sickbay',
      },
      {
        label: 'Gleam',
        src: '/game-of-captains/portraits/v2/crew-gleam.webp',
        pos: 'center 30%',
        subject: 'a shimmering crystalline alien officer with a friendly smile',
      },
      {
        label: 'Away Team',
        src: '/game-of-captains/portraits/pair-brin-fen.webp',
        subject:
          'two explorers in space suits stepping onto a glowing alien planet',
      },
    ],
    copy: {
      title: 'Space Couch',
      statValue: '101',
      statUnit: 'ALIEN SPECIES',
      hook: 'Your starship is a couch.',
      hookHighlight: 'Space is very big.',
      blurb:
        'Pick a captain and three officers, then fly a long red couch across a three-act voyage against a random nemesis.',
      chips: ['FREE', 'IN YOUR BROWSER', 'SAVES PROGRESS', 'RANDOM NEMESIS'],
      strip: ['100 REDSHIRTS', '8 NEMESES', '16 ENDINGS', '6 CAPTAINS'],
    },
    palette: { bg: '#120b24', a1: '#e0434f', a2: '#e39a4f', a3: '#8c6cff' },
    type: {
      fontQuery: 'Audiowide',
      titleFont: "'Audiowide',sans-serif",
      titleSize: 140,
    },
  }),
  poster({
    slug: 'hybridizer',
    name: 'Hybridizer',
    path: '/hybridizer',
    conductorSlug: 'hybridizer',
    style:
      'naturalist specimen illustration, soft watercolor and ink, mint green backdrop',
    wall: HYBRID_WALL,
    cards: [
      {
        label: 'Apple + Cyborg',
        src: hybridRender('268516-9e0514c8'),
        subject:
          'a fusion creature that is half shiny red apple and half chrome cyborg',
      },
      {
        label: 'Axolotl + Shark',
        src: hybridRender('268513-ebc4e9e3'),
        size: 16,
        subject: 'a pink axolotl and great white shark hybrid swimming',
      },
      {
        label: 'Alpaca + Owl',
        src: hybridRender('268701-9449ab76'),
        subject: 'a fluffy alpaca with owl wings and wide amber eyes',
      },
    ],
    copy: {
      title: 'Hybridizer',
      statValue: '19,900',
      statUnit: 'POSSIBLE PAIRINGS',
      hook: 'Fuse any two creatures.',
      hookHighlight: 'Meet their impossible cousin.',
      blurb:
        'Drop two of 200 illustrated specimens into the fusion chamber, then remix the results into stranger hybrids.',
      chips: [
        'BROWSE FREE',
        'NO ACCOUNT NEEDED',
        'IN YOUR BROWSER',
        'REMIX HYBRIDS',
        'SHARED GALLERY',
      ],
      strip: [
        '200 SPECIMENS',
        '4,000+ HYBRIDS',
        'REMIX 3 LEVELS DEEP',
        'SHARED DISCOVERIES',
      ],
    },
    palette: { bg: '#0f2b24', a1: '#a6f09a', a2: '#ffb36b', a3: '#6ad8ff' },
    type: {
      fontQuery: 'Fredoka:wght@700',
      titleFont: "'Fredoka',sans-serif",
      titleSize: 170,
      statSize: 58,
    },
  }),
  poster({
    slug: 'the-elevator-only-goes-down',
    name: 'Downward Mobility',
    path: '/shifting-desks',
    conductorSlug: 'shifting-desks',
    style:
      'prestige hand-painted mid-century corporate safety-poster satire, screen-printed gouache, tactile halftone, cinematic retro-futurist office horror, manila gold, deep oxblood and fluorescent green',
    hero: {
      src: artImageFile(272626),
      pos: 'center 47%',
      subject:
        'an impossible cutaway of a sunny corporate campus and the secret floors beneath it, one glass elevator shaft sinking past a brass pneumatic-tube archive, a strange toy laboratory and a living underground boardroom, tiny new hire smiling bravely inside the elevator, vast storybook architectural scale, one clear central vertical focal point',
    },
    cards: [
      {
        label: 'Mandatory Orientation',
        src: artImageFile(272630),
        pos: 'center 45%',
        size: 13,
        subject:
          'a giant scholarly cockroach wearing glasses and a cardigan politely raising a hand among new employees at a corporate orientation',
      },
      {
        label: 'Meet the Board',
        src: artImageFile(272632),
        pos: 'center 48%',
        size: 15,
        subject:
          'eleven executives joined into a single long pinstripe suit, seated in a breathing upholstered boardroom under warm brass lamps',
      },
      {
        label: 'Rewrite the Rules',
        src: '/images/shifting-desks/endings/the-kind-rewrite.webp',
        pos: 'center 40%',
        size: 15,
        subject:
          'coworkers gather around a massive policy scroll in an office transformed by warm morning light',
      },
    ],
    copy: {
      ribbon: 'MANDATORY CAREER DEVELOPMENT',
      kicker: 'THE COMPANY IS PLEASED TO INFORM YOU',
      title: 'Downward',
      title2: 'Mobility',
      statValue: '11',
      statUnit: 'OFFICIAL EXIT OUTCOMES',
      hook: 'Promotion is a descent.',
      hookHighlight: 'Every floor has a price.',
      blurb:
        'Climb the corporate ladder in reverse. Survive secret societies, bizarre experiments and paperwork with teeth.',
      chips: ['FREE', '5 DEPARTMENTS', 'DAILY MEMO', 'DICE + CHOICES'],
      strip: ['120 STORY CARDS', '6 SECRET SOCIETIES', '8 MUTATIONS', '11 ENDINGS'],
    },
    palette: {
      bg: '#1d1016',
      a1: '#f6aa4b',
      a2: '#f0e0b4',
      a3: '#8fc7b5',
      ink: '#fff4da',
    },
    type: {
      fontQuery: 'Bebas+Neue',
      titleFont: "'Bebas Neue',sans-serif",
      titleSize: 162,
      titleSpacing: '3px',
      titleGradient: false,
      statSize: 104,
      hookSize: 43,
    },
    layout: {
      heroHeight: 790,
      heroPosition: 'center 47%',
      cardsTop: 393,
      cardsScale: 0.96,
      contentTop: 700,
      contentGap: 16,
    },
  }),
  poster({
    slug: 'ecotone',
    name: 'Ecotone',
    path: '/ecotone',
    conductorSlug: 'weird-humboldt',
    style:
      'moody Pacific Northwest painting, redwood fog, teal and amber light',
    hero: {
      src: '/ecotone/title/key-art.webp',
      pos: 'center 45%',
      subject:
        'a foggy redwood forest road at dusk with strange lights glowing between the trees',
    },
    cards: [
      {
        label: 'Bigfoot Picnic',
        src: '/ecotone/encounters/wh-021-bigfoot-picnic.webp',
        subject: 'a shy bigfoot sharing a picnic blanket in a redwood clearing',
      },
      {
        label: 'Juniper',
        src: '/ecotone/companions/juniper.webp',
        pos: 'center 25%',
        subject:
          'a young park ranger with a lantern and a raven on her shoulder',
      },
      {
        label: 'The Bay Crossing',
        src: '/ecotone/encounters/kn-5-the-bay-crossing.webp',
        subject:
          'a small ferry crossing a fog-covered bay toward a glowing lighthouse',
      },
    ],
    copy: {
      kicker: 'WEIRD HUMBOLDT',
      title: 'Ecotone',
      statValue: '163',
      statUnit: 'STORY CARDS',
      hook: 'Follow the fog. Roll the dice.',
      hookHighlight: "Shape the county's future.",
      blurb:
        "A comedy-horror card adventure through Humboldt's redwoods, bays and back roads, where the weird is very local.",
      chips: ['FREE', 'IN YOUR BROWSER', 'NO ACCOUNT NEEDED', '2D6 DICE'],
      strip: ['12 MYSTERIES', '4 COMPANIONS', '6 REGIONS', '396 CHOICES'],
    },
    palette: { bg: '#0b1f20', a1: '#1fa3a3', a2: '#f4b23c', a3: '#9fe08a' },
    type: {
      fontQuery: 'Abril+Fatface',
      titleFont: "'Abril Fatface',serif",
      titleSize: 170,
      statSize: 100,
    },
  }),
  poster({
    slug: 'rainbow-princess',
    name: 'Rainbow Bullet Hell Space Princess',
    path: '/rainbow-bullet-hell-space-princess',
    conductorSlug: 'rainbow-bullet-hell-space-princess',
    style:
      'candy-bright space shooter illustration, pearlescent pink and cyan glow',
    hero: {
      src: '/rainbow-princess-art/hero-pearl-palace.webp',
      pos: 'center 45%',
      subject:
        'a pearl palace floating in a rainbow galaxy with starships streaking past',
    },
    cards: [
      {
        label: 'Maribel',
        src: '/rainbow-princess-art/doodle/portraits/p1-maribel.webp',
        pos: 'center 20%',
        subject:
          'a space princess pilot with coral pink hair and a starfighter helmet',
      },
      {
        label: 'Azure',
        src: '/rainbow-princess-art/doodle/portraits/p2-azure.webp',
        pos: 'center 20%',
        subject:
          'a space princess pilot with ocean blue hair and a pearl tiara',
      },
      {
        label: 'Vivi',
        src: '/rainbow-princess-art/doodle/portraits/p4-vivi.webp',
        pos: 'center 20%',
        subject: 'a grinning space princess pilot with violet pigtails',
      },
    ],
    copy: {
      title: 'Rainbow Bullet Hell',
      title2: 'Space Princess',
      statValue: '9',
      statUnit: 'GIANT BOSSES',
      hook: 'Four princesses.',
      hookHighlight: 'One pearlescent galaxy.',
      blurb:
        'A candy-bright shooter for up to four friends on one screen, across eight sea-themed acts.',
      chips: ['FREE', '1–4 PLAYER CO-OP', '3 ENDINGS', '3 DIFFICULTIES'],
      strip: ['8 ACTS', '8 GUARDIANS', '3 ENDINGS', '17 ACHIEVEMENTS'],
    },
    palette: { bg: '#170b2e', a1: '#ff3fa4', a2: '#fde047', a3: '#04e6e7' },
    type: { titleSize: 104, statSize: 120 },
    layout: { contentGap: 18 },
  }),
  poster({
    slug: 'save-the-plumber',
    name: 'Save the Plumber',
    path: '/save-the-plumber',
    conductorSlug: 'save-the-plumber',
    style: 'painted platformer world, sunny teal sky, warm coral accents',
    hero: {
      src: '/save-the-plumber/maps/world-8.webp',
      pos: 'center 50%',
      subject:
        'a painted fantasy world where rivers flow uphill toward a sky pump tower',
    },
    cards: [
      {
        label: 'Marisol',
        src: '/images/arcade/save-the-plumber/cast/heroine-marisol.webp',
        pos: 'center 20%',
        subject: 'a fearless heroine in a teal jumpsuit leaping with a wrench',
      },
      {
        label: 'Teo (Captured!)',
        src: '/images/arcade/save-the-plumber/cast/teo-caged.webp',
        pos: 'center 30%',
        subject: 'a plumber locked in a floating birdcage beneath a sky pump',
      },
      {
        label: 'Nova',
        src: '/images/arcade/save-the-plumber/cast/heroine-nova.webp',
        pos: 'center 20%',
        subject: 'a heroine in a starry cape splashing water from a wrench',
      },
    ],
    copy: {
      title: 'Save the Plumber',
      statValue: '32',
      statUnit: 'PAINTED STAGES',
      hook: 'The rivers run uphill.',
      hookHighlight: "Your plumber's gone. Go get him.",
      blurb:
        "Run, jump and wrench-splash across eight painted worlds to rescue Teo from Lady Spigot's sky-pump.",
      chips: [
        'FREE',
        'NO DOWNLOAD',
        '8 HEROINES',
        'LEVEL MAKER',
        'ENDLESS MODE',
      ],
      strip: ['8 WORLDS', '8 BOSSES', '13 SECRET EXITS', 'HIDDEN SKY WORLD'],
    },
    palette: { bg: '#0e2228', a1: '#2fb3a8', a2: '#f2c14e', a3: '#f58a6b' },
    type: {
      fontQuery: 'Lilita+One',
      titleFont: "'Lilita One',cursive",
      titleSize: 140,
      statSize: 110,
    },
  }),
  poster({
    slug: 'zuzu-gamebook',
    name: 'Zuzu: The Bell That Never Rang',
    path: '/zuzu-gamebook',
    conductorSlug: 'zuzu-gamebook',
    style:
      'painted weird-west illustration, dusty orange desert light, ink washes',
    hero: {
      src: '/zuzu-gamebook/scenes/ripples.webp',
      pos: 'center 40%',
      subject:
        'rippling heat over a dying desert with a distant mission bell tower',
    },
    cards: [
      {
        label: 'Campfire',
        src: '/zuzu-gamebook/scenes/zuzu-fire.webp',
        subject:
          'a koala ronin resting by a campfire under a starry desert sky',
      },
      {
        label: 'The Crow Witch',
        src: '/zuzu-gamebook/scenes/crow-witch.webp',
        subject: 'a crow witch in a feathered cloak perched on a dead tree',
      },
      {
        label: 'The Coyote',
        src: '/zuzu-gamebook/scenes/coyote.webp',
        subject: 'a sly coyote in a duster coat grinning in moonlight',
      },
    ],
    copy: {
      kicker: 'AN ILLUSTRATED GAMEBOOK',
      title: 'Zuzu',
      title2: 'The Bell That Never Rang',
      statValue: '15',
      statUnit: 'ENDINGS',
      hook: 'Roll the dice. Draw the blade.',
      hookHighlight: 'Decide who the bell tolls for.',
      blurb:
        'A painted weird-west gamebook: a koala ronin crosses a dying desert toward a mission with a terrible secret.',
      chips: ['FREE', 'IN YOUR BROWSER', 'DICE AND DUELS', 'SAVES PROGRESS'],
      strip: ['9 ACTS', '375+ SECTIONS', '420+ PAINTINGS', '64 DICE CHECKS'],
    },
    palette: {
      bg: '#1b1a1d',
      a1: '#e8873a',
      a2: '#f3c27a',
      a3: '#7fc4d8',
      ink: '#f6c48b',
    },
    type: {
      fontQuery: 'Sancreek',
      titleFont: "'Sancreek',serif",
      titleSize: 112,
      titleGradient: false,
      statSize: 120,
    },
    layout: { contentGap: 14, contentTop: 700 },
  }),
  poster({
    slug: 'shifting-lands',
    name: 'Shifting Lands',
    path: '/zuzu-shifting-lands',
    conductorSlug: 'zuzu-shifting-lands',
    style:
      'painted weird-west journey illustration, warm ochre dust, slate blue sky',
    hero: {
      src: '/shifting-lands/endings/unnamed-road.webp',
      pos: 'center 50%',
      subject:
        'an unnamed dirt road curving through shifting mesas under a vast sky',
    },
    cards: [
      {
        label: 'The Wanderer',
        src: '/shifting-lands/portraits/koala.webp',
        subject: 'a koala wanderer with a wide hat and a travel pack',
      },
      {
        label: 'Mags',
        src: '/shifting-lands/portraits/mags.webp',
        subject: 'a tough frontier mechanic with goggles and a wrench',
      },
      {
        label: 'Sister Wren',
        src: '/shifting-lands/portraits/sister-wren.webp',
        subject:
          'a calm wandering nun holding a lantern with a small bird on her hand',
      },
    ],
    copy: {
      kicker: 'A WEIRD-WEST CARD JOURNEY',
      title: 'Shifting Lands',
      statValue: '58',
      statUnit: 'ENDINGS TO FIND',
      hook: 'Draw a card. The road changes.',
      hookHighlight: 'So do you.',
      blurb:
        'Choose a traveler or make your own, then cross five shifting lands of painted encounters, dice and trials.',
      chips: [
        'FREE',
        'IN YOUR BROWSER',
        '13 TRAVELERS',
        'MAKE YOUR OWN HERO',
        'SAVES PROGRESS',
      ],
      strip: ['120 ENCOUNTER CARDS', '5 LANDS', '5 TRIALS', '840+ PAINTINGS'],
    },
    palette: {
      bg: '#1e1712',
      a1: '#d56a3a',
      a2: '#e9c27a',
      a3: '#5f86a8',
      ink: '#f1cf8c',
    },
    type: {
      fontQuery: 'Smokum',
      titleFont: "'Smokum',serif",
      titleSize: 150,
      titleGradient: false,
      statSize: 110,
    },
  }),
  poster({
    slug: 'aquarium',
    name: 'Cthulhuquarium',
    path: '/aquarium',
    conductorSlug: 'cthulhuquarium',
    style:
      'gaslit Victorian parlour painting, deep green water, brass and candlelight',
    hero: {
      src: 'asset:cthulhuquarium/backgrounds/flooded-conservatory.webp',
      pos: 'center 40%',
      subject:
        'a flooded Victorian conservatory full of glowing deep-sea creatures',
    },
    cards: [
      {
        label: 'Chandelier Lion',
        src: '/cthulhuquarium-plates/cthulhuquarium-fish-chandelier-lion.webp',
        subject: 'a lionfish whose fins glow like a crystal chandelier',
      },
      {
        label: 'Charlotte Fishmonger',
        src: 'asset:cthulhuquarium/cthulhuquarium-char-charlotte-fishmonger.webp',
        pos: 'center 18%',
        size: 15,
        subject:
          'a cheerful Victorian fishmonger woman with a basket of strange fish',
      },
      {
        label: 'Lamplight Angler',
        src: '/cthulhuquarium-plates/cthulhuquarium-fish-lamplight-angler.webp',
        subject: 'an anglerfish with a warm brass lamp lure in dark water',
      },
    ],
    copy: {
      title: 'Cthulhuquarium',
      statValue: '151',
      statUnit: 'STRANGE SPECIES',
      hook: 'Feed the monsters.',
      hookHighlight: 'Fill the tank.',
      blurb:
        'Stock a gaslit parlour tank with deep-sea oddities. Every feeding drops coins for bigger tanks and stranger set pieces.',
      chips: [
        'FREE TO BROWSE',
        'PUBLIC TANKS',
        'EARNS WHILE AWAY',
        'IN YOUR BROWSER',
      ],
      strip: [
        '16 TANK SCENES',
        '6 RARITY TIERS',
        '20 STORY SCENES',
        'SPECIES LEADERBOARD',
      ],
    },
    palette: { bg: '#0b1d1c', a1: '#4f9969', a2: '#c9a24a', a3: '#e86a8a' },
    type: {
      fontQuery: 'Cinzel+Decorative:wght@900',
      titleFont: "'Cinzel Decorative',serif",
      titleSize: 120,
      titleSpacing: '1px',
      statSize: 84,
    },
  }),
  poster({
    slug: 'ruler-hooked',
    name: 'The Ruler Is Hooked',
    path: '/ruler-hooked',
    conductorSlug: 'ruler-hooked',
    style: 'storybook fantasy painting, teal lake light, golden afternoon glow',
    hero: {
      src: '/ruler-hooked/hero.webp',
      pos: 'center 45%',
      subject:
        'a young ruler fishing from a royal dock beside a castle on a sparkling lake',
    },
    cards: [
      {
        label: 'Warlock Vex',
        src: '/images/ruler-hooked/characters/warlock-vex.webp',
        pos: 'center 15%',
        subject: 'a scheming warlock in violet robes with a crooked staff',
      },
      {
        label: 'Lake Spirit Nix',
        src: '/images/ruler-hooked/characters/lake-spirit-nix.webp',
        pos: 'center 15%',
        subject: 'a shimmering water spirit rising from a calm lake',
      },
      {
        label: 'Druid Sela',
        src: '/images/ruler-hooked/characters/druid-sela.webp',
        pos: 'center 15%',
        subject:
          'a druid with an antler crown and moss cloak holding a glowing seed',
      },
    ],
    copy: {
      title: 'The Ruler Is Hooked',
      statValue: '24',
      statUnit: 'WAYS THE REALM CHANGES',
      hook: "You'd rather fish.",
      hookHighlight: 'Your kingdom has other plans.',
      blurb:
        'Cast from the royal dock while petitions pile up. Every decree repaints the shore, the village and the castle.',
      chips: ['FREE', 'IN YOUR BROWSER', '4 ENDINGS', 'MULTIPLE SAVES'],
      strip: ['12 COURTIERS', '18 FISH', '4 ENDINGS', 'QUIZ FISHING MODE'],
    },
    palette: { bg: '#1d1430', a1: '#3db7a5', a2: '#e3c772', a3: '#66bdd5' },
    type: {
      fontQuery: 'Luckiest+Guy',
      titleFont: "'Luckiest Guy',cursive",
      titleSize: 118,
      statSize: 100,
    },
  }),
]

export function advertPosterBySlug(slug: string | null | undefined) {
  return ADVERT_POSTERS.find((entry) => entry.slug === slug) ?? null
}

export function advertSlots(entry: AdvertPoster): AdvertSlot[] {
  return [
    ...(entry.hero ? [entry.hero] : []),
    ...entry.cards.map((card) => card.slot),
  ]
}

export const ADVERT_SLOT_KEYS = ADVERT_POSTERS.flatMap((entry) =>
  advertSlots(entry).map((slot) => slot.key),
)

export function advertSlotByKey(key: string) {
  const parsed = parseAdvertSlotKey(key)
  if (!parsed) return null
  const entry = advertPosterBySlug(parsed.posterSlug)
  if (!entry) return null
  const slot = advertSlots(entry).find((s) => s.name === parsed.slotName)
  return slot ? { poster: entry, slot } : null
}

export function advertFontStylesheetUrl(): string {
  const families = [
    ...new Set(
      ADVERT_POSTERS.map((entry) => entry.type.fontQuery).filter(
        (query) => query !== 'Bungee+Shade',
      ),
    ),
  ]
  const extra = families.map((family) => `family=${family}`).join('&')
  return `https://fonts.googleapis.com/css2?${BASE_FONT_QUERY}&${extra}&display=swap`
}

export function advertRequestKey(slotKey: string, nonce: string): string {
  return `${ADVERT_REQUEST_KEY_PREFIX}${slotKey}@${nonce}`
}

export function slotKeyFromAdvertRequestKey(
  requestKey: unknown,
): string | null {
  if (typeof requestKey !== 'string') return null
  if (!requestKey.startsWith(ADVERT_REQUEST_KEY_PREFIX)) return null
  const rest = requestKey.slice(ADVERT_REQUEST_KEY_PREFIX.length)
  const slotKey = rest.split('@')[0] ?? ''
  return ADVERT_SLOT_KEY_PATTERN.test(slotKey) ? slotKey : null
}

const NEGATION_WORDS =
  /\b(?:no|not|without|never|none|nothing|avoid|don't|dont|free of|devoid of|exclude|excluding)\b/gi

export function advertPromptNegations(prompt: string): string[] {
  return [
    ...new Set(
      (prompt.match(NEGATION_WORDS) ?? []).map((w) => w.toLowerCase()),
    ),
  ]
}

export function advertEditTitle(text: string): string {
  const firstLine =
    text
      .split('\n')
      .map((line) => line.trim())
      .find(Boolean) ?? 'Edit request'
  const clipped =
    firstLine.length > 110 ? `${firstLine.slice(0, 109).trimEnd()}…` : firstLine
  return `Advert: ${clipped}`
}

export function advertEditMarker(posterSlug: string): string {
  return `Advert poster: ${posterSlug}`
}

export function advertEditDescription(
  entry: AdvertPoster,
  field: AdvertEditField,
  text: string,
): string {
  return [
    'Advert Studio edit request.',
    `${advertEditMarker(entry.slug)} (${entry.name})`,
    `Field: ${field}`,
    `Studio: /admin/adverts?poster=${entry.slug}`,
    'Source: utils/adverts/posters.ts (copy, palette, slots) and components/adverts/advert-poster.vue (layout).',
    '',
    'Request:',
    text.trim(),
  ].join('\n')
}
