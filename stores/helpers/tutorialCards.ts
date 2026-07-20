// /stores/helpers/tutorialCards.ts
//
// Canonical config for channel tutorials. Most channels mirror footer keys, but
// standalone channels can live here too when a page deserves first-class help
// before it is fully folded into the dashboard registry.

import { type FooterKey, footerKeys, footerRouteMap } from './dashboardHelper'

export const TUTORIAL_IMAGE_BASE = '/images/tutorials'
export const TUTORIAL_IMAGE_EXTENSION = 'webp'

const CONDUCTOR_IMAGE_BASE =
  'https://raw.githubusercontent.com/silasfelinus/conductor/main/projects/images'

export function getTutorialImagePath(
  channelKey: string,
  sectionKey: string,
): string {
  return `${TUTORIAL_IMAGE_BASE}/${channelKey}/${sectionKey}.${TUTORIAL_IMAGE_EXTENSION}`
}

export function getTutorialHeroPath(channelKey: string): string {
  return `${TUTORIAL_IMAGE_BASE}/${channelKey}/hero.${TUTORIAL_IMAGE_EXTENSION}`
}

function tutorialImage(channelKey: string, sectionKey: string): string {
  return getTutorialImagePath(channelKey, sectionKey)
}

export type ExtraTutorialKey =
  | 'conductor'
  | 'mural'
  | 'challenges'
  | 'humboldt-scoop'
  | 'scoop-cms'
  | 'mermaids'
  | 'packs'
  | 'wonder'
export type TutorialChannelKey = FooterKey | ExtraTutorialKey

export type TutorialSection = {
  key: string
  title: string
  body: string
  image: string
  underConstruction?: boolean
}

export type TutorialChannel = {
  key: TutorialChannelKey
  title: string
  hero?: string
  overview: string
  tagline?: string
  earnings?: string
  underConstruction?: boolean
  sections: TutorialSection[]
}

export const EARNING_CHANNELS = [
  'scenario',
  'character',
  'dream',
  'reward',
  'bot',
] as const satisfies readonly FooterKey[]

export type EarningChannelKey = (typeof EARNING_CHANNELS)[number]

export const CREATOR_EARNINGS_MESSAGE =
  'When people spend paid tokens on something you made, you earn a share. ' +
  'Paid usage is split three ways - Kind Robots, the anti-malaria fundraiser, ' +
  'and you. Build something people love, and the swarm pays you back.'

export function isEarningChannel(key: string): key is EarningChannelKey {
  return (EARNING_CHANNELS as readonly string[]).includes(key)
}

