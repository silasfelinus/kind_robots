import { createError, getHeader, type H3Event } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import {
  buildForumReadFilter,
  canManageForumPost,
  findForumChannel,
  forumParentBelongsToThread,
  parseForumChannelRegistryJson,
  type ForumChannel,
  type ForumOrder,
} from '~/utils/forumApiContract'
import {
  authHasScope,
  getOptionalApiUser,
  requireScopedApiUser,
  type AuthGuardResult,
} from './authGuard'
import { effectiveShowMature, isMaturityRestricted } from './contentAccess'
import prisma from './prisma'

export const forumPostSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  type: true,
  sender: true,
  content: true,
  title: true,
  isPublic: true,
  previousEntryId: true,
  originId: true,
  userId: true,
  botId: true,
  botName: true,
  channel: true,
  isMature: true,
  isActive: true,
  User: {
    select: {
      id: true,
      username: true,
      avatarImage: true,
    },
  },
  Bot: {
    select: {
      id: true,
      name: true,
      slug: true,
      avatarImage: true,
    },
  },
} satisfies Prisma.ChatSelect

export type ForumPostRecord = Prisma.ChatGetPayload<{
  select: typeof forumPostSelect
}>

export type ForumActor = {
  auth: AuthGuardResult
  userId: number
  botId: number | null
  displayName: string
  botName: string | null
}

export type ForumReadContext = {
  auth: AuthGuardResult | null
  includeMature: boolean
}

export function getForumChannels(): ForumChannel[] {
  return parseForumChannelRegistryJson(process.env.FORUM_CHANNELS_JSON)
}

export function requireForumChannel(value: unknown): ForumChannel {
  const channel = findForumChannel(getForumChannels(), value)

  if (!channel) {
    throw createError({
      statusCode: 400,
      message: 'A valid forum channel slug is required.',
    })
  }

  return channel
}

function hasSuppliedAuth(event: H3Event): boolean {
  return Boolean(
    getHeader(event, 'authorization') ||
      getHeader(event, 'x-api-key') ||
      getHeader(event, 'x-beta-admin-token') ||
      getHeader(event, 'x-admin-token'),
  )
}

export async function getForumReadContext(
  event: H3Event,
  requestedMature = false,
): Promise<ForumReadContext> {
  const auth = await getOptionalApiUser(event)

  if (!auth && hasSuppliedAuth(event)) {
    throw createError({
      statusCode: 401,
      message: 'Invalid or expired token.',
    })
  }

  if (auth && !authHasScope(auth, 'forum:read')) {
    throw createError({
      statusCode: 403,
      message: 'This credential is not authorized for scope "forum:read".',
    })
  }

  const includeMature = Boolean(
    auth &&
      !isMaturityRestricted(auth.user) &&
      (requestedMature || effectiveShowMature(auth.user)),
  )

  return { auth, includeMature }
}

export function forumReadWhere(options: {
  channel?: string | null
  includeMature?: boolean
  rootOnly?: boolean
  cursor?: number | null
  order?: ForumOrder
}): Prisma.ChatWhereInput {
  return buildForumReadFilter(options) as Prisma.ChatWhereInput
}

export async function requireForumWriter(event: H3Event): Promise<ForumActor> {
  const auth = await requireScopedApiUser(event, 'forum:write')

  if (auth.kind !== 'agent-credential') {
    return {
      auth,
      userId: auth.user.id,
      botId: null,
      displayName: auth.user.username,
      botName: null,
    }
  }

  if (!auth.botId) {
    throw createError({
      statusCode: 403,
      message: 'Forum-writing agent credentials must be bound to a Kind Robots Bot.',
    })
  }

  const bot = await prisma.bot.findFirst({
    where: {
      id: auth.botId,
      userId: auth.user.id,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
  })

  if (!bot) {
    throw createError({
      statusCode: 403,
      message: 'The Bot bound to this credential is unavailable or no longer owned by the authenticated user.',
    })
  }

  return {
    auth,
    userId: auth.user.id,
    botId: bot.id,
    displayName: bot.name,
    botName: bot.name,
  }
}

export function assertForumPostManageable(
  auth: AuthGuardResult,
  post: Pick<ForumPostRecord, 'userId' | 'botId'>,
): void {
  if (
    !canManageForumPost(
      {
        kind: auth.kind,
        userId: auth.user.id,
        botId: auth.botId,
        isAdmin: auth.isAdmin,
      },
      post,
    )
  ) {
    throw createError({
      statusCode: 403,
      message: 'You do not have permission to modify this forum post.',
    })
  }
}

export function assertMatureForumWriteAllowed(
  auth: AuthGuardResult,
  isMature: boolean,
): void {
  if (isMature && isMaturityRestricted(auth.user)) {
    throw createError({
      statusCode: 403,
      message: 'This account cannot create or participate in mature forum content.',
    })
  }
}

export async function requireForumThreadRoot(
  id: number,
  includeMature: boolean,
): Promise<ForumPostRecord> {
  const root = await prisma.chat.findFirst({
    where: {
      id,
      type: 'ToForum',
      isPublic: true,
      isActive: true,
      previousEntryId: null,
      ...(includeMature ? {} : { isMature: false }),
    },
    select: forumPostSelect,
  })

  if (!root) {
    throw createError({
      statusCode: 404,
      message: `Forum thread ${id} was not found.`,
    })
  }

  return root
}

export async function requireForumReplyParent(
  threadId: number,
  parentId: number,
): Promise<ForumPostRecord> {
  const parent = await prisma.chat.findUnique({
    where: { id: parentId },
    select: forumPostSelect,
  })

  if (!parent || !forumParentBelongsToThread(threadId, parent)) {
    throw createError({
      statusCode: 400,
      message: 'The requested reply parent does not belong to this forum thread.',
    })
  }

  return parent
}

export function serializeForumPost(post: ForumPostRecord) {
  const user = post.User
    ? {
        id: post.User.id,
        username: post.User.username,
        avatarImage: post.User.avatarImage,
      }
    : post.userId
      ? { id: post.userId, username: post.sender, avatarImage: null }
      : null

  const bot = post.Bot
    ? {
        id: post.Bot.id,
        name: post.Bot.name,
        slug: post.Bot.slug,
        avatarImage: post.Bot.avatarImage,
      }
    : null

  return {
    id: post.id,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    threadId: post.originId ?? post.id,
    parentId: post.previousEntryId,
    channel: post.channel,
    title: post.title,
    content: post.content,
    isMature: post.isMature,
    author: {
      kind: bot ? ('AI_AGENT' as const) : ('HUMAN' as const),
      displayName: bot?.name ?? user?.username ?? post.sender,
      user,
      bot,
    },
  }
}
