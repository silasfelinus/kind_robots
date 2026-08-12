// /server/utils/commentBackfillGeneration.ts
// Production backfill engine for kind_robots#1769.
// The HTTP trigger lives in a preview-only route and is deleted after the run.
// This module stays reusable: object-first casting, exact prompt builder, fresh
// generation, truthful Bot/Character authorship, bounded/idempotent writes.
import prisma from './prisma'
import {
  ReactionType,
  Reaction_reactionCategory,
  type Prisma,
} from '~/prisma/generated/prisma/client'
import { archivedVoiceRecords } from '@/utils/comments/archivedVoiceCorpus'
import {
  buildVoiceEvidenceIndex,
  selectVoiceSamples,
  speakerKey,
  type SpeakerVoiceEvidence,
} from '@/utils/comments/voiceEvidence'
import {
  rankCommentSpeakers,
  type CommentTargetProfile,
} from '@/utils/comments/commentCasting'
import {
  scoreSpeakerPool,
  type SignalSpeakerProfile,
  type SignalTargetProfile,
} from '@/utils/comments/commentSignals'
import {
  buildCommentDraftPrompt,
  type CommentExchangeShape,
  type CommentVoiceEvidence,
} from '@/utils/comments/commentDraftPrompt'
import { characterVoiceSeeds } from '@/stores/seeds/characterVoices'
import { assertSingleFirstPartyReactionAuthor } from '@/utils/reactions/firstPartyReactionAuthor'

const DEFAULT_MODEL = 'gpt-5.2'
const PUBLISHER_USER_ID = 1
const MAX_BATCH = 24
const BANNED_REVIEW_LANGUAGE =
  /\b(component|wonderlab|museum|exhibit|star rating|rating|review|implementation|usability)\b/i

type SupportedTargetType = 'REWARD' | 'FACET'

type BackfillTarget = SignalTargetProfile & {
  type: SupportedTargetType
  promptProfile: CommentTargetProfile
}

type ExistingState = {
  targetKeys: Set<string>
  castCounts: Map<string, number>
  authoredText: Map<string, string[]>
  firstPartyComments: number
}

type PlannedExchange = {
  target: BackfillTarget
  targetIndex: number
  shape: CommentExchangeShape
  speakers: SignalSpeakerProfile[]
  prompt: ReturnType<typeof buildCommentDraftPrompt>
}

type GeneratedComment = {
  authorKind: 'BOT' | 'CHARACTER'
  authorId: number
  comment: string
}

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null
      refusal?: string | null
    }
  }>
  error?: { message?: string; code?: string | null }
}

export type BackfillRunResult = {
  start: number
  limit: number
  eligibleTargets: number
  attemptedTargets: number
  skippedExisting: number
  publishedTargets: number
  publishedComments: number
  failedTargets: number
  model: string
  results: Array<{
    key: string
    title: string
    shape?: CommentExchangeShape
    speakers?: string[]
    comments?: string[]
    status: 'PUBLISHED' | 'SKIPPED_EXISTING' | 'FAILED'
    error?: string
  }>
}

const voiceIndex = buildVoiceEvidenceIndex(archivedVoiceRecords)

function targetKey(target: { type: SupportedTargetType; id: number }): string {
  return `${target.type}:${target.id}`
}

function text(value: unknown): string {
  return String(value ?? '').trim()
}

function compactParts(parts: Array<string | null | undefined>): string | null {
  const joined = parts.map(text).filter(Boolean).join(' ')
  return joined || null
}

function authorKey(kind: 'BOT' | 'CHARACTER', id: number): string {
  return speakerKey({ kind, id })
}

