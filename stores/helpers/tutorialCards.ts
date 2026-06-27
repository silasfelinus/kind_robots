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

export type ExtraTutorialKey = 'conductor'
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
      {
        key: 'composition',
        title: 'Composition',
        body: 'Customize the shape of a bot response object for more precise requests. Still under construction.',
        image: tutorialImage('bot', 'composition'),
        underConstruction: true,
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
        key: 'workbench',
        title: 'Code Cards (Workbench)',
        body: 'A simplified ComfyUI-style interface for building specific chains of art and text generation. Under construction.',
        image: tutorialImage('art', 'workbench'),
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
    ],
  },

  home: {
    key: 'home',
    title: 'Your Account',
    tagline: 'Configure your profile, your look, and your people.',
    overview:
      'Your home base. Configure your account, build an avatar, manage friends, chase milestones, theme the app, and keep up with conversations.',
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
        key: 'milestones',
        title: 'Milestones',
        body: 'Collect jellybeans hidden throughout the site and track the rewards you unlock.',
        image: tutorialImage('home', 'milestones'),
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
    ],
  },
} as const satisfies Record<TutorialChannelKey, TutorialChannel>

export const tutorialChannelKeys = Object.keys(
  tutorialChannels,
) as TutorialChannelKey[]

const tutorialRouteMap = {
  ...footerRouteMap,
  conductor: '/conductor',
} as const satisfies Record<TutorialChannelKey, string>

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
): TutorialChannelKey | null {
  let cleanPath = path || ''
  const queryIndex = cleanPath.indexOf('?')
  if (queryIndex !== -1) cleanPath = cleanPath.slice(0, queryIndex)
  const hashIndex = cleanPath.indexOf('#')
  if (hashIndex !== -1) cleanPath = cleanPath.slice(0, hashIndex)

  let bestKey: TutorialChannelKey | null = null
  let bestLen = -1

  for (const key of tutorialChannelKeys) {
    const route = tutorialRouteMap[key]
    if (!route) continue

    if (cleanPath === route) return key

    const isPrefix = route !== '/' && cleanPath.startsWith(`${route}/`)

    if (isPrefix && route.length > bestLen) {
      bestKey = key
      bestLen = route.length
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
