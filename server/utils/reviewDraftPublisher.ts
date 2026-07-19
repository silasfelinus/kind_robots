// /server/utils/reviewDraftPublisher.ts
import prisma from '@/server/utils/prisma'
import {
  finalReviewDraftComment,
  type ReviewDraftStatus,
} from '@/utils/wonderlab/reviewDraft'
import { getReviewDraftById, type ReviewDraftRecord } from './reviewDraftRepository'

type LockedDraftRow = {
  id: number
  status: ReviewDraftStatus
  componentId: number
  authorBotId: number | null
  authorCharacterId: number | null
  publisherUserId: number | null
  publishedReactionId: number | null
  generatedComment: string
  editedComment: string | null
  rating: number
  reactionType: string | null
}

type IdRow = { id: number }
type ReviewDraftTransaction = Pick<typeof prisma, '$queryRaw' | '$executeRaw'>

export type PublishedReviewDraft = {
  draft: ReviewDraftRecord
  reactionId: number
  created: boolean
}

function defaultReactionType(rating: number): string {
  if (rating >= 4) return 'LOVED'
  if (rating === 3) return 'CLAPPED'
  return 'NEUTRAL'
}

async function findAuthoredReaction(
  tx: ReviewDraftTransaction,
  draft: LockedDraftRow,
): Promise<number | null> {
  if (draft.authorBotId) {
    const rows = await tx.$queryRaw<IdRow[]>`
      SELECT id
      FROM Reaction
      WHERE componentId = ${draft.componentId}
        AND reactionCategory = 'COMPONENT'
        AND authorBotId = ${draft.authorBotId}
        AND authorCharacterId IS NULL
      ORDER BY id ASC
      LIMIT 1
      FOR UPDATE
    `
    return rows[0]?.id ?? null
  }

  if (draft.authorCharacterId) {
    const rows = await tx.$queryRaw<IdRow[]>`
      SELECT id
      FROM Reaction
      WHERE componentId = ${draft.componentId}
        AND reactionCategory = 'COMPONENT'
        AND authorCharacterId = ${draft.authorCharacterId}
        AND authorBotId IS NULL
      ORDER BY id ASC
      LIMIT 1
      FOR UPDATE
    `
    return rows[0]?.id ?? null
  }

  throw new Error('Approved review draft has no first-party author.')
}

async function supersedeOtherDrafts(
  tx: ReviewDraftTransaction,
  draft: LockedDraftRow,
): Promise<void> {
  if (draft.authorBotId) {
    await tx.$executeRaw`
      UPDATE ReviewDraft
      SET status = 'SUPERSEDED', updatedAt = CURRENT_TIMESTAMP(3)
      WHERE id != ${draft.id}
        AND componentId = ${draft.componentId}
        AND authorBotId = ${draft.authorBotId}
        AND authorCharacterId IS NULL
        AND status IN ('PROPOSED', 'APPROVED', 'FAILED')
    `
    return
  }

  await tx.$executeRaw`
    UPDATE ReviewDraft
    SET status = 'SUPERSEDED', updatedAt = CURRENT_TIMESTAMP(3)
    WHERE id != ${draft.id}
      AND componentId = ${draft.componentId}
      AND authorCharacterId = ${draft.authorCharacterId}
      AND authorBotId IS NULL
      AND status IN ('PROPOSED', 'APPROVED', 'FAILED')
  `
}

export async function publishReviewDraft(
  draftId: number,
  publisherUserId: number,
): Promise<PublishedReviewDraft> {
  const publication = await prisma.$transaction(async (tx) => {
    const drafts = await tx.$queryRaw<LockedDraftRow[]>`
      SELECT
        id,
        status,
        componentId,
        authorBotId,
        authorCharacterId,
        publisherUserId,
        publishedReactionId,
        generatedComment,
        editedComment,
        rating,
        reactionType
      FROM ReviewDraft
      WHERE id = ${draftId}
      LIMIT 1
      FOR UPDATE
    `
    const draft = drafts[0]
    if (!draft) throw new Error(`Review draft ${draftId} not found.`)

    if (draft.status === 'PUBLISHED' && draft.publishedReactionId) {
      return { reactionId: draft.publishedReactionId, created: false }
    }
    if (draft.status !== 'APPROVED') {
      throw new Error('Only an approved review draft may be published.')
    }

    // Serializes all first-party publication work for the same exhibit, including
    // different draft rows for the same reviewer, so duplicate reactions cannot race.
    await tx.$queryRaw<IdRow[]>`
      SELECT id FROM Component WHERE id = ${draft.componentId} LIMIT 1 FOR UPDATE
    `

    const comment = finalReviewDraftComment(draft)
    if (!comment) throw new Error('Approved review draft has no publishable comment.')

    const reactionType = draft.reactionType || defaultReactionType(draft.rating)
    let reactionId = await findAuthoredReaction(tx, draft)
    const created = !reactionId

    if (reactionId) {
      await tx.$executeRaw`
        UPDATE Reaction
        SET
          updatedAt = CURRENT_TIMESTAMP(3),
          userId = ${publisherUserId},
          componentId = ${draft.componentId},
          reactionType = ${reactionType},
          reactionCategory = 'COMPONENT',
          rating = ${draft.rating},
          comment = ${comment},
          authorBotId = ${draft.authorBotId},
          authorCharacterId = ${draft.authorCharacterId}
        WHERE id = ${reactionId}
      `
    } else {
      await tx.$executeRaw`
        INSERT INTO Reaction (
          userId,
          componentId,
          reactionType,
          reactionCategory,
          rating,
          comment,
          authorBotId,
          authorCharacterId
        ) VALUES (
          ${publisherUserId},
          ${draft.componentId},
          ${reactionType},
          'COMPONENT',
          ${draft.rating},
          ${comment},
          ${draft.authorBotId},
          ${draft.authorCharacterId}
        )
      `
      const inserted = await tx.$queryRaw<Array<{ id: bigint | number }>>`
        SELECT LAST_INSERT_ID() AS id
      `
      reactionId = Number(inserted[0]?.id)
      if (!Number.isInteger(reactionId) || reactionId <= 0) {
        throw new Error('Published Reaction ID was not returned by the database.')
      }
    }

    await tx.$executeRaw`
      UPDATE ReviewDraft
      SET
        updatedAt = CURRENT_TIMESTAMP(3),
        status = 'PUBLISHED',
        publisherUserId = ${publisherUserId},
        publishedReactionId = ${reactionId},
        publishedAt = CURRENT_TIMESTAMP(3),
        failureReason = NULL
      WHERE id = ${draft.id}
    `

    await supersedeOtherDrafts(tx, draft)
    return { reactionId, created }
  })

  const draft = await getReviewDraftById(draftId)
  if (!draft) throw new Error('Published review draft could not be reloaded.')

  return { draft, ...publication }
}
