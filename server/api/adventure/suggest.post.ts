// server/api/adventure/suggest.post.ts
//
// Multi-provider LLM suggest endpoint for the Adventure Character Builder.
// Provider is derived from the active text server passed by the client —
// no hardcoded provider field needed.
//
// Request body:
//   server   — snapshot of serverStore.activeTextServer (serverType, baseUrl, model, endpointPath)
//   field    — sheet field being suggested (e.g. 'personality', 'artPrompt')
//   stepKey  — card step key (e.g. 'personality', 'art')
//   current  — user's existing text (may be empty)
//   sheet    — full AdventureSheet for context
//
// Provider resolution (in order):
//   1. baseUrl contains 'anthropic.com'                  → anthropic
//   2. baseUrl contains 'openai.com'                     → openai
//   3. serverType === 'OPENAI_COMPATIBLE' + custom base  → openai-compatible (uses baseUrl)
//   4. baseUrl is local / contains 'ollama'              → ollama
//   5. no server passed                                  → anthropic (fallback)
//
// Response:
//   { success: true,  data: { value: string } }
//   { success: false, message: string }

import { defineEventHandler, readBody, createError } from 'h3'

// ── Types ──────────────────────────────────────────────────────────────────

type Provider = 'anthropic' | 'openai' | 'openai_compatible' | 'ollama'

type ServerSnapshot = {
  serverType?: string | null
  baseUrl?: string | null
  endpointPath?: string | null
  model?: string | null
}

type SheetSnapshot = {
  name?: string
  honorific?: string
  title?: string
  role?: string
  genre?: string
  species?: string
  class?: string
  alignment?: string
  gender?: string
  presentation?: string
  personality?: string
  drive?: string
  backstory?: string
  achievements?: string
  quirks?: string
  artPrompt?: string
  rewards?: Record<string, { label: string; power: string; rarity: string }>
}

type SuggestRequestBody = {
  server?: ServerSnapshot
  field: string
  stepKey: string
  current?: string
  sheet?: SheetSnapshot
}

// ── Provider derivation ────────────────────────────────────────────────────

function deriveProvider(server?: ServerSnapshot): Provider {
  if (!server?.baseUrl && !server?.serverType) return 'anthropic'

  const url = (server.baseUrl || '').toLowerCase()
  const type = (server.serverType || '').toUpperCase()

  if (url.includes('anthropic.com')) return 'anthropic'
  if (url.includes('openai.com')) return 'openai'

  // Local / Ollama — covers localhost:11434, docker container names, etc.
  const isLocal =
    url.includes('localhost') ||
    url.includes('127.0.0.1') ||
    url.includes('0.0.0.0') ||
    url.includes('ollama')
  if (isLocal) return 'ollama'

  // OPENAI_COMPATIBLE with a non-openai, non-local base — e.g. LM Studio, vLLM, homelab
  if (type === 'OPENAI_COMPATIBLE' || type === 'TEXT')
    return 'openai_compatible'

  return 'anthropic'
}

// ── Model defaults per provider ────────────────────────────────────────────

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

// ── Sheet context ──────────────────────────────────────────────────────────

function buildSheetContext(sheet: SheetSnapshot): string {
  const lines: string[] = []

  if (sheet.name) lines.push(`Name: ${sheet.name}`)
  if (sheet.species) lines.push(`Species: ${sheet.species}`)
  if (sheet.class) lines.push(`Calling: ${sheet.class}`)
  if (sheet.role) lines.push(`Story role: ${sheet.role}`)
  if (sheet.genre) lines.push(`Genre: ${sheet.genre}`)
  if (sheet.alignment) lines.push(`Alignment: ${sheet.alignment}`)
  if (sheet.gender) lines.push(`Gender: ${sheet.gender}`)
  if (sheet.presentation) lines.push(`Presentation: ${sheet.presentation}`)
  if (sheet.personality) lines.push(`Personality: ${sheet.personality}`)
  if (sheet.drive) lines.push(`Drive: ${sheet.drive}`)
  if (sheet.backstory) lines.push(`Backstory: ${sheet.backstory}`)

  if (sheet.rewards) {
    const skills = Object.values(sheet.rewards)
      .map((r) => `${r.rarity} — ${r.label}: ${r.power}`)
      .join('\n')
    if (skills) lines.push(`Skills:\n${skills}`)
  }

  return lines.join('\n')
}

// ── User prompt builder ────────────────────────────────────────────────────

function buildUserPrompt(
  field: string,
  stepKey: string,
  current: string,
  sheet: SheetSnapshot,
): string {
  const context = buildSheetContext(sheet)
  const entityName = sheet.name || 'this entity'

  const currentNote = current.trim()
    ? `\nThe user has already written: "${current.trim()}"\nRefine this — keep what works, sharpen what doesn't. Return only the improved version.`
    : '\nReturn only the written value. No preamble, no explanation, no quotation marks.'

  const PROMPTS: Record<string, string> = {
    presentation: `Write a vivid 1–3 sentence description of how ${entityName} physically presents to the world.
Capture their visual appearance, posture, and the immediate impression they make before speaking.
Be specific and strange where appropriate. Species: ${sheet.species || 'unknown'}. Genre: ${sheet.genre || 'any'}.
${currentNote}`,

    personality: `Write a 2–4 sentence personality description for ${entityName}.
Capture how they behave under pressure, how they relate to others, their characteristic flaws and strengths.
Make it feel lived-in and specific — not a list of traits, but a voice.
Genre: ${sheet.genre || 'any'}. Role: ${sheet.role || 'undefined'}.
${currentNote}`,

    drive: `Write 1–2 sentences describing what ${entityName} wants badly enough to make a questionable decision about.
Be specific and emotionally charged. Avoid generic ambitions.
${currentNote}`,

    backstory: `Write a 3–5 sentence backstory for ${entityName}.
Include: something they wanted, something they lost or left behind, a formative event, and one detail that still surfaces at the wrong moments.
Species: ${sheet.species || 'unknown'}. Genre: ${sheet.genre || 'any'}.
${currentNote}`,

    achievements: `Write 2–4 achievements, rumours, or notable incidents for ${entityName}.
Format as a single paragraph or brief list. Mix the impressive with the absurd. Be specific.
${currentNote}`,

    artPrompt: `Refine this portrait prompt for use with an AI image generation model.
Structure it for image generation: subject, environment, mood, style, lighting.
Prioritise visual specificity over narrative explanation. Keep it under 200 words.

Current prompt:
${current}

Entity context:
${context}

Return only the refined prompt text.`,
  }

  const fallback = `Generate an appropriate value for the "${field}" field of a character sheet.
Entity context:\n${context}
${currentNote}`

  return PROMPTS[stepKey] ?? PROMPTS[field] ?? fallback
}

