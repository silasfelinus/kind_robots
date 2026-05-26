// server/api/suggest.post.ts
//
// Unified LLM suggest endpoint for all Kind Robots builders.
// One file. Builder-specific system prompts + context.
//
// Request body:
//   builder  — 'adventure' | 'pitch' | 'reward' | 'dream' (routes system prompt)
//   server   — serverStore.activeTextServer snapshot (provider derived from this)
//   field    — schema field being suggested
//   stepKey  — card step key
//   current  — existing text (may be empty)
//   context  — builder-specific context object (sheet, pitchForm, etc.)
//
// Provider resolution (from server.baseUrl / server.serverType):
//   anthropic.com   → anthropic
//   openai.com      → openai
//   OPENAI_COMPAT   → openai_compatible (uses server.baseUrl)
//   localhost/ollama → ollama
//   fallback        → anthropic

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

// ── Provider derivation ────────────────────────────────────────────────────

function deriveProvider(server?: ServerSnapshot): Provider {
  if (!server?.baseUrl && !server?.serverType) return 'anthropic'
  const url = (server.baseUrl || '').toLowerCase()
  const type = (server.serverType || '').toUpperCase()
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

// ── System prompts by builder ──────────────────────────────────────────────

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

const DEFAULT_SYSTEM = SYSTEM_PROMPTS.adventure

// ── Context builders ───────────────────────────────────────────────────────

function buildContextString(
  builder: Builder,
  context: Record<string, unknown>,
): string {
  const lines: string[] = []

  switch (builder) {
    case 'adventure': {
      const c = context as Record<string, string | undefined>
      if (c.name) lines.push(`Name: ${c.name}`)
      if (c.species) lines.push(`Species: ${c.species}`)
      if (c.class) lines.push(`Calling: ${c.class}`)
      if (c.genre) lines.push(`Genre: ${c.genre}`)
      if (c.alignment) lines.push(`Alignment: ${c.alignment}`)
      if (c.gender) lines.push(`Gender: ${c.gender}`)
      if (c.personality) lines.push(`Personality: ${c.personality}`)
      if (c.backstory) lines.push(`Backstory: ${c.backstory}`)
      break
    }
    case 'pitch': {
      const c = context as Record<string, string | undefined>
      if (c.PitchType === 'DREAM')
        lines.push('Type: Location pitch (a place for stories to happen)')
      else lines.push('Type: Art pitch (a concept for image generation)')
      if (c.pitch) lines.push(`Current pitch: ${c.pitch}`)
      if (c.genre) lines.push(`Genre: ${c.genre}`)
      break
    }
    case 'dream': {
      const c = context as Record<string, string | undefined>
      if (c.title) lines.push(`Location: ${c.title}`)
      if (c.pitch) lines.push(`Concept: ${c.pitch}`)
      if (c.genre) lines.push(`Genre: ${c.genre}`)
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

  // Field-specific prompts
  const FIELD_PROMPTS: Record<string, string> = {
    pitch: `Write or refine a pitch sentence for this creative seed.`,
    personality: `Write a 2–3 sentence personality description. Capture how they behave under pressure, their characteristic flaws and strengths.`,
    backstory: `Write a 3–5 sentence backstory. Include: something wanted, something lost, a formative event, one detail that still surfaces at wrong moments.`,
    quirks: `Write 1–2 specific behavioral quirks. Make them specific and interesting.`,
    artPrompt: `Refine this portrait prompt for AI image generation. Prioritise visual specificity. Keep under 200 words.`,
    description: `Write a 1–2 sentence evocative description.`,
  }

  const fieldPrompt =
    FIELD_PROMPTS[field] ??
    FIELD_PROMPTS[stepKey] ??
    `Generate an appropriate value for the "${field}" field.`

  return `${fieldPrompt}${ctxNote}${currentNote}`
}

// ── Provider calls ────────────────────────────────────────────────────────

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
  if (!response.ok) {
    const err = await response.text().catch(() => '')
    throw createError({
      statusCode: response.status,
      statusMessage: `Anthropic: ${response.statusText}. ${err}`,
    })
  }
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
  const endpoint = `${baseUrl.replace(/\/$/, '')}${endpointPath}`
  const response = await fetch(endpoint, {
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
  if (!response.ok) {
    const err = await response.text().catch(() => '')
    throw createError({
      statusCode: response.status,
      statusMessage: `OpenAI: ${response.statusText}. ${err}`,
    })
  }
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
  if (!response.ok) {
    const err = await response.text().catch(() => '')
    throw createError({
      statusCode: response.status,
      statusMessage: `Ollama: ${response.statusText}. ${err}`,
    })
  }
  type R = { message: { content: string } }
  const data = (await response.json()) as R
  return data.message?.content?.trim() ?? ''
}

// ── Handler ───────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<SuggestBody>(event)
    const {
      builder = 'adventure',
      server,
      field,
      stepKey = field,
      current = '',
      context = {},
    } = body ?? {}

    if (!field && !stepKey) {
      return { success: false, message: 'field or stepKey is required.' }
    }

    const config = useRuntimeConfig()
    const provider = deriveProvider(server)
    const model = resolveModel(provider, server?.model)
    const systemPrompt = SYSTEM_PROMPTS[builder] ?? DEFAULT_SYSTEM
    const userPrompt = buildUserPrompt(
      builder,
      field,
      stepKey,
      current,
      context,
    )

    console.log('[suggest]', { builder, provider, model, field, stepKey })

    let value: string

    if (provider === 'ollama') {
      const baseUrl =
        server?.baseUrl ||
        (config.ollamaBaseUrl as string | undefined) ||
        'http://localhost:11434'
      value = await callOllama(systemPrompt, userPrompt, model, baseUrl)
    } else if (provider === 'openai_compatible') {
      const apiKey = (config.openaiApiKey as string | undefined) || ''
      const baseUrl = server?.baseUrl || 'http://localhost:1234'
      const endpointPath = server?.endpointPath || '/v1/chat/completions'
      value = await callOpenAI(
        systemPrompt,
        userPrompt,
        model,
        apiKey,
        baseUrl,
        endpointPath,
      )
    } else if (provider === 'openai') {
      const apiKey = config.openaiApiKey as string | undefined
      if (!apiKey)
        throw createError({
          statusCode: 500,
          statusMessage: 'openaiApiKey not configured',
        })
      value = await callOpenAI(systemPrompt, userPrompt, model, apiKey)
    } else {
      const apiKey = config.anthropicApiKey as string | undefined
      if (!apiKey)
        throw createError({
          statusCode: 500,
          statusMessage: 'anthropicApiKey not configured',
        })
      value = await callAnthropic(systemPrompt, userPrompt, model, apiKey)
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