export const tutorialChannels = {
  games: {
    key: 'games',
    title: 'Games',
    tagline: 'Play, tinker, and poke at the moving parts.',
    overview:
      'The Games page is the playful corner of Kind Robots: a card-matching dungeon crawl, screen effects, and WonderLab experiments. Come for the dungeon, stay for the visual chaos.',
    sections: [
      {
        key: 'memory-dungeon',
        title: 'Memory Match Dungeon',
        body: 'Match cards to progress deeper into the dungeon, with leaderboards to climb and generated art to remix the crawl.',
        image: tutorialImage('games', 'memory-dungeon'),
      },
      {
        key: 'screen-fx',
        title: 'Screen FX',
        body: 'A playground of after-dark-style screen effects you can layer until the screen looks exactly as unreasonable as you want.',
        image: tutorialImage('games', 'screen-fx'),
      },
      {
        key: 'animation-manager',
        title: 'Animation Manager',
        body: 'The museum of Screen FX build attempts: browse status and ratings for every effect, then preview, compare, promote, polish, or retire a build.',
        image: tutorialImage('games', 'animation-manager'),
      },
      {
        key: 'wonder-lab',
        title: 'WonderLab',
        body: 'A behind-the-scenes look at the components that make up the site and the experiments that are still earning their shoes.',
        image: tutorialImage('games', 'wonder-lab'),
      },
    ],
  },

  scenario: {
    key: 'scenario',
    title: 'Stories',
    tagline: 'Bring everything into one narrative space.',
    overview:
      'Combine characters, places, treasures, and art into a single unfolding story. Browse playable scenarios, configure a session, and let the narrator turn choices into consequences with teeth.',
    earnings: CREATOR_EARNINGS_MESSAGE,
    sections: [
      {
        key: 'scenarios',
        title: 'Scenario Gallery',
        body: 'Browse playable scenarios, clone promising branches, and pick the playground you want to run.',
        image: tutorialImage('scenario', 'scenarios'),
      },
      {
        key: 'add',
        title: 'Add Scenario',
        body: 'Create a new scenario with an intro, choices, stakes, and room for players to surprise the narrator.',
        image: tutorialImage('scenario', 'add'),
      },
      {
        key: 'serendipity',
        title: 'Serendipity',
        body: 'Step into a second-person story woven by the Serendipity bot: pick a tone, open the door, and answer honestly — the questions it asks quietly advance your real honey-dos and human-gated tasks along the way.',
        image: tutorialImage('scenario', 'serendipity'),
      },
      {
        key: 'storymaker',
        title: 'Storymaker',
        body: 'Bring your characters, settings, and rewards together and let the narrator turn choices into consequences with teeth — the long-form loom that gathers everything else into one unfolding story.',
        image: tutorialImage('scenario', 'storymaker'),
      },
    ],
  },

  dream: {
    key: 'dream',
    title: 'Dreams',
    tagline: 'Explore imagined places, dreamscapes, and story seeds.',
    overview:
      'Dreams are collaborative places, story seeds, and weird little worlds that can inspire chat, art, scenarios, and future story material.',
    earnings: CREATOR_EARNINGS_MESSAGE,
    sections: [
      {
        key: 'dreams',
        title: 'Dream Gallery',
        body: 'Browse collaborative dreams, pick a world to expand, chat inside it, generate art around it, or clone an interesting seed.',
        image: tutorialImage('dream', 'dreams'),
      },
      {
        key: 'dreammaker',
        title: 'Dreammaker',
        body: 'Create or revise a dream with the right title, idea, description, art hooks, and story coordinates.',
        image: tutorialImage('dream', 'add'),
      },
      {
        key: 'brainstorm',
        title: 'Dream Brainstorm',
        body: 'Start with an idea, generate riffs on the concept, accept the good ones, and save survivors as reusable dream seeds.',
        image: tutorialImage('dream', 'brainstorm'),
      },
    ],
  },

  character: {
    key: 'character',
    title: 'Characters',
    tagline: 'Design and meet the cast of your world.',
    overview:
      'Create the people, creatures, guides, rivals, and chattable weirdos who move through your stories. Build them in the gallery, then cast them together on the stage.',
    earnings: CREATOR_EARNINGS_MESSAGE,
    sections: [
      {
        key: 'characters',
        title: 'Character Gallery',
        body: 'Browse the cast, select favorites, and clone useful archetypes. Your glorious weirdos live in one theatrical little cabinet.',
        image: tutorialImage('character', 'characters'),
      },
      {
        key: 'add',
        title: 'Add Character',
        body: 'Build a character from scratch or through the interactive adventurer.',
        image: tutorialImage('character', 'add'),
      },
      {
        key: 'stage',
        title: 'Stage Manager',
        body: 'Cast one or more characters into a scene together and let their energy play off each other.',
        image: tutorialImage('character', 'stage'),
      },
    ],
  },

  reward: {
    key: 'reward',
    title: 'Rewards',
    tagline: 'Items, magic, powers, skills, and favors.',
    overview:
      'Rewards are narrative accelerants: items, magic, powers, skills, and favors that inspire creative experiences.',
    earnings: CREATOR_EARNINGS_MESSAGE,
    sections: [
      {
        key: 'rewards',
        title: 'Reward Gallery',
        body: 'Browse rewards and use any of them as a text-based story prompt or scenario ingredient.',
        image: tutorialImage('reward', 'rewards'),
      },
      {
        key: 'add',
        title: 'Create Reward',
        body: 'Create items, magic, powers, skills, and favors with enough flavor to make the loot table purr.',
        image: tutorialImage('reward', 'add'),
      },
    ],
  },

  bot: {
    key: 'bot',
    title: 'Bots',
    tagline: 'Build personalities, assistants, and accomplices.',
    overview:
      'A bot is a focused, specialized GPT. Visit the Cafe to chat with bots others have built, and the Factory to forge your own.',
    earnings: CREATOR_EARNINGS_MESSAGE,
    sections: [
      {
        key: 'bots',
        title: 'Bot Cafe',
        body: 'Browse and chat with bots, launch a favorite assistant, or clone a useful troublemaker.',
        image: tutorialImage('bot', 'bots'),
      },
      {
        key: 'forge',
        title: 'Bot Factory',
        body: 'Forge new bot personalities and tune their skills.',
        image: tutorialImage('bot', 'forge'),
      },
    ],
  },

  art: {
    key: 'art',
    title: 'Art',
    tagline: 'Generate, browse, and remix AI artwork.',
    overview:
      'Build prompts, generate images, browse the gallery, and remix styles through the active art server.',
    sections: [
      {
        key: 'generate',
        title: 'Art Generator',
        body: 'Build prompts, choose the active art server, and create new images.',
        image: tutorialImage('art', 'generate'),
      },
      {
        key: 'gallery',
        title: 'Art Gallery',
        body: 'Browse generated art, inspect details, and collect favorites.',
        image: tutorialImage('art', 'gallery'),
      },
      {
        key: 'styler',
        title: 'Art Styler',
        body: 'Remix an existing image into a fresh style and polish rough gems.',
        image: tutorialImage('art', 'styler'),
      },
      {
        key: 'stylist',
        title: 'Hair Studio',
        body: 'The Hair by Superkate suite: upload or snap a client photo and try a new color, style, or cleanup on their own face; price appointments with the services calculator (rate × time + products); keep the client book; and send warm receipts. Client photos are kept private — they never appear in public galleries or the memory game.',
        image: tutorialImage('art', 'stylist'),
      },
      {
        key: 'artjob',
        title: 'ArtJob Pipeline (Admin)',
        body: 'The admin control room for art generation: manage ComfyUI/SD servers, watch uptime, track images created vs failed, and inspect, requeue, or cancel jobs in the queue.',
        image: tutorialImage('art', 'artjob'),
      },
      {
        key: 'coloring',
        title: 'Coloring Book',
        body: 'Pick a page from a set, tap a region to fill it, and group-fill matching sections with one color. Switch to a custom shade any time, undo mistakes, and save your progress or export a finished page as an image — it all saves itself as you go.',
        image: tutorialImage('art', 'coloring'),
      },
      {
        key: 'coat-dance',
        title: 'Coat Dance',
        body: 'An experimental AI-remixed music video built from a real 2006 physical-theater performance with a trench coat as duet partner. Still in early production planning.',
        image: tutorialImage('art', 'coat-dance'),
        underConstruction: true,
      },
    ],
  },

  sanctuary: {
    key: 'sanctuary',
    title: 'Orientation',
    tagline: 'Our mission, our fundraiser, and where this is all headed.',
    overview:
      'Welcome to the heart of the project: the mission, fundraiser, community tools, subscriptions, wallet, and giftshop plans.',
    underConstruction: true,
    sections: [
      {
        key: 'giftshop',
        title: 'Giftshop',
        body: 'A print-on-demand shop built on art and text generated right here on the site.',
        image: tutorialImage('sanctuary', 'giftshop'),
        underConstruction: true,
      },
      {
        key: 'community',
        title: 'Community Broadcasts',
        body: 'Compose one post, generate platform-ready versions, and share updates to the wider Kind Robots community.',
        image: tutorialImage('sanctuary', 'community'),
        underConstruction: true,
      },
      {
        key: 'forum',
        title: 'Forum',
        body: 'Talk with other members of the community, comment, compare notes, and share what you have been building.',
        image: tutorialImage('sanctuary', 'forum'),
      },
      {
        key: 'subscriptions',
        title: 'Subscriptions',
        body: 'A monthly subscription gets you more generations and helps keep the ecosystem running.',
        image: tutorialImage('sanctuary', 'subscriptions'),
      },
      {
        key: 'wallet',
        title: 'Mana Purse',
        body: 'See how many free generations you have available and, later, track credits you have earned.',
        image: tutorialImage('sanctuary', 'wallet'),
      },
      {
        key: 'sponsor',
        title: 'About & Sponsorship',
        body: 'Our mission, history, and the anti-malaria fundraiser at the center of it.',
        image: tutorialImage('sanctuary', 'sponsor'),
      },
    ],
  },

  builder: {
    key: 'builder',
    title: 'Builder',
    tagline: 'One flow to build everything.',
    overview:
      'The Builder is a single guided flow for creating dream seeds, dreams, characters, bots, rewards, scenarios, and art using the builder card system.',
    earnings: CREATOR_EARNINGS_MESSAGE,
    sections: [
      {
        key: 'builder',
        title: 'Builder Cards',
        body: 'Move through a card-driven flow to create reusable building blocks from one place.',
        image: tutorialImage('builder', 'builder'),
      },
      {
        key: 'model-builder',
        title: 'Model Builder',
        body: 'Turn any record — Project, Character, Bot, Reward, Dream, Scenario, or Facet — into a resumable, gated build run: pick a recipe, draft fields and art, batch-edit quantity outputs, and commit upgraded or newly created records with full provenance.',
        image: tutorialImage('builder', 'model-builder'),
      },
    ],
  },

  home: {
    key: 'home',
    title: 'Your Account',
    tagline: 'Configure your profile, your look, and your people.',
    overview:
      'Your home base. Configure your account, build an avatar, manage friends, chase achievements, theme the app, and keep up with conversations.',
    sections: [
      {
        key: 'dashboard',
        title: 'Dashboard',
        body: 'Your configuration hub: account details, preferences, privacy, and practical knobs.',
        image: tutorialImage('home', 'dashboard'),
      },
      {
        key: 'avatars',
        title: 'Avatar Creator',
        body: 'Choose how you show up: upload an image, select from the collection, or generate something new.',
        image: tutorialImage('home', 'avatars'),
      },
      {
        key: 'friends',
        title: 'Friends',
        body: 'Browse your friends list: favorite people, companions, collaborators, and friendly weirdos.',
        image: tutorialImage('home', 'friends'),
      },
      {
        key: 'achievements',
        title: 'Achievements',
        body: 'Collect jellybeans hidden throughout the site and track the rewards you unlock.',
        image: tutorialImage('home', 'achievements'),
      },
      {
        key: 'themes',
        title: 'Theme Manager',
        body: 'Switch between DaisyUI themes, or build your own custom design.',
        image: tutorialImage('home', 'themes'),
      },
      {
        key: 'chats',
        title: 'Chats',
        body: 'View and continue conversations across the community.',
        image: tutorialImage('home', 'chats'),
      },
    ],
  },

  mural: {
    key: 'mural',
    title: 'Mural Color Studio',
    hero: tutorialImage('mural', 'mural'),
    tagline: 'Color the fence mural before the real paint gets brave.',
    overview:
      'Mural Color Studio turns a simplified coloring page into a paint-planning workspace. Save paint swatches, color several mural sections with one shared color ID, then override individual sections when a leaf, window, robot, or butterfly needs its own moment.',
    sections: [
      {
        key: 'mural',
        title: 'Colorable Mural Plan',
        body: 'Click shapes to color inside the lines, use group fill to assign one color across related sections, and keep a saved palette for the exterior-paint pass.',
        image: tutorialImage('mural', 'mural'),
      },
    ],
  },

  challenges: {
    key: 'challenges',
    title: 'Challenge Center',
    hero: tutorialImage('challenges', 'challenges'),
    tagline: 'Two enter. The swarm decides.',
    overview:
      'Challenge Center pits contenders — providers, models, generators, or prompt variants — against each other on the same prompt. Browse open matchups, cast a LOVED/CLAPPED/BOOED/HATED reaction on any entry, and watch the leaderboard settle the argument.',
    sections: [
      {
        key: 'challenges',
        title: 'Challenge Arena',
        body: 'Filter by challenge type and status, open a matchup to see contenders head to head, cast reactions once logged in, and check the live leaderboard.',
        image: tutorialImage('challenges', 'challenges'),
      },
    ],
  },

  'humboldt-scoop': {
    key: 'humboldt-scoop',
    title: 'The Humboldt Scoop',
    hero: tutorialImage('humboldt-scoop', 'humboldt-scoop'),
    tagline: 'A cleaner yard, without the dirty work.',
    overview:
      'The Humboldt Scoop is a real-world pet-waste removal service run out of Humboldt County. This page is its home base inside Kind Robots — meet the service and the story, then jump to the real site to see pricing and book a route.',
    sections: [
      {
        key: 'humboldt-scoop',
        title: 'Local & dependable',
        body: 'Weekly, bi-weekly, monthly, and one-time cleanup plans serving Eureka, Arcata, and McKinleyville (with Trinidad, Cutten, Freshwater, and Blue Lake by request). Flat honest pricing, cancel anytime, no long-term contract.',
        image: tutorialImage('humboldt-scoop', 'humboldt-scoop'),
      },
    ],
  },

  'scoop-cms': {
    key: 'scoop-cms',
    title: 'Humboldt Scoop CMS',
    hero: tutorialImage('scoop-cms', 'scoop-cms'),
    tagline: 'The back office behind the tidy yards.',
    overview:
      'Humboldt Scoop CMS is the admin console for the real-world pet-waste removal business: customers, their yards and pets, recurring service schedules, visit logs, and draft invoicing. Internal, admin-only tooling — dummy data until Silas approves real customer data.',
    sections: [
      {
        key: 'customers',
        title: 'Customers, properties & pets',
        body: 'Each customer can have multiple properties (yards), and pets are tied to the property where they are actually encountered, so service notes stay accurate across visits.',
        image: tutorialImage('scoop-cms', 'scoop-cms'),
      },
      {
        key: 'scheduling',
        title: 'Service plans & visits',
        body: 'Recurring service plans track frequency, preferred weekday, and pricing; visits record scheduled and completed work. Draft invoices preview billing from visits without any live payment collection.',
        image: tutorialImage('scoop-cms', 'scoop-cms'),
      },
      {
        key: 'routing',
        title: 'Deterministic route planning',
        body: 'A mapped route planner builds a route from a selected set of customers using deterministic optimization, not an LLM — Android-first for the field crew, with Linux and iOS compatibility as ongoing goals.',
        image: tutorialImage('scoop-cms', 'scoop-cms'),
        underConstruction: true,
      },
    ],
  },

  mermaids: {
    key: 'mermaids',
    title: 'Mermaids of Venice',
    hero: tutorialImage('mermaids', 'mermaids'),
    tagline: 'Old gods, busking for tips in a flooded city.',
    overview:
      "Mermaids of Venice is Silas Knight's novel — six years hand-carved, edited by the author's own hand. This page is its home inside Kind Robots: the book, a personal note from Silas, and exactly one paragraph of AI (the one that admits it).",
    sections: [
      {
        key: 'mermaids',
        title: 'The Book',
        body: 'In the canals and campos of Venice, old gods get by the way anyone does — busking, bargaining, and performing for a crowd that no longer believes in them. Available now in paperback on Amazon, with a PDF edition coming to the giftshop.',
        image: tutorialImage('mermaids', 'mermaids'),
      },
    ],
  },

  conductor: {
    key: 'conductor',
    title: 'Conductor',
    hero: `${CONDUCTOR_IMAGE_BASE}/conductor-hero.webp`,
    tagline: 'Steer agents, review work, and keep the human in the loop.',
    overview:
      'Conductor is the private cockpit for the agent loop. It gathers project progress, roadmap state, task gates, pitch voting, and anything that needs Silas before robots continue doing robot things.',
    sections: [
      {
        key: 'conductor',
        title: 'Conductor',
        body: 'Review active projects, open project detail views, vote on brainstorm pitches, inspect blockers, and see which tasks need human judgment before the next agent pass.',
        image: `images/tutorials/conductor/conductor.webp`,
      },
      {
        key: 'portos',
        title: 'PortOS',
        body: 'Add a PortOS server to use a host of services. For more information, visit https://github.com/atomantic/PortOS',
        image: `images/tutorials/conductor/conductor.webp`,
      },
      {
        key: 'appmaker',
        title: 'AppMaker',
        body: 'The app factory — browse the fleet of apps already built, or spin up a new one from a name and a one-line description. Every app is a workspace folder, a project roadmap, and a Dream sharing one slug, so it plugs straight into the rest of Kind Robots.',
        image: tutorialImage('conductor', 'appmaker'),
      },
      {
        key: 'conductor-app',
        title: 'Conductor App',
        body: 'The companion Flutter client for Conductor — review projects, approve gates, and nudge the build loop from a phone. Built in the open, one roadmap task at a time; not on the App Store or Play Store yet.',
        image: tutorialImage('conductor', 'conductor-app'),
      },
    ],
  },
  packs: {
    key: 'packs',
    title: 'Packmaker',
    tagline: 'Bundle it once. Share it everywhere.',
    overview:
      'Packmaker turns loose creations into tidy, shareable packs. Choose the contents, set who can use them, and ship reusable content bundles and DLC that other builders can drop straight into their own worlds.',
    underConstruction: true,
    sections: [
      {
        key: 'packs',
        title: 'Packmaker',
        body: 'Group characters, art, scenarios, and rewards into one coherent pack, then control who can install it with the shared permission primitives.',
        image: tutorialImage('packs', 'packs'),
        underConstruction: true,
      },
    ],
  },

  wonder: {
    key: 'wonder',
    title: 'WonderLab',
    tagline: 'Experimental toys, tests, and delightful nonsense.',
    overview:
      'WonderLab is the workshop wing of Kind Robots -- games, generative sims, and the Newsfeed, all still earning their shoes.',
    sections: [
      {
        key: 'newsfeed',
        title: 'Newsfeed',
        body: 'A programmable, remixable homepage feed of fresh art, stories, and milestones. Pick which feeds show up, filter by keyword or category, and dial in perspective balance from the Manage feeds panel.',
        image: tutorialImage('wonder', 'newsfeed'),
      },
      {
        key: 'wonderlab',
        title: 'WonderLab',
        body: 'The open sandbox: the card-matching Memory Dungeon crawl plus a shelf of experimental components and half-finished toys that exist purely because they were fun to make.',
        image: tutorialImage('wonder', 'wonderlab'),
      },
      {
        key: 'screenfx',
        title: 'Screen FX',
        body: 'Control the screen-effect layer -- matrix rain, firefly drift, butterflies, and ambient theater -- and layer overlays until the screen looks exactly as unreasonable as you want.',
        image: tutorialImage('wonder', 'screenfx'),
      },
      {
        key: 'davinci',
        title: 'Da Vinci Life Sim',
        body: 'A generative life-and-legacy simulation: hundreds of achievements, branching choices, and a legacy that remembers what you built.',
        image: tutorialImage('wonder', 'davinci'),
      },
      {
        key: 'watchlist',
        title: 'Media Watchlist',
        body: 'Track films and shows across a clean, structured watchlist -- queue, in-progress, and finished -- so the "what should we watch" argument finally has a source of truth.',
        image: tutorialImage('wonder', 'watchlist'),
      },
      {
        key: 'ruler-hooked',
        title: 'Ruler Hooked',
        body: 'Cast lines, manage a seaside kingdom, and ride the slideshow of tides and decisions where every catch reshapes the realm you rule.',
        image: tutorialImage('wonder', 'ruler-hooked'),
      },
      {
        key: 'voice-lab',
        title: 'Voice Lab',
        body: 'The voice frontier: an Alexa skill and local relay that let Serendipity and friends speak and listen. Watch the relay status and learn how to plug in.',
        image: tutorialImage('wonder', 'voice-lab'),
      },
    ],
  },
} as const satisfies Record<TutorialChannelKey, TutorialChannel>