// ── System prompt ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the writing engine for a character builder called the Adventure Builder.
Entities can be anything: humans, monsters, aliens, sentient appliances, abstract concepts, non-sentient sponges.
Your job is to write vivid, specific, flavourful text for character sheet fields.

Tone: mysterious but whimsical. Think Disco Elysium meets Douglas Adams.
The prose should feel like it knows something you don't, but finds you charming anyway.

Rules:
- Write only the requested field value. No preamble, no explanation, no quotation marks around the output.
- Be specific. Generic writing is a failure state.
- If the entity is unusual (non-human, non-sentient, alien) lean into it — don't normalise them.
- Keep responses concise and punchy. Longer is not better.
- Never use filler phrases like "In conclusion" or "As an AI".`

// ── Provider fetch functions ───────────────────────────────────────────────

async function callAnthropic(
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
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
      stream: false,
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw createError({
      statusCode: response.status,
      statusMessage: `Anthropic: ${response.statusText}. ${errText}`,
    })
  }

  type R = { content: Array<{ type: string; text?: string }> }
  const data = (await response.json()) as R
  const text = data.content?.[0]?.text?.trim()
  if (!text)
    throw createError({
      statusCode: 500,
      statusMessage: 'Anthropic returned empty content.',
    })
  return text
}

async function callOpenAI(
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
      temperature: 0.7,
      max_tokens: 512,
      stream: false,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw createError({
      statusCode: response.status,
      statusMessage: `OpenAI: ${response.statusText}. ${errText}`,
    })
  }

  type R = { choices: Array<{ message: { content: string } }> }
  const data = (await response.json()) as R
  const text = data.choices?.[0]?.message?.content?.trim()
  if (!text)
    throw createError({
      statusCode: 500,
      statusMessage: 'OpenAI returned empty content.',
    })
  return text
}

async function callOllama(
  userPrompt: string,
  model: string,
  baseUrl: string,
): Promise<string> {
  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/chat`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      options: { num_predict: 512 },
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw createError({
      statusCode: response.status,
      statusMessage: `Ollama: ${response.statusText}. ${errText}`,
    })
  }

  type R = { message: { content: string } }
  const data = (await response.json()) as R
  const text = data.message?.content?.trim()
  if (!text)
    throw createError({
      statusCode: 500,
      statusMessage: 'Ollama returned empty content.',
    })
  return text
}

// ── Handler ────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<SuggestRequestBody>(event)
    const { server, field, stepKey, current = '', sheet = {} } = body ?? {}

    if (!field && !stepKey) {
      return { success: false, message: 'field or stepKey is required.' }
    }

    const config = useRuntimeConfig()
    const provider = deriveProvider(server)
    const model = resolveModel(provider, server?.model)
    const userPrompt = buildUserPrompt(field, stepKey, current, sheet)

    console.log('[adventure/suggest] →', {
      provider,
      model,
      serverType: server?.serverType ?? 'none',
      baseUrl: server?.baseUrl ?? 'default',
      field,
      stepKey,
      entity: sheet.name || 'unnamed',
    })

    let value: string

    if (provider === 'ollama') {
      const baseUrl =
        server?.baseUrl ||
        (config.ollamaBaseUrl as string | undefined) ||
        'http://localhost:11434'
      value = await callOllama(userPrompt, model, baseUrl)
    } else if (provider === 'openai_compatible') {
      // Self-hosted OpenAI-compatible server (LM Studio, vLLM, homelab, etc.)
      // Uses openaiApiKey if set, falls back to empty string (many local servers don't require auth)
      const apiKey = (config.openaiApiKey as string | undefined) || ''
      const baseUrl = server?.baseUrl || 'http://localhost:1234'
      const endpointPath = server?.endpointPath || '/v1/chat/completions'
      value = await callOpenAI(userPrompt, model, apiKey, baseUrl, endpointPath)
    } else if (provider === 'openai') {
      const apiKey = config.openaiApiKey as string | undefined
      if (!apiKey)
        throw createError({
          statusCode: 500,
          statusMessage: 'openaiApiKey not configured',
        })
      value = await callOpenAI(userPrompt, model, apiKey)
    } else {
      // anthropic (default)
      const apiKey = config.anthropicApiKey as string | undefined
      if (!apiKey)
        throw createError({
          statusCode: 500,
          statusMessage: 'anthropicApiKey not configured',
        })
      value = await callAnthropic(userPrompt, model, apiKey)
    }

    return { success: true, data: { value } }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[adventure/suggest] error:', message)
    throw createError({
      statusCode: 500,
      statusMessage: `Suggestion failed: ${message}`,
    })
  }
})
