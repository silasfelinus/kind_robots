// /stores/helpers/dashboardHelper.ts
export type DashboardTabConfig = {
  key: string
  label: string
  icon: string
  title?: string
  summary?: string
}

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
        key: 'servers',
        label: 'Servers',
        icon: 'kind-icon:server',
        title: 'Server Manager',
        summary: 'Manage AI providers and private endpoints.',
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
      {
        key: 'galleries',
        label: 'Galleries',
        icon: 'kind-icon:gallery',
        title: 'Galleries',
        summary: 'Browse generated and curated media.',
      },
    ],
  },

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
        key: 'gallery',
        label: 'Gallery',
        icon: 'kind-icon:image',
        title: 'Art Gallery',
        summary: 'Browse, select, upload, collect, and inspect generated art.',
      },
      {
        key: 'collections',
        label: 'Collections',
        icon: 'kind-icon:folder',
        title: 'Art Collections',
        summary: 'Organize art into reusable collections.',
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
        key: 'servers',
        label: 'Servers',
        icon: 'kind-icon:server',
        title: 'Art Servers',
        summary: 'Manage image generation servers.',
      },
      {
        key: 'selected',
        label: 'Selected',
        icon: 'kind-icon:check',
        title: 'Selected Art',
        summary: 'Inspect the currently selected art record and image.',
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
        key: 'interact',
        label: 'Interact',
        icon: 'kind-icon:chat',
        title: 'Bot Interact',
        summary: 'Chat with the selected bot.',
      },
      {
        key: 'servers',
        label: 'Servers',
        icon: 'kind-icon:server',
        title: 'Text Servers',
        summary: 'Manage text engines for bot conversations.',
      },
      {
        key: 'forge',
        label: 'Forge',
        icon: 'kind-icon:sparkles',
        title: 'Bot Forge',
        summary: 'Create or edit bots.',
      },
    ],
  },

  theme: {
    key: 'theme',
    label: 'Theme',
    defaultTab: 'overview',
    tabs: [
      {
        key: 'overview',
        label: 'Overview',
        icon: 'kind-icon:dashboard',
        title: 'Theme Overview',
        summary: 'Preview, choose, and manage app themes.',
      },
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

  giftshop: {
    key: 'giftshop',
    label: 'Giftshop',
    defaultTab: 'overview',
    tabs: [
      {
        key: 'overview',
        label: 'Overview',
        icon: 'kind-icon:dashboard',
        title: 'Giftshop Overview',
        summary: 'Manage giftshop items, swag ideas, and storefront assets.',
      },
      {
        key: 'products',
        label: 'Products',
        icon: 'kind-icon:gift',
        title: 'Products',
        summary: 'Browse and manage giftshop products.',
      },
      {
        key: 'collections',
        label: 'Collections',
        icon: 'kind-icon:folder',
        title: 'Giftshop Collections',
        summary: 'Group products and art assets.',
      },
    ],
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
        key: 'servers',
        label: 'Servers',
        icon: 'kind-icon:server',
        title: 'Character Servers',
        summary: 'Choose text and art engines.',
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
        key: 'servers',
        label: 'Servers',
        icon: 'kind-icon:server',
        title: 'Dream Servers',
        summary: 'Choose text and art engines for generation.',
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
        key: 'rebel-button',
        label: 'Rebel',
        icon: 'kind-icon:button',
        title: 'Rebel Button',
        summary: 'Push the button. Regret is optional.',
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
        key: 'choices',
        label: 'Choices',
        icon: 'kind-icon:list',
        title: 'Choice Gallery',
        summary: 'Manage reusable decision points and branching prompts.',
      },
      {
        key: 'genres',
        label: 'Genres',
        icon: 'kind-icon:book',
        title: 'Genre Gallery',
        summary: 'Manage tone, flavor, setting, and story DNA.',
      },
      {
        key: 'servers',
        label: 'Servers',
        icon: 'kind-icon:server',
        title: 'Server Manager',
        summary: 'Manage the AI engines behind the curtain.',
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
        summary: 'Pick a reward and decide how it changes the story.',
      },
      {
        key: 'rewards',
        label: 'Rewards',
        icon: 'kind-icon:gift',
        title: 'Reward Gallery',
        summary: 'Select, add, edit, or delete story rewards and artifacts.',
      },
      {
        key: 'characters',
        label: 'Characters',
        icon: 'kind-icon:person',
        title: 'Character Gallery',
        summary: 'Choose who encounters the reward.',
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
        key: 'servers',
        label: 'Servers',
        icon: 'kind-icon:server',
        title: 'Server Manager',
        summary: 'Manage the AI engines behind reward prompts.',
      },
      {
        key: 'interact',
        label: 'Interact',
        icon: 'kind-icon:chat',
        title: 'Reward Interact',
        summary: 'Turn a selected reward into a story prompt.',
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
        summary: 'Manage text and art engines from one control room.',
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
} as const satisfies Record<string, DashboardConfig>

export type DashboardKey = keyof typeof dashboardConfigs

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
