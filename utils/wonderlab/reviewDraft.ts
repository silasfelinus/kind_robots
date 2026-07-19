// /utils/wonderlab/reviewDraft.ts
import { createHash } from 'node:crypto'

export const reviewDraftStatuses = [
  'PROPOSED',
  'APPROVED',
  'REJECTED',
  'PUBLISHED',
  'FAILED',
  'SUPERSEDED',
] as const

export type ReviewDraftStatus = (typeof reviewDraftStatuses)[number]
export type ReviewDraftAuthorKind = 'BOT' | 'CHARACTER'

export type ReviewDraftAuthorRef =
  | { kind: 'BOT'; id: number }
  | { kind: 'CHARACTER'; id: number }

export type ReviewDraftPublicAuthor = ReviewDraftAuthorRef & {
  name: string
  avatarImage: string | null
  role: string
}

const transitionMap: Record<ReviewDraftStatus, ReadonlySet<ReviewDraftStatus>> = {
  PROPOSED: new Set(['PROPOSED', 'APPROVED', 'REJECTED', 'FAILED', 'SUPERSEDED']),
  APPROVED: new Set(['APPROVED', 'PROPOSED', 'REJECTED', 'SUPERSEDED']),
  REJECTED: new Set(['REJECTED', 'PROPOSED', 'SUPERSEDED']),
  FAILED: new Set(['FAILED', 'PROPOSED', 'SUPERSEDED']),
  PUBLISHED: new Set(['PUBLISHED']),
  SUPERSEDED: new Set(['SUPERSEDED']),
}

export function normalizeReviewDraftStatus(value: unknown): ReviewDraftStatus | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toUpperCase() as ReviewDraftStatus
  return reviewDraftStatuses.includes(normalized) ? normalized : null
}

export function positiveReviewDraftId(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export function normalizeReviewDraftRating(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.min(5, Math.round(parsed)))
}

export function normalizeReviewDraftText(
  value: unknown,
  options: { required?: boolean; maxLength?: number } = {},
): string | null {
  if (value === null || value === undefined) {
    if (options.required) throw new Error('Text value is required.')
    return null
  }

  if (typeof value !== 'string') throw new Error('Text value must be a string.')
  const text = value.trim()
  if (!text && options.required) throw new Error('Text value is required.')
  if (!text) return null

  const maxLength = options.maxLength ?? 20_000
  if (text.length > maxLength) {
    throw new Error(`Text value must be ${maxLength} characters or fewer.`)
  }

  return text
}

export function reviewDraftAuthor(
  authorBotId: unknown,
  authorCharacterId: unknown,
): ReviewDraftAuthorRef {
  const botId = positiveReviewDraftId(authorBotId)
  const characterId = positiveReviewDraftId(authorCharacterId)

  if (Boolean(botId) === Boolean(characterId)) {
    throw new Error('Exactly one Bot or Character author is required.')
  }

  return botId
    ? { kind: 'BOT', id: botId }
    : { kind: 'CHARACTER', id: characterId as number }
}

export function canTransitionReviewDraft(
  from: ReviewDraftStatus,
  to: ReviewDraftStatus,
): boolean {
  return transitionMap[from].has(to)
}

export function assertReviewDraftTransition(
  from: ReviewDraftStatus,
  to: ReviewDraftStatus,
): void {
  if (!canTransitionReviewDraft(from, to)) {
    throw new Error(`Review draft cannot transition from ${from} to ${to}.`)
  }
}

export function buildReviewDraftKey(input: {
  componentId: number
  author: ReviewDraftAuthorRef
  promptVersion: string
  promptHash: string
}): string {
  const canonical = [
    'wonderlab-review-draft-v1',
    input.componentId,
    input.author.kind,
    input.author.id,
    input.promptVersion.trim(),
    input.promptHash.trim(),
  ].join(':')

  return `wonderlab-review-draft:${createHash('sha256').update(canonical).digest('hex')}`
}

export function finalReviewDraftComment(input: {
  generatedComment: string
  editedComment?: string | null
}): string {
  return input.editedComment?.trim() || input.generatedComment.trim()
}