export const tutorialChannelKeys = Object.keys(
  tutorialChannels,
) as TutorialChannelKey[]

const tutorialRouteMap = {
  ...footerRouteMap,
  conductor: '/conductor',
  mural: '/mural',
  challenges: '/challenges',
  'humboldt-scoop': '/humboldt-scoop',
  'scoop-cms': '/scoop-cms',
  mermaids: '/mermaids',
  packs: '/packs',
  wonder: [
    '/newsfeed',
    '/wonderlab',
    '/screenfx',
    '/davinci',
    '/watchlist',
    '/ruler-hooked',
    '/voice-lab',
  ],
} as const satisfies Record<TutorialChannelKey, string | readonly string[]>

export function isTutorialChannelKey(
  value: string,
): value is TutorialChannelKey {
  return value in tutorialChannels
}

export function getTutorialChannel(key: TutorialChannelKey): TutorialChannel {
  return tutorialChannels[key]
}

export function getTutorialHero(key: TutorialChannelKey): string {
  return getTutorialChannel(key).hero ?? getTutorialHeroPath(key)
}

export function getTutorialSections(
  key: TutorialChannelKey,
): TutorialSection[] {
  return tutorialChannels[key].sections
}

export function getTutorialEarningsMessage(
  key: TutorialChannelKey,
): string | null {
  return getTutorialChannel(key).earnings ?? null
}