function normalizeWords(value: string): string[] {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function shingles(value: string, size = 8): Set<string> {
  const words = normalizeWords(value)
  const result = new Set<string>()
  for (let index = 0; index + size <= words.length; index += 1) {
    result.add(words.slice(index, index + size).join(' '))
  }
  return result
}

function sharedShingle(left: string, right: string): string | null {
  const leftSet = shingles(left)
  for (const candidate of shingles(right)) {
    if (leftSet.has(candidate)) return candidate
  }
  return null
}

async function loadSpeakers(): Promise<SignalSpeakerProfile[]> {
  const [characters, bots] = await Promise.all([
    prisma.character.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        personality: true,
        voice: true,
        sampleResponse: true,
        quirks: true,
        drive: true,
        backstory: true,
        role: true,
        title: true,
        alignment: true,
        class: true,
        species: true,
        genre: true,
        FacetLinks: { select: { facetId: true } },
      },
    }),
    prisma.bot.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        personality: true,
        sampleResponse: true,
        botIntro: true,
        narrativeVoice: true,
        tagline: true,
        subtitle: true,
        description: true,
        BotType: true,
        FacetLinks: { select: { facetId: true } },
      },
    }),
  ])

  const seedById = new Map<number, (typeof characterVoiceSeeds)[number]>(
    characterVoiceSeeds.map((seed) => [seed.id, seed]),
  )

  return [
    ...characters.map((row) => {
      const seed = seedById.get(row.id)
      return {
        kind: 'CHARACTER' as const,
        id: row.id,
        name: row.name,
        personality: row.personality,
        voice: seed?.voice || row.voice,
        sampleResponse: seed?.sampleResponse || row.sampleResponse,
        quirks: row.quirks,
        drive: row.drive,
        backstory: row.backstory,
        role: row.role,
        title: row.title,
        alignment: row.alignment,
        characterClass: row.class,
        species: row.species,
        genre: row.genre,
        facetIds: row.FacetLinks.map((link) => link.facetId),
      } satisfies SignalSpeakerProfile
    }),
    ...bots.map(
      (row) =>
        ({
          kind: 'BOT' as const,
          id: row.id,
          name: row.name,
          personality: row.personality,
          sampleResponse: row.sampleResponse,
          botIntro: row.botIntro,
          narrativeVoice: row.narrativeVoice,
          tagline: row.tagline,
          subtitle: row.subtitle,
          description: row.description,
          botType: row.BotType,
          facetIds: row.FacetLinks.map((link) => link.facetId),
        }) satisfies SignalSpeakerProfile,
    ),
  ]
}

async function loadTargets(): Promise<BackfillTarget[]> {
  const [rewards, facets] = await Promise.all([
    prisma.reward.findMany({
      where: { isPublic: true, isActive: true, allowReviews: true },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        effect: true,
        flavorText: true,
        rewardType: true,
        rarity: true,
        theme: true,
        Characters: { select: { id: true } },
        FacetLinks: { select: { facetId: true } },
      },
    }),
    prisma.facet.findMany({
      where: {
        isPublic: true,
        isActive: true,
        allowReviews: true,
        OR: [
          { description: { not: null } },
          { flavorText: { not: null } },
          { examples: { not: null } },
        ],
      },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        flavorText: true,
        examples: true,
        theme: true,
        RelationsFrom: { select: { toFacetId: true } },
        RelationsTo: { select: { fromFacetId: true } },
      },
    }),
  ])

  const rewardTargets: BackfillTarget[] = rewards.map((row) => {
    const description = compactParts([
      row.description,
      row.effect ? `Effect: ${row.effect}` : null,
    ])
    const tags = [String(row.rarity), row.theme].map(text).filter(Boolean)
    return {
      type: 'REWARD',
      id: row.id,
      title: row.name,
      description,
      flavorText: row.flavorText,
      effect: row.effect,
      category: String(row.rewardType),
      tags,
      facetIds: row.FacetLinks.map((link) => link.facetId),
      linkedCharacterIds: row.Characters.map((character) => character.id),
      promptProfile: {
        type: 'REWARD',
        id: row.id,
        title: row.name,
        description,
        flavorText: row.flavorText,
        category: String(row.rewardType),
        tags,
      },
    }
  })

  const facetTargets: BackfillTarget[] = facets
    .filter(
      (row) =>
        Boolean(text(row.description)) ||
        Boolean(text(row.flavorText)) ||
        Boolean(text(row.examples)),
    )
    .map((row) => {
      const description = compactParts([
        row.description,
        row.examples ? `Examples: ${row.examples}` : null,
      ])
      const relatedFacetIds = [
        ...row.RelationsFrom.map((relation) => relation.toFacetId),
        ...row.RelationsTo.map((relation) => relation.fromFacetId),
      ]
      return {
        type: 'FACET',
        id: row.id,
        title: row.title,
        description,
        flavorText: row.flavorText,
        category: row.theme || 'FACET',
        tags: row.theme ? [row.theme] : [],
        relatedFacetIds: [...new Set(relatedFacetIds)],
        promptProfile: {
          type: 'FACET',
          id: row.id,
          title: row.title,
          description,
          flavorText: row.flavorText,
          category: row.theme || 'FACET',
          tags: row.theme ? [row.theme] : [],
        },
      }
    })

  return [...rewardTargets, ...facetTargets]
}

