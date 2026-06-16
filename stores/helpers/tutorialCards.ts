// /stores/helpers/tutorialCards.ts
//
// Canonical config for channel tutorials. One entry per footer channel.
// Each channel has a hero image + an overview + one section per tab. Sections
// map 1:1 to a screenshot. tutorial-page.vue reads from here; nothing writes
// back.
//
// Mirrors the dashboardHelper pattern: config-as-truth, derived lookups,
// pure helper functions, no store calls inside this file.

import { type FooterKey, footerKeys, footerRouteMap } from './dashboardHelper'

export const TUTORIAL_IMAGE_BASE = '/images/tutorials'
export const TUTORIAL_IMAGE_EXTENSION = 'webp'

// Two kinds of image live under each channel folder:
//   - One hero: illustrative title art for the whole tutorial.
//       Path shape: /images/tutorials/<channel>/hero.webp
//   - One screenshot per section: an actual screen capture of that tab.
//       Path shape: /images/tutorials/<channel>/<section>.webp
// "hero" is reserved as a section image name so the two never collide.

// Screenshot path for a single section.
export function getTutorialImagePath(
  channelKey: string,
  sectionKey: string,
): string {
  return `${TUTORIAL_IMAGE_BASE}/${channelKey}/${sectionKey}.${TUTORIAL_IMAGE_EXTENSION}`
}

// Hero (title art) path for the whole channel.
export function getTutorialHeroPath(channelKey: string): string {
  return `${TUTORIAL_IMAGE_BASE}/${channelKey}/hero.${TUTORIAL_IMAGE_EXTENSION}`
}

function tutorialImage(channelKey: string, sectionKey: string): string {
  return getTutorialImagePath(channelKey, sectionKey)
}

export type TutorialSection = {
  // Stable key, used for the image path and v-for keys. Usually the tab key.
  key: string
  // Short heading shown above the screenshot.
  title: string
  // 1-3 sentences describing what the tab does, in the platform's dry voice.
  body: string
  // Screenshot path. Defaults to the conventional path if omitted.
  image: string
  // Marks a section as still in development. tutorial-page shows a badge and
  // can de-emphasize or skip it depending on the consuming UI.
  underConstruction?: boolean
}

export type TutorialChannel = {
  // Footer channel key this tutorial belongs to.
  key: FooterKey
  // Title shown at the top of the tutorial popup.
  title: string
  // Hero / title art for the whole tutorial. This is illustrative art, NOT a
  // screenshot. Defaults to /images/tutorials/<channel>/hero.webp via
  // getTutorialHero(); set explicitly only to point somewhere else.
  hero?: string
  // Overview paragraph(s) for the whole channel.
  overview: string
  // Optional one-liner under the title.
  tagline?: string
  // Optional callout shown prominently in the overview. Used for the
  // creator-earnings / profit-share message on monetizable channels.
  earnings?: string
  // Marks the whole channel as still under development.
  underConstruction?: boolean
  // Ordered sections, one per tab.
  sections: TutorialSection[]
}

// Channels where user creations participate in the profit-share model: when
// other people spend paid tokens interacting with your work, a share comes
// back to you. Applies to scenarios, characters, locations (dreams), rewards,
// bots, and dreams (including brainstorm seeds).
export const EARNING_CHANNELS = [
  'scenario',
  'character',
  'dream',
  'reward',
  'bot',
] as const satisfies readonly FooterKey[]

export type EarningChannelKey = (typeof EARNING_CHANNELS)[number]

// Profit-share message for creator channels. The model splits paid-token
// revenue three ways: Kind Robots, the anti-malaria fundraiser, and the
// creators whose work people choose to use.
export const CREATOR_EARNINGS_MESSAGE =
  'When people spend paid tokens on something you made, you earn a share. ' +
  'Paid usage is split three ways - Kind Robots, the anti-malaria fundraiser, ' +
  'and you. Build something people love, and the swarm pays you back.'

export function isEarningChannel(key: string): key is EarningChannelKey {
  return (EARNING_CHANNELS as readonly string[]).includes(key)
}

