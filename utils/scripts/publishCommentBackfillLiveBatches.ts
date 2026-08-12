// /utils/scripts/publishCommentBackfillLiveBatches.ts
// One-shot production publisher for kind_robots#1769.
// The payload carries the exact speaker identities GPT-5.6 authored for. This
// job validates the whole corpus against current production state before it
// writes anything, then inserts each target exchange atomically and idempotently.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import prisma from '@/server/utils/prisma'
import {
  ReactionType,
  Reaction_reactionCategory,
  type Prisma,
} from '@/prisma/generated/prisma/client'
import { archivedVoiceRecords } from '@/utils/comments/archivedVoiceCorpus'
import {
  buildVoiceEvidenceIndex,
  speakerKey,
} from '@/utils/comments/voiceEvidence'
import { characterVoiceSeeds } from '@/stores/seeds/characterVoices'
import { assertSingleFirstPartyReactionAuthor } from '@/utils/reactions/firstPartyReactionAuthor'

const ISSUE_NUMBER = 1769
const PUBLISHER_USER_ID = 1
const EXPECTED_AUTHORING_MODEL = 'GPT-5.6 Sol'
const BANNED_REVIEW_LANGUAGE =
  /\b(component|wonderlab|museum|exhibit|star rating|rating|review|implementation|usability)\b/i

type TargetType = 'REWARD' | 'FACET'
type AuthorKind = 'BOT' | 'CHARACTER'
type Shape = 'SOLO' | 'DUET' | 'DUET_REPLY' | 'TRIO'

type PayloadSpeaker = {
  kind: AuthorKind
  id: number
  name: string
  comment: string
}

type PayloadItem = {
  key: string
  shape: Shape
  speakers: PayloadSpeaker[]
}

type BatchFile = {
  version: number
  issueNumber: number
  authoringModel: string
  createdFor: string
  targetCount: number
  batches: Array<{
    start: number
    items: PayloadItem[]
  }>
}

type EligibleTarget = {
  key: string
  type: TargetType
  id: number
  title: string
}

const file = join(process.cwd(), 'config', 'comment-backfill-live-batches.json')
const batchFile = JSON.parse(readFileSync(file, 'utf8')) as BatchFile
const voiceIndex = buildVoiceEvidenceIndex(archivedVoiceRecords)
const seedById = new Map<number, (typeof characterVoiceSeeds)[number]>(
  characterVoiceSeeds.map((seed) => [seed.id, seed]),
)

function text(value: unknown): string {
  return String(value ?? '').trim()
}

function authorKey(kind: AuthorKind, id: number): string {
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

function expectedSpeakerCount(shape: Shape): number {
  if (shape === 'SOLO') return 1
  if (shape === 'TRIO') return 3
  return 2
}

async function loadEligibleTargets(): Promise<EligibleTarget[]> {
  const [rewards, facets] = await Promise.all([
    prisma.reward.findMany({
      where: { isPublic: true, isActive: true, allowReviews: true },
      orderBy: { id: 'asc' },
      select: { id: true, name: true },
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
      },
    }),
  ])

  const rewardTargets: EligibleTarget[] = rewards.map((row) => ({
    key: `REWARD:${row.id}`,
    type: 'REWARD',
    id: row.id,
    title: row.name,
  }))
  const facetTargets: EligibleTarget[] = facets
    .filter(
      (row) =>
        Boolean(text(row.description)) ||
        Boolean(text(row.flavorText)) ||
        Boolean(text(row.examples)),
    )
    .map((row) => ({
      key: `FACET:${row.id}`,
      type: 'FACET',
      id: row.id,
      title: row.title,
    }))

  return [...rewardTargets, ...facetTargets]
}

async function loadAuthorDirectory() {
  const [characters, bots] = await Promise.all([
    prisma.character.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        sampleResponse: true,
      },
    }),
    prisma.bot.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        sampleResponse: true,
      },
    }),
  ])

  return new Map(
    [
      ...characters.map((row) => ({
        key: authorKey('CHARACTER', row.id),
        kind: 'CHARACTER' as const,
        id: row.id,
        name: row.name,
        sampleResponse:
          seedById.get(row.id)?.sampleResponse || row.sampleResponse || null,
      })),
      ...bots.map((row) => ({
        key: authorKey('BOT', row.id),
        kind: 'BOT' as const,
        id: row.id,
        name: row.name,
        sampleResponse: row.sampleResponse || null,
      })),
    ].map((row) => [row.key, row]),
  )
}