async function loadExistingState(): Promise<ExistingState> {
  const rows = await prisma.reaction.findMany({
    where: {
      AND: [
        { OR: [{ rewardId: { not: null } }, { facetId: { not: null } }] },
        {
          OR: [
            { authorBotId: { not: null } },
            { authorCharacterId: { not: null } },
          ],
        },
      ],
    },
    select: {
      rewardId: true,
      facetId: true,
      authorBotId: true,
      authorCharacterId: true,
      comment: true,
    },
  })

  const targetKeys = new Set<string>()
  const castCounts = new Map<string, number>()
  const authoredText = new Map<string, string[]>()

  for (const row of rows) {
    if (row.rewardId) targetKeys.add(`REWARD:${row.rewardId}`)
    if (row.facetId) targetKeys.add(`FACET:${row.facetId}`)

    const key = row.authorBotId
      ? authorKey('BOT', row.authorBotId)
      : row.authorCharacterId
        ? authorKey('CHARACTER', row.authorCharacterId)
        : null
    if (!key) continue

    castCounts.set(key, (castCounts.get(key) || 0) + 1)
    if (row.comment?.trim()) {
      authoredText.set(key, [...(authoredText.get(key) || []), row.comment])
    }
  }

  return {
    targetKeys,
    castCounts,
    authoredText,
    firstPartyComments: rows.length,
  }
}

function chooseShape(
  target: BackfillTarget,
  targetIndex: number,
): { shape: CommentExchangeShape; speakerCount: 1 | 2 | 3 } {
  // Variation is deliberate. Most Facets stay a single strong observation;
  // Rewards are richer and more often earn an exchange. A small minority gets
  // three voices, avoiding a site full of identical synthetic threads.
  if (target.type === 'FACET') {
    if (targetIndex % 17 === 0) return { shape: 'DUET', speakerCount: 2 }
    if (targetIndex % 9 === 0) return { shape: 'DUET_REPLY', speakerCount: 2 }
    return { shape: 'SOLO', speakerCount: 1 }
  }

  if (targetIndex % 19 === 0) return { shape: 'TRIO', speakerCount: 3 }
  if (targetIndex % 7 === 0) return { shape: 'SOLO', speakerCount: 1 }
  if (targetIndex % 3 === 0) return { shape: 'DUET_REPLY', speakerCount: 2 }
  return { shape: 'DUET', speakerCount: 2 }
}

function toPromptSpeaker(
  speaker: SignalSpeakerProfile,
  evidence: SpeakerVoiceEvidence | undefined,
): CommentVoiceEvidence {
  return {
    kind: speaker.kind,
    id: speaker.id,
    name: speaker.name,
    personality: speaker.personality,
    canonicalVoice:
      speaker.voice ||
      speaker.narrativeVoice ||
      speaker.botIntro ||
      speaker.description ||
      null,
    sampleResponse: speaker.sampleResponse,
    archivedVoiceSamples: selectVoiceSamples(evidence, 4).map(
      (sample) => sample.text,
    ),
  }
}

