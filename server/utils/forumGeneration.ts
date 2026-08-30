import type { Prisma } from '~/prisma/generated/prisma/client'
import { parseArtJobPayload } from './artJobPayload'

type JsonRecord = Record<string, unknown>

export type ForumArtGenerationContext = {
  kind: 'forum-art'
  postId: number
  threadId: number
  userId: number
  botId: number | null
  requestedAt: string
}

export type ForumArtCompletion = {
  status: 'ATTACHED' | 'SKIPPED'
  postId: number
  threadId: number
  artImageId: number
  reason?: string
}

type ForumCompletionTransaction = Pick<Prisma.TransactionClient, 'chat'>

// Same cast-at-the-boundary idiom as generatedArtCollections.ts's
// ArtCollectionDb/asArtCollectionDb: the caller's `tx` comes from
// `prisma.$transaction(async (tx) => ...)`, whose generated client-extension
// type isn't always structurally assignable to a `Pick<Prisma.TransactionClient,
// ...>` narrowing across Prisma client regenerations, even though it carries
// every property the narrowing needs at runtime. Accepting `unknown` and
// casting internally avoids that false-positive mismatch without widening
// what this function actually uses `tx` for.
function asForumCompletionTransaction(tx: unknown): ForumCompletionTransaction {
  return tx as ForumCompletionTransaction
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : {}
}

function positiveInt(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export function readForumArtGenerationContext(
  payload: unknown,
): ForumArtGenerationContext | null {
  const row = asRecord(parseArtJobPayload(payload).forumContext)
  if (row.kind !== 'forum-art') return null

  const postId = positiveInt(row.postId)
  const threadId = positiveInt(row.threadId)
  const userId = positiveInt(row.userId)
  const botId = row.botId == null ? null : positiveInt(row.botId)
  const requestedAt = typeof row.requestedAt === 'string' ? row.requestedAt : ''

  if (!postId || !threadId || !userId || !requestedAt) return null
  if (row.botId != null && !botId) return null

  return {
    kind: 'forum-art',
    postId,
    threadId,
    userId,
    botId,
    requestedAt,
  }
}

export async function attachCompletedForumArt(
  txInput: unknown,
  payload: unknown,
  artImageId: number,
  jobUserId: number,
): Promise<ForumArtCompletion | null> {
  const context = readForumArtGenerationContext(payload)
  if (!context) return null

  const tx = asForumCompletionTransaction(txInput)

  if (context.userId !== jobUserId) {
    return {
      status: 'SKIPPED',
      postId: context.postId,
      threadId: context.threadId,
      artImageId,
      reason: 'job-user-mismatch',
    }
  }

  const post = await tx.chat.findFirst({
    where: {
      id: context.postId,
      type: 'ToForum',
      isPublic: true,
      isActive: true,
      userId: jobUserId,
      ...(context.botId == null ? {} : { botId: context.botId }),
    },
    select: {
      id: true,
      originId: true,
      botId: true,
    },
  })

  if (!post || (post.originId ?? post.id) !== context.threadId) {
    return {
      status: 'SKIPPED',
      postId: context.postId,
      threadId: context.threadId,
      artImageId,
      reason: 'forum-post-unavailable',
    }
  }

  if (context.botId == null && post.botId != null) {
    return {
      status: 'SKIPPED',
      postId: context.postId,
      threadId: context.threadId,
      artImageId,
      reason: 'forum-author-mismatch',
    }
  }

  await tx.chat.update({
    where: { id: post.id },
    data: {
      ArtImage: { connect: { id: artImageId } },
    },
  })

  return {
    status: 'ATTACHED',
    postId: context.postId,
    threadId: context.threadId,
    artImageId,
  }
}