function flattenPayload(): Array<PayloadItem & { index: number }> {
  const flattened: Array<PayloadItem & { index: number }> = []
  for (const batch of batchFile.batches) {
    for (const [localIndex, item] of batch.items.entries()) {
      flattened.push({ ...item, index: batch.start + localIndex })
    }
  }
  return flattened.sort((left, right) => left.index - right.index)
}

async function loadExistingFirstPartyState() {
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
  const authoredText = new Map<string, string[]>()
  for (const row of rows) {
    if (row.rewardId) targetKeys.add(`REWARD:${row.rewardId}`)
    if (row.facetId) targetKeys.add(`FACET:${row.facetId}`)
    const key = row.authorBotId
      ? authorKey('BOT', row.authorBotId)
      : row.authorCharacterId
        ? authorKey('CHARACTER', row.authorCharacterId)
        : null
    if (key && row.comment?.trim()) {
      authoredText.set(key, [...(authoredText.get(key) || []), row.comment])
    }
  }
  return { targetKeys, authoredText, rows: rows.length }
}

function validateCommentFreshness(
  speaker: PayloadSpeaker,
  canonicalSample: string | null,
  authoredText: Map<string, string[]>,
  compareAgainstExistingGenerated = true,
): void {
  const value = speaker.comment.trim()
  const words = normalizeWords(value)
  if (value.length < 2 || value.length > 1200) {
    throw new Error(`${speaker.name}: invalid comment length.`)
  }
  if (words.length < 4 || words.length > 120) {
    throw new Error(
      `${speaker.name}: ${words.length} words is outside the 4–120 guardrail.`,
    )
  }
  if (BANNED_REVIEW_LANGUAGE.test(value)) {
    throw new Error(`${speaker.name}: slipped into reviewer/museum language.`)
  }

  const key = authorKey(speaker.kind, speaker.id)
  const evidence = voiceIndex.get(key)
  for (const sample of evidence?.samples || []) {
    const overlap = sharedShingle(value, sample.text)
    if (overlap) {
      throw new Error(`${speaker.name}: reused archived phrase "${overlap}".`)
    }
  }
  if (canonicalSample) {
    const overlap = sharedShingle(value, canonicalSample)
    if (overlap) {
      throw new Error(`${speaker.name}: reused canonical phrase "${overlap}".`)
    }
  }
  if (compareAgainstExistingGenerated) {
    for (const prior of authoredText.get(key) || []) {
      const overlap = sharedShingle(value, prior)
      if (overlap) {
        throw new Error(`${speaker.name}: repeated generated phrase "${overlap}".`)
      }
    }
    authoredText.set(key, [...(authoredText.get(key) || []), value])
  }
}

