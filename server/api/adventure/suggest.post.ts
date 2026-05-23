// server/api/adventure/suggest.post.ts
//
// LLM suggest endpoint for the Adventure Character Builder.
// Follows the same pattern as anthropic/stream — direct fetch,
// useRuntimeConfig() for the key, no SDK dependency.
// Non-streaming: waits for the full response and returns JSON.
//
// Request body:
//   field    — sheet field being suggested (e.g. 'personality', 'artPrompt')
//   stepKey  — card step key (e.g. 'personality', 'art')
//   current  — user's existing text (may be empty)
//   sheet    — full AdventureSheet for context
//
// Response:
//   { success: true,  data: { value: string } }
//   { success: false, message: string }

import { defineEventHandler, readBody, createError } from 'h3'

// ── Types ──────────────────────────────────────────────────────────────────

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
  field: string
  stepKey: string
  current?: string
  sheet?: SheetSnapshot
}

type AnthropicMessage = {
  content: Array<{ type: string; text?: string }>
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

// ── Field-specific user prompts ────────────────────────────────────────────

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

// ── Handler ────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<SuggestRequestBody>(event)
    const { field, stepKey, current = '', sheet = {} } = body ?? {}

    if (!field && !stepKey) {
      return { success: false, message: 'field or stepKey is required.' }
    }

    const { anthropicApiKey } = useRuntimeConfig()

    if (!anthropicApiKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'anthropicApiKey not configured',
      })
    }

    const userPrompt = buildUserPrompt(field, stepKey, current, sheet)

    console.log('[adventure/suggest] →', {
      field,
      stepKey,
      entity: sheet.name || 'unnamed',
    })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw createError({
        statusCode: response.status,
        statusMessage: `Anthropic API error: ${response.statusText}. ${errText}`,
      })
    }

    const data = (await response.json()) as AnthropicMessage

    const block = data.content?.[0]
    if (!block || block.type !== 'text' || !block.text?.trim()) {
      return {
        success: false,
        message: 'The language model returned an empty or unexpected response.',
      }
    }

    return {
      success: true,
      data: { value: block.text.trim() },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[adventure/suggest] error:', message)

    throw createError({
      statusCode: 500,
      statusMessage: `Suggestion failed: ${message}`,
    })
  }
})
