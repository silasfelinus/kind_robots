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
  mode?: 'attach' | 'contribute'
  actorDisplayName?: string
  actorBotName?: string | null
  actorShadowRestricted?: boolean
}

export type ForumArtCompletion = {
  status: 'ATTACHED' | 'CONTRIBUTION' | 'SKIPPED'
  postId: number
  threadId: number
  artImageId: number
  contributionPostId?: number
  reason?: string
}

type ForumCompletionTransaction = Pick<Prisma.TransactionClient, 'chat'>

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
  const mode =
    row.mode === 'contribute'
      ? 'contribute'
      : row.mode === 'attach'
        ? 'attach'
        : undefined
  const actorDisplayName =
    typeof row.actorDisplayName === 'string'
      ? row.actorDisplayName.trim()
      : undefined
  const actorBotName =
    row.actorBotName == null
      ? null
      : typeof row.actorBotName === 'string'
        ? row.actorBotName.trim()
        : undefined
  const actorShadowRestricted =
    typeof row.actorShadowRestricted === 'boolean'
      ? row.actorShadowRestricted
      : undefined

  if (!postId || !threadId || !userId || !requestedAt) return null
  if (row.botId != null && !botId) return null
  if (row.actorBotName != null && typeof actorBotName === 'undefined')
    return null

  return {
    kind: 'forum-art',
    postId,
    threadId,
    userId,
    botId,
    requestedAt,
    mode,
    actorDisplayName,
    actorBotName,
    actorShadowRestricted,
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

  // New contribution-mode jobs may build on any public source contribution.
  // Legacy/attach jobs retain the stricter original-owner lookup so queued
  // jobs from older deployments remain safe and behavior-compatible.
  const contributionMode = context.mode === 'contribute'
  const post = await tx.chat.findFirst({
    where: {
      id: context.postId,
      type: 'ToForum',
      isPublic: true,
      isActive: true,
      ...(contributionMode ? {} : { userId: jobUserId }),
      ...(!contributionMode && context.botId != null
        ? { botId: context.botId }
        : {}),
    },
    select: {
      id: true,
      originId: true,
      botId: true,
      channel: true,
      isMature: true,
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

  if (!contributionMode) {
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

  if (!context.actorDisplayName) {
    return {
      status: 'SKIPPED',
      postId: context.postId,
      threadId: context.threadId,
      artImageId,
      reason: 'missing-contributor-identity',
    }
  }

  const contribution = await tx.chat.create({
    data: {
      type: 'ToForum',
      sender: context.actorDisplayName,
      content: `Built on forum contribution #${post.id}. This generated Kind Robots ArtImage is a new reusable contribution; the source remains intact so the provenance chain can continue.`,
      title: null,
      channel: post.channel,
      isPublic: context.actorShadowRestricted !== true,
      isActive: true,
      isMature: post.isMature,
      originId: context.threadId,
      // Keep generated contributions shallow even when the source itself is a
      // deeply nested reply. The source id in content is the provenance pointer;
      // the thread root is the structural parent so automation cannot bypass the
      // forum's nesting cap.
      previousEntryId: context.threadId,
      User: { connect: { id: jobUserId } },
      Bot: context.botId ? { connect: { id: context.botId } } : undefined,
      botName: context.actorBotName ?? null,
      ArtImage: { connect: { id: artImageId } },
    },
    select: { id: true },
  })

  return {
    status: 'CONTRIBUTION',
    postId: context.postId,
    threadId: context.threadId,
    artImageId,
    contributionPostId: contribution.id,
  }
}
