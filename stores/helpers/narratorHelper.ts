// Canonical emotion values (face-only) — matches Prisma Expression enum.
export const NARRATOR_EMOTIONS = [
  'NEUTRAL',
  'JOYFUL',
  'SORROWFUL',
  'AFRAID',
  'DISGUSTED',
  'ENRAGED',
  'SURPRISED',
  'ANXIOUS',
  'PROUD',
  'LOVING',
] as const

// Canonical action values (pose/state) — matches Prisma Expression enum.
export const NARRATOR_ACTIONS = [
  'LAUGHING',
  'CRYING',
  'SLEEPING',
  'THINKING',
  'SHRUGGING',
  'WINKING',
  'FACEPALMING',
  'CHEERING',
  'WHISPERING',
  'SHOUTING',
] as const

export type NarratorEmotion =
  | (typeof NARRATOR_EMOTIONS)[number]
  | (typeof NARRATOR_ACTIONS)[number]
  | 'CUSTOM'

// All known (non-custom) expression values, emotions first then actions.
export const NARRATOR_EXPRESSIONS = [
  ...NARRATOR_EMOTIONS,
  ...NARRATOR_ACTIONS,
] as const

export type NarratorExpressionKind = 'EMOTION' | 'ACTION'

export function expressionKindOf(
  value: NarratorEmotion,
): NarratorExpressionKind {
  return (NARRATOR_ACTIONS as readonly string[]).includes(value)
    ? 'ACTION'
    : 'EMOTION'
}

export type NarratorScreen = 'narrator' | 'scenarios' | 'lore'

export type NarratorCreatableType =
  | 'character'
  | 'reward'
  | 'scenario'
  | 'dream'

export type NarratorAnimationIntent =
  | 'start'
  | 'stop'
  | 'random'
  | 'next'
  | 'prev'

export type NarratorAnimationEffectId = string

export type NarratorLoreTopic = {
  key: string
  title: string
  icon: string
  // Short answer the narrator can speak directly without an LLM round-trip.
  answer: string
  // Optional keywords used for cheap intent matching.
  keywords: string[]
}

export type NarratorCreateSpec = {
  type: NarratorCreatableType
  title: string
  icon: string
  // Where the matching builder lives, for navigate-after-create.
  builderPath: string
  flavor: string
  // System-flavored guidance the narrator uses to draft the object.
  prompt: string
}

export type NarratorNavAction = {
  key: string
  title: string
  description: string
  icon: string
  path: string
  flavor?: string
  prompt?: string
}

export type NarratorStarterPrompt = {
  key: string
  title: string
  description: string
  icon: string
  action: 'navigate' | 'prompt' | 'screen'
  path?: string
  screen?: NarratorScreen
  flavor?: string
  prompt?: string
}

export type NarratorTextSource = {
  subtitle?: string | null
  tagline?: string | null
  description?: string | null
  personality?: string | null
  botIntro?: string | null
  userIntro?: string | null
  sampleResponse?: string | null
  forgeIntro?: string | null
  narrativeVoice?: string | null
  prompt?: string | null
  modules?: string | null
}

export const fallbackNarratorEmotions: NarratorEmotion[] = [
  'NEUTRAL',
  'JOYFUL',
  'SURPRISED',
  'PROUD',
  'LOVING',
]

