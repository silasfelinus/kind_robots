// /server/utils/wonderLabReviewDraftGenerator.ts
import { createHash } from 'node:crypto'
import prisma from '@/server/utils/prisma'
import {
  createReviewDraft,
  listReviewDrafts,
  updateReviewDraft,
  type ReviewDraftRecord,
} from '@/server/utils/reviewDraftRepository'
import {
  buildWonderLabReviewDraftPrompt,
  type WonderLabNarratorThreadExcerpt,
} from '@/utils/wonderlab/reviewDraftPrompt'
import {
  rankWonderLabReviewers,
  type WonderLabExhibitProfile,
  type WonderLabReviewerCandidate,
} from '@/utils/wonderlab/reviewerAffinity'
import type { ReviewDraftAuthorRef } from '@/utils/wonderlab/reviewDraft'

const PROMPT_VERSION = 'wonderlab-personality-review-v1'
const MINIMUM_CONFIDENCE = 0.45
const MINIMUM_COMMENT_WORDS = 20
const MAXIMUM_COMMENT_WORDS = 160
const REVIEW_GENERATION_TIMEOUT_MS = 30_000

export type GenerateWonderLabReviewDraftInput = {
  componentId: number
  author: ReviewDraftAuthorRef
  actorUserId: number
  model?: string | null
  regenerate?: boolean
}

export type GeneratedWonderLabReviewDraft = {
  draft: ReviewDraftRecord
  generated: boolean
  reused: boolean
  confidence: number | null
  observations: string[]
}

type GeneratedPayload = {
  comment: string
  rating: number
  confidence: number
  observations: string[]
}

type NarratorThreadRecord = {
  title: string | null
  openingText: string | null
  guidance: string | null
  starterPrompts: unknown
  Topic: { slug: string; title: string | null } | null
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }
  if (typeof value !== 'string' || !value.trim()) return []
  try {
    return stringArray(JSON.parse(value))
  } catch {
    return value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean)
  }
}

function tags(value: unknown): string[] {
  return stringArray(value).slice(0, 24)
}

async function loadExhibit(componentId: number): Promise<WonderLabExhibitProfile> {
  const component = await prisma.component.findUnique({
    where: { id: componentId },
    select: {
      id: true,
      componentName: true,
      folderName: true,
      sourcePath: true,
      title: true,
      description: true,
      notes: true,
      category: true,
      tags: true,
    },
  })

  if (!component) throw new Error(`Component ${componentId} not found.`)

  return {
    id: component.id,
    componentName: component.componentName,
    folderName: component.folderName,
    sourcePath: component.sourcePath,
    title: component.title,
    description: component.description,
    notes: component.notes,
    category: component.category,
    tags: tags(component.tags),
  }
}

async function loadReviewer(
  author: ReviewDraftAuthorRef,
): Promise<WonderLabReviewerCandidate> {
  if (author.kind === 'BOT') {
    const bot = await prisma.bot.findFirst({
      where: { id: author.id, isActive: true, isPublic: true },
      select: {
        id: true,
        name: true,
        slug: true,
        subtitle: true,
        description: true,
        personality: true,
        narrativeVoice: true,
        sampleResponse: true,
        prompt: true,
        modules: true,
        isActive: true,
        isPublic: true,
        isMature: true,
      },
    })
    if (!bot) throw new Error(`Eligible Bot ${author.id} not found.`)

    return {
      id: bot.id,
      kind: 'BOT',
      name: bot.name,
      slug: bot.slug,
      subtitle: bot.subtitle,
      description: bot.description,
      personality: bot.personality,
      voice: bot.narrativeVoice,
      sampleResponse: bot.sampleResponse,
      prompt: bot.prompt,
      modules: bot.modules,
      isActive: bot.isActive,
      isPublic: bot.isPublic,
      isMature: bot.isMature,
    }
  }

  const character = await prisma.character.findFirst({
    where: { id: author.id, isActive: true, isPublic: true },
    select: {
      id: true,
      name: true,
      slug: true,
      title: true,
      backstory: true,
      personality: true,
      voice: true,
      sampleResponse: true,
      drive: true,
      quirks: true,
      genre: true,
      isActive: true,
      isPublic: true,
      isMature: true,
    },
  })
  if (!character) throw new Error(`Eligible Character ${author.id} not found.`)

  return {
    id: character.id,
    kind: 'CHARACTER',
    name: character.name,
    slug: character.slug,
    subtitle: character.title,
    description: character.backstory,
    personality: character.personality,
    voice: character.voice,
    sampleResponse: character.sampleResponse,
    prompt: [character.drive, character.quirks].filter(Boolean).join('\n'),
    modules: character.genre,
    isActive: character.isActive,
    isPublic: character.isPublic,
    isMature: character.isMature,
  }
}