export const tutorialChannels = {
  // The footer key for the games/lab channel is `games` (route /memory).
  // Its label and title read "Games"; route resolution uses footerRouteMap.
  games: {
    key: 'games',
    title: 'Games',
    tagline: 'Play, tinker, and poke at the moving parts.',
    overview:
      'The Games page is the playful corner of Kind Robots: a card-matching ' +
      'dungeon crawl, a sandbox of screensaver-style screen effects, and a ' +
      'behind-the-scenes look at the components that build the site. Come for ' +
      'the dungeon, stay for the visual chaos.',
    sections: [
      {
        key: 'memory-dungeon',
        title: 'Memory Match Dungeon',
        body: 'Match cards to progress deeper into the dungeon, with leaderboards to climb. You can even customize the crawl with your own generated art.',
        image: tutorialImage('games', 'memory-dungeon'),
      },
      {
        key: 'screen-fx',
        title: 'Screen FX',
        body: 'A playground of 28 after-dark-style screen effects you can mix and match. Layer matrix rain over fireflies over butterflies until the screen looks exactly as unreasonable as you want.',
        image: tutorialImage('games', 'screen-fx'),
      },
      {
        key: 'wonder-lab',
        title: 'WonderLab',
        body: 'A behind-the-scenes look at the components that make up the site. Mostly here for Silas, but the tools are reviewable and worth a poke if you like seeing how the machine is wired.',
        image: tutorialImage('games', 'wonder-lab'),
      },
    ],
  },

  scenario: {
    key: 'scenario',
    title: 'Stories',
    tagline: 'Bring everything into one narrative space.',
    overview:
      'Combine characters, places, treasures, and art into a single ' +
      'unfolding story. Browse playable scenarios, configure a session, and ' +
      'let the narrator turn your choices into consequences with teeth.',
    earnings: CREATOR_EARNINGS_MESSAGE,
    sections: [
      {
        key: 'scenarios',
        title: 'Scenario Gallery',
        body: 'Browse playable scenarios, clone promising branches, and pick the playground you want to run. Selecting a scenario moves you into configuration.',
        image: tutorialImage('scenario', 'scenarios'),
      },
      {
        key: 'add',
        title: 'Add Scenario',
        body: 'Create a new scenario with an intro, choices, and stakes - and enough room for players to surprise the narrator with solutions you never wrote. A popular scenario earns you a share of the paid tokens players spend on it.',
        image: tutorialImage('scenario', 'add'),
      },
    ],
  },

  dream: {
    key: 'dream',
    title: 'Dreams',
    tagline: 'Explore imagined places, dreamscapes, and story seeds.',
    overview:
      'Dreams are collaborative places, story seeds, and weird little worlds ' +
      'that can inspire chat, art, scenarios, and future story material. Browse ' +
      'the gallery, expand a world, or create your own dreamscapes.',
    earnings: CREATOR_EARNINGS_MESSAGE,
    sections: [
      {
        key: 'dreams',
        title: 'Dream Gallery',
        body: 'Browse collaborative dreams, pick a world to expand, chat inside it, generate art around it, clone an interesting seed, or quietly retire the portals that did not work out.',
        image: tutorialImage('dream', 'dreams'),
      },
      {
        key: 'dreammaker',
        title: 'Dreammaker',
        body: 'Create a new dream or revise an existing one with the right title, idea, description, art hooks, and story coordinates. Dreams join the profit share, so a place people keep building on can earn you a cut.',
        image: tutorialImage('dream', 'add'),
      },
      {
        key: 'brainstorm',
        title: 'Dream Brainstorm',
        body: 'Start with an idea, generate riffs on the concept, accept the good ones, reject the goblins, and save the survivors as reusable dream seeds.',
        image: tutorialImage('dream', 'brainstorm'),
      },
    ],
  },

  character: {
    key: 'character',
    title: 'Characters',
    tagline: 'Design and meet the cast of your world.',
    overview:
      'Create the people, creatures, guides, rivals, and chattable weirdos ' +
      'who move through your stories. Build them in the gallery, then cast ' +
      'them together on the stage.',
    earnings: CREATOR_EARNINGS_MESSAGE,
    sections: [
      {
        key: 'characters',
        title: 'Character Gallery',
        body: 'Browse the cast, select favorites, and clone useful archetypes. All your glorious weirdos live in one theatrical little cabinet.',
        image: tutorialImage('character', 'characters'),
      },
      {
        key: 'add',
        title: 'Add Character',
        body: 'Build a character from scratch or through the interactive adventurer. Characters join the profit share, so a memorable one can earn you a cut of the paid tokens spent using it.',
        image: tutorialImage('character', 'add'),
      },
      {
        key: 'stage',
        title: 'Stage Manager',
        body: 'Cast one or more characters into a scene together and let their energy play off each other. The stage is where a cabinet of profiles becomes an actual cast.',
        image: tutorialImage('character', 'stage'),
      },
    ],
  },

  reward: {
    key: 'reward',
    title: 'Rewards',
    tagline: 'Items, magic, powers, skills, and favors.',
    overview:
      'Rewards are the narrative accelerants - items, magic, powers, skills, ' +
      'and favors - that inspire a creative experience. Browse the gallery to ' +
      'spin one into a story prompt, or create your own for stories to use.',
    earnings: CREATOR_EARNINGS_MESSAGE,
    sections: [
      {
        key: 'rewards',
        title: 'Reward Gallery',
        body: 'Browse rewards and use any of them as a text-based story prompt. Most rewards do their real work inside scenarios and characters, but a single reward can headline a prompt too - and if it earns paid usage, you get a share.',
        image: tutorialImage('reward', 'rewards'),
      },
      {
        key: 'add',
        title: 'Create Reward',
        body: 'Create items, magic, powers, skills, and favors with enough narrative flavor to make the loot table purr. Built to drop into scenarios and characters, with profit share when people pay to use them.',
        image: tutorialImage('reward', 'add'),
      },
    ],
  },

  bot: {
    key: 'bot',
    title: 'Bots',
    tagline: 'Build personalities, assistants, and accomplices.',
    overview:
      'A bot is a focused, specialized GPT. Visit the Cafe to chat with bots ' +
      'others have built, and the Factory to forge your own. Bots that draw ' +
      'paid token usage earn their makers a share.',
    earnings: CREATOR_EARNINGS_MESSAGE,
    sections: [
      {
        key: 'bots',
        title: 'Bot Cafe',
        body: 'Browse and chat with bots, launch a favorite assistant, or clone a useful troublemaker. The Cafe is where bots meet the people who actually use them.',
        image: tutorialImage('bot', 'bots'),
      },
      {
        key: 'forge',
        title: 'Bot Factory',
        body: 'Forge new bot personalities and tune their skills. A bot that catches on and pulls paid usage earns you a share of the profit.',
        image: tutorialImage('bot', 'forge'),
      },
      {
        key: 'composition',
        title: 'Composition',
        body: 'Composition is a way to customize the shape of a bot\u2019s response object for more precise requests. Still under construction while we work out the details.',
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
      'Build prompts, generate images, browse the gallery, and remix styles ' +
      'through the active art server. Turn story fuel into fresh images ' +
      'without waking the prompt goblin unless absolutely necessary.',
    sections: [
      {
        key: 'generate',
        title: 'Art Generator',
        body: 'Build prompts, choose the active art server, and create new images. The control room for turning words into pictures.',
        image: tutorialImage('art', 'generate'),
      },
      {
        key: 'gallery',
        title: 'Art Gallery',
        body: 'Browse generated art, inspect details, and collect favorites until the rest of the page stops looking naked.',
        image: tutorialImage('art', 'gallery'),
      },
      {
        key: 'styler',
        title: 'Art Styler',
        body: 'Remix an existing image into a fresh style, polish rough gems, and commit tasteful visual crimes against boring defaults.',
        image: tutorialImage('art', 'styler'),
      },
      {
        key: 'workbench',
        title: 'Code Cards (Workbench)',
        body: 'A simplified, abstracted ComfyUI interface for building specific chains of art and text generation. Under construction while we smooth out the rough edges.',
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
      'Welcome to the heart of the project. A lot of the Sanctuary is still ' +
      'under construction, but the plan is a profit-share model that splits ' +
      'funds three ways: Kind Robots, our anti-malaria fundraiser, and the ' +
      'users who contribute to the site. Here is what is coming.',
    underConstruction: true,
    sections: [
      {
        key: 'giftshop',
        title: 'Giftshop',
        body: 'A print-on-demand shop built on art and text generated right here on the site. Still under development, but the plan is to turn your creations into things you can actually hold.',
        image: tutorialImage('sanctuary', 'giftshop'),
        underConstruction: true,
      },
      {
        key: 'forum',
        title: 'Forum',
        body: 'Talk with other members of the community: comment, compare notes, and share the beautiful nonsense you have been building.',
        image: tutorialImage('sanctuary', 'forum'),
      },
      {
        key: 'subscriptions',
        title: 'Subscriptions',
        body: 'A monthly subscription gets you more generations and priority in the queue, and helps keep the whole ecosystem running.',
        image: tutorialImage('sanctuary', 'subscriptions'),
      },
      {
        key: 'wallet',
        title: 'Mana Purse',
        body: 'See how many free generations you have available. Down the line, this is also where you will watch the credits you have earned from other people using your creations.',
        image: tutorialImage('sanctuary', 'wallet'),
      },
      {
        key: 'sponsor',
        title: 'About & Sponsorship',
        body: 'Our mission, our history, and the anti-malaria fundraiser at the center of it. This is where AMI turns tiny digital wings into real-world protection.',
        image: tutorialImage('sanctuary', 'sponsor'),
      },
    ],
  },

  builder: {
    key: 'builder',
    title: 'Builder',
    tagline: 'One flow to build everything.',
    overview:
      'The Builder is a single guided flow for creating all your building ' +
      'blocks - dream seeds, dreams, characters, bots, rewards, scenarios, and ' +
      'art - using the builder card system to move through each step in a ' +
      'simple GUI. Start small, stack boldly.',
    earnings: CREATOR_EARNINGS_MESSAGE,
    sections: [
      {
        key: 'builder',
        title: 'Builder Cards',
        body: 'Move through a card-driven flow to create dream seeds, dreams, characters, bots, rewards, scenarios, and art - all from one place, no juggling required. Many of these creations can join the profit share once they are out in the world.',
        image: tutorialImage('builder', 'builder'),
      },
    ],
  },

  // `home` is the footer key for the user channel: account configuration,
  // avatars, friends, milestones, themes, and chats.
  home: {
    key: 'home',
    title: 'Your Account',
    tagline: 'Configure your profile, your look, and your people.',
    overview:
      'Your home base. Configure your account, build an avatar, manage your ' +
      'friends list, chase milestones, theme the whole place, and keep up ' +
      'with conversations across the community.',
    sections: [
      {
        key: 'dashboard',
        title: 'Dashboard',
        body: 'Your configuration hub: account details, preferences, privacy, and the practical knobs that keep the whole contraption personalized.',
        image: tutorialImage('home', 'dashboard'),
      },
      {
        key: 'avatars',
        title: 'Avatar Creator',
        body: 'Choose how you show up: upload an image, select from the collection, or generate something brand new with the art tools.',
        image: tutorialImage('home', 'avatars'),
      },
      {
        key: 'friends',
        title: 'Friends',
        body: 'Browse your friends list: favorite people, companions, collaborators, and the friendly weirdos who make the village feel alive.',
        image: tutorialImage('home', 'friends'),
      },
      {
        key: 'milestones',
        title: 'Milestones',
        body: 'Our achievement system. Collect jellybeans hidden throughout the site by interacting with the tools, and track the rewards you unlock along the way.',
        image: tutorialImage('home', 'milestones'),
      },
      {
        key: 'themes',
        title: 'Theme Manager',
        body: 'Switch between 30+ DaisyUI themes, or build your own custom design and share it with the community. Aesthetics are infrastructure with better shoes.',
        image: tutorialImage('home', 'themes'),
      },
      {
        key: 'chats',
        title: 'Chats',
        body: 'View and continue your messages with other members of the community, so useful conversations do not vanish into the scroll mines.',
        image: tutorialImage('home', 'chats'),
      },
    ],
  },
} as const satisfies Record<FooterKey, TutorialChannel>

export type TutorialChannelKey = keyof typeof tutorialChannels

export const tutorialChannelKeys = Object.keys(
  tutorialChannels,
) as TutorialChannelKey[]

export function isTutorialChannelKey(
  value: string,
): value is TutorialChannelKey {
  return value in tutorialChannels
}

export function getTutorialChannel(key: TutorialChannelKey): TutorialChannel {
  return tutorialChannels[key]
}

// Resolved hero path: explicit override if set, otherwise the conventional
// /images/tutorials/<channel>/hero.webp.
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

// Resolve the tutorial channel for a route path. Footer routes are not unique
// (several tabs share /bots, /art, etc.), so this matches the channel whose
// footer route is the longest prefix of the given path. Returns null when
// nothing matches (e.g. an unrelated page), so callers can hide the tutorial
// entry rather than guessing.
export function resolveTutorialChannelFromRoute(
  path: string,
): TutorialChannelKey | null {
  // Strip query and hash without array indexing (keeps strict
  // noUncheckedIndexedAccess happy — split()[0] would be string | undefined).
  let cleanPath = path || ''
  const queryIndex = cleanPath.indexOf('?')
  if (queryIndex !== -1) cleanPath = cleanPath.slice(0, queryIndex)
  const hashIndex = cleanPath.indexOf('#')
  if (hashIndex !== -1) cleanPath = cleanPath.slice(0, hashIndex)

  let bestKey: TutorialChannelKey | null = null
  let bestLen = -1

  for (const key of tutorialChannelKeys) {
    const route = footerRouteMap[key]
    if (!route) continue

    // Exact match always wins immediately.
    if (cleanPath === route) return key

    // Otherwise prefer the longest matching prefix, ignoring the bare '/'
    // home route so it doesn't swallow every path.
    const isPrefix = route !== '/' && cleanPath.startsWith(`${route}/`)

    if (isPrefix && route.length > bestLen) {
      bestKey = key
      bestLen = route.length
    }
  }

  return bestKey
}

// Sanity check: every footer channel should have a tutorial entry. This keeps
// tutorialCards in sync with dashboardHelper's footer tabs at the type level.
type _AllFooterChannelsCovered = TutorialChannelKey extends FooterKey
  ? FooterKey extends TutorialChannelKey
    ? true
    : false
  : false
const _coverageCheck: _AllFooterChannelsCovered = true
void _coverageCheck
void footerKeys
