export type NarratorEmotion =
  | 'NEUTRAL'
  | 'HAPPY'
  | 'SAD'
  | 'EXCITED'
  | 'NERVOUS'
  | 'ANGRY'
  | 'CONFUSED'
  | 'PROUD'

export type NarratorScreen = 'narrator' | 'scenarios'

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
  'HAPPY',
  'EXCITED',
  'CONFUSED',
  'PROUD',
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
]

export function normalizeEmotion(value: unknown): NarratorEmotion {
  const normalized = String(value || 'NEUTRAL').toUpperCase()

  if (
    normalized === 'HAPPY' ||
    normalized === 'JOYFUL' ||
    normalized === 'LOVING'
  ) {
    return 'HAPPY'
  }

  if (
    normalized === 'SAD' ||
    normalized === 'SORROWFUL' ||
    normalized === 'CRYING'
  ) {
    return 'SAD'
  }

  if (
    normalized === 'EXCITED' ||
    normalized === 'SURPRISED' ||
    normalized === 'CHEERING' ||
    normalized === 'LAUGHING'
  ) {
    return 'EXCITED'
  }

  if (
    normalized === 'NERVOUS' ||
    normalized === 'ANXIOUS' ||
    normalized === 'AFRAID'
  ) {
    return 'NERVOUS'
  }

  if (
    normalized === 'ANGRY' ||
    normalized === 'ENRAGED' ||
    normalized === 'DISGUSTED' ||
    normalized === 'SHOUTING'
  ) {
    return 'ANGRY'
  }

  if (
    normalized === 'CONFUSED' ||
    normalized === 'THINKING' ||
    normalized === 'SHRUGGING' ||
    normalized === 'FACEPALMING'
  ) {
    return 'CONFUSED'
  }

  if (normalized === 'PROUD') {
    return 'PROUD'
  }

  return 'NEUTRAL'
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
    emotion?: unknown
  }

  return record.expression ?? record.emotion ?? 'NEUTRAL'
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

  const phrases: Record<NarratorEmotion, string> = {
    NEUTRAL: `___ is watching ${dreamTitle} take shape.`,
    HAPPY: `___ likes where ${dreamTitle} is going.`,
    SAD: `___ sees a tender shadow inside ${dreamTitle}.`,
    EXCITED: `___ has three extremely suspicious ideas for ${dreamTitle}.`,
    NERVOUS: `___ thinks ${dreamTitle} is powerful, but needs rails.`,
    ANGRY: `___ wants sharper stakes for ${dreamTitle}.`,
    CONFUSED: `___ is untangling the weird little knot inside ${dreamTitle}.`,
    PROUD: `___ thinks ${dreamTitle} has main-character energy.`,
  }

  return applyNarratorTemplate(phrases[options.emotion], {
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