function planExchange(
  target: BackfillTarget,
  targetIndex: number,
  speakers: SignalSpeakerProfile[],
  speakerMap: Map<string, SignalSpeakerProfile>,
  castCounts: Map<string, number>,
): PlannedExchange {
  const desired = chooseShape(target, targetIndex)
  const scored = scoreSpeakerPool(target, speakers, {
    evidence: voiceIndex,
    castCounts,
  })
  const ranked = rankCommentSpeakers(target, scored, desired.speakerCount)
  const chosen = ranked
    .map((candidate) => speakerMap.get(speakerKey(candidate)))
    .filter((candidate): candidate is SignalSpeakerProfile => Boolean(candidate))

  if (chosen.length !== desired.speakerCount) {
    throw new Error(
      `${targetKey(target)} only found ${chosen.length}/${desired.speakerCount} castable speakers.`,
    )
  }

  // Reserve novelty before any network call so concurrently generated plans do
  // not all see the same "unused" speaker pool.
  for (const speaker of chosen) {
    const key = speakerKey(speaker)
    castCounts.set(key, (castCounts.get(key) || 0) + 1)
  }

  const prompt = buildCommentDraftPrompt(
    target.promptProfile,
    chosen.map((speaker) =>
      toPromptSpeaker(speaker, voiceIndex.get(speakerKey(speaker))),
    ),
    {
      shape: desired.shape,
      maxSpeakers: desired.speakerCount === 3 ? 3 : 2,
    },
  )

  return {
    target,
    targetIndex,
    shape: desired.shape,
    speakers: chosen,
    prompt,
  }
}

function validateComments(
  plan: PlannedExchange,
  comments: GeneratedComment[],
  authoredText: Map<string, string[]>,
): void {
  if (comments.length !== plan.speakers.length) {
    throw new Error(
      `Expected ${plan.speakers.length} comments, received ${comments.length}.`,
    )
  }

  for (const [index, comment] of comments.entries()) {
    const expected = plan.speakers[index]
    if (!expected) throw new Error(`Missing planned speaker ${index + 1}.`)
    if (
      comment.authorKind !== expected.kind ||
      comment.authorId !== expected.id
    ) {
      throw new Error(
        `Author drift at slot ${index + 1}: expected ${speakerKey(expected)}, got ${comment.authorKind}:${comment.authorId}.`,
      )
    }

    const value = comment.comment.trim()
    const words = normalizeWords(value)
    if (value.length < 2 || value.length > 1200) {
      throw new Error(`${expected.name}: invalid comment length.`)
    }
    if (words.length < 4 || words.length > 120) {
      throw new Error(
        `${expected.name}: ${words.length} words is outside the 4–120 guardrail.`,
      )
    }
    if (BANNED_REVIEW_LANGUAGE.test(value)) {
      throw new Error(`${expected.name}: slipped into reviewer/museum language.`)
    }

    const key = speakerKey(expected)
    const evidence = voiceIndex.get(key)
    for (const sample of evidence?.samples || []) {
      const overlap = sharedShingle(value, sample.text)
      if (overlap) {
        throw new Error(
          `${expected.name}: reused archived phrase "${overlap}".`,
        )
      }
    }

    if (expected.sampleResponse) {
      const overlap = sharedShingle(value, expected.sampleResponse)
      if (overlap) {
        throw new Error(
          `${expected.name}: reused canonical phrase "${overlap}".`,
        )
      }
    }

    for (const prior of authoredText.get(key) || []) {
      const overlap = sharedShingle(value, prior)
      if (overlap) {
        throw new Error(
          `${expected.name}: repeated prior generated phrase "${overlap}".`,
        )
      }
    }
  }
}

async function callWriter(
  plan: PlannedExchange,
  model: string,
  retryNote?: string,
): Promise<GeneratedComment[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured.')

  const system = retryNote
    ? `${plan.prompt.system}\n\nAUTOMATED VALIDATION NOTE: ${retryNote} Write a genuinely fresh replacement while preserving the requested speakers and shape.`
    : plan.prompt.system

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: plan.prompt.user },
      ],
      max_completion_tokens: 1000,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'kind_robots_object_comments',
          strict: true,
          schema: plan.prompt.responseSchema,
        },
      },
    }),
  })

  const body = (await response.json()) as ChatCompletionResponse
  if (!response.ok) {
    throw new Error(
      `OpenAI ${response.status}: ${body.error?.message || response.statusText}`,
    )
  }

  const raw = body.choices?.[0]?.message?.content?.trim()
  if (!raw) {
    throw new Error(
      body.choices?.[0]?.message?.refusal || 'Writer returned no JSON content.',
    )
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Writer returned invalid JSON.')
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !Array.isArray((parsed as { comments?: unknown }).comments)
  ) {
    throw new Error('Writer response does not contain a comments array.')
  }

  return (parsed as { comments: GeneratedComment[] }).comments
}

