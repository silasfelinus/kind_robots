// /stores/helpers/dashboardHelper.ts

export type DashboardTabConfig = {
  key: string
  label: string
  icon?: string
  title?: string
  summary?: string
  image?: string
  flourish?: string
  tagline?: string
  narrative?: string
  modelType?: string
  route?: string
  requiredBeforeNext?: string[]
}

export type DashboardConfig = {
  key: string
  label: string
  defaultTab: string
  tabs: DashboardTabConfig[]
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
        summary: 'Add an image to our gallery.',
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
        summary: 'Remix an image into a fresh style.',
      },
      {
        key: 'workbench',
        label: 'Workbench',
        icon: 'kind-icon:foundry',
        title: 'Workbench',
        summary: 'Create modular server requests with special code cards.',
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
        summary: 'Build a robot with easy builder cards.',
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
        summary: 'Compose your own bot endpoint.',
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
        summary: 'Build a pitch using easy builder cards.',
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
    defaultTab: 'user',
    tabs: [
      {
        key: 'user',
        label: 'User',
        icon: 'kind-icon:person',
        title: 'User Builder',
        summary:
          'Login or register, pick a designer name, choose an avatar, configure privacy, maturity, and servers.',
        modelType: 'user',
        route: '/dashboard',
        requiredBeforeNext: ['designerName'],
      },
      {
        key: 'pitch',
        label: 'Pitch',
        icon: 'kind-icon:idea',
        title: 'Pitch Builder',
        summary:
          'Start with the big-picture idea. A pitch is the seed, not the whole haunted botanical garden.',
        modelType: 'pitch',
        route: '/brainstorm',
        requiredBeforeNext: ['title', 'pitch'],
      },
      {
        key: 'dream',
        label: 'Dream',
        icon: 'kind-icon:moon',
        title: 'Dream Builder',
        summary:
          'Evolve the pitch into a richer world with setting, vibe, conflicts, locations, and reusable story fuel.',
        modelType: 'dream',
        route: '/dreams',
        requiredBeforeNext: ['title'],
      },
      {
        key: 'character',
        label: 'Character',
        icon: 'kind-icon:mask',
        title: 'Character Builder',
        summary:
          'Create people, creatures, guides, rivals, disasters, and chattable weirdos who can live inside dreams.',
        modelType: 'character',
        route: '/characters',
        requiredBeforeNext: ['name'],
      },
      {
        key: 'bot',
        label: 'Bots',
        icon: 'kind-icon:robot-color',
        title: 'Bot Builder',
        summary:
          'Create bot assistants with particular skills, personalities, and mildly suspicious charm.',
        modelType: 'bot',
        route: '/bots',
        requiredBeforeNext: ['name'],
      },
      {
        key: 'reward',
        label: 'Reward',
        icon: 'kind-icon:gift',
        title: 'Reward Builder',
        summary:
          'Design loot, powers, skills, secrets, permissions, curses, keys, and other narrative accelerants.',
        modelType: 'reward',
        route: '/rewards',
        requiredBeforeNext: ['title'],
      },
      {
        key: 'scenario',
        label: 'Scenario',
        icon: 'kind-icon:map',
        title: 'Scenario Builder',
        summary:
          'Build multiple-choice experiences where users can also invent solutions and let the LLM narrate outcomes.',
        modelType: 'scenario',
        route: '/stories',
        requiredBeforeNext: ['title', 'intro'],
      },
      {
        key: 'art',
        label: 'Art',
        icon: 'kind-icon:palette',
        title: 'Art Builder',
        summary:
          'Assemble an image one card at a time: subject, figures, style, the punk mix, setting, mood, and resources.',
        modelType: 'art',
        route: '/art',
        requiredBeforeNext: ['style'],
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
        key: 'adventure',
        label: 'Adventure',
        icon: 'kind-icon:mask',
        title: 'Adventure Creator',
        summary: 'Create a character with the interactive adventurer.',
      },
      {
        key: 'stage',
        label: 'Stage',
        icon: 'kind-icon:mask',
        title: 'Stage Performance',
        summary: 'Create a scene with one or more performers.',
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
      {
        key: 'overview',
        label: 'Overview',
        icon: 'kind-icon:home',
        title: 'Composition Overview',
      },
      {
        key: 'gallery',
        label: 'Gallery',
        icon: 'kind-icon:grid',
        title: 'Composition Gallery',
      },
      {
        key: 'add',
        label: 'New',
        icon: 'kind-icon:plus',
        title: 'New Composition',
      },
      {
        key: 'synthesize',
        label: 'Synthesize',
        icon: 'kind-icon:wand',
        title: 'Synthesize',
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
        key: 'builder',
        label: 'Location Builder',
        icon: 'kind-icon:wrench',
        title: 'Location Builder',
        summary: 'Build a location with easy builder cards.',
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
        summary: 'Add or edit a dream experience.',
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
        title: 'Butterfly Sanctuary',
        flourish: '✿',
        tagline: 'The swarm that absolutely does not run this website.',
        narrative:
          'Summon, inspect, and interact with the butterflies, and tune the screen effects they pretend not to control.',
      },
      {
        key: 'bot',
        label: 'Bot',
        icon: 'kind-icon:robot-color',
        title: 'Bots',
        flourish: '◈',
        tagline: 'Build personalities, assistants, and accomplices.',
        narrative:
          'Build bots with the builder cards, chat with them, forge new ones, or compose your own endpoint.',
      },
      {
        key: 'art',
        label: 'Art',
        icon: 'kind-icon:palette',
        title: 'Art',
        flourish: '◐',
        tagline: 'Generate and browse AI artwork.',
        narrative:
          'Build prompts, generate images, browse the gallery, and remix styles through the active art server.',
      },
      {
        key: 'scenario',
        label: 'Scenario',
        icon: 'kind-icon:story',
        title: 'Stories',
        flourish: '§',
        tagline: 'Bring everything into one narrative space.',
        narrative:
          'Combine characters, places, treasures, and art into a single unfolding story.',
      },
      {
        key: 'theme',
        label: 'Theme',
        icon: 'kind-icon:paintbrush',
        title: 'Themes',
        flourish: '✦',
        tagline: 'Change the look and the vibe.',
        narrative: 'Browse and activate themes, or build a custom palette.',
      },
      {
        key: 'user',
        label: 'User',
        icon: 'kind-icon:person',
        title: 'User Dashboard',
        flourish: '☉',
        tagline: 'Account, profile, and settings.',
        narrative:
          'Manage your account, subscription, milestones, themes, and chat history.',
      },
      {
        key: 'lab',
        label: 'Lab',
        icon: 'kind-icon:foundry',
        title: 'WonderLab',
        flourish: '⚗',
        tagline: 'Let the robots touch the shiny buttons.',
        narrative:
          'Experiment, test reactions, and play with the toys that are not quite ready for the front page.',
      },
      {
        key: 'brainstorm',
        label: 'Brainstorm',
        icon: 'kind-icon:brain',
        title: 'Brainstorm',
        flourish: '✺',
        tagline: 'Catch loose ideas before they escape into the walls.',
        narrative:
          'Work with pitches, prompts, and generated ideas. Build a pitch or let the brainstorm run.',
      },
      {
        key: 'giftshop',
        label: 'Giftshop',
        icon: 'kind-icon:gift',
        title: 'Butterfly Giftshop',
        flourish: '❦',
        tagline: 'Merch, prints, tokens, and swarm-approved artifacts.',
        narrative:
          'Browse the shop, manage your mana purse, and sponsor the anti-malaria mission behind AMI.',
      },
      {
        key: 'dream',
        label: 'Dream',
        icon: 'kind-icon:moon',
        title: 'Locations',
        flourish: '☾',
        tagline: 'Explore imagined places and dreamscapes.',
        narrative:
          'Coordinate collaborative dreams, prompts, art, collections, and the places your stories happen.',
      },
      {
        key: 'character',
        label: 'Character',
        icon: 'kind-icon:mask',
        title: 'Characters',
        flourish: '⚜',
        tagline: 'Design and meet the cast of your world.',
        narrative:
          'Create characters with the adventure builder, pair them with scenarios and rewards, and bring them to the stage.',
      },
      {
        key: 'reward',
        label: 'Reward',
        icon: 'kind-icon:trophy',
        title: 'Rewards',
        flourish: '♛',
        tagline: 'Earn and collect rewards for your creations.',
        narrative:
          'Browse powers, items, and plot grenades. Build new rewards or turn one into a story encounter.',
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
        summary: 'Manage your mana wallet.',
      },
      {
        key: 'sponsor',
        label: 'Sponsor',
        icon: 'kind-icon:hand-heart',
        title: 'Sponsor the Mission',
        summary:
          'Support the anti-malaria mission and help AMI turn tiny digital wings into real-world mosquito-net energy.',
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
        summary: 'Build a reward with easy builder cards.',
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
        summary: 'Build a scenario with easy builder cards.',
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
        flourish: '⚔',
        tagline: 'A card-matching crawl with teeth.',
        narrative:
          'Explore the gamified memory adventure. Match the cards, survive the dungeon, see how deep it goes.',
      },
      {
        key: 'wonder-lab',
        label: 'WonderLab',
        icon: 'kind-icon:flask',
        title: 'WonderLab',
        summary: 'Experimental toys, tests, and delightful nonsense.',
        flourish: '⚗',
        tagline: 'Experimental toys and delightful nonsense.',
        narrative:
          'The open sandbox. Experimental components, half-finished toys, and things that exist purely because they were fun to make.',
      },
      {
        key: 'screen-fx',
        label: 'Screen FX',
        icon: 'kind-icon:sparkles',
        title: 'Screen Effects',
        summary: 'Control overlays, butterflies, and visual effects.',
        flourish: '✦',
        tagline: 'Overlays, butterflies, and visual chaos.',
        narrative:
          'Control the screen-effect layer, including matrix rain, firefly drift, butterflies, and ambient theater.',
      },
      {
        key: 'chat-test',
        label: 'Chat Test',
        icon: 'kind-icon:chat',
        title: 'Chat Test',
        summary: 'Test different chat streams.',
        flourish: '◈',
        tagline: 'Poke the text engines and watch them stream.',
        narrative:
          'Test different chat streams and text backends, then watch the tokens arrive.',
      },
      {
        key: 'art-test',
        label: 'Art Test',
        icon: 'kind-icon:image',
        title: 'Art Test',
        summary: 'Test our image generators.',
        flourish: '◐',
        tagline: 'Throw prompts at the image generators.',
        narrative:
          'Test image generators directly with quick prompts and fast iteration.',
      },
    ],
  },
} as const satisfies Record<string, DashboardConfig>

