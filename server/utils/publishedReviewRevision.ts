// /server/utils/publishedReviewRevision.ts
import { createHash } from 'node:crypto'
import prisma from '@/server/utils/prisma'
import { getReviewDraftById, type ReviewDraftRecord } from './reviewDraftRepository'

export type PublishedReviewRevisionAuthor =
  | { kind: 'BOT'; id: number }
  | { kind: 'CHARACTER'; id: number }

export type RevisePublishedReviewInput = {
  draftId: number
  editedComment: string
  expectedComponentId: number
  expectedReactionId: number
  expectedAuthor: PublishedReviewRevisionAuthor
  expectedCurrentCommentHash: string
}

type LockedPublishedDraft = {
  id: number
  status: string
  componentId: number
  authorBotId: number | null
  authorCharacterId: number | null
  publisherUserId: number | null
  publishedReactionId: number | null
}

type LockedReaction = {
  id: number
  userId: number
  componentId: number
  reactionCategory: string
  comment: string | null
  authorBotId: number | null
  authorCharacterId: number | null
}

export type PublishedReviewRevisionResult = {
  draft: ReviewDraftRecord
  reactionId: number
  previousCommentHash: string
  revisedCommentHash: string
}

export function publishedReviewCommentHash(value: string | null | undefined): string {
  return createHash('sha256').update(String(value ?? '')).digest('hex')
}

function assertExpectedAuthor(
  draft: LockedPublishedDraft,
  reaction: LockedReaction,
  author: PublishedReviewRevisionAuthor,
): void {
  const expectedBotId = author.kind === 'BOT' ? author.id : null
  const expectedCharacterId = author.kind === 'CHARACTER' ? author.id : null

  if (
    draft.authorBotId !== expectedBotId ||
    draft.authorCharacterId !== expectedCharacterId ||
    reaction.authorBotId !== expectedBotId ||
    reaction.authorCharacterId !== expectedCharacterId
  ) {
    throw new Error('Published review author lock does not match the draft and Reaction.')
  }
}

export async function revisePublishedReview(
  input: RevisePublishedReviewInput,
): Promise<PublishedReviewRevisionResult> {
  const revisedComment = input.editedComment.trim()
  if (!revisedComment) throw new Error('A revised review comment is required.')

  const revision = await prisma.$transaction(async (tx) => {
    const drafts = await tx.$queryRaw<LockedPublishedDraft[]>`
      SELECT
        id,
        status,
        componentId,
        authorBotId,
        authorCharacterId,
        publisherUserId,
        publishedReactionId
      FROM ReviewDraft
      WHERE id = ${input.draftId}
      LIMIT 1
      FOR UPDATE
    `
    const draft = drafts[0]
    if (!draft) throw new Error(`Review draft ${input.draftId} not found.`)
    if (draft.status !== 'PUBLISHED') {
      throw new Error('Only a published review draft may use the revision service.')
    }
    if (!draft.publisherUserId || !draft.publishedReactionId) {
      throw new Error('Published review draft is missing publisher or Reaction linkage.')
    }
    if (
      draft.componentId !== input.expectedComponentId ||
      draft.publishedReactionId !== input.expectedReactionId
    ) {
      throw new Error('Published review Component or Reaction lock is stale.')
    }

    const reactions = await tx.$queryRaw<LockedReaction[]>`
      SELECT
        id,
        userId,
        componentId,
        reactionCategory,
        comment,
        authorBotId,
        authorCharacterId
      FROM Reaction
      WHERE id = ${draft.publishedReactionId}
      LIMIT 1
      FOR UPDATE
    `
    const reaction = reactions[0]
    if (!reaction) throw new Error('The linked published Reaction no longer exists.')
    if (
      reaction.componentId !== draft.componentId ||
      reaction.reactionCategory !== 'COMPONENT' ||
      reaction.userId !== draft.publisherUserId
    ) {
      throw new Error('Published Reaction linkage no longer matches the ReviewDraft.')
    }

    assertExpectedAuthor(draft, reaction, input.expectedAuthor)

    const previousCommentHash = publishedReviewCommentHash(reaction.comment)
    if (previousCommentHash !== input.expectedCurrentCommentHash) {
      throw new Error('Published review comment changed after the revision was prepared.')
    }

    await tx.$executeRaw`
      UPDATE ReviewDraft
      SET
        updatedAt = CURRENT_TIMESTAMP(3),
        editedComment = ${revisedComment}
      WHERE id = ${draft.id}
        AND status = 'PUBLISHED'
        AND publishedReactionId = ${reaction.id}
    `

    await tx.$executeRaw`
      UPDATE Reaction
      SET
        updatedAt = CURRENT_TIMESTAMP(3),
        comment = ${revisedComment}
      WHERE id = ${reaction.id}
        AND componentId = ${draft.componentId}
        AND userId = ${draft.publisherUserId}
    `

    return {
      reactionId: reaction.id,
      previousCommentHash,
      revisedCommentHash: publishedReviewCommentHash(revisedComment),
    }
  })

  const draft = await getReviewDraftById(input.draftId)
  if (!draft) throw new Error('Revised published review draft could not be reloaded.')

  return { draft, ...revision }
}
