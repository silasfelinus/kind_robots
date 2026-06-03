// /stores/helpers/dashboardHelper.ts

import {
  builderDashboardTabs,
  defaultBuilderStage,
} from '@/stores/seeds/builderSchema'
import type { DashboardTabConfig } from '@/stores/helpers/builderCards'

export type DashboardConfig = {
  key: string
  label: string
  defaultTab: string
  tabs: DashboardTabConfig[]
}

const serverStatusTab: DashboardTabConfig = {
  key: 'status',
  label: 'Status',
  icon: 'kind-icon:activity',
  title: 'Server Status',
  summary:
    'Inspect runtime health, refresh server capabilities, change active model settings, and import server resources.',
}

export const dashboardConfigs = {
  art: {
    key: 'art',
    label: 'Art',
    defaultTab: 'generate',
    tabs: [
      {
        key: 'generate',
        label: 'Generate',
        icon: 'kind-icon:sparkles',
        title: 'Generate Art',
        summary:
          'Build prompts and create new images through the active art server.',
      },
      {
        key: 'upload',
        label: 'Upload',
        icon: 'kind-icon:save',
        title: 'Upload Art',
        summary: 'Add an image to our gallery',
      },
      {
        key: 'gallery',
        label: 'Gallery',
        icon: 'kind-icon:image',
        title: 'Art Gallery',
        summary: 'Browse, select, upload, collect, and inspect generated art.',
      },
      {
        key: 'checkpoints',
        label: 'Models',
        icon: 'kind-icon:blueprint',
        title: 'Checkpoints',
        summary:
          'Choose checkpoints, samplers, and verify active backend models.',
      },
      {
        key: 'styler',
        label: 'Styler',
        icon: 'kind-icon:paintbrush',
        title: 'Art Styler',
        summary: 'Remix an image into a fresh style',
      },
      {
        key: 'workbench',
        label: 'Workbench',
        icon: 'kind-icon:foundry',
        title: 'Workbench',
        summary: 'create modular server requests with our special code cards.',
      },
      {
        key: 'memory-dungeon',
        label: 'Dungeon',
        icon: 'kind-icon:castle',
        title: 'Memory Dungeon',
        summary: 'Explore the gamified memory adventure.',
      },
    ],
  },

  bot: {
    key: 'bot',
    label: 'Bots',
    defaultTab: 'overview',
    tabs: [
      {
        key: 'overview',
        label: 'Overview',
        icon: 'kind-icon:dashboard',
        title: 'Bot Overview',
        summary: 'Browse bots, choose text engines, and start conversations.',
      },
      {
        key: 'bots',
        label: 'Bots',
        icon: 'kind-icon:robot',
        title: 'Bot Gallery',
        summary: 'Select, add, edit, clone, delete, or launch bots.',
      },
      {
        key: 'builder',
        label: 'Bot Builder',
        icon: 'kind-icon:wrench',
        title: 'Bot Builder',
        summary: 'Build a robot with our easy builder cards!',
      },
      {
        key: 'interact',
        label: 'Interact',
        icon: 'kind-icon:chat',
        title: 'Bot Interact',
        summary: 'Chat with the selected bot.',
      },
      {
        key: 'forge',
        label: 'Forge',
        icon: 'kind-icon:sparkles',
        title: 'Bot Forge',
        summary: 'Create or edit bots.',
      },
      {
        key: 'composition',
        label: 'Composition',
        icon: 'kind-icon:rubik',
        title: 'Composition',
        summary: 'Compose your own bot endpoint',
      },
    ],
  },

  brainstorm: {
    key: 'brainstorm',
    label: 'Brainstorm',
    defaultTab: 'overview',
    tabs: [
      {
        key: 'overview',
        label: 'Overview',
        icon: 'kind-icon:dashboard',
        title: 'Brainstorm Overview',
        summary: 'Work with pitches, prompts, and generated ideas.',
      },
      {
        key: 'pitches',
        label: 'Pitches',
        icon: 'kind-icon:idea',
        title: 'Pitch Gallery',
        summary: 'Browse, select, add, edit, and delete big-picture ideas.',
      },
      {
        key: 'builder',
        label: 'Builder',
        icon: 'kind-icon:plan',
        title: 'Pitch Builder',
        summary: 'Build a Pitch using our easy builder cards.',
      },
      {
        key: 'prompts',
        label: 'Prompts',
        icon: 'kind-icon:prompt',
        title: 'Prompt Gallery',
        summary: 'Browse reusable text prompts.',
      },
      {
        key: 'interact',
        label: 'Interact',
        icon: 'kind-icon:brain',
        title: 'Brainstorm Interact',
        summary:
          'Generate, accept, edit, reject, save, or overwrite brainstorms.',
      },
    ],
  },

  builder: {
    key: 'builder',
    label: 'Builder',
    defaultTab: defaultBuilderStage,
    tabs: builderDashboardTabs,
  },

  character: {
    key: 'character',
    label: 'Character',
    defaultTab: 'overview',
    tabs: [
      {
        key: 'overview',
        label: 'Overview',
        icon: 'kind-icon:sparkles',
        title: 'Character Overview',
        summary: 'Pair a character with scenarios, rewards, dreams, and chat.',
      },
      {
        key: 'characters',
        label: 'Characters',
        icon: 'kind-icon:person',
        title: 'Character Gallery',
        summary: 'Select, add, edit, clone, or delete characters.',
      },
      {
        key: 'adventure',
        label: 'Adventure',
        icon: 'kind-icon:mask',
        title: 'Adventure Creator',
        summary: 'Create a character with our interactive adventurer',
      },
      {
        key: 'stage',
        label: 'Stage',
        icon: 'kind-icon:mask',
        title: 'Stage Performance',
        summary: 'Create a scene with one or more Performers',
      },
      {
        key: 'scenarios',
        label: 'Scenarios',
        icon: 'kind-icon:map',
        title: 'Scenario Pairing',
        summary: 'Choose a setting for character interactions.',
      },
      {
        key: 'rewards',
        label: 'Rewards',
        icon: 'kind-icon:gift',
        title: 'Reward Pairing',
        summary: 'Choose powers, items, or plot grenades.',
      },
      {
        key: 'dreams',
        label: 'Dreams',
        icon: 'kind-icon:moon',
        title: 'Dream Pairing',
        summary: 'Use characters inside collaborative dream sessions.',
      },
      {
        key: 'interact',
        label: 'Interact',
        icon: 'kind-icon:chat',
        title: 'Character Interact',
        summary:
          'Chat, adventure, or generate prompts with the selected character.',
      },
    ],
  },
  composition: {
    key: 'composition',
    label: 'Composition Manager',
    defaultTab: 'overview',
    tabs: [
      { key: 'overview', label: 'Overview', icon: 'kind-icon:home' },
      { key: 'gallery', label: 'Gallery', icon: 'kind-icon:grid' },
      { key: 'add', label: 'New', icon: 'kind-icon:plus' },
      { key: 'synthesize', label: 'Synthesize', icon: 'kind-icon:wand' },
    ],
  },

  dream: {
    key: 'dream',
    label: 'Dream',
    defaultTab: 'overview',
    tabs: [
      {
        key: 'overview',
        label: 'Overview',
        icon: 'kind-icon:sparkles',
        title: 'Dream Overview',
        summary:
          'Coordinate the current dream, prompt, image, servers, and collaborators.',
      },
      {
        key: 'dreams',
        label: 'Dreams',
        icon: 'kind-icon:moon',
        title: 'Dream Gallery',
        summary: 'Select, add, edit, clone, or delete collaborative dreams.',
      },
      {
        key: 'builder',
        label: 'Location Builder',
        icon: 'kind-icon:wrench',
        title: 'Location Builder',
        summary: 'Build a location with our easy builder cards!',
      },
      {
        key: 'prompts',
        label: 'Prompts',
        icon: 'kind-icon:prompt',
        title: 'Prompt Tools',
        summary:
          'Use pitches, prompt text, and inspiration to steer the dream.',
      },
      {
        key: 'art',
        label: 'Art',
        icon: 'kind-icon:palette',
        title: 'Dream Art',
        summary: 'Choose or generate the current image for the dream.',
      },
      {
        key: 'collections',
        label: 'Collections',
        icon: 'kind-icon:folder',
        title: 'Dream Collections',
        summary: 'Manage shared art collections connected to the dream.',
      },
      {
        key: 'scenarios',
        label: 'Scenarios',
        icon: 'kind-icon:map',
        title: 'Scenario Link',
        summary: 'Optionally ground the dream in a storytelling scenario.',
      },

      {
        key: 'add',
        label: 'Add/Edit',
        icon: 'kind-icon:plus',
        title: 'Add/Edit Dreams',
        summary: 'Add/Edit a dream experience',
      },
      {
        key: 'interact',
        label: 'Interact',
        icon: 'kind-icon:chat',
        title: 'Dream Interact',
        summary: 'Collaboratively evolve the dream through text and images.',
      },
    ],
  },

  footer: {
    key: 'footer',
    label: 'Footer',
    defaultTab: 'fx',
    tabs: [
      {
        key: 'fx',
        label: 'FX',
        icon: 'kind-icon:butterfly',
        title: 'Effects',
      },
      {
        key: 'bot',
        label: 'Bot',
        icon: 'kind-icon:robot',
        title: 'Kind Robots',
      },
      {
        key: 'art',
        label: 'Art',
        icon: 'kind-icon:art',
        title: 'Art',
      },
      {
        key: 'scenario',
        label: 'Scenario',
        icon: 'kind-icon:book',
        title: 'Story',
      },
      {
        key: 'theme',
        label: 'Theme',
        icon: 'kind-icon:palette',
        title: 'Theme',
      },
      {
        key: 'user',
        label: 'User',
        icon: 'kind-icon:person',
        title: 'User',
      },
      {
        key: 'lab',
        label: 'Lab',
        icon: 'kind-icon:flask',
        title: 'Lab',
      },
      {
        key: 'brainstorm',
        label: 'Brainstorm',
        icon: 'kind-icon:brain',
        title: 'Brainstorm',
      },
      {
        key: 'giftshop',
        label: 'Giftshop',
        icon: 'kind-icon:gift',
        title: 'Giftshop',
      },
      {
        key: 'dream',
        label: 'Dream',
        icon: 'kind-icon:sparkles',
        title: 'Dream',
      },
      {
        key: 'character',
        label: 'Character',
        icon: 'kind-icon:person',
        title: 'Character',
      },
      {
        key: 'reward',
        label: 'Reward',
        icon: 'kind-icon:gift',
        title: 'Reward',
      },
    ],
  },

  giftshop: {
    key: 'giftshop',
    label: 'Butterfly Giftshop',
    defaultTab: 'sanctuary',
    tabs: [
      {
        key: 'sanctuary',
        label: 'Sanctuary',
        icon: 'kind-icon:butterfly',
        title: 'Butterfly Sanctuary',
        summary:
          'Create, summon, inspect, and interact with the butterflies who absolutely, definitely do not run this entire website.',
      },
      {
        key: 'about',
        label: 'About',
        icon: 'kind-icon:sparkles',
        title: 'About the Swarm',
        summary:
          'Meet the humans, robots, butterflies, and suspiciously organized tiny executives behind Kind Robots.',
      },
      {
        key: 'butterfly-lab',
        label: 'Butterfly Lab',
        icon: 'kind-icon:flask',
        title: 'Butterfly Lab',
        summary:
          'Tune behind-the-scenes animation controls, test wing chaos, and politely ask cursed perspectives to leave.',
      },
      {
        key: 'giftshop',
        label: 'Giftshop',
        icon: 'kind-icon:gift',
        title: 'Giftshop',
        summary:
          'Browse merch, prints, tokens, and swarm-approved artifacts. Every purchase is reviewed by at least three butterflies in tiny clipboards.',
      },
      {
        key: 'cart',
        label: 'Cart',
        icon: 'kind-icon:cart',
        title: 'Cart Nest',
        summary:
          'Review your cart, update quantities, release unwanted butterflies, and proceed to checkout.',
      },
      {
        key: 'subscriptions',
        label: 'Subscriptions',
        icon: 'kind-icon:credit-card',
        title: 'Subscriptions',
        summary:
          'Manage support plans, credits, billing, and the ceremonial exchange of jellybeans for robot uptime.',
      },
      {
        key: 'wallet',
        label: 'Mana Purse',
        icon: 'kind-icon:bag',
        title: 'Mana Purse',
        summary: 'Manage your mana wallet',
      },
      {
        key: 'sponsor',
        label: 'Sponsor',
        icon: 'kind-icon:hand-heart',
        title: 'Sponsor the Mission',
        summary:
          'Support the anti-malaria mission and help AMI turn tiny digital wings into very real-world mosquito-net energy.',
      },
    ],
  },

  reward: {
    key: 'reward',
    label: 'Reward',
    defaultTab: 'overview',
    tabs: [
      {
        key: 'overview',
        label: 'Overview',
        icon: 'kind-icon:sparkles',
        title: 'Reward Overview',
        summary:
          'Pick a reward, choose a text engine, and generate a story encounter.',
      },
      {
        key: 'rewards',
        label: 'Rewards',
        icon: 'kind-icon:gift',
        title: 'Reward Gallery',
        summary: 'Select, add, edit, or delete story rewards and artifacts.',
      },
      {
        key: 'builder',
        label: 'Reward Builder',
        icon: 'kind-icon:gift',
        title: 'Reward Builder',
        summary: 'Build a reward with our easy builder cards!',
      },
      {
        key: 'collections',
        label: 'Collections',
        icon: 'kind-icon:folder',
        title: 'Reward Collections',
        summary:
          'Organize rewards by story type, item family, or chaos flavor.',
      },

      {
        key: 'interact',
        label: 'Generate',
        icon: 'kind-icon:chat',
        title: 'Reward Generator',
        summary: 'Turn a selected reward into a story prompt.',
      },
    ],
  },

  scenario: {
    key: 'scenario',
    label: 'Scenario',
    defaultTab: 'overview',
    tabs: [
      {
        key: 'overview',
        label: 'Overview',
        icon: 'kind-icon:sparkles',
        title: 'Adventure Overview',
        summary: 'Pick the ingredients for your weird little narrative soup.',
      },
      {
        key: 'scenarios',
        label: 'Scenarios',
        icon: 'kind-icon:map',
        title: 'Scenario Gallery',
        summary: 'Select, add, clone, or edit the playground.',
      },
      {
        key: 'builder',
        label: 'Scenario Builder',
        icon: 'kind-icon:wrench',
        title: 'Scenario Builder',
        summary: 'Build a scenario with our easy builder cards!',
      },
      {
        key: 'characters',
        label: 'Characters',
        icon: 'kind-icon:person',
        title: 'Character Gallery',
        summary: 'Select, add, or edit the cast.',
      },
      {
        key: 'rewards',
        label: 'Rewards',
        icon: 'kind-icon:gift',
        title: 'Reward Gallery',
        summary: 'Select, add, or edit story powers and plot grenades.',
      },

      {
        key: 'interact',
        label: 'Interact',
        icon: 'kind-icon:chat',
        title: 'Scenario Interact',
        summary: 'Start shaping the actual adventure flow.',
      },
    ],
  },

  server: {
    key: 'server',
    label: 'Server',
    defaultTab: 'overview',
    tabs: [
      {
        key: 'overview',
        label: 'Overview',
        icon: 'kind-icon:server',
        title: 'Server Overview',
        summary:
          'Manage text engines, art engines, and model resources from one control room.',
      },
      {
        key: 'art',
        label: 'Art',
        icon: 'kind-icon:palette',
        title: 'Art Servers',
        summary:
          'Pick, test, customize, and activate image generation engines.',
      },
      {
        key: 'text',
        label: 'Text',
        icon: 'kind-icon:chat',
        title: 'Text Servers',
        summary: 'Pick, test, customize, and activate chat engines.',
      },
      {
        key: 'checkpoints',
        label: 'Models',
        icon: 'kind-icon:blueprint',
        title: 'Checkpoints',
        summary:
          'Choose checkpoints, samplers, and verify active backend models.',
      },
      {
        key: 'all',
        label: 'All',
        icon: 'kind-icon:list',
        title: 'All Servers',
        summary: 'Browse every visible server.',
      },
      {
        key: 'interact',
        label: 'Interact',
        icon: 'kind-icon:wrench',
        title: 'Server Tools',
        summary: 'Ping servers, inspect health, and manage active selections.',
      },
    ],
  },

  theme: {
    key: 'theme',
    label: 'Theme',
    defaultTab: 'gallery',
    tabs: [
      {
        key: 'gallery',
        label: 'Gallery',
        icon: 'kind-icon:palette',
        title: 'Theme Gallery',
        summary: 'Browse and activate themes.',
      },
      {
        key: 'custom',
        label: 'Custom',
        icon: 'kind-icon:wrench',
        title: 'Custom Theme',
        summary: 'Edit custom theme values.',
      },
    ],
  },

  user: {
    key: 'user',
    label: 'User',
    defaultTab: 'dashboard',
    tabs: [
      {
        key: 'dashboard',
        label: 'Dashboard',
        icon: 'kind-icon:dashboard',
        title: 'User Dashboard',
        summary: 'Account, profile, and app settings.',
      },
      {
        key: 'subscription',
        label: 'Subscription',
        icon: 'kind-icon:credit-card',
        title: 'Subscription',
        summary: 'Manage plans, credits, and billing.',
      },
      {
        key: 'milestones',
        label: 'Milestones',
        icon: 'kind-icon:trophy',
        title: 'Milestones',
        summary: 'Track achievements, rewards, and progress.',
      },
      {
        key: 'themes',
        label: 'Themes',
        icon: 'kind-icon:palette',
        title: 'Theme Gallery',
        summary: 'Customize the look and vibe of the app.',
      },
      {
        key: 'chats',
        label: 'Chats',
        icon: 'kind-icon:chat',
        title: 'Chats',
        summary: 'Review conversations and message activity.',
      },
    ],
  },

  wonder: {
    key: 'wonder',
    label: 'WonderLab',
    defaultTab: 'memory-dungeon',
    tabs: [
      {
        key: 'memory-dungeon',
        label: 'Dungeon',
        icon: 'kind-icon:castle',
        title: 'Memory Dungeon',
        summary: 'Explore the gamified memory adventure.',
      },
      {
        key: 'wonder-lab',
        label: 'WonderLab',
        icon: 'kind-icon:flask',
        title: 'WonderLab',
        summary: 'Experimental toys, tests, and delightful nonsense.',
      },
      {
        key: 'screen-fx',
        label: 'Screen FX',
        icon: 'kind-icon:sparkles',
        title: 'Screen Effects',
        summary: 'Control overlays, butterflies, and visual effects.',
      },
      {
        key: 'chat-test',
        label: 'Chat Test',
        icon: 'kind-icon:chat',
        title: 'Chat Test',
        summary: 'Test different chat streams.',
      },
      {
        key: 'art-test',
        label: 'Art Test',
        icon: 'kind-icon:image',
        title: 'Art Test',
        summary: 'Test our image generators.',
      },
    ],
  },
} as const satisfies Record<string, DashboardConfig>