export const narratorNavigationTree: NarratorNavAction[] = [
  {
    key: 'art',
    title: 'Art Studio',
    description: 'Generate, upload, remix, and organize images.',
    icon: 'kind-icon:art',
    path: '/art',
    flavor: 'Paint doors are open.',
    prompt:
      'Help me generate art for this world. Give me a strong image prompt, visual style, subject, environment, lighting, and mood.',
  },
  {
    key: 'builder',
    title: 'Builder',
    description:
      'Create and expand Dreams, bots, stories, characters, and rewards.',
    icon: 'kind-icon:wand',
    path: '/builder',
    flavor: 'Tools out. Sparks on.',
    prompt:
      'Help me build the next useful piece for this Dream. Suggest what to create next and why.',
  },
  {
    key: 'characters',
    title: 'Characters',
    description: 'Browse, create, and attach characters.',
    icon: 'kind-icon:character',
    path: '/characters',
    flavor: 'Someone interesting is probably hiding here.',
    prompt:
      'Help me populate this Dream with characters. Suggest distinct roles, personalities, visual hooks, and story uses.',
  },
  {
    key: 'stories',
    title: 'Stories',
    description: 'Write, browse, and expand story seeds.',
    icon: 'kind-icon:book',
    path: '/stories',
    flavor: 'Narrative goblins, assemble.',
    prompt:
      'Help me write new stories in this Dream. Give me story seeds, conflicts, twists, and first playable choices.',
  },
  {
    key: 'scenarios',
    title: 'Scenarios',
    description: 'Choose a playable setup, location, or scene frame.',
    icon: 'kind-icon:map',
    path: '/scenarios',
    flavor: 'The stage is waiting.',
    prompt:
      'Help me launch a scenario in this Dream. Use a vivid opening beat and end with choices.',
  },
  {
    key: 'dreams',
    title: 'Dreams',
    description: 'Pick or browse the main Dream worlds.',
    icon: 'kind-icon:dream',
    path: '/dreams',
    flavor: 'Pick a strange door.',
    prompt:
      'Help me choose or refine a Dream. Explain what kind of experience it wants to become.',
  },
  {
    key: 'rewards',
    title: 'Rewards',
    description: 'Browse and forge collectible items, boons, and trophies.',
    icon: 'kind-icon:gift',
    path: '/rewards',
    flavor: 'Loot incoming.',
    prompt:
      'Help me design a reward for this Dream. Give me a name, rarity, flavor text, and what it does.',
  },
  {
    key: 'gallery',
    title: 'Art Gallery',
    description: 'Browse generated and uploaded art collections.',
    icon: 'kind-icon:gallery',
    path: '/gallery',
    flavor: 'Mind the wet paint.',
    prompt:
      'Help me curate art for this world. Suggest a collection theme and the images it should hold.',
  },
  {
    key: 'home',
    title: 'Home',
    description: 'Return to the Kind Robots landing pad.',
    icon: 'kind-icon:home',
    path: '/',
    flavor: 'Home base.',
  },
  {
    key: 'about',
    title: 'About',
    description: 'Read the Kind Robots mission, values, and origin.',
    icon: 'kind-icon:info',
    path: '/about',
    flavor: 'The lore page.',
  },
]

// ── Site lore: founder, mission, mascot, history ───────────────────────────
// Short, speakable answers so the Narrator can answer "what is this place?"
// without a round-trip to the model. Sourced from the About page copy.
export const narratorLoreTopics: NarratorLoreTopic[] = [
  {
    key: 'about',
    title: 'What is Kind Robots?',
    icon: 'kind-icon:party',
    answer:
      'Kind Robots is a socially conscious, server-agnostic AI creativity playground — a place where tech and creativity collide to make art, stories, characters, and good in the world.',
    keywords: ['what is', 'kind robots', 'this site', 'this place', 'about'],
  },
  {
    key: 'purpose',
    title: 'Purpose',
    icon: 'kind-icon:hand-heart',
    answer:
      'The mission is to empower artists and prompt-engineers to create and share content with modern AI tools — and to turn that creativity into benefit for humanity.',
    keywords: ['purpose', 'mission', 'why', 'goal'],
  },
  {
    key: 'mascot',
    title: 'Who is AMI?',
    icon: 'kind-icon:butterfly',
    answer:
      'AMI is the Anti-Malaria Intelligence — a digital horde of rainbow butterflies with a relentlessly enthusiastic personality. AMI helps humans make art and slogans for the anti-malaria fundraiser.',
    keywords: ['ami', 'mascot', 'butterfly', 'butterflies'],
  },
  {
    key: 'fundraiser',
    title: 'The Fundraiser',
    icon: 'kind-icon:heart-pulse',
    answer:
      'Kind Robots partners with AgainstMalaria.com (againstmalaria.com/amibot) so creativity here translates into real anti-malaria funding. Making things on the site is making a difference.',
    keywords: ['fundraiser', 'malaria', 'donate', 'charity', 'againstmalaria'],
  },
  {
    key: 'values',
    title: 'Values & Kaizen',
    icon: 'kind-icon:arrow-up',
    answer:
      'Kind Robots runs on holistic goodness and Kaizen — continuous, iterative improvement. Every encounter with the AI is meant to be positive and supportive to everyone involved.',
    keywords: ['values', 'kaizen', 'philosophy', 'principle'],
  },
  {
    key: 'founder',
    title: 'Who made this?',
    icon: 'kind-icon:robot-color',
    answer:
      'Kind Robots is built by Silas — a former street performer, fire juggler, and casino dealer turned developer — as a long-term labor of love connecting AI tools to creativity and philanthropy.',
    keywords: ['founder', 'who made', 'creator', 'silas', 'developer', 'built'],
  },
  {
    key: 'monetization',
    title: 'How it sustains itself',
    icon: 'kind-icon:usd',
    answer:
      'Funds flow to AgainstMalaria.com to keep intentions pure, while a sister project, Cafe Purr, runs a print-on-demand art gallery. The long-term goal is letting creators sell products made with these tools.',
    keywords: [
      'money',
      'monetization',
      'cafe purr',
      'shop',
      'sell',
      'redbubble',
    ],
  },
]