async function generateValidated(
  plan: PlannedExchange,
  model: string,
  authoredText: Map<string, string[]>,
): Promise<GeneratedComment[]> {
  let validationError = ''
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const comments = await callWriter(
      plan,
      model,
      attempt === 2 ? validationError : undefined,
    )
    try {
      validateComments(plan, comments, authoredText)
      return comments
    } catch (error) {
      validationError =
        error instanceof Error ? error.message : 'Unknown validation failure.'
      if (attempt === 2) throw error
    }
  }
  throw new Error('Generation exhausted retries.')
}

async function publishExchange(
  plan: PlannedExchange,
  comments: GeneratedComment[],
  publisherUserId: number,
): Promise<number> {
  // Recheck immediately before the write. A repeated invocation or an overlap
  // between two calls becomes a skip, never a duplicate exchange.
  const where =
    plan.target.type === 'REWARD'
      ? {
          rewardId: plan.target.id,
          OR: [
            { authorBotId: { not: null } },
            { authorCharacterId: { not: null } },
          ],
        }
      : {
          facetId: plan.target.id,
          OR: [
            { authorBotId: { not: null } },
            { authorCharacterId: { not: null } },
          ],
        }

  const existing = await prisma.reaction.findFirst({
    where,
    select: { id: true },
  })
  if (existing) return 0

  const data: Prisma.ReactionCreateManyInput[] = comments.map((comment) => {
    const author = {
      authorBotId: comment.authorKind === 'BOT' ? comment.authorId : null,
      authorCharacterId:
        comment.authorKind === 'CHARACTER' ? comment.authorId : null,
    }
    assertSingleFirstPartyReactionAuthor(author)

    return {
      userId: publisherUserId,
      reactionType: ReactionType.NEUTRAL,
      reactionCategory:
        plan.target.type === 'REWARD'
          ? Reaction_reactionCategory.REWARD
          : Reaction_reactionCategory.FACET,
      rating: 0,
      comment: comment.comment.trim(),
      rewardId: plan.target.type === 'REWARD' ? plan.target.id : null,
      facetId: plan.target.type === 'FACET' ? plan.target.id : null,
      ...author,
    }
  })

  const result = await prisma.reaction.createMany({ data })
  return result.count
}

function mergeAuthoredText(
  authoredText: Map<string, string[]>,
  comments: GeneratedComment[],
): void {
  for (const comment of comments) {
    const key = authorKey(comment.authorKind, comment.authorId)
    authoredText.set(key, [
      ...(authoredText.get(key) || []),
      comment.comment.trim(),
    ])
  }
}

export async function getCommentBackfillStatus() {
  const [targets, existing, publisher] = await Promise.all([
    loadTargets(),
    loadExistingState(),
    prisma.user.findUnique({
      where: { id: PUBLISHER_USER_ID },
      select: { id: true, username: true },
    }),
  ])

  const rewardTargets = targets.filter(
    (target) => target.type === 'REWARD',
  ).length
  const facetTargets = targets.length - rewardTargets
  const completedTargets = targets.filter((target) =>
    existing.targetKeys.has(targetKey(target)),
  ).length

  return {
    eligibleTargets: targets.length,
    rewardTargets,
    enrichedFacetTargets: facetTargets,
    completedTargets,
    remainingTargets: targets.length - completedTargets,
    firstPartyComments: existing.firstPartyComments,
    voiceCorpus: {
      rawRows: archivedVoiceRecords.length,
      speakers: voiceIndex.size,
    },
    publisher: publisher
      ? { id: publisher.id, username: publisher.username || null }
      : null,
    model: process.env.COMMENT_BACKFILL_MODEL || DEFAULT_MODEL,
  }
}

