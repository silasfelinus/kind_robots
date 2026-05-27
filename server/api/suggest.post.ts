// server/api/suggest.post.ts
//
// Unified LLM suggest endpoint for all Kind Robots builders.
// One file. Builder-specific system prompts + context.

import { defineEventHandler, readBody, createError } from 'h3'

// ── Types ──────────────────────────────────────────────────────────────────

type Provider = 'anthropic' | 'openai' | 'openai_compatible' | 'ollama'
type Builder = 'adventure' | 'pitch' | 'reward' | 'dream' | string

type ServerSnapshot = {
  serverType?: string | null
  baseUrl?: string | null
  endpointPath?: string | null
  model?: string | null
}

type SuggestBody = {
  builder?: Builder
  server?: ServerSnapshot
  field: string
  stepKey: string
  current?: string
  context?: Record<string, unknown>
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Coerce any config value → string, with optional fallback.
 *  Accepts unknown so Nuxt runtimeConfig fields (string | undefined) pass without casts. */
function str(val: unknown, fallback = ''): string {
  if (val == null || val === '') return fallback
  if (typeof val === 'string') return val
  return fallback
}

function deriveProvider(server?: ServerSnapshot): Provider {
  if (!server?.baseUrl && !server?.serverType) return 'anthropic'
  const url = str(server.baseUrl).toLowerCase()
  const type = str(server.serverType).toUpperCase()
  if (url.includes('anthropic.com')) return 'anthropic'
  if (url.includes('openai.com')) return 'openai'
  if (
    url.includes('localhost') ||
    url.includes('127.0.0.1') ||
    url.includes('ollama')
  )
    return 'ollama'
  if (type === 'OPENAI_COMPATIBLE' || type === 'TEXT')
    return 'openai_compatible'
  return 'anthropic'
}

function resolveModel(provider: Provider, serverModel?: string | null): string {
  if (serverModel?.trim()) return serverModel.trim()
  switch (provider) {
    case 'openai':
    case 'openai_compatible':
      return 'gpt-4o-mini'
    case 'ollama':
      return 'llama3.2'
    default:
      return 'claude-sonnet-4-6'
  }
}

// ── System prompts ─────────────────────────────────────────────────────────

const SYSTEM_PROMPTS: Record<string, string> = {
  adventure: `You are the writing engine for a character builder called the Adventure Builder on Kind Robots.
Entities can be anything: humans, monsters, aliens, sentient appliances, abstract concepts.
Your job: write vivid, specific, flavourful text for character sheet fields.
Tone: mysterious but whimsical. Think Disco Elysium meets Douglas Adams.
Rules:
- Return only the field value. No preamble, no explanation, no quotation marks.
- Be specific. Generic writing is a failure state.
- Keep responses concise and punchy.`,

  pitch: `You are a pitch refinement assistant for Kind Robots.
A pitch is a one-sentence creative seed — subject, mood, scenario, or concept.
Your job: make the pitch more evocative, specific, and interesting.
Rules:
- Return only the refined pitch sentence. No preamble, no explanation, no quotes.
- One sentence, under 100 words.
- Make it more specific, not more complicated.
- The best pitches make someone immediately start having ideas.`,

  bot: `You are a bot design assistant for Kind Robots.
You help create system prompts, taglines, opening messages, and descriptions for AI bots.
Each bot has a type (assistant, story, art, composition, character, scenario, guide, custom) and a personality.
Rules:
- Return only the requested text. No preamble.
- Match the bot's type and personality when writing.
- System prompts: second person (You are...), clear, specific, 1–4 sentences.
- Taglines: one sentence hook. Make it specific to this bot, not generic.
- Opening messages: in the bot's voice, present tense, immediate, warm or in-character.`,

  scenario: `You are a scenario writer for Kind Robots.
You write engaging, dramatic scenario prompts — setup descriptions and intro choices for interactive storytelling.
Tone: matches the genre. Can be horror, comedy, fantasy, or anything else. Always specific and immediate.
Rules:
- Return only the requested text. No preamble.
- Descriptions set scene and stakes in 2–5 sentences.
- Intros drop the player directly into a dramatic opening moment — present tense, immediate, specific.
- When generating multiple intros, return them pipe-separated: INTRO ONE: text | INTRO TWO: text
- Each intro should be a distinct way into the scenario, not variations of the same entry point.`,

  reward: `You are a reward and ability writer for Kind Robots.
You write compelling, evocative names and descriptions for skills, powers, and rewards.
Tone: game-mechanical but flavourful. The ability should feel earned and specific.
Rules:
- Return only the requested text. No preamble.
- Be specific and interesting. Avoid generic RPG language.`,

  dream: `You are a location and atmosphere writer for Kind Robots.
You write evocative descriptions of places — real, imagined, or somewhere between.
Tone: immersive, sensory, with a sense of history and possibility.
Rules:
- Return only the description. No preamble, no quotation marks.
- Prioritise atmosphere over inventory. What does it feel like to be there?
- Keep it under 150 words unless the field specifically requires more.`,
}

const DEFAULT_SYSTEM =
  SYSTEM_PROMPTS.adventure ?? 'You are a helpful creative writing assistant.'

// ── Context builders ───────────────────────────────────────────────────────

function buildContextString(
  builder: Builder,
  context: Record<string, unknown>,
): string {
  const lines: string[] = []
  const c = context as Record<string, string | undefined>

  switch (builder) {
    case 'adventure':
      if (c.name) lines.push(`Name: ${c.name}`)
      if (c.species) lines.push(`Species: ${c.species}`)
      if (c.class) lines.push(`Calling: ${c.class}`)
      if (c.genre) lines.push(`Genre: ${c.genre}`)
      if (c.alignment) lines.push(`Alignment: ${c.alignment}`)
      if (c.gender) lines.push(`Gender: ${c.gender}`)
      if (c.personality) lines.push(`Personality: ${c.personality}`)
      if (c.backstory) lines.push(`Backstory: ${c.backstory}`)
      break
    case 'pitch':
      lines.push(
        c.PitchType === 'DREAM'
          ? 'Type: Location pitch (a place for stories to happen)'
          : 'Type: Art pitch (a concept for image generation)',
      )
      if (c.pitch) lines.push(`Current pitch: ${c.pitch}`)
      break
    case 'bot': {
      if (c.BotType) lines.push(`Bot type: ${c.BotType}`)
      if (c.name) lines.push(`Name: ${c.name}`)
      if (c.personality)
        lines.push(
          `Personality: ${String(c.personality).split('|').join(', ')}`,
        )
      if (c.prompt) lines.push(`System prompt: ${c.prompt}`)
      break
    }
    case 'scenario': {
      if (c.genres) lines.push(`Genre: ${c.genres}`)
      if (c.title) lines.push(`Title: ${c.title}`)
      if (c.description) lines.push(`Description: ${c.description}`)
      if (c.inspirations) lines.push(`Inspirations: ${c.inspirations}`)
      if (c.introIndex !== undefined) {
        lines.push(
          `Writing intro ${Number(c.introIndex) + 1} of ${c.totalIntros}`,
        )
        if (Array.isArray(c.otherIntros) && c.otherIntros.length)
          lines.push(
            `Other intros already written: ${(c.otherIntros as string[]).join(' | ')}`,
          )
      }
      if (c.count) lines.push(`Generate ${c.count} intros, pipe-separated`)
      break
    }
    case 'dream':
      if (c.vibeTag) lines.push(`Atmosphere: ${c.vibeTag}`)
      if (c.title) lines.push(`Title: ${c.title}`)
      if (c.description) lines.push(`Description: ${c.description}`)
      if (c.currentVibe) lines.push(`Current vibe: ${c.currentVibe}`)
      break
    case 'reward': {
      if (c.rewardType) lines.push(`Type: ${c.rewardType}`)
      if (c.rarity) lines.push(`Rarity: ${c.rarity}`)
      if (c.text) lines.push(`Name: ${c.text}`)
      if (c.power) lines.push(`Current power: ${c.power}`)
      if (c.collection) lines.push(`Collection: ${c.collection}`)
      if (Array.isArray(c.examples)) {
        const exs = (
          c.examples as Array<{ text: string; power: string }>
        ).slice(0, 2)
        exs.forEach((e) => lines.push(`Example — ${e.text}: ${e.power}`))
      }
      break
    }
  }

  return lines.join('\n')
}

function buildUserPrompt(
  builder: Builder,
  field: string,
  stepKey: string,
  current: string,
  context: Record<string, unknown>,
): string {
  const ctx = buildContextString(builder, context)
  const ctxNote = ctx ? `\n\nContext:\n${ctx}` : ''
  const currentNote = current.trim()
    ? `\n\nExisting value to refine:\n"${current.trim()}"\nReturn only the improved version.`
    : '\nReturn only the value. No preamble.'

  const FIELD_PROMPTS: Record<string, string> = {
    pitch: 'Write or refine a pitch sentence for this creative seed.',
    personality:
      'Write a 2–3 sentence personality description. Capture how they behave under pressure, their characteristic flaws and strengths.',
    backstory:
      'Write a 3–5 sentence backstory. Include: something wanted, something lost, a formative event, one detail that still surfaces at wrong moments.',
    quirks:
      'Write 1–2 specific behavioral quirks. Make them specific and interesting.',
    artPrompt:
      'Refine this portrait prompt for AI image generation. Prioritise visual specificity. Keep under 200 words.',
    rewardText:
      'Write a short, evocative name for this reward (2–5 words). Specific and memorable.',
    rewardPower:
      'Write the power/effect of this reward in 1–2 sentences. Clear mechanical effect with flavourful delivery.',
    title:
      'Write a short, evocative title for this location or dream space (2–5 words).',
    description:
      'Write a 2–4 sentence description of this space as it exists when undisturbed. Atmosphere, history, defining features.',
    currentVibe:
      'Write 1–2 sentences describing the current mood or atmospheric condition of this space right now.',
    currentPrompt:
      'Write 1–3 sentences describing what a visitor encounters when entering this space today. The active element.',
    botPrompt:
      'Write a system prompt for this bot. Second person (You are...). Clear and specific about what the bot does and how it speaks. Under 200 words.',
    botTagline:
      'Write a one-sentence tagline for this bot. Specific, compelling, makes someone want to use it.',
    botUserIntro:
      "Write the user-facing intro for this bot — what they read before starting. An invitation or description in the bot's voice.",
    botDescription:
      "Write a short description of this bot for listings. What it does, who it's for.",
    botSampleResponse:
      "Write a single example response in this bot's voice. 1–2 sentences.",
    botIntro:
      "Write one opening message in this bot's voice. Present tense, immediate, in character.",
    botIntros:
      'Write multiple opening messages pipe-separated. Format: opener one | opener two | opener three',
    scenarioTitle:
      'Write a short evocative scenario title (2–5 words). Creates anticipation without explaining everything.',
    scenarioDescription:
      'Write the scenario setup in 2–5 sentences. Situation, stakes, and tone.',
    intro:
      'Write one scenario intro — drop the player into a dramatic opening moment. Present tense, specific, immediate. 2–4 sentences.',
    intros:
      'Write multiple scenario intros pipe-separated. Each is a distinct entry point. Format: TITLE IN CAPS: text | TITLE IN CAPS: text',
  }

  const fieldPrompt =
    FIELD_PROMPTS[field] ??
    FIELD_PROMPTS[stepKey] ??
    `Generate an appropriate value for the "${field}" field.`
  return `${fieldPrompt}${ctxNote}${currentNote}`
}

// ── Provider calls ─────────────────────────────────────────────────────────

async function callAnthropic(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  apiKey: string,
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 512,
      stream: false,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })
  if (!response.ok)
    throw createError({
      statusCode: response.status,
      statusMessage: `Anthropic: ${response.statusText}`,
    })
  type R = { content: Array<{ type: string; text?: string }> }
  const data = (await response.json()) as R
  return data.content?.[0]?.text?.trim() ?? ''
}