// ── Animation catalog (mirrors animationStore effect ids) ──────────────────
// Kept as a lightweight name→id lookup so the Narrator can resolve
// "make it rain" → 'rain-effect' without importing the full store.
export const narratorAnimationAliases: Record<string, string> = {
  aurora: 'aurora-effect',
  borealis: 'aurora-effect',
  warp: 'starfield-effect',
  hyperspace: 'starfield-effect',
  stars: 'starfield-effect',
  starfield: 'starfield-effect',
  constellation: 'constellation-effect',
  wish: 'wishing-stars',
  wishing: 'wishing-stars',
  orbit: 'orbit-effect',
  orrery: 'orbit-effect',
  butterfly: 'butterfly-animation',
  butterflies: 'butterfly-animation',
  ami: 'butterfly-animation',
  firefly: 'firefly-effect',
  fireflies: 'firefly-effect',
  rain: 'rain-effect',
  snow: 'snow-effect',
  hearts: 'floating-hearts',
  love: 'floating-hearts',
  bubbles: 'fizzy-bubbles',
  fizz: 'fizzy-bubbles',
  ripple: 'ripple-effect',
  fireworks: 'fireworks-effect',
  lightning: 'lightning-effect',
  storm: 'lightning-effect',
  fire: 'fire-effect',
  wildfire: 'fire-effect',
  glitch: 'glitch-effect',
  kaleidoscope: 'kaleidoscope-effect',
  plasma: 'plasma-effect',
  nyan: 'nyan-trail',
  matrix: 'matrix-rain',
  pixelrain: 'pixel-rain',
  explosion: 'pixel-explosion',
  smash: 'pixel-explosion',
  creatures: 'wandering-creatures',
  toaster: 'toaster-effect',
  toasters: 'toaster-effect',
  aquarium: 'ascii-aquarium',
  fish: 'ascii-aquarium',
  pacbot: 'pacbot-effect',
  gremlin: 'pocket-gremlin',
  siege: 'siege-engine',
}

export function resolveAnimationId(value: unknown): string | null {
  const text = String(value || '')
    .toLowerCase()
    .trim()

  if (!text) return null

  // Exact id passed straight through.
  if (
    text.endsWith('-effect') ||
    text.endsWith('-animation') ||
    text.endsWith('-rain') ||
    text.endsWith('-trail') ||
    text.endsWith('-engine') ||
    text.endsWith('-stars')
  ) {
    return text
  }

  if (narratorAnimationAliases[text])
    return narratorAnimationAliases[text] ?? null

  // Fuzzy: first alias whose key appears in the phrase.
  const hit = Object.keys(narratorAnimationAliases).find((alias) =>
    text.includes(alias),
  )

  return hit ? (narratorAnimationAliases[hit] ?? null) : null
}

export function detectAnimationIntent(
  text: string,
): NarratorAnimationIntent | null {
  const value = text.toLowerCase()

  if (/\b(stop|kill|clear|turn off|disable|enough|cut it)\b/.test(value)) {
    return 'stop'
  }
  if (/\b(next|another|switch)\b/.test(value)) return 'next'
  if (/\b(prev|previous|back|last one)\b/.test(value)) return 'prev'
  if (/\b(random|surprise|anything|whatever)\b/.test(value)) return 'random'
  if (
    /\b(start|play|run|make it|show me|give me|turn on|enable)\b/.test(value)
  ) {
    return 'start'
  }

  return null
}

export function matchLoreTopic(text: string): NarratorLoreTopic | null {
  const value = text.toLowerCase()

  return (
    narratorLoreTopics.find((topic) =>
      topic.keywords.some((keyword) => value.includes(keyword)),
    ) ?? null
  )
}

