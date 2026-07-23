// /server/api/music-mentor/analyze.post.ts
//
// Music Mentor feedback endpoint. Receives a compact, browser-extracted audio
// feature summary (pitch/intonation, timing, dynamics, structure) plus the
// user's setlist and the feedback dimensions they picked, and asks an LLM to
// turn those numbers into honest singing + arrangement coaching. The raw audio
// never reaches the server — this endpoint only ever sees the numeric summary,
// and nothing is persisted. Reuses the suggest-provider plumbing so it inherits
// the same provider selection, key resolution, and mana billing as /api/suggest.
import { defineEventHandler, readBody, createError } from 'h3'
import { manaGate } from '../../utils/manaGate'
import { estimateTextCostUsd } from '../../utils/manaCost'
import {
  callSuggestProvider,
  deriveSuggestProvider,
  resolveSuggestModel,
  str,
} from '../../utils/suggest/suggestProviders'
import type { SuggestServerSnapshot } from '../../utils/suggest/suggestTypes'

type Dimension = 'intonation' | 'timing' | 'dynamics' | 'arrangement'

const DIMENSION_GUIDES: Record<Dimension, string> = {
  intonation:
    'Intonation & pitch: comment on how in-tune the singing is (use meanAbsCentsOff — under ~20 cents is quite accurate, 20–40 is workable, over 40 reads as noticeably off), note stability/jitter, range, and the estimated key. Say whether any flat/sharp tendency is worth drilling.',
  timing:
    'Timing & rhythm: comment on the tempo estimate, how steady it is (tempoStability closer to 1 is steadier), and any rushing/dragging trend. Frame it around keeping the medley grooving.',
  dynamics:
    'Dynamics & expression: comment on the loudness range and contrast — is the take dynamically flat or expressive? Note the overall build/fade and flag suspected clipping if present.',
  arrangement:
    'Arrangement & structure: reason over the setlist the user provided plus the detected section structure. Comment on song-to-song transitions, key relationships between songs, pacing across the medley, and overall cohesion. This is the most important dimension — be concrete and musical.',
}

type AnalyzeBody = {
  features?: unknown
  setlist?: string
  dimensions?: string[]
  server?: SuggestServerSnapshot
  maxTokens?: number | null
}

const SYSTEM_PROMPT = `You are Music Mentor, a warm, specific vocal and arrangement coach for a songwriter workshopping a sung medley.

You are given OBJECTIVE audio measurements extracted in the singer's browser (pitch/intonation, timing, dynamics, rough section structure) plus a setlist they typed. You never hear the audio yourself — you only see these numbers.

Rules:
- Be honest about the boundary: you can speak to what the measurements support (intonation, timing, dynamics, structure). You CANNOT judge tone, emotion, timbre, or "is this a good voice" — say so briefly if the user seems to expect it, and don't fake it.
- Lead with what is working, then give the one or two highest-leverage things to improve. Be concrete and actionable, never vague praise or vague scolding.
- Reference the actual numbers when they justify a point (e.g. "averaging ~35 cents off suggests..."). If a measurement is missing or the notes flag low reliability, hedge accordingly instead of inventing detail.
- Warm rehearsal-buddy voice. Use short Markdown sections with a heading per requested dimension. Keep it tight.`

function toDimensions(input: unknown): Dimension[] {
  const valid: Dimension[] = ['intonation', 'timing', 'dynamics', 'arrangement']
  if (!Array.isArray(input)) return valid
  const picked = input.filter((d): d is Dimension =>
    valid.includes(d as Dimension),
  )
  return picked.length ? picked : valid
}

function buildUserPrompt(
  features: unknown,
  setlist: string,
  dimensions: Dimension[],
): string {
  const featureJson = JSON.stringify(features, null, 2)
  const focus = dimensions.map((d) => `- ${DIMENSION_GUIDES[d]}`).join('\n')
  const setlistBlock = setlist.trim()
    ? setlist.trim()
    : '(No setlist provided — infer what you can about arrangement from the section structure, and gently note that a setlist would sharpen the arrangement feedback.)'

  return `Here is the singer's medley setlist / notes:
${setlistBlock}

Here are the objective measurements from their recording:
\`\`\`json
${featureJson}
\`\`\`

Give feedback on these dimensions only:
${focus}

Write one short Markdown section per dimension above (in that order), then a brief "Next take" line with the single most useful thing to try next.`
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<AnalyzeBody>(event)

    if (!body || typeof body.features !== 'object' || body.features === null) {
      return {
        success: false,
        message: 'A feature summary is required.',
      }
    }

    const dimensions = toDimensions(body.dimensions)
    const setlist = typeof body.setlist === 'string' ? body.setlist : ''
    const server = body.server

    const config = useRuntimeConfig()
    const provider = deriveSuggestProvider(server)
    const model = resolveSuggestModel(provider, server?.model)

    const maxTokens = Math.min(
      Math.max(Math.trunc(body.maxTokens ?? 1200), 256),
      4096,
    )

    const gate = await manaGate(event, {
      kind: 'text',
      estCostUsd: estimateTextCostUsd({ model, maxTokens }),
    })

    const userPrompt = buildUserPrompt(body.features, setlist, dimensions)

    const feedback = await callSuggestProvider(SYSTEM_PROMPT, userPrompt, {
      provider,
      model,
      maxTokens,
      apiKey:
        provider === 'anthropic'
          ? str(config.anthropicApiKey)
          : str(config.openaiApiKey),
      baseUrl:
        provider === 'ollama'
          ? str(
              server?.baseUrl,
              str(config.ollamaBaseUrl, 'http://localhost:11434'),
            )
          : provider === 'openai_compatible'
            ? str(server?.baseUrl, 'http://localhost:1234')
            : undefined,
      endpointPath:
        provider === 'openai_compatible'
          ? str(server?.endpointPath, '/v1/chat/completions')
          : undefined,
    })

    if (!feedback) {
      return {
        success: false,
        message: 'The model returned an empty response.',
      }
    }

    const { balance } = await gate.commit(`music-mentor:${Date.now()}`)

    return {
      success: true,
      message: 'Feedback generated.',
      data: { feedback, dimensions },
      mana: {
        balance,
        charged: gate.cost,
        free: gate.free,
      },
    }
  } catch (error) {
    console.error('[music-mentor] analyze failed:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage:
        error instanceof Error ? error.message : 'Analysis request failed.',
    })
  }
})