async function main() {
  if (batchFile.version !== 1 || batchFile.issueNumber !== ISSUE_NUMBER) {
    throw new Error('Unexpected live comment backfill payload metadata.')
  }
  if (batchFile.authoringModel !== EXPECTED_AUTHORING_MODEL) {
    throw new Error(`Unexpected authoring model: ${batchFile.authoringModel}`)
  }
  if (!batchFile.batches.length) {
    throw new Error('Live comment backfill payload has no batches.')
  }

  const [eligibleTargets, authors, existing, publisher] = await Promise.all([
    loadEligibleTargets(),
    loadAuthorDirectory(),
    loadExistingFirstPartyState(),
    prisma.user.findUnique({
      where: { id: PUBLISHER_USER_ID },
      select: { id: true, username: true },
    }),
  ])
  if (!publisher) {
    throw new Error(`Publisher user #${PUBLISHER_USER_ID} does not exist.`)
  }

  const payload = flattenPayload()
  if (batchFile.targetCount !== eligibleTargets.length) {
    throw new Error(
      `Payload expected ${batchFile.targetCount} targets; production currently has ${eligibleTargets.length}.`,
    )
  }
  if (payload.length !== eligibleTargets.length) {
    throw new Error(
      `Payload contains ${payload.length} targets; expected ${eligibleTargets.length}.`,
    )
  }

  const seenTargets = new Set<string>()
  const validationText = new Map(existing.authoredText)
  for (const [index, target] of eligibleTargets.entries()) {
    const item = payload[index]
    if (!item || item.index !== index || item.key !== target.key) {
      throw new Error(
        `Payload order drift at ${index}: expected ${target.key}, got ${item?.key || 'missing'}.`,
      )
    }
    if (seenTargets.has(item.key)) {
      throw new Error(`Duplicate payload target ${item.key}.`)
    }
    seenTargets.add(item.key)
    if (item.speakers.length !== expectedSpeakerCount(item.shape)) {
      throw new Error(
        `${item.key}: ${item.shape} requires ${expectedSpeakerCount(item.shape)} speakers, got ${item.speakers.length}.`,
      )
    }

    for (const speaker of item.speakers) {
      const key = authorKey(speaker.kind, speaker.id)
      const directory = authors.get(key)
      if (!directory) throw new Error(`${item.key}: missing active author ${key}.`)
      if (directory.name !== speaker.name) {
        throw new Error(
          `${item.key}: author name drift for ${key}: expected ${directory.name}, got ${speaker.name}.`,
        )
      }
      validateCommentFreshness(
        speaker,
        directory.sampleResponse,
        validationText,
        !existing.targetKeys.has(item.key),
      )
    }
  }

  console.log(
    'COMMENT_BACKFILL_VALIDATED',
    JSON.stringify({
      targetCount: eligibleTargets.length,
      existingFirstPartyComments: existing.rows,
      publisher,
      voiceArchiveRows: archivedVoiceRecords.length,
      voiceSpeakers: voiceIndex.size,
    }),
  )

  let publishedTargets = 0
  let publishedComments = 0
  let skippedTargets = 0

  for (const [index, target] of eligibleTargets.entries()) {
    const item = payload[index]!
    if (existing.targetKeys.has(target.key)) {
      skippedTargets += 1
      continue
    }

    const data: Prisma.ReactionCreateManyInput[] = item.speakers.map((speaker) => {
      const author = {
        authorBotId: speaker.kind === 'BOT' ? speaker.id : null,
        authorCharacterId: speaker.kind === 'CHARACTER' ? speaker.id : null,
      }
      assertSingleFirstPartyReactionAuthor(author)
      return {
        userId: publisher.id,
        reactionType: ReactionType.NEUTRAL,
        reactionCategory:
          target.type === 'REWARD'
            ? Reaction_reactionCategory.REWARD
            : Reaction_reactionCategory.FACET,
        rating: 0,
        comment: speaker.comment.trim(),
        rewardId: target.type === 'REWARD' ? target.id : null,
        facetId: target.type === 'FACET' ? target.id : null,
        ...author,
      }
    })

    // createMany is a single DB statement: no half-duets or half-trios.
    const result = await prisma.reaction.createMany({ data })
    if (result.count !== data.length) {
      throw new Error(
        `${target.key}: inserted ${result.count}/${data.length} comments; stopping.`,
      )
    }
    existing.targetKeys.add(target.key)
    publishedTargets += 1
    publishedComments += result.count

    if (publishedTargets % 25 === 0) {
      console.log(
        'COMMENT_BACKFILL_PROGRESS',
        JSON.stringify({ publishedTargets, publishedComments, target: target.key }),
      )
    }
  }

  const remaining = eligibleTargets.filter(
    (target) => !existing.targetKeys.has(target.key),
  )
  if (remaining.length) {
    throw new Error(
      `Backfill ended with ${remaining.length} eligible target(s) empty: ${remaining
        .slice(0, 10)
        .map((target) => target.key)
        .join(', ')}.`,
    )
  }

  console.log(
    'COMMENT_BACKFILL_COMPLETE',
    JSON.stringify({
      eligibleTargets: eligibleTargets.length,
      publishedTargets,
      publishedComments,
      skippedTargets,
    }),
  )
}

await main()