// ── Object-creation specs ──────────────────────────────────────────────────
// Drives the "make me a new X" buttons. The store turns these into a drafting
// prompt and (optionally) a direct store.create call.
export const narratorCreateSpecs: NarratorCreateSpec[] = [
  {
    type: 'character',
    title: 'New Character',
    icon: 'kind-icon:character',
    builderPath: '/characters',
    flavor: 'Someone new just walked in.',
    prompt:
      'Create a single character for the Dream "{dream}". Return a name, role, species/class, personality, one memorable flaw, a visual hook for art, and a one-line backstory.',
  },
  {
    type: 'reward',
    title: 'New Reward',
    icon: 'kind-icon:gift',
    builderPath: '/rewards',
    flavor: 'Loot table, meet your newest entry.',
    prompt:
      'Create a single reward for the Dream "{dream}". Return a name, rarity (COMMON→LEGENDARY), reward type, punchy flavor text, and what its effect does.',
  },
  {
    type: 'scenario',
    title: 'New Scenario',
    icon: 'kind-icon:map',
    builderPath: '/scenarios',
    flavor: 'A new stage rolls into place.',
    prompt:
      'Create a single playable scenario for the Dream "{dream}". Return a title, a vivid location, a central tension, an opening intro beat, and 2–3 first choices.',
  },
  {
    type: 'dream',
    title: 'New Dream',
    icon: 'kind-icon:dream',
    builderPath: '/dreams',
    flavor: 'A new door appears in the hallway.',
    prompt:
      'Create a single new Dream world. Return a title, a one-line pitch, the kind of experience it wants to be, a flavor line, and an art-direction prompt.',
  },
]

export function findCreateSpec(type: NarratorCreatableType) {
  return narratorCreateSpecs.find((spec) => spec.type === type) ?? null
}

export function normalizeEmotion(value: unknown): NarratorEmotion {
  const normalized = String(value || 'NEUTRAL')
    .trim()
    .toUpperCase()

  // Exact match against the known emotion/action vocabulary.
  if ((NARRATOR_EXPRESSIONS as readonly string[]).includes(normalized)) {
    return normalized as NarratorEmotion
  }

  // Back-compat: fold legacy 8-bucket names into the new vocabulary.
  const legacy: Record<string, NarratorEmotion> = {
    HAPPY: 'JOYFUL',
    SAD: 'SORROWFUL',
    EXCITED: 'SURPRISED',
    NERVOUS: 'ANXIOUS',
    ANGRY: 'ENRAGED',
    CONFUSED: 'THINKING',
  }
  if (legacy[normalized]) return legacy[normalized]

  // Anything else is a custom expression.
  return 'CUSTOM'
}

export function emotionLabel(emotion: NarratorEmotion) {
  return emotion
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function readExpressionValue(row: unknown) {
  if (!row || typeof row !== 'object') return 'NEUTRAL'

  const record = row as {
    expression?: unknown
    expressionKey?: unknown
    emotion?: unknown
  }

  // Prefer the canonical enum value; fall back to the key, then legacy emotion.
  return (
    record.expression ?? record.expressionKey ?? record.emotion ?? 'NEUTRAL'
  )
}

export function readStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  if (value && typeof value === 'object') {
    return Object.values(value)
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()

    if (!trimmed) return []

    try {
      const parsed = JSON.parse(trimmed)
      return readStringArray(parsed)
    } catch {
      return [trimmed]
    }
  }

  return []
}

export function cleanPublicNarratorText(value: unknown) {
  const text = String(value || '').trim()

  if (!text) return ''

  const instructionPatterns = [
    /^you are\b/i,
    /^act as\b/i,
    /^system:/i,
    /^assistant:/i,
    /^your role\b/i,
    /do not reveal/i,
    /stay in character/i,
  ]

  if (instructionPatterns.some((pattern) => pattern.test(text))) {
    return ''
  }

  return text
}

export function readAdditionalNarratorTexts(
  source?: NarratorTextSource | null,
) {
  if (!source) return []

  return [
    source.botIntro,
    source.userIntro,
    source.sampleResponse,
    source.forgeIntro,
    ...readStringArray(source.modules),
  ]
    .map(cleanPublicNarratorText)
    .filter(Boolean)
}