export type DashboardKey = keyof typeof dashboardConfigs

export type FooterKey = (typeof dashboardConfigs.footer.tabs)[number]['key']

export const dashboardKeys = Object.keys(dashboardConfigs) as DashboardKey[]

export const footerKeys = dashboardConfigs.footer.tabs.map((tab) => {
  return tab.key
}) as FooterKey[]

export const fallbackFooterKey: FooterKey = dashboardConfigs.footer.defaultTab

export const footerRouteMap = {
  fx: '/sanctuary',
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

export function getDashboardConfig(key: DashboardKey): DashboardConfig {
  return dashboardConfigs[key]
}

export function getDashboardTabs(key: DashboardKey): DashboardTabConfig[] {
  return dashboardConfigs[key].tabs
}

export function getDashboardDefaultTab(key: DashboardKey): string {
  return dashboardConfigs[key].defaultTab
}

export function getDashboardDefaultTabs(): Record<DashboardKey, string> {
  return Object.fromEntries(
    dashboardKeys.map((key) => [key, dashboardConfigs[key].defaultTab]),
  ) as Record<DashboardKey, string>
}

export function getDashboardTabMap(): Record<DashboardKey, string[]> {
  return Object.fromEntries(
    dashboardKeys.map((key) => [
      key,
      dashboardConfigs[key].tabs.map((tab) => tab.key),
    ]),
  ) as Record<DashboardKey, string[]>
}

export function isDashboardTabKey(
  dashboardKey: DashboardKey,
  tabKey: string,
): boolean {
  return dashboardConfigs[dashboardKey].tabs.some((tab) => tab.key === tabKey)
}

export function getDashboardTabConfig(
  dashboardKey: DashboardKey,
  tabKey: string,
): DashboardTabConfig | null {
  return (
    dashboardConfigs[dashboardKey].tabs.find((tab) => tab.key === tabKey) ??
    null
  )
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

export function validateDashboardPair(
  dashboardKey: string,
  dashboardTab: string,
): {
  success: boolean
  message: string
  dashboardKey: DashboardKey | null
  dashboardTab: string
} {
  if (!isDashboardKey(dashboardKey)) {
    return {
      success: false,
      message: `Invalid dashboardKey "${dashboardKey}". Expected one of: ${dashboardKeys.join(', ')}`,
      dashboardKey: null,
      dashboardTab,
    }
  }

  if (!isDashboardTabKey(dashboardKey, dashboardTab)) {
    return {
      success: false,
      message: `Invalid dashboardTab "${dashboardTab}" for dashboardKey "${dashboardKey}". Expected one of: ${dashboardConfigs[
        dashboardKey
      ].tabs
        .map((tab) => tab.key)
        .join(', ')}`,
      dashboardKey,
      dashboardTab,
    }
  }

  return {
    success: true,
    message: 'Dashboard front matter is valid.',
    dashboardKey,
    dashboardTab,
  }
}