export function resolveTutorialChannelFromRoute(
  path: string,
  // Overridable for tests exercising the exact-vs-prefix precedence rules
  // with controlled route data; real callers always use the defaults.
  routeMap: Partial<
    Record<TutorialChannelKey, string | readonly string[]>
  > = tutorialRouteMap,
  keys: readonly TutorialChannelKey[] = tutorialChannelKeys,
): TutorialChannelKey | null {
  let cleanPath = path || ''
  const queryIndex = cleanPath.indexOf('?')
  if (queryIndex !== -1) cleanPath = cleanPath.slice(0, queryIndex)
  const hashIndex = cleanPath.indexOf('#')
  if (hashIndex !== -1) cleanPath = cleanPath.slice(0, hashIndex)

  let bestKey: TutorialChannelKey | null = null
  let bestLen = -1

  for (const key of keys) {
    const routes = routeMap[key]
    if (!routes) continue
    const routeList = Array.isArray(routes) ? routes : [routes]

    for (const route of routeList) {
      if (!route) continue
      if (cleanPath === route) return key

      const isPrefix = route !== '/' && cleanPath.startsWith(`${route}/`)

      if (isPrefix && route.length > bestLen) {
        bestKey = key
        bestLen = route.length
      }
    }
  }

  return bestKey
}

type _AllFooterChannelsCovered = FooterKey extends TutorialChannelKey
  ? true
  : false
const _coverageCheck: _AllFooterChannelsCovered = true
void _coverageCheck
void footerKeys