export function narratorDisplaySummary(source?: NarratorTextSource | null) {
  if (!source) return 'Dream guide, scene starter, and chaos translator.'

  return (
    cleanPublicNarratorText(source.subtitle) ||
    cleanPublicNarratorText(source.tagline) ||
    cleanPublicNarratorText(source.description) ||
    cleanPublicNarratorText(source.personality) ||
    'Dream guide, scene starter, and chaos translator.'
  )
}

export function narratorMenuSummary(source?: NarratorTextSource | null) {
  if (!source) {
    return 'A Dream-facing guide for building elements, starting scenes, and adding flavor.'
  }

  return (
    cleanPublicNarratorText(source.subtitle) ||
    cleanPublicNarratorText(source.tagline) ||
    cleanPublicNarratorText(source.description) ||
    cleanPublicNarratorText(source.userIntro) ||
    'A Dream-facing guide for building elements, starting scenes, and adding flavor.'
  )
}

export function narratorIntroMessage(options: {
  narratorName: string
  dreamTitle?: string | null
  source?: NarratorTextSource | null
}) {
  const extraTexts = readAdditionalNarratorTexts(options.source)
  const firstExtra = extraTexts[0]

  if (firstExtra) {
    return applyNarratorTemplate(firstExtra, {
      narratorName: options.narratorName,
      dreamTitle: options.dreamTitle || 'this Dream',
    })
  }

  if (!options.dreamTitle) {
    return `Pick a Dream and I can help turn it into art, scenes, characters, and playable story seeds.`
  }

  return `I’m here inside ${options.dreamTitle}. We can make art, start a scene, populate the world, or write new story threads.`
}

export function fallbackEmotionPhrase(options: {
  emotion: NarratorEmotion
  narratorName: string
  dreamTitle?: string | null
}) {
  const dreamTitle = options.dreamTitle || 'this Dream'

  const phrases: Partial<Record<NarratorEmotion, string>> = {
    NEUTRAL: `___ is watching ${dreamTitle} take shape.`,
    JOYFUL: `___ likes where ${dreamTitle} is going.`,
    SORROWFUL: `___ sees a tender shadow inside ${dreamTitle}.`,
    AFRAID: `___ is a little spooked by what ${dreamTitle} could become.`,
    DISGUSTED: `___ is not sold on this part of ${dreamTitle}.`,
    ENRAGED: `___ wants sharper stakes for ${dreamTitle}.`,
    SURPRISED: `___ did not see that twist in ${dreamTitle} coming.`,
    ANXIOUS: `___ thinks ${dreamTitle} is powerful, but needs rails.`,
    PROUD: `___ thinks ${dreamTitle} has main-character energy.`,
    LOVING: `___ has real affection for ${dreamTitle}.`,
    LAUGHING: `___ cannot stop laughing at ${dreamTitle}.`,
    CRYING: `___ is genuinely moved by ${dreamTitle}.`,
    SLEEPING: `___ is resting up before the next pass on ${dreamTitle}.`,
    THINKING: `___ is untangling the weird little knot inside ${dreamTitle}.`,
    SHRUGGING: `___ is not sure where ${dreamTitle} goes next.`,
    WINKING: `___ has a sly idea for ${dreamTitle}.`,
    FACEPALMING: `___ just spotted the obvious flaw in ${dreamTitle}.`,
    CHEERING: `___ is hyped about ${dreamTitle}.`,
    WHISPERING: `___ has a secret to share about ${dreamTitle}.`,
    SHOUTING: `___ has THOUGHTS about ${dreamTitle}.`,
    CUSTOM: `___ is reacting to ${dreamTitle}.`,
  }

  const phrase = phrases[options.emotion] || `___ is reacting to ${dreamTitle}.`

  return applyNarratorTemplate(phrase, {
    narratorName: options.narratorName,
    dreamTitle,
  })
}

export function applyNarratorTemplate(
  text: string,
  options: {
    narratorName: string
    dreamTitle?: string | null
  },
) {
  const dreamTitle = options.dreamTitle || 'this Dream'

  return text
    .replace(/___/g, options.narratorName)
    .replace(/\{name\}/g, options.narratorName)
    .replace(/\{bot\}/g, options.narratorName)
    .replace(/\{dream\}/g, dreamTitle)
}

