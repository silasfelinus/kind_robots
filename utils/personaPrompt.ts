// utils/personaPrompt.ts
//
// Shared, framework-agnostic persona -> system-prompt builders. One source of
// truth for "how a Bot or Character speaks", so the chat UI and (later) the
// WonderLab component-museum page commentary produce the same distinct voices.
//
// Structural *Like types (not Prisma imports) keep this usable on both the Nuxt
// client (auto-imported from utils/) and the Nitro server (via ~/utils/...).

export type PersonaMode = 'chat' | 'comment'

export type CharacterPersona = {
  name?: string | null
  honorific?: string | null
  title?: string | null
  role?: string | null
  class?: string | null
  species?: string | null
  genre?: string | null
  alignment?: string | null
  gender?: string | null
  personality?: string | null
  backstory?: string | null
  quirks?: string | null
  drive?: string | null
  presentation?: string | null
  sampleResponse?: string | null
  achievements?: string | null
  luck?: string | null
  might?: string | null
  wits?: string | null
  grace?: string | null
  charm?: string | null
  empathy?: string | null
}

export type BotPersona = {
  name?: string | null
  subtitle?: string | null
  description?: string | null
  prompt?: string | null
  personality?: string | null
  narrativeVoice?: string | null
  sampleResponse?: string | null
  botIntro?: string | null
  forgeIntro?: string | null
  tagline?: string | null
}

export type PersonaOptions = {
  mode?: PersonaMode
  // Extra situational context, e.g. "You are commenting on the <BotCard> page."
  context?: string
}

function labelled(label: string, value?: string | null): string | null {
  const trimmed = (value ?? '').toString().trim()
  return trimmed ? `${label}: ${trimmed}` : null
}

function compact(lines: Array<string | null | undefined>): string {
  return lines.filter((line): line is string => Boolean(line)).join('\n')
}

// The shared "be a distinct individual" instruction. This is the heart of the
// personality system: it tells the model to treat the persona fields as a voice,
// not just facts to recite.
const VOICE_GUIDANCE = compact([
  'VOICE — embody this persona as a unique individual, not a generic assistant:',
  '- Keep a consistent speech pattern, vocabulary, and rhythm that is theirs alone.',
  '- Let verbosity match their nature — some are terse and clipped, some pour words out.',
  '- Let quirks, drive, and mood colour word choice and cadence, not just content.',
  '- Favour specific, sensory, in-world detail over vague summary.',
  '- Never break character or mention being an AI, a model, a system, or a prompt.',
])

function chatClosing(): string {
  return compact([
    'Stay in character. Answer directly, vividly, and conversationally.',
    'Be amusing and thought-provoking, but never narrate or speak as the user.',
    'Keep replies to 2–6 short paragraphs unless the user asks for more.',
  ])
}

function commentClosing(): string {
  return compact([
    'Write ONE short in-character comment (1–3 sentences) reacting to what you are shown.',
    'Stay in your own voice; be specific, memorable, and generous-spirited.',
    'Do not address the user directly or explain yourself — just react as yourself.',
  ])
}

export function buildCharacterPersonaPrompt(
  character: CharacterPersona | null | undefined,
  options: PersonaOptions = {},
): string {
  if (!character) {
    return 'You are a vivid fictional character. Respond in character with a distinct voice.'
  }

  const mode = options.mode ?? 'chat'
  const displayName =
    [character.honorific, character.name].filter(Boolean).join(' ').trim() ||
    character.name ||
    'this character'

  const stats = [
    character.luck && `luck ${character.luck}`,
    character.might && `might ${character.might}`,
    character.wits && `wits ${character.wits}`,
    character.grace && `grace ${character.grace}`,
    character.charm && `charm ${character.charm}`,
    character.empathy && `empathy ${character.empathy}`,
  ]
    .filter(Boolean)
    .join(', ')

  return compact([
    `You are ${displayName}.`,
    labelled('Species', character.species),
    labelled('Class', character.class),
    labelled('Genre', character.genre),
    labelled('Role', character.role),
    labelled('Title', character.title),
    labelled('Alignment', character.alignment),
    labelled('Gender', character.gender),
    '',
    VOICE_GUIDANCE,
    labelled('Personality', character.personality),
    labelled('Presentation', character.presentation),
    labelled('Quirks', character.quirks),
    labelled('Drive', character.drive),
    labelled('Backstory', character.backstory),
    labelled('Achievements', character.achievements),
    stats ? `Stats: ${stats}` : null,
    character.sampleResponse
      ? `A line in your voice (match this register; do not repeat it verbatim): ${character.sampleResponse}`
      : null,
    options.context ? `\n${options.context}` : null,
    '',
    mode === 'comment' ? commentClosing() : chatClosing(),
  ])
}

export function buildBotPersonaPrompt(
  bot: BotPersona | null | undefined,
  options: PersonaOptions = {},
): string {
  if (!bot) {
    return 'You are a helpful, characterful bot. Respond with a distinct voice.'
  }

  const mode = options.mode ?? 'chat'

  return compact([
    bot.prompt || `You are ${bot.name || 'a Kind Robots bot'}.`,
    labelled('Tagline', bot.tagline),
    labelled('About', bot.subtitle || bot.description),
    '',
    VOICE_GUIDANCE,
    labelled('Personality', bot.personality),
    labelled('Narrative voice', bot.narrativeVoice),
    bot.sampleResponse
      ? `A line in your voice (match this register; do not repeat it verbatim): ${bot.sampleResponse}`
      : null,
    labelled('Bot intro', bot.botIntro),
    labelled('Forge guidance', bot.forgeIntro),
    options.context ? `\n${options.context}` : null,
    '',
    mode === 'comment' ? commentClosing() : chatClosing(),
  ])
}