export type DashboardKey =
  | 'art'
  | 'bot'
  | 'brainstorm'
  | 'builder'
  | 'user'
  | 'dream'
  | 'character'
  | 'reward'
  | 'scenario'
  | 'footer'
  | 'theme'
  | 'giftshop'
  | 'server'
  | 'wonder'
  | 'composition'

export type FooterKey = (typeof dashboardConfigs.footer.tabs)[number]['key']

export const footerKeys = dashboardConfigs.footer.tabs.map((tab) => {
  return tab.key
}) as FooterKey[]

export const fallbackFooterKey: FooterKey = dashboardConfigs.footer.defaultTab

export const footerRouteMap = {
  fx: '/butterflies',
  bot: '/bots',
  art: '/art',
  scenario: '/stories',
  theme: '/themes',
  user: '/dashboard',
  lab: '/wonderlab',
  brainstorm: '/brainstorm',
  giftshop: '/giftshop',
  dream: '/dreams',
  character: '/characters',
  reward: '/rewards',
} as const satisfies Record<FooterKey, string>

export const footerDashboardMap = {
  fx: 'footer',
  bot: 'bot',
  art: 'art',
  scenario: 'scenario',
  theme: 'theme',
  user: 'user',
  lab: 'wonder',
  brainstorm: 'brainstorm',
  giftshop: 'giftshop',
  dream: 'dream',
  character: 'character',
  reward: 'reward',
} as const satisfies Record<FooterKey, DashboardKey>

export function isDashboardKey(value: string): value is DashboardKey {
  return value in dashboardConfigs
}

export function getDashboardDefaultTabs(): Record<DashboardKey, string> {
  return Object.fromEntries(
    Object.entries(dashboardConfigs).map(([key, config]) => [
      key,
      config.defaultTab,
    ]),
  ) as Record<DashboardKey, string>
}

export function isDashboardTabKey(
  dashboardKey: DashboardKey,
  tabKey: string,
): boolean {
  return dashboardConfigs[dashboardKey].tabs.some((tab) => tab.key === tabKey)
}

export function normalizeDashboardTabs(
  incoming: Record<string, string>,
): Record<DashboardKey, string> {
  const normalized = getDashboardDefaultTabs()

  for (const [dashboardKey, tabKey] of Object.entries(incoming)) {
    if (!isDashboardKey(dashboardKey)) continue

    if (isDashboardTabKey(dashboardKey, tabKey)) {
      normalized[dashboardKey] = tabKey
    }
  }

  return normalized
}

export type { DashboardTabConfig }