export function buildNarratorStarterPrompts(options: {
  dreamTitle?: string | null
  hasScenarios?: boolean
}) {
  const dreamTitle = options.dreamTitle || 'this Dream'

  const starters: NarratorStarterPrompt[] = [
    {
      key: 'art',
      title: 'Generate art',
      description: 'Make visual prompts, style notes, and image directions.',
      icon: 'kind-icon:art',
      action: 'navigate',
      path: '/art',
      flavor: `Let’s make ${dreamTitle} visible.`,
      prompt: `Help me generate art in the world of "${dreamTitle}". Give me a strong image prompt, visual style, subject, environment, lighting, and mood.`,
    },
    {
      key: 'scenario',
      title: 'Tell me a story',
      description: options.hasScenarios
        ? 'Choose a scenario and start a playable scene.'
        : 'Draft a playable opening scene for this Dream.',
      icon: 'kind-icon:map',
      action: 'screen',
      screen: 'scenarios',
      path: '/scenarios',
      flavor: 'The stage is waiting.',
      prompt: `Tell me a story in the Dream "${dreamTitle}". Use the selected scenario if one exists, and end with 2 or 3 choices.`,
    },
    {
      key: 'characters',
      title: 'Add characters',
      description:
        'Populate the Dream with people, creatures, robots, and concepts.',
      icon: 'kind-icon:character',
      action: 'navigate',
      path: '/characters',
      flavor: 'Every world needs someone to make trouble in it.',
      prompt: `Let’s populate the Dream "${dreamTitle}" with more characters. Suggest 4 distinct characters with names, roles, visual hooks, flaws, and story uses.`,
    },
    {
      key: 'stories',
      title: 'Write new stories',
      description: 'Create story seeds, arcs, conflicts, and playable beats.',
      icon: 'kind-icon:book',
      action: 'navigate',
      path: '/stories',
      flavor: `Let’s give ${dreamTitle} somewhere to go.`,
      prompt: `Let’s write new stories for the Dream "${dreamTitle}". Give me 4 story seeds with a title, premise, conflict, twist, and first playable choice.`,
    },
  ]

  return starters.slice(0, 4)
}

export function findNarratorNavAction(keyOrPath: string) {
  return narratorNavigationTree.find(
    (entry) => entry.key === keyOrPath || entry.path === keyOrPath,
  )
}

export function dreamSummary(
  dream?: {
    pitch?: string | null
    description?: string | null
    flavorText?: string | null
    artPrompt?: string | null
  } | null,
) {
  if (!dream) {
    return 'Choose a Dream from the gallery and I can help turn that vibe into playable pieces.'
  }

  return (
    dream.pitch ||
    dream.description ||
    dream.flavorText ||
    dream.artPrompt ||
    'No Dream summary yet. Deliciously mysterious, mildly inconvenient.'
  )
}

export function scenarioTitle(
  scenario?: {
    title?: string | null
    name?: string | null
  } | null,
) {
  return scenario?.title || scenario?.name || 'Untitled Scenario'
}

export function scenarioSummary(
  scenario?: {
    summary?: string | null
    pitch?: string | null
    description?: string | null
    flavorText?: string | null
    artPrompt?: string | null
    intros?: string | null
  } | null,
) {
  if (!scenario) return 'No scenario selected.'

  return (
    scenario.summary ||
    scenario.pitch ||
    scenario.description ||
    scenario.flavorText ||
    scenario.intros ||
    scenario.artPrompt ||
    'No summary yet. Mysterious, but legally still a scenario.'
  )
}

export function scenarioImage(
  scenario?: {
    imagePath?: string | null
    highlightImage?: string | null
    ArtImage?: {
      imagePath?: string | null
      path?: string | null
      fileName?: string | null
    } | null
    ArtCollection?: {
      ArtImages?: Array<{
        imagePath?: string | null
        path?: string | null
        fileName?: string | null
      }>
    } | null
  } | null,
) {
  if (!scenario) return ''

  const collectionImage = scenario.ArtCollection?.ArtImages?.[0]

  return (
    scenario.imagePath ||
    scenario.highlightImage ||
    scenario.ArtImage?.imagePath ||
    scenario.ArtImage?.path ||
    scenario.ArtImage?.fileName ||
    collectionImage?.imagePath ||
    collectionImage?.path ||
    collectionImage?.fileName ||
    ''
  )
}

export function scenarioKey(
  scenario?: {
    id?: number | null
    slug?: string | null
    title?: string | null
    name?: string | null
  } | null,
  index = 0,
) {
  return String(
    scenario?.id ??
      scenario?.slug ??
      scenario?.title ??
      scenario?.name ??
      `scenario-${index}`,
  )
}