export async function runCommentBackfillSlice(options: {
  start?: number
  limit?: number
}): Promise<BackfillRunResult> {
  const start = Math.max(0, Math.floor(options.start || 0))
  const limit = Math.max(
    1,
    Math.min(MAX_BATCH, Math.floor(options.limit || 8)),
  )
  const model = process.env.COMMENT_BACKFILL_MODEL || DEFAULT_MODEL

  const [targets, speakers, existing, publisher] = await Promise.all([
    loadTargets(),
    loadSpeakers(),
    loadExistingState(),
    prisma.user.findUnique({
      where: { id: PUBLISHER_USER_ID },
      select: { id: true },
    }),
  ])
  if (!publisher) {
    throw new Error(
      `Publisher accountability user #${PUBLISHER_USER_ID} does not exist.`,
    )
  }

  const speakerMap = new Map(
    speakers.map((speaker) => [speakerKey(speaker), speaker]),
  )
  const slice = targets.slice(start, start + limit)
  const plans: PlannedExchange[] = []
  const results: BackfillRunResult['results'] = []
  let skippedExisting = 0

  for (const [localIndex, target] of slice.entries()) {
    const key = targetKey(target)
    if (existing.targetKeys.has(key)) {
      skippedExisting += 1
      results.push({
        key,
        title: target.title,
        status: 'SKIPPED_EXISTING',
      })
      continue
    }

    try {
      plans.push(
        planExchange(
          target,
          start + localIndex,
          speakers,
          speakerMap,
          existing.castCounts,
        ),
      )
    } catch (error) {
      results.push({
        key,
        title: target.title,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Casting failed.',
      })
    }
  }

  // Four simultaneous model calls gives the backfill speed without turning a
  // Vercel function into a thundering herd against the writer API.
  const concurrency = 4
  let publishedTargets = 0
  let publishedComments = 0
  let failedTargets = results.filter(
    (result) => result.status === 'FAILED',
  ).length

  for (let offset = 0; offset < plans.length; offset += concurrency) {
    const group = plans.slice(offset, offset + concurrency)
    const generated = await Promise.all(
      group.map(async (plan) => {
        try {
          const comments = await generateValidated(
            plan,
            model,
            existing.authoredText,
          )
          return { plan, comments, error: null as string | null }
        } catch (error) {
          return {
            plan,
            comments: null,
            error:
              error instanceof Error ? error.message : 'Generation failed.',
          }
        }
      }),
    )

    // Persist sequentially after the parallel writer calls so our in-memory
    // freshness corpus advances deterministically in target order.
    for (const item of generated) {
      const key = targetKey(item.plan.target)
      if (!item.comments) {
        failedTargets += 1
        results.push({
          key,
          title: item.plan.target.title,
          shape: item.plan.shape,
          speakers: item.plan.speakers.map(
            (speaker) => `${speaker.kind}:${speaker.id} ${speaker.name}`,
          ),
          status: 'FAILED',
          error: item.error || 'Generation failed.',
        })
        continue
      }

      try {
        const count = await publishExchange(
          item.plan,
          item.comments,
          publisher.id,
        )
        if (count === 0) {
          skippedExisting += 1
          results.push({
            key,
            title: item.plan.target.title,
            shape: item.plan.shape,
            speakers: item.plan.speakers.map(
              (speaker) => `${speaker.kind}:${speaker.id} ${speaker.name}`,
            ),
            status: 'SKIPPED_EXISTING',
          })
          continue
        }

        mergeAuthoredText(existing.authoredText, item.comments)
        existing.targetKeys.add(key)
        publishedTargets += 1
        publishedComments += count
        results.push({
          key,
          title: item.plan.target.title,
          shape: item.plan.shape,
          speakers: item.plan.speakers.map(
            (speaker) => `${speaker.kind}:${speaker.id} ${speaker.name}`,
          ),
          comments: item.comments.map((comment) => comment.comment.trim()),
          status: 'PUBLISHED',
        })
      } catch (error) {
        failedTargets += 1
        results.push({
          key,
          title: item.plan.target.title,
          shape: item.plan.shape,
          speakers: item.plan.speakers.map(
            (speaker) => `${speaker.kind}:${speaker.id} ${speaker.name}`,
          ),
          comments: item.comments.map((comment) => comment.comment.trim()),
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Publish failed.',
        })
      }
    }
  }

  return {
    start,
    limit,
    eligibleTargets: targets.length,
    attemptedTargets: slice.length,
    skippedExisting,
    publishedTargets,
    publishedComments,
    failedTargets,
    model,
    results: results.sort((left, right) => {
      const leftIndex = slice.findIndex(
        (target) => targetKey(target) === left.key,
      )
      const rightIndex = slice.findIndex(
        (target) => targetKey(target) === right.key,
      )
      return leftIndex - rightIndex
    }),
  }
}