async function loadNarratorThreads(
  author: ReviewDraftAuthorRef,
): Promise<WonderLabNarratorThreadExcerpt[]> {
  if (author.kind !== 'BOT') return []

  const threads = (await prisma.narratorThread.findMany({
    where: { botId: author.id, isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    take: 8,
    select: {
      title: true,
      openingText: true,
      guidance: true,
      starterPrompts: true,
      Topic: { select: { slug: true, title: true } },
    },
  })) as NarratorThreadRecord[]

  return threads.map((thread) => ({
    topicKey: thread.Topic?.slug || thread.title || 'general',
    title: thread.Topic?.title || thread.title,
    openingText: thread.openingText,
    guidance: thread.guidance,
    starterPrompts: stringArray(thread.starterPrompts),
  }))
}

async function latestDraft(
  componentId: number,
  author: ReviewDraftAuthorRef,
): Promise<ReviewDraftRecord | null> {
  const drafts = await listReviewDrafts({
    componentId,
    authorBotId: author.kind === 'BOT' ? author.id : null,
    authorCharacterId: author.kind === 'CHARACTER' ? author.id : null,
    limit: 1,
  })
  return drafts[0] ?? null
}

async function nextGenerationAttempt(
  componentId: number,
  author: ReviewDraftAuthorRef,
): Promise<number> {
  const authorBotId = author.kind === 'BOT' ? author.id : null
  const authorCharacterId = author.kind === 'CHARACTER' ? author.id : null
  const rows = await prisma.$queryRaw<Array<{ attempt: bigint | number | null }>>`
    SELECT COALESCE(MAX(generationAttempt), 0) AS attempt
    FROM ReviewDraft
    WHERE componentId = ${componentId}
      AND (${authorBotId} IS NULL OR authorBotId = ${authorBotId})
      AND (${authorCharacterId} IS NULL OR authorCharacterId = ${authorCharacterId})
  `
  return Number(rows[0]?.attempt ?? 0) + 1
}

function normalizeModel(value?: string | null): string {
  const model = value?.trim() || 'gpt-4o-mini'
  if (!/^[a-zA-Z0-9._:-]{1,100}$/.test(model)) {
    throw new Error('Invalid text generation model name.')
  }
  return model
}

function validateGeneratedPayload(value: unknown): GeneratedPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('The generation provider returned a non-object response.')
  }
  const payload = value as Record<string, unknown>
  const comment = typeof payload.comment === 'string' ? payload.comment.trim() : ''
  const rating = Number(payload.rating)
  const confidence = Number(payload.confidence)
  const observations = Array.isArray(payload.observations)
    ? payload.observations
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 3)
    : []
  const wordCount = comment.split(/\s+/).filter(Boolean).length

  if (wordCount < MINIMUM_COMMENT_WORDS || wordCount > MAXIMUM_COMMENT_WORDS) {
    throw new Error(
      `Generated review must contain ${MINIMUM_COMMENT_WORDS}-${MAXIMUM_COMMENT_WORDS} words.`,
    )
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('Generated review rating must be an integer from 1 to 5.')
  }
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new Error('Generated review confidence must be between 0 and 1.')
  }
  if (!observations.length) {
    throw new Error('Generated review must include at least one grounded observation.')
  }

  return { comment, rating, confidence, observations }
}