async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  apiKey: string,
  baseUrl = 'https://api.openai.com',
  endpointPath = '/v1/chat/completions',
): Promise<string> {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}${endpointPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 512,
      stream: false,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  })
  if (!response.ok)
    throw createError({
      statusCode: response.status,
      statusMessage: `OpenAI: ${response.statusText}`,
    })
  type R = { choices: Array<{ message: { content: string } }> }
  const data = (await response.json()) as R
  return data.choices?.[0]?.message?.content?.trim() ?? ''
}

async function callOllama(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  baseUrl: string,
): Promise<string> {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      options: { num_predict: 512 },
    }),
  })
  if (!response.ok)
    throw createError({
      statusCode: response.status,
      statusMessage: `Ollama: ${response.statusText}`,
    })
  type R = { message: { content: string } }
  const data = (await response.json()) as R
  return data.message?.content?.trim() ?? ''
}

// ── Handler ────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<SuggestBody>(event)

    // Read fields directly — avoids body ?? {} widening field/stepKey to string | undefined
    const field = body?.field ?? ''
    const stepKey = body?.stepKey ?? body?.field ?? ''
    const builder = body?.builder ?? 'adventure'
    const server = body?.server
    const current = body?.current ?? ''
    const context = body?.context ?? {}

    if (!field) {
      return { success: false, message: 'field or stepKey is required.' }
    }

    const config = useRuntimeConfig()
    const provider = deriveProvider(server)
    const model = resolveModel(provider, server?.model)
    const systemPrompt =
      SYSTEM_PROMPTS[builder] ??
      DEFAULT_SYSTEM ??
      'You are a helpful creative writing assistant.'
    const userPrompt = buildUserPrompt(
      builder,
      field,
      stepKey,
      current,
      context,
    )

    console.log('[suggest]', { builder, provider, model, field, stepKey })

    let value: string

    // str() coerces string | null | undefined → string, so all args are clean strings
    if (provider === 'ollama') {
      value = await callOllama(
        systemPrompt,
        userPrompt,
        model,
        str(
          server?.baseUrl,
          str(config.ollamaBaseUrl, 'http://localhost:11434'),
        ),
      )
    } else if (provider === 'openai_compatible') {
      value = await callOpenAI(
        systemPrompt,
        userPrompt,
        model,
        str(config.openaiApiKey),
        str(server?.baseUrl, 'http://localhost:1234'),
        str(server?.endpointPath, '/v1/chat/completions'),
      )
    } else if (provider === 'openai') {
      const key = str(config.openaiApiKey)
      if (!key)
        throw createError({
          statusCode: 500,
          statusMessage: 'openaiApiKey not configured',
        })
      value = await callOpenAI(systemPrompt, userPrompt, model, key)
    } else {
      const key = str(config.anthropicApiKey)
      if (!key)
        throw createError({
          statusCode: 500,
          statusMessage: 'anthropicApiKey not configured',
        })
      value = await callAnthropic(systemPrompt, userPrompt, model, key)
    }

    if (!value) {
      return {
        success: false,
        message: 'The model returned an empty response.',
      }
    }

    return { success: true, data: { value } }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[suggest] error:', message)
    throw createError({
      statusCode: 500,
      statusMessage: `Suggestion failed: ${message}`,
    })
  }
})
