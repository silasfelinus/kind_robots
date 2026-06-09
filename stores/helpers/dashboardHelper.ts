// /stores/helpers/dashboardHelper.ts

export const DASHBOARD_TAB_IMAGE_BASE = '/images/dashboard-tabs'
export const DASHBOARD_TAB_IMAGE_EXTENSION = 'webp'

export type DashboardTabConfig = {
  key: string
  label: string
  icon?: string
  title: string
  summary?: string
  image: string
  flourish?: string
  tagline?: string
  narrative: string
  modelType?: string
  route: string
  requiredBeforeNext?: string[]
}

export type DashboardConfig = {
  key: string
  label: string
  defaultTab: string
  tabs: DashboardTabConfig[]
}

export type DashboardImageKey = `${string}/${string}`

export function getDashboardTabImagePath(
  dashboardKey: string,
  tabKey: string,
): string {
  return `${DASHBOARD_TAB_IMAGE_BASE}/${dashboardKey}/${tabKey}.${DASHBOARD_TAB_IMAGE_EXTENSION}`
}

function tabImage(dashboardKey: string, tabKey: string): string {
  return getDashboardTabImagePath(dashboardKey, tabKey)
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
        image: tabImage('art', 'generate'),
        narrative:
          'Build prompts, choose the active art server, and turn story fuel into fresh images without waking the prompt goblin unless absolutely necessary.',
        route: '/art',
      },
      {
        key: 'upload',
        label: 'Upload',
        icon: 'kind-icon:save',
        title: 'Upload Art',
        summary: 'Add an image to our gallery.',
        image: tabImage('art', 'upload'),
        narrative:
          'Bring outside images into the gallery, attach useful metadata, and make them available for collections, sheets, and future remixing.',
        route: '/art',
      },
      {
        key: 'gallery',
        label: 'Gallery',
        icon: 'kind-icon:image',
        title: 'Art Gallery',
        summary: 'Browse, select, upload, collect, and inspect generated art.',
        image: tabImage('art', 'gallery'),
        narrative:
          'Browse generated art, inspect details, collect favorites, and find the exact image that makes the rest of the page stop looking naked.',
        route: '/art',
      },
      {
        key: 'checkpoints',
        label: 'Models',
        icon: 'kind-icon:blueprint',
        title: 'Checkpoints',
        summary:
          'Choose checkpoints, samplers, and verify active backend models.',
        image: tabImage('art', 'checkpoints'),
        narrative:
          'Choose checkpoints, samplers, and backend model resources before the image forge starts confidently hallucinating with the wrong toolbox.',
        route: '/art',
      },
      {
        key: 'styler',
        label: 'Styler',
        icon: 'kind-icon:paintbrush',
        title: 'Art Styler',
        summary: 'Remix an image into a fresh style.',
        image: tabImage('art', 'styler'),
        narrative:
          'Remix existing images into new styles, polish rough gems, and perform tasteful visual crimes against boring defaults.',
        route: '/art',
      },
      {
        key: 'workbench',
        label: 'Workbench',
        icon: 'kind-icon:foundry',
        title: 'Workbench',
        summary: 'Create modular server requests with special code cards.',
        image: tabImage('art', 'workbench'),
        narrative:
          'Assemble modular server requests with reusable code cards, test weird pipelines, and keep the experimental sparks mostly inside the box.',
        route: '/art',
      },
      {
        key: 'memory-dungeon',
        label: 'Dungeon',
        icon: 'kind-icon:castle',
        title: 'Memory Dungeon',
        summary: 'Explore the gamified memory adventure.',
        image: tabImage('art', 'memory-dungeon'),
        narrative:
          'Step into the gamified memory dungeon, match cards, survive the crawl, and let the art tools moonlight as fantasy cartographers.',
        route: '/wonderlab',
      },
    ],
  },

  bot: {
    key: 'bot',
    label: 'Bots',
    defaultTab: 'bots',
    tabs: [
      {
        key: 'bots',
        label: 'Bots',
        icon: 'kind-icon:robot',
        title: 'Bot Gallery',
        summary: 'Select, add, edit, clone, delete, or launch bots.',
        image: tabImage('bot', 'bots'),
        narrative:
          'Browse the bot gallery, launch a favorite assistant, clone a useful troublemaker, or retire the ones that got too many ideas.',
        route: '/bots',
      },
      {
        key: 'forge',
        label: 'Forge',
        icon: 'kind-icon:sparkles',
        title: 'Bot Forge',
        summary: 'Create or edit bots.',
        image: tabImage('bot', 'forge'),
        narrative:
          'Forge new bot personalities, tune their skills, and give them just enough charm to be useful without letting them unionize.',
        route: '/bots',
      },
      {
        key: 'composition',
        label: 'Composition',
        icon: 'kind-icon:rubik',
        title: 'Composition',
        summary: 'Compose your own bot endpoint.',
        image: tabImage('bot', 'composition'),
        narrative:
          'Compose custom bot endpoints from reusable parts, model choices, and instructions that can survive contact with actual users.',
        route: '/bots',
      },
    ],
  },

  brainstorm: {
    key: 'brainstorm',
    label: 'Brainstorm',
    defaultTab: 'pitches',
    tabs: [
      {
        key: 'pitches',
        label: 'Pitches',
        icon: 'kind-icon:idea',
        title: 'Pitch Gallery',
        summary: 'Browse, select, add, edit, and delete big-picture ideas.',
        image: tabImage('brainstorm', 'pitches'),
        narrative:
          'Catch big-picture ideas before they escape into the walls, then sort, edit, and grow them into worlds worth building.',
        route: '/brainstorm',
      },
      {
        key: 'prompts',
        label: 'Prompts',
        icon: 'kind-icon:prompt',
        title: 'Prompt Gallery',
        summary: 'Browse reusable text prompts.',
        image: tabImage('brainstorm', 'prompts'),
        narrative:
          'Browse reusable prompts, sharpen your language tools, and keep the good incantations somewhere safer than a sticky note swamp.',
        route: '/brainstorm',
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
        image: tabImage('builder', 'user'),
        narrative:
          'Start with the creator profile: identity, avatar, privacy, maturity, and server preferences before the rest of the build starts wearing a fake mustache.',
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
        image: tabImage('builder', 'pitch'),
        narrative:
          'Shape the big-picture idea first. A pitch is the seed, not the whole haunted botanical garden, and seeds matter.',
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
        image: tabImage('builder', 'dream'),
        narrative:
          'Evolve the pitch into a richer dream with setting, vibe, conflict, locations, and reusable story fuel for later chaos.',
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
        image: tabImage('builder', 'character'),
        narrative:
          'Create people, creatures, guides, rivals, disasters, and chattable weirdos who can move through the dream without knocking over the scenery.',
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
        image: tabImage('builder', 'bot'),
        narrative:
          'Create bot assistants with specific skills, personalities, roles, and the exact amount of mildly suspicious charm the project can tolerate.',
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
        image: tabImage('builder', 'reward'),
        narrative:
          'Design loot, powers, skills, secrets, permissions, curses, keys, and other narrative accelerants that make stories go zoom.',
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
        image: tabImage('builder', 'scenario'),
        narrative:
          'Build branching experiences where users can choose options, invent solutions, and let the narrator make the consequences sparkle ominously.',
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
        image: tabImage('builder', 'art'),
        narrative:
          'Assemble an image one card at a time: subject, figures, style, setting, mood, resources, and the delicious secret sauce.',
        modelType: 'art',
        route: '/art',
        requiredBeforeNext: ['style'],
      },
    ],
  },

  character: {
    key: 'character',
    label: 'Character',
    defaultTab: 'characters',
    tabs: [
      {
        key: 'characters',
        label: 'Characters',
        icon: 'kind-icon:person',
        title: 'Character Gallery',
        summary: 'Select, add, edit, clone, or delete characters.',
        image: tabImage('character', 'characters'),
        narrative:
          'Browse the cast, select favorites, clone useful archetypes, and keep all the glorious weirdos in one theatrical little cabinet.',
        route: '/characters',
      },
      {
        key: 'adventure',
        label: 'Adventure',
        icon: 'kind-icon:mask',
        title: 'Adventure Creator',
        summary: 'Create a character with the interactive adventurer.',
        image: tabImage('character', 'adventure'),
        narrative:
          'Create a character through the interactive adventurer, making choices that turn a blank sheet into somebody with problems and style.',
        route: '/characters',
      },
      {
        key: 'stage',
        label: 'Stage',
        icon: 'kind-icon:mask',
        title: 'Stage Performance',
        summary: 'Create a scene with one or more performers.',
        image: tabImage('character', 'stage'),
        narrative:
          'Put one or more performers on stage, frame the scene, and let character energy do its dramatic little cartwheel.',
        route: '/characters',
      },
    ],
  },

  composition: {
    key: 'composition',
    label: 'Composition Manager',
    defaultTab: 'gallery',
    tabs: [
      {
        key: 'gallery',
        label: 'Gallery',
        icon: 'kind-icon:grid',
        title: 'Composition Gallery',
        summary: 'Browse saved compositions and reusable endpoint recipes.',
        image: tabImage('composition', 'gallery'),
        narrative:
          'Browse saved compositions, compare endpoint recipes, and find the reusable machine that does the thing without rebuilding it every time.',
        route: '/bots',
      },
      {
        key: 'add',
        label: 'New',
        icon: 'kind-icon:plus',
        title: 'New Composition',
        summary: 'Create a new composition recipe.',
        image: tabImage('composition', 'add'),
        narrative:
          'Create a new composition recipe from models, instructions, and routing choices that cooperate like a tiny robot kitchen.',
        route: '/bots',
      },
      {
        key: 'synthesize',
        label: 'Synthesize',
        icon: 'kind-icon:wand',
        title: 'Synthesize',
        summary: 'Generate a composition from existing parts.',
        image: tabImage('composition', 'synthesize'),
        narrative:
          'Synthesize new compositions from existing parts, then see whether the endpoint sings, squeaks, or demands a snack.',
        route: '/bots',
      },
    ],
  },

  dream: {
    key: 'dream',
    label: 'Dream',
    defaultTab: 'dreams',
    tabs: [
      {
        key: 'dreams',
        label: 'Dreams',
        icon: 'kind-icon:moon',
        title: 'Dream Gallery',
        summary: 'Select, add, edit, clone, or delete collaborative dreams.',
        image: tabImage('dream', 'dreams'),
        narrative:
          'Browse collaborative dreams, pick a world to expand, clone an interesting seed, or sweep failed portals under the rug.',
        route: '/dreams',
      },
      {
        key: 'prompts',
        label: 'Prompts',
        icon: 'kind-icon:prompt',
        title: 'Prompt Tools',
        summary:
          'Use pitches, prompt text, and inspiration to steer the dream.',
        image: tabImage('dream', 'prompts'),
        narrative:
          'Use pitches, prompt text, fragments, and inspiration to steer the dream before it becomes three raccoons in a wizard coat.',
        route: '/dreams',
      },
      {
        key: 'add',
        label: 'Add/Edit',
        icon: 'kind-icon:plus',
        title: 'Add/Edit Dreams',
        summary: 'Add or edit a dream experience.',
        image: tabImage('dream', 'add'),
        narrative:
          'Add a new dream or revise an existing one with the right title, description, vibe, and coordinates for future story travel.',
        route: '/dreams',
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
        summary: 'Summon, inspect, and interact with screen effects.',
        image: tabImage('footer', 'fx'),
        flourish: '✿',
        tagline: 'The swarm that absolutely does not run this website.',
        narrative:
          'Summon, inspect, and interact with the butterflies, and tune the screen effects they pretend not to control.',
        route: '/screenfx',
      },
      {
        key: 'bot',
        label: 'Bot',
        icon: 'kind-icon:robot-color',
        title: 'Bots',
        summary: 'Build personalities, assistants, and accomplices.',
        image: tabImage('footer', 'bot'),
        flourish: '◈',
        tagline: 'Build personalities, assistants, and accomplices.',
        narrative:
          'Build bots with the builder cards, chat with them, forge new ones, or compose your own endpoint.',
        route: '/bots',
      },
      {
        key: 'art',
        label: 'Art',
        icon: 'kind-icon:palette',
        title: 'Art',
        summary: 'Generate and browse AI artwork.',
        image: tabImage('footer', 'art'),
        flourish: '◐',
        tagline: 'Generate and browse AI artwork.',
        narrative:
          'Build prompts, generate images, browse the gallery, and remix styles through the active art server.',
        route: '/art',
      },
      {
        key: 'scenario',
        label: 'Scenario',
        icon: 'kind-icon:story',
        title: 'Stories',
        summary: 'Bring everything into one narrative space.',
        image: tabImage('footer', 'scenario'),
        flourish: '§',
        tagline: 'Bring everything into one narrative space.',
        narrative:
          'Combine characters, places, treasures, and art into a single unfolding story.',
        route: '/stories',
      },
      {
        key: 'theme',
        label: 'Theme',
        icon: 'kind-icon:paintbrush',
        title: 'Themes',
        summary: 'Change the look and the vibe.',
        image: tabImage('footer', 'theme'),
        flourish: '✦',
        tagline: 'Change the look and the vibe.',
        narrative: 'Browse and activate themes, or build a custom palette.',
        route: '/themes',
      },
      {
        key: 'user',
        label: 'User',
        icon: 'kind-icon:person',
        title: 'User Dashboard',
        summary: 'Account, profile, and settings.',
        image: tabImage('footer', 'user'),
        flourish: '☉',
        tagline: 'Account, profile, and settings.',
        narrative:
          'Manage your account, subscription, milestones, themes, and chat history.',
        route: '/dashboard',
      },
      {
        key: 'lab',
        label: 'Lab',
        icon: 'kind-icon:foundry',
        title: 'WonderLab',
        summary: 'Let the robots touch the shiny buttons.',
        image: tabImage('footer', 'lab'),
        flourish: '⚗',
        tagline: 'Let the robots touch the shiny buttons.',
        narrative:
          'Experiment, test reactions, and play with the toys that are not quite ready for the front page.',
        route: '/wonderlab',
      },
      {
        key: 'brainstorm',
        label: 'Brainstorm',
        icon: 'kind-icon:brain',
        title: 'Brainstorm',
        summary: 'Catch loose ideas before they escape into the walls.',
        image: tabImage('footer', 'brainstorm'),
        flourish: '✺',
        tagline: 'Catch loose ideas before they escape into the walls.',
        narrative:
          'Work with pitches, prompts, and generated ideas. Build a pitch or let the brainstorm run.',
        route: '/brainstorm',
      },
      {
        key: 'giftshop',
        label: 'Giftshop',
        icon: 'kind-icon:gift',
        title: 'Butterfly Giftshop',
        summary: 'Merch, prints, tokens, and swarm-approved artifacts.',
        image: tabImage('footer', 'giftshop'),
        flourish: '❦',
        tagline: 'Merch, prints, tokens, and swarm-approved artifacts.',
        narrative:
          'Browse the shop, manage your mana purse, and sponsor the anti-malaria mission behind AMI.',
        route: '/giftshop',
      },
      {
        key: 'dream',
        label: 'Dream',
        icon: 'kind-icon:moon',
        title: 'Locations',
        summary: 'Explore imagined places and dreamscapes.',
        image: tabImage('footer', 'dream'),
        flourish: '☾',
        tagline: 'Explore imagined places and dreamscapes.',
        narrative:
          'Coordinate collaborative dreams, prompts, art, collections, and the places your stories happen.',
        route: '/dreams',
      },
      {
        key: 'character',
        label: 'Character',
        icon: 'kind-icon:mask',
        title: 'Characters',
        summary: 'Design and meet the cast of your world.',
        image: tabImage('footer', 'character'),
        flourish: '⚜',
        tagline: 'Design and meet the cast of your world.',
        narrative:
          'Create characters with the adventure builder, pair them with scenarios and rewards, and bring them to the stage.',
        route: '/characters',
      },
      {
        key: 'reward',
        label: 'Reward',
        icon: 'kind-icon:trophy',
        title: 'Rewards',
        summary: 'Earn and collect rewards for your creations.',
        image: tabImage('footer', 'reward'),
        flourish: '♛',
        tagline: 'Earn and collect rewards for your creations.',
        narrative:
          'Browse powers, items, and plot grenades. Build new rewards or turn one into a story encounter.',
        route: '/rewards',
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
        image: tabImage('giftshop', 'sanctuary'),
        narrative:
          'Create, summon, inspect, and interact with the butterflies who absolutely, definitely do not run this entire website.',
        route: '/giftshop',
      },
      {
        key: 'about',
        label: 'About',
        icon: 'kind-icon:sparkles',
        title: 'About the Swarm',
        summary:
          'Meet the humans, robots, butterflies, and suspiciously organized tiny executives behind Kind Robots.',
        image: tabImage('giftshop', 'about'),
        narrative:
          'Meet the humans, robots, butterflies, and suspiciously organized tiny executives behind Kind Robots.',
        route: '/giftshop',
      },
      {
        key: 'giftshop',
        label: 'Giftshop',
        icon: 'kind-icon:gift',
        title: 'Giftshop',
        summary:
          'Browse merch, prints, tokens, and swarm-approved artifacts. Every purchase is reviewed by at least three butterflies in tiny clipboards.',
        image: tabImage('giftshop', 'giftshop'),
        narrative:
          'Browse merch, prints, tokens, and swarm-approved artifacts. Every purchase is reviewed by at least three butterflies in tiny clipboards.',
        route: '/giftshop',
      },
      {
        key: 'cart',
        label: 'Cart',
        icon: 'kind-icon:cart',
        title: 'Cart Nest',
        summary:
          'Review your cart, update quantities, release unwanted butterflies, and proceed to checkout.',
        image: tabImage('giftshop', 'cart'),
        narrative:
          'Review your cart, update quantities, release unwanted butterflies, and proceed to checkout without angering the tiny inventory moths.',
        route: '/giftshop',
      },
      {
        key: 'forum',
        label: 'Forum',
        icon: 'kind-icon:chat',
        title: 'Forum',
        summary: 'Discuss with others in the Kind Robots community.',
        image: tabImage('giftshop', 'forum'),
        narrative:
          'Discuss projects, stories, tools, and beautiful nonsense with the Kind Robots community.',
        route: '/giftshop',
      },
      {
        key: 'subscriptions',
        label: 'Subscriptions',
        icon: 'kind-icon:credit-card',
        title: 'Subscriptions',
        summary:
          'Manage support plans, credits, billing, and the ceremonial exchange of jellybeans for robot uptime.',
        image: tabImage('giftshop', 'subscriptions'),
        narrative:
          'Manage support plans, credits, billing, and the ceremonial exchange of jellybeans for robot uptime.',
        route: '/giftshop',
      },
      {
        key: 'wallet',
        label: 'Mana Purse',
        icon: 'kind-icon:bag',
        title: 'Mana Purse',
        summary: 'Manage your mana wallet.',
        image: tabImage('giftshop', 'wallet'),
        narrative:
          'Manage your mana wallet, check balances, and keep the magical economy from rolling under the couch.',
        route: '/giftshop',
      },
      {
        key: 'sponsor',
        label: 'Sponsor',
        icon: 'kind-icon:hand-heart',
        title: 'Sponsor the Mission',
        summary:
          'Support the anti-malaria mission and help AMI turn tiny digital wings into real-world mosquito-net energy.',
        image: tabImage('giftshop', 'sponsor'),
        narrative:
          'Support the anti-malaria mission and help AMI turn tiny digital wings into real-world mosquito-net energy.',
        route: '/giftshop',
      },
    ],
  },

  reward: {
    key: 'reward',
    label: 'Reward',
    defaultTab: 'rewards',
    tabs: [
      {
        key: 'rewards',
        label: 'Rewards',
        icon: 'kind-icon:gift',
        title: 'Reward Gallery',
        summary: 'Select, add, edit, or delete story rewards and artifacts.',
        image: tabImage('reward', 'rewards'),
        narrative:
          'Browse story rewards and artifacts: powers, items, keys, pets, curses, plot grenades, and other delightful accelerants.',
        route: '/rewards',
      },
      {
        key: 'add',
        label: 'Create Reward',
        icon: 'kind-icon:plus',
        title: 'Reward Generator',
        summary: 'Create fresh skills, items, powers, pets, and more.',
        image: tabImage('reward', 'add'),
        narrative:
          'Create fresh skills, items, powers, pets, and secrets with enough narrative flavor to make the loot table purr.',
        route: '/rewards',
      },
    ],
  },

  scenario: {
    key: 'scenario',
    label: 'Scenario',
    defaultTab: 'scenarios',
    tabs: [
      {
        key: 'scenarios',
        label: 'Scenarios',
        icon: 'kind-icon:map',
        title: 'Scenario Gallery',
        summary: 'Select, add, clone, or edit the playground.',
        image: tabImage('scenario', 'scenarios'),
        narrative:
          'Browse playable scenarios, clone promising branches, and edit the playground where characters discover consequences have teeth.',
        route: '/stories',
      },
      {
        key: 'add',
        label: 'Add',
        icon: 'kind-icon:plus',
        title: 'Add Scenario',
        summary:
          'Create new scenarios to jump start a one of a kind adventure.',
        image: tabImage('scenario', 'add'),
        narrative:
          'Create a new scenario with an intro, choices, stakes, and enough room for the player to surprise the narrator.',
        route: '/stories',
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
        image: tabImage('server', 'overview'),
        narrative:
          'Manage text engines, art engines, model resources, status checks, and the tiny control-room lights that make everything feel official.',
        route: '/servers',
      },
      {
        key: 'art',
        label: 'Art',
        icon: 'kind-icon:palette',
        title: 'Art Servers',
        summary:
          'Pick, test, customize, and activate image generation engines.',
        image: tabImage('server', 'art'),
        narrative:
          'Pick, test, customize, and activate image generation engines before asking them to paint a dragon holding a spreadsheet.',
        route: '/servers',
      },
      {
        key: 'text',
        label: 'Text',
        icon: 'kind-icon:chat',
        title: 'Text Servers',
        summary: 'Pick, test, customize, and activate chat engines.',
        image: tabImage('server', 'text'),
        narrative:
          'Pick, test, customize, and activate chat engines so conversations stream cleanly instead of arriving like soup through a fax machine.',
        route: '/servers',
      },
      {
        key: 'checkpoints',
        label: 'Models',
        icon: 'kind-icon:blueprint',
        title: 'Checkpoints',
        summary:
          'Choose checkpoints, samplers, and verify active backend models.',
        image: tabImage('server', 'checkpoints'),
        narrative:
          'Choose checkpoints, verify model resources, and make sure the backend is holding the correct wrench before launch.',
        route: '/servers',
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
        image: tabImage('theme', 'gallery'),
        narrative:
          'Browse theme palettes, preview the vibe, and activate the one that makes the app look like it has its life together.',
        route: '/themes',
      },
      {
        key: 'custom',
        label: 'Custom',
        icon: 'kind-icon:wrench',
        title: 'Custom Theme',
        summary: 'Edit custom theme values.',
        image: tabImage('theme', 'custom'),
        narrative:
          'Edit custom theme values, tune colors and radii, and create a look that says yes, the robots did decorate this place.',
        route: '/themes',
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
        image: tabImage('user', 'dashboard'),
        narrative:
          'Manage the account hub: profile, preferences, app settings, and the practical knobs that keep the whole contraption personalized.',
        route: '/dashboard',
      },
      {
        key: 'subscription',
        label: 'Subscription',
        icon: 'kind-icon:credit-card',
        title: 'Subscription',
        summary: 'Manage plans, credits, and billing.',
        image: tabImage('user', 'subscription'),
        narrative:
          'Manage plans, credits, billing, and support status without making the mana purse file a formal complaint.',
        route: '/dashboard',
      },
      {
        key: 'milestones',
        label: 'Milestones',
        icon: 'kind-icon:trophy',
        title: 'Milestones',
        summary: 'Track achievements, rewards, and progress.',
        image: tabImage('user', 'milestones'),
        narrative:
          'Track achievements, rewards, progress, and the little victory stickers that prove the journey is doing numbers.',
        route: '/dashboard',
      },
      {
        key: 'themes',
        label: 'Themes',
        icon: 'kind-icon:palette',
        title: 'Theme Gallery',
        summary: 'Customize the look and vibe of the app.',
        image: tabImage('user', 'themes'),
        narrative:
          'Customize the look and vibe of the app from the user dashboard, because aesthetics are infrastructure with better shoes.',
        route: '/dashboard',
      },
      {
        key: 'chats',
        label: 'Chats',
        icon: 'kind-icon:chat',
        title: 'Chats',
        summary: 'Review conversations and message activity.',
        image: tabImage('user', 'chats'),
        narrative:
          'Review conversations, message activity, and chat history so useful sparks do not vanish into the scroll mines.',
        route: '/dashboard',
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
        image: tabImage('wonder', 'memory-dungeon'),
        flourish: '⚔',
        tagline: 'A card-matching crawl with teeth.',
        narrative:
          'Explore the gamified memory adventure. Match the cards, survive the dungeon, and see how deep the little cardboard menace goes.',
        route: '/wonderlab',
      },
      {
        key: 'wonder-lab',
        label: 'WonderLab',
        icon: 'kind-icon:flask',
        title: 'WonderLab',
        summary: 'Experimental toys, tests, and delightful nonsense.',
        image: tabImage('wonder', 'wonder-lab'),
        flourish: '⚗',
        tagline: 'Experimental toys and delightful nonsense.',
        narrative:
          'The open sandbox: experimental components, half-finished toys, and things that exist purely because they were fun to make.',
        route: '/wonderlab',
      },
      {
        key: 'screen-fx',
        label: 'Screen FX',
        icon: 'kind-icon:sparkles',
        title: 'Screen Effects',
        summary: 'Control overlays, butterflies, and visual effects.',
        image: tabImage('wonder', 'screen-fx'),
        flourish: '✦',
        tagline: 'Overlays, butterflies, and visual chaos.',
        narrative:
          'Control the screen-effect layer, including matrix rain, firefly drift, butterflies, and ambient theater.',
        route: '/screenfx',
      },
      {
        key: 'chat-test',
        label: 'Chat Test',
        icon: 'kind-icon:chat',
        title: 'Chat Test',
        summary: 'Test different chat streams.',
        image: tabImage('wonder', 'chat-test'),
        flourish: '◈',
        tagline: 'Poke the text engines and watch them stream.',
        narrative:
          'Test different chat streams and text backends, then watch the tokens arrive with either grace or slapstick timing.',
        route: '/wonderlab',
      },
      {
        key: 'art-test',
        label: 'Art Test',
        icon: 'kind-icon:image',
        title: 'Art Test',
        summary: 'Test our image generators.',
        image: tabImage('wonder', 'art-test'),
        flourish: '◐',
        tagline: 'Throw prompts at the image generators.',
        narrative:
          'Test image generators directly with quick prompts, fast iteration, and a healthy distrust of default settings.',
        route: '/wonderlab',
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

export const footerRouteMap = Object.fromEntries(
  dashboardConfigs.footer.tabs.map((tab) => [tab.key, tab.route]),
) as Record<FooterKey, string>

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

export function getDashboardTabRoute(
  dashboardKey: DashboardKey,
  tabKey: string,
): string {
  return getDashboardTabConfig(dashboardKey, tabKey)?.route ?? '/dashboard'
}

export function getDashboardTabImage(
  dashboardKey: DashboardKey,
  tabKey: string,
): string {
  return (
    getDashboardTabConfig(dashboardKey, tabKey)?.image ??
    getDashboardTabImagePath(dashboardKey, tabKey)
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
