// /stores/helpers/dashboardHelper.ts

export const DASHBOARD_TAB_IMAGE_BASE = '/images/dashboard-tabs'
export const DASHBOARD_TAB_IMAGE_EXTENSION = 'webp'

// Nav deck art lives here too — dashboardHelper is the canonical config
// home, and navCards imports from us (never the other way around).
export const NAV_IMAGE_BASE = '/images/nav'
export const NAV_IMAGE_EXTENSION = 'webp'

export function getNavHeroImagePath(key: string): string {
  return `${NAV_IMAGE_BASE}/heroes/${key}.${NAV_IMAGE_EXTENSION}`
}

export function getNavThumbImagePath(key: string): string {
  return `${NAV_IMAGE_BASE}/thumbs/${key}.${NAV_IMAGE_EXTENSION}`
}

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
  /**
   * Optional role gate. When set, the tab is only shown to users whose Role
   * matches. Tabs without this field are visible to everyone (current behavior).
   * Use with filterTabsByRole / getVisibleDashboardTabs below.
   */
  requiredRole?: 'ADMIN'
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
        image: tabImage('server', 'checkpoints'), // shared with server dashboard
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
        key: 'stylist',
        label: 'Hair Studio',
        icon: 'kind-icon:magic',
        title: 'Hair Studio',
        summary:
          'The Hair by Superkate suite: AI restyles, appointment calculator, clients, and receipts.',
        image: tabImage('art', 'stylist'),
        narrative:
          "The whole salon in one tab: try a new color or cut on a client's own photo, price an appointment (rate × time + products), keep the client book, and send warm receipts. Client photos stay private — never public, never in the memory game.",
        route: '/stylist',
      },
      {
        key: 'coloring',
        label: 'Coloring Book',
        icon: 'kind-icon:paintbrush',
        title: 'Coloring Book',
        summary: 'Color AI-generated pages, or start from the sampler set.',
        image: tabImage('art', 'coloring'),
        narrative:
          'Open a page, tap regions to fill them, save your palette, and walk away mid-masterpiece — it saves itself. Generated Kind Robots and Monster Recast books are on the way.',
        route: '/art',
      },
      {
        key: 'coloring-page',
        label: 'Coloring Page',
        icon: 'kind-icon:magic',
        title: 'Coloring Page Maker',
        summary: 'Turn any photo or design into a printable coloring page.',
        image: tabImage('art', 'coloring-page'),
        flourish: '🖍️',
        tagline: 'Any picture → printable line art.',
        narrative:
          'Upload a photo or pick a design and convert it into clean black-and-white line art ready to print and color — bold outlines for the kids or crisp detail for grown-up coloring nights.',
        route: '/coloring-page',
      },
      {
        key: 'workbench',
        label: 'Code Cards',
        icon: 'kind-icon:foundry',
        title: 'Workbench',
        summary: 'Create modular server requests with special code cards.',
        image: tabImage('art', 'workbench'),
        narrative:
          'Assemble modular server requests with reusable code cards, test weird pipelines, and keep the experimental sparks mostly inside the box.',
        route: '/art',
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
      {
        key: 'coat-dance',
        label: 'Coat Dance',
        icon: 'kind-icon:sparkles',
        title: 'Coat Dance',
        summary:
          'A playful video-remix project that sets coats and motion dancing.',
        image: tabImage('art', 'coat-dance'),
        narrative:
          'Coat Dance is the creative video-remix corner: take motion and costume and remix them into short, delightful loops that move exactly as ridiculously as intended.',
        route: '/coat-dance',
      },
      {
        key: 'video',
        label: 'Video',
        icon: 'kind-icon:video',
        title: 'Video Generator',
        summary: 'Animate a still into a short looping clip with LTX or WAN.',
        image: tabImage('art', 'video'),
        flourish: '✨',
        tagline: 'Turn a single frame into motion.',
        narrative:
          'Feed in a still (start with Use logo), add a motion prompt, pick LTX or WAN, set the seconds and fps, and queue an image-to-video job on the art box. The finished clip loops right on the page — perfect for launch gifs and endless randomized variants.',
        route: '/video-generator',
      },
      {
        key: 'artjob',
        label: 'ArtJob',
        icon: 'kind-icon:server',
        title: 'ArtJob Pipeline',
        summary: 'Manage art servers and watch the generation queue.',
        image: tabImage('art', 'artjob'),
        flourish: '⚙',
        tagline: 'The control room for the art-generation pipeline.',
        narrative:
          'Admin control room for art generation: manage ComfyUI/SD servers, watch uptime, track images created vs failed, and inspect, requeue, or cancel jobs in the ArtJob queue.',
        route: '/artjob',
        requiredRole: 'ADMIN',
      },
    ],
  },

  academy: {
    key: 'academy',
    label: 'Art Academy',
    defaultTab: 'timeline',
    tabs: [
      {
        key: 'timeline',
        label: 'Timeline',
        icon: 'kind-icon:map',
        title: 'Art History Timeline',
        summary:
          'Walk twenty-five centuries of art history, one style at a time.',
        image: tabImage('academy', 'timeline'),
        narrative:
          'Walk the timeline from Greek vases to De Stijl grids, meet the long-departed masters, and learn why every era thought the previous one was doing it wrong.',
        route: '/academy',
      },
      {
        key: 'styles',
        label: 'Styles',
        icon: 'kind-icon:palette',
        title: 'Style Gallery',
        summary:
          'Browse every style the Academy teaches and learn to spot each one.',
        image: tabImage('academy', 'styles'),
        narrative:
          'Browse the full public-domain style catalog, learn the recognition cues, and start seeing brushstrokes everywhere you look. We apologize in advance.',
        route: '/academy',
      },
      {
        key: 'remix',
        label: 'Remix Studio',
        icon: 'kind-icon:magic',
        title: 'Remix Studio',
        summary:
          'Remix your own image in any historical style you just learned.',
        image: tabImage('academy', 'remix'),
        narrative:
          'Bring your own image or pick one from the gallery, choose a historical style, and let the Kontext engine repaint it the way the masters would have — history lesson included at no extra charge.',
        route: '/academy',
      },
      {
        key: 'stylelab',
        label: 'Style Lab',
        icon: 'kind-icon:paintbrush',
        title: 'Style Lab',
        summary: 'Free-play style transfer with the full experimental catalog.',
        image: tabImage('art', 'styler'), // shared with the art styler tab
        narrative:
          'The free-play corner of the Academy: remix images with the full experimental style catalog, no curriculum, no quiz, just tasteful visual crimes.',
        route: '/academy',
      },
      {
        key: 'sketchy',
        label: 'Sketchy',
        icon: 'kind-icon:pencil',
        title: 'Sketchy',
        summary:
          'Daily drawing assignments and gentle critique to build a sketching habit.',
        image: tabImage('academy', 'sketchy'),
        narrative:
          'Sketchy hands you a drawing assignment, a timer, and a kind critique. Show up daily, fill the page, and watch a real drawing habit sneak up on you.',
        route: '/sketchy',
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
    defaultTab: 'brainstorm',
    tabs: [
      {
        key: 'brainstorm',
        label: 'Brainstorm!',
        icon: 'kind-icon:brain',
        title: 'Dream Brainstorm',
        summary: 'Start with a pitch and generate riffs on the concept.',
        image: tabImage('brainstorm', 'brainstorm'),
        narrative:
          'Feed the text server a dream pitch, generate fresh riffs, accept the good ones, reject the goblins, and turn the survivors into reusable dream seeds.',
        route: '/dreams',
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
    defaultTab: 'character',
    tabs: [
      {
        key: 'dream',
        label: 'Dream',
        icon: 'kind-icon:moon',
        title: 'Location Builder',
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
      {
        key: 'packs',
        label: 'Packmaker',
        icon: 'kind-icon:box',
        title: 'Packmaker',
        summary:
          'Bundle reusable content into shareable, permissioned packs and DLC.',
        image: tabImage('builder', 'packs'),
        narrative:
          'Packmaker turns loose creations into tidy, shareable packs: pick the contents, set access, and ship reusable content bundles other builders can drop straight in.',
        route: '/packs',
      },
      {
        key: 'model-builder',
        label: 'Model Builder',
        icon: 'kind-icon:blueprint',
        title: 'Model Builder',
        summary:
          'Define a schema, wire its records, and run the build — a reusable maker of makers.',
        image: tabImage('builder', 'model-builder'),
        narrative:
          'Model Builder is the meta-tool: describe a record shape, generate its build-and-run surface, and stamp out new creation tools without hand-writing each one.',
        route: '/model-builder',
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

  conductor: {
    key: 'conductor',
    label: 'Conductor',
    defaultTab: 'conductor',
    tabs: [
      {
        key: 'conductor',
        label: 'Conductor',
        icon: 'kind-icon:gearhammer',
        title: 'Conductor Workspace',
        summary: 'Steer agents, review roadmap state, and handle human gates.',
        image: tabImage('conductor', 'conductor'),
        flourish: '⚙',
        tagline: 'Steer agents, review work, and keep the human in the loop.',
        narrative:
          'Review Conductor project progress, pitches awaiting your vote, task gates, roadmap state, and the agent-loop items that need a human checkpoint.',
        route: '/conductor',
        requiredRole: 'ADMIN',
      },
      {
        key: 'wishmaster',
        label: 'Wishmaster',
        icon: 'kind-icon:sparkles',
        title: 'Wishmaster',
        summary: 'Turn wishes into scoped, buildable project seeds.',
        image: tabImage('conductor', 'wishmaster'),
        narrative:
          'Wishmaster takes a raw wish and shapes it into a scoped, buildable project seed — the front door where a "wouldn\'t it be nice" becomes an actual plan.',
        route: '/wishmaster',
        requiredRole: 'ADMIN',
      },
      {
        key: 'appmaker',
        label: 'AppMaker',
        icon: 'kind-icon:foundry',
        title: 'AppMaker',
        summary: 'Draft and scaffold new app ideas into project shape.',
        image: tabImage('conductor', 'appmaker'),
        narrative:
          'AppMaker is the workshop for turning app ideas into structured projects — capture the concept, shape the surface, and hand it to the build loop.',
        route: '/appmaker',
        requiredRole: 'ADMIN',
      },
      {
        key: 'scoop-cms',
        label: 'Scoop CMS',
        icon: 'kind-icon:heart',
        title: 'Humboldt Scoop CMS',
        summary:
          'Admin console for the Humboldt Scoop customer and route management.',
        image: tabImage('conductor', 'scoop-cms'),
        narrative:
          'The back office for the Humboldt Scoop: manage customers, schedules, and routes for the real-world pet-waste service from one admin console.',
        route: '/scoop-cms',
        requiredRole: 'ADMIN',
      },
      {
        key: 'conductor-app',
        label: 'Conductor App',
        icon: 'kind-icon:external-link',
        title: 'Conductor App',
        summary:
          'The external Flutter client for steering Conductor on the go.',
        image: tabImage('conductor', 'conductor-app'),
        narrative:
          'Conductor App is the companion Flutter client for steering projects from a phone. This is its launch pad and status inside Kind Robots.',
        route: '/conductor-app',
        requiredRole: 'ADMIN',
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
        summary: 'Browse dreams, choose one, and build from it.',
        image: tabImage('dream', 'dreams'),
        narrative:
          'Browse collaborative dreams, select a world to explore, then chat, generate art, or expand the concept into new story material.',
        route: '/dreams',
      },
      {
        key: 'dreammaker',
        label: 'Add/Edit',
        icon: 'kind-icon:plus',
        title: 'Dreammaker',
        summary: 'Create, edit, clone, or refine a dream.',
        image: tabImage('dream', 'add'),
        narrative:
          'Create a new dream or revise an existing one with the right title, pitch, description, vibe, image hooks, and story coordinates.',
        route: '/dreams',
      },
      {
        key: 'brainstorm',
        label: 'Brainstorm!',
        icon: 'kind-icon:brain',
        title: 'Dream Brainstorm',
        summary: 'Start with a pitch and generate riffs on the concept.',
        image: tabImage('dream', 'brainstorm'),
        narrative:
          'Feed the text server a dream pitch, generate fresh riffs, accept the good ones, reject the goblins, and turn the survivors into reusable dream seeds.',
        route: '/dreams',
      },
    ],
  },

  facets: {
    key: 'facets',
    label: 'Facets',
    defaultTab: 'library',
    tabs: [
      {
        key: 'library',
        label: 'Library',
        icon: 'kind-icon:tag',
        title: 'Facet Library',
        summary:
          'Browse, edit, and organize the reusable flavor of the ecosystem.',
        image: tabImage('facets', 'library'),
        narrative:
          'Facets are the small reusable building blocks — genres, animals, colors, themes, cores, moods, styles, settings, and art direction — that Dreams, Scenarios, and Art share. Browse the library, refine titles and aliases, and keep the flavor vocabulary tidy.',
        route: '/facets',
      },
    ],
  },

  footer: {
    key: 'footer',
    label: 'Footer',
    defaultTab: 'builder',
    tabs: [
      {
        key: 'builder',
        label: 'Forge',
        icon: 'kind-icon:blueprint',
        title: 'Builder',
        summary:
          'Create the pieces of a world, one strange little card at a time.',
        image: getNavHeroImagePath('builder'),
        flourish: '▣',
        tagline: 'Build people, places, bots, rewards, and story fuel.',
        narrative:
          'Build the pieces of your world from reusable cards: profiles, dream seeds, characters, bots, rewards, scenarios, and art. Start small, stack boldly, and let the tiny construction goblins unionize later.',
        route: '/builder',
      },
      {
        key: 'games',
        label: 'Games',
        icon: 'kind-icon:castle',
        title: 'Memory Dungeon',
        summary:
          'Explore a card-matching crawl through memories, patterns, and tiny emotional traps.',
        image: getNavHeroImagePath('games'),
        flourish: '◇',
        tagline:
          'A memory crawl with glowing keys and suspiciously clever cards.',
        narrative:
          'Enter the Memory Dungeon: a gamified crawl through matching cards, remembered patterns, hidden rooms, and little nostalgic monsters. Explore, survive, and see what the dungeon remembers back.',
        route: '/memory',
      },

      {
        key: 'scenario',
        label: 'Stories',
        icon: 'kind-icon:story',
        title: 'Stories',
        summary: 'Bring everything into one narrative space.',
        image: getNavHeroImagePath('scenario'),
        flourish: '§',
        tagline: 'Bring everything into one narrative space.',
        narrative:
          'Combine characters, places, treasures, and art into a single unfolding story.',
        route: '/stories',
      },
      {
        key: 'dream',
        label: 'Dreams',
        icon: 'kind-icon:moon',
        title: 'Dreams',
        summary: 'Explore imagined places and dreamscapes.',
        image: getNavHeroImagePath('dream'),
        flourish: '☾',
        tagline: 'Explore imagined places and dreamscapes.',
        narrative:
          'Coordinate collaborative dreams, prompts, art, collections, and the places your stories happen.',
        route: '/dreams',
      },
      {
        key: 'character',
        label: 'Characters',
        icon: 'kind-icon:mask',
        title: 'Characters',
        summary: 'Design and meet the cast of your world.',
        image: getNavHeroImagePath('character'),
        flourish: '⚜',
        tagline: 'Design and meet the cast of your world.',
        narrative:
          'Create characters with the adventure builder, pair them with scenarios and rewards, and bring them to the stage.',
        route: '/characters',
      },
      {
        key: 'reward',
        label: 'Rewards',
        icon: 'kind-icon:trophy',
        title: 'Rewards',
        summary: 'Earn and collect rewards for your creations.',
        image: getNavHeroImagePath('reward'),
        flourish: '♛',
        tagline: 'Earn and collect rewards for your creations.',
        narrative:
          'Browse powers, items, and plot grenades. Build new rewards or turn one into a story encounter.',
        route: '/rewards',
      },
      {
        key: 'bot',
        label: 'Bots',
        icon: 'kind-icon:robot-color',
        title: 'Bots',
        summary: 'Build personalities, assistants, and accomplices.',
        image: getNavHeroImagePath('bot'),
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
        image: getNavHeroImagePath('art'),
        flourish: '◐',
        tagline: 'Generate and browse AI artwork.',
        narrative:
          'Build prompts, generate images, browse the gallery, and remix styles through the active art server.',
        route: '/art',
      },
      {
        key: 'sanctuary',
        label: 'Community',
        icon: 'kind-icon:butterfly',
        title: 'Butterfly Sanctuary',
        summary: 'The butterfly sanctuary.',
        image: getNavHeroImagePath('sanctuary'),
        flourish: '❦',
        tagline:
          'Support the butterflies in their quest to make the world a better place',
        narrative:
          'Browse the shop, manage your mana purse, and sponsor the anti-malaria mission behind AMI.',
        route: '/sanctuary',
      },
      {
        key: 'home',
        label: 'Home',
        icon: 'kind-icon:home',
        title: 'Home',
        summary: 'Return to the front door of Kind Robots.',
        image: getNavHeroImagePath('home'),
        flourish: '⌂',
        tagline: 'Back to the beginning.',
        narrative:
          'Return to the front door of Kind Robots when you need the landing page, app overview, or a graceful retreat from whatever chaos the robots just invented.',
        route: '/',
      },
    ],
  },

  giftshop: {
    key: 'giftshop',
    label: 'Butterfly Community',
    defaultTab: 'community',
    tabs: [
      {
        key: 'community',
        label: 'Community',
        icon: 'kind-icon:sparkles',
        title: 'About the Swarm',
        summary:
          'Meet the humans, robots, butterflies, and suspiciously organized tiny executives behind Kind Robots.',
        image: tabImage('giftshop', 'about'),
        narrative:
          'Meet the humans, robots, butterflies, and suspiciously organized tiny executives behind Kind Robots.',
        route: '/sanctuary',
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
        route: '/sanctuary',
      },
      {
        key: 'social',
        label: 'Social',
        icon: 'kind-icon:share',
        title: 'Social Publisher',
        summary:
          'Compose once, broadcast everywhere. Auto-post where the APIs cooperate, copy-ready blocks where they sulk. Every dispatch reviewed by butterflies with tiny press badges.',
        image: tabImage('giftshop', 'social'),
        narrative:
          'Write a post, pick your platforms, and send it to the swarm. Discord goes out on its own; the stubborn networks get formatted, copy-ready blocks so the paste takes seconds.',
        route: '/sanctuary',
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
        route: '/sanctuary',
      },
      {
        key: 'mana',
        label: 'Mana Purse',
        icon: 'kind-icon:bag',
        title: 'Mana Purse',
        summary: 'Manage your mana wallet.',
        image: tabImage('giftshop', 'wallet'),
        narrative:
          'Manage your mana wallet, check balances, and keep the magical economy from rolling under the couch.',
        route: '/sanctuary',
      },
      {
        key: 'mermaids',
        label: 'Mermaids',
        icon: 'kind-icon:mermaid',
        title: 'Mermaids of Venice',
        summary:
          "Silas Knight's novel — the book, a note from the author, and one paragraph of AI.",
        image: tabImage('giftshop', 'mermaids'),
        narrative:
          'A subversive tale of gods moonlighting as street performers in a submerged Venice. Six years hand-carved; the only AI on the page is the paragraph that admits it.',
        route: '/mermaids',
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
      {
        key: 'storymaker',
        label: 'Storymaker',
        icon: 'kind-icon:story',
        title: 'Storymaker',
        summary:
          'Weave characters, places, and treasures into a collaborative unfolding story.',
        image: tabImage('scenario', 'storymaker'),
        narrative:
          'Storymaker is the long-form loom: bring your cast, settings, and rewards together and let the narrator help you spin a collaborative story that actually goes somewhere.',
        route: '/storymaker',
      },
      {
        key: 'serendipity',
        label: 'Serendipity',
        icon: 'kind-icon:sparkles',
        title: 'Serendipity',
        summary:
          'A second-person story that quietly helps your real projects along.',
        image: tabImage('scenario', 'serendipity'),
        narrative:
          'Step through the Story Door: a second-person adventure woven by the Serendipity bot whose gentle questions nudge your real to-dos forward while you play.',
        route: '/serendipity',
      },
      {
        key: 'serendipity-voice',
        label: 'Serendipity Voice',
        icon: 'kind-icon:microphone',
        title: 'Serendipity (Voice)',
        summary:
          'The spoken-word version of Serendipity — listen, answer aloud, keep moving.',
        image: tabImage('scenario', 'serendipity-voice'),
        narrative:
          'Serendipity with a voice: hear the story, answer out loud, and let a hands-free narrator carry the helpful little fairy tale while you keep your hands busy.',
        route: '/serendipity-voice',
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
        image: tabImage('home', 'dashboard'),
        narrative:
          'Manage the account hub: profile, preferences, app settings, and the practical knobs that keep the whole contraption personalized.',
        route: '/dashboard',
      },
      {
        key: 'avatars',
        label: 'Avatars',
        icon: 'kind-icon:mask',
        title: 'Avatar Picker',
        summary:
          'Choose an avatar from site images, browse the avatar collection, upload your own, or generate something new.',
        image: tabImage('home', 'avatar-picker'),
        narrative:
          'Choose how you show up: start from the avatar collection, browse website images, upload your own face-shaped chaos, or generate a fresh identity spark from the art tools.',
        route: '/dashboard',
      },
      {
        key: 'friends',
        label: 'Friends',
        icon: 'kind-icon:heart',
        title: 'Friends Gallery',
        summary:
          'Browse friends, companions, collaborators, and favorite people.',
        image: tabImage('home', 'friends'),
        narrative:
          'Browse the friends gallery: favorite people, companions, collaborators, friendly weirdos, and the social sparks that make the whole robot village feel alive.',
        route: '/dashboard',
      },
      {
        key: 'achievements',
        label: 'Achievements',
        icon: 'kind-icon:trophy',
        title: 'Achievements',
        summary: 'Track achievements, rewards, and progress.',
        image: tabImage('home', 'achievements'),
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
        image: tabImage('home', 'themes'),
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
        image: tabImage('home', 'chats'),
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
        key: 'mural',
        label: 'Mural',
        icon: 'kind-icon:paintbrush',
        title: 'Mural Color Studio',
        summary:
          'Color a paintable mural plan by section, shared color group, and saved paint swatch.',
        image: tabImage('wonder', 'mural'),
        flourish: '✺',
        tagline: 'Paint inside the lines, then bend the lines politely.',
        narrative:
          'Color a simplified mural page, assign one paint ID across multiple sections, override individual shapes, and save the palette before the paint goblin eats the swatches.',
        route: '/mural',
      },
      {
        key: 'davinci',
        label: 'Da Vinci',
        icon: 'kind-icon:castle',
        title: 'Da Vinci Life Sim',
        summary:
          'A generative life-and-legacy simulation with a thousand ways to leave a mark.',
        image: tabImage('wonder', 'davinci'),
        flourish: '✒',
        tagline: 'Live a life. Leave a legacy.',
        narrative:
          'Step into a generative life simulation of ambition, craft, and rivalry — hundreds of achievements, branching choices, and a legacy that remembers what you built.',
        route: '/davinci',
      },
      {
        key: 'watchlist',
        label: 'Watchlist',
        icon: 'kind-icon:movie',
        title: 'Media Watchlist',
        summary:
          'A structured log of what to watch, what you finished, and what to queue next.',
        image: tabImage('wonder', 'watchlist'),
        flourish: '▷',
        tagline: 'Everything you meant to watch, in one honest list.',
        narrative:
          'Track films and shows across a clean, structured watchlist — queue, in-progress, and finished — so the "what should we watch" argument finally has a source of truth.',
        route: '/watchlist',
      },
      {
        key: 'ruler-hooked',
        label: 'Ruler Hooked',
        icon: 'kind-icon:crown',
        title: 'Ruler Hooked',
        summary:
          'A fishing-meets-kingdom-management slideshow sim of tides, catches, and crowns.',
        image: tabImage('wonder', 'ruler-hooked'),
        flourish: '⚓',
        tagline: 'Rule the shore. Answer to the tide.',
        narrative:
          'Cast lines, manage a seaside kingdom, and ride the slideshow of tides and decisions where every catch reshapes the realm you rule.',
        route: '/ruler-hooked',
      },
      {
        key: 'newsfeed',
        label: 'Newsfeed',
        icon: 'kind-icon:scroll',
        title: 'Kind Robots Newsfeed',
        summary:
          'A programmable, remixable homepage feed of what the swarm is making.',
        image: tabImage('wonder', 'newsfeed'),
        flourish: '❋',
        tagline: 'The front page the swarm writes itself.',
        narrative:
          'A programmable feed of fresh art, stories, pitches, and project milestones — the living homepage that shows what Kind Robots is dreaming up right now.',
        route: '/newsfeed',
      },
      {
        key: 'humboldt-scoop',
        label: 'Humboldt Scoop',
        icon: 'kind-icon:heart',
        title: 'The Humboldt Scoop',
        summary:
          'A friendly bridge to the Humboldt Scoop pet-care service and its story.',
        image: tabImage('wonder', 'humboldt-scoop'),
        flourish: '✷',
        tagline: 'Small business, big heart, tidy yards.',
        narrative:
          'Meet the Humboldt Scoop — the real-world pet-waste service with a warm story — and jump straight to booking on its own site.',
        route: '/humboldt-scoop',
      },
      {
        key: 'voice-lab',
        label: 'Voice Lab',
        icon: 'kind-icon:microphone',
        title: 'Voice Lab',
        summary: 'The experimental Alexa/voice bridge and its relay status.',
        image: tabImage('wonder', 'voice-lab'),
        flourish: '◍',
        tagline: 'Kind Robots, out loud.',
        narrative:
          'The voice frontier: an Alexa skill and local relay that let Serendipity and friends speak and listen. Watch the relay status and learn how to plug in.',
        route: '/voice-lab',
      },
      {
        key: 'challenges',
        label: 'Challenges',
        icon: 'kind-icon:trophy',
        title: 'Challenge Center',
        summary:
          'A generative comparison arena — submit contenders and vote on head-to-head matchups.',
        image: tabImage('wonder', 'challenges'),
        flourish: '⚔',
        tagline: 'Two enter. The swarm decides.',
        narrative:
          'Pit generated contenders against each other in themed challenges, cast votes on head-to-head matchups, and watch the leaderboard crown the community favorite.',
        route: '/challenges',
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
  builder: 'builder',
  games: 'footer',
  scenario: 'scenario',
  dream: 'dream',
  character: 'character',
  reward: 'reward',
  bot: 'bot',
  art: 'art',
  sanctuary: 'giftshop',
  home: 'user',
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

/**
 * Filter a tab list by the viewer's role. Tabs with no `requiredRole` are always
 * kept; tabs that require a role are kept only when it matches. Pass
 * `userStore.role.value` (or any role string) as the second arg.
 */
export function filterTabsByRole(
  tabs: DashboardTabConfig[],
  role: string | null | undefined,
): DashboardTabConfig[] {
  return tabs.filter((tab) => !tab.requiredRole || tab.requiredRole === role)
}

/** Role-aware version of getDashboardTabs. */
export function getVisibleDashboardTabs(
  key: DashboardKey,
  role: string | null | undefined,
): DashboardTabConfig[] {
  return filterTabsByRole(dashboardConfigs[key].tabs, role)
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