async function requestOpenAiReview(input: {
  model: string
  system: string
  user: string
  responseSchema: Record<string, unknown>
}): Promise<GeneratedPayload> {
  const config = useRuntimeConfig()
  const apiKey = String(config.openaiApiKey || process.env.OPENAI_API_KEY || '').trim()
  if (!apiKey) throw new Error('No OpenAI API key is configured for review generation.')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REVIEW_GENERATION_TIMEOUT_MS)
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: input.model,
        messages: [
          { role: 'system', content: input.system },
          { role: 'user', content: input.user },
        ],
        temperature: 0.65,
        max_tokens: 500,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'wonderlab_review_draft',
            strict: true,
            schema: input.responseSchema,
          },
        },
      }),
    })

    const body = (await response.json().catch(() => null)) as
      | { choices?: Array<{ message?: { content?: string | null } }>; error?: { message?: string } }
      | null
    if (!response.ok) {
      throw new Error(body?.error?.message || `OpenAI review generation failed (${response.status}).`)
    }

    const content = body?.choices?.[0]?.message?.content?.trim()
    if (!content) throw new Error('OpenAI returned an empty review draft.')

    try {
      return validateGeneratedPayload(JSON.parse(content))
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('OpenAI returned invalid JSON for the review draft.')
      }
      throw error
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('OpenAI review generation timed out before the serverless deadline.')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

function reactionTypeForRating(rating: number): string {
  if (rating >= 4) return 'LOVED'
  if (rating === 3) return 'CLAPPED'
  if (rating === 2) return 'NEUTRAL'
  return 'BOOED'
}

export async function generateWonderLabReviewDraft(
  input: GenerateWonderLabReviewDraftInput,
): Promise<GeneratedWonderLabReviewDraft> {
  const existing = await latestDraft(input.componentId, input.author)
  if (existing && !input.regenerate) {
    return {
      draft: existing,
      generated: false,
      reused: true,
      confidence: null,
      observations: [],
    }
  }

  const [exhibit, reviewer, threads, attempt] = await Promise.all([
    loadExhibit(input.componentId),
    loadReviewer(input.author),
    loadNarratorThreads(input.author),
    nextGenerationAttempt(input.componentId, input.author),
  ])

  const affinity = rankWonderLabReviewers(exhibit, [reviewer], {
    limit: 1,
    minimumScore: -100,
    includeMature: false,
  })[0]
  if (!affinity?.voiceReady) {
    throw new Error(`${reviewer.name} does not have enough canonical voice data.`)
  }

  const prompt = buildWonderLabReviewDraftPrompt(reviewer, exhibit, {
    affinityReasons: affinity.reasons,
    narratorThreads: threads,
  })
  const model = normalizeModel(input.model)
  const promptHash = createHash('sha256')
    .update(JSON.stringify({ prompt, model, attempt }))
    .digest('hex')

  let generated: GeneratedPayload
  try {
    generated = await requestOpenAiReview({
      model,
      system: prompt.system,
      user: prompt.user,
      responseSchema: prompt.responseSchema,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Review generation failed.'
    const existingFailed = await latestDraft(input.componentId, input.author)
    if (existingFailed && existingFailed.status === 'FAILED' && !input.regenerate) {
      return {
        draft: existingFailed,
        generated: false,
        reused: true,
        confidence: null,
        observations: [],
      }
    }
    throw new Error(message)
  }

  const result = await createReviewDraft({
    componentId: input.componentId,
    author: input.author,
    promptVersion: PROMPT_VERSION,
    promptHash,
    promptPayload: {
      prompt,
      affinityScore: affinity.score,
      affinityReasons: affinity.reasons,
      reviewerKey: affinity.reviewerKey,
      narratorThreadCount: threads.length,
      observations: generated.observations,
      confidence: generated.confidence,
    },
    generatedComment: generated.comment,
    rating: generated.rating,
    reactionType: reactionTypeForRating(generated.rating),
    generationModel: model,
    generationProvider: 'openai',
    generationAttempt: attempt,
  })

  if (generated.confidence < MINIMUM_CONFIDENCE) {
    const failed = await updateReviewDraft({
      id: result.draft.id,
      actorUserId: input.actorUserId,
      status: 'FAILED',
      failureReason: `Generation confidence ${generated.confidence.toFixed(2)} was below ${MINIMUM_CONFIDENCE.toFixed(2)}.`,
    })
    return {
      draft: failed,
      generated: result.created,
      reused: !result.created,
      confidence: generated.confidence,
      observations: generated.observations,
    }
  }

  return {
    draft: result.draft,
    generated: result.created,
    reused: !result.created,
    confidence: generated.confidence,
    observations: generated.observations,
  }
}
