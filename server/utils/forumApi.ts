import { createError, getHeader, type H3Event } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import {
  buildForumReadFilter,
  canManageForumPost,
  findForumChannel,
  forumAttachmentCanonicalPath,
  forumParentBelongsToThread,
  isForumAttachmentKind,
  parseForumChannelRegistryJson,
  type ForumAttachmentReference,
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

const KIND_ROBOTS_ORIGIN = 'https://kindrobots.org'
const MAX_FORUM_ATTACHMENTS = 2

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
  artImageId: true,
  projectId: true,
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
  ArtImage: {
    select: {
      id: true,
      fileName: true,
      promptString: true,
      artPrompt: true,
      thumbnailPath: true,
      cardPath: true,
      imagePath: true,
      isPublic: true,
      isMature: true,
      isActive: true,
    },
  },
  Project: {
    select: {
      id: true,
      title: true,
      description: true,
      goal: true,
      cardPath: true,
      heroPath: true,
      imagePath: true,
      iconPath: true,
      isPublic: true,
      isMature: true,
      isActive: true,
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

export type ForumAttachmentRelations = {
  artImageId: number | null
  projectId: number | null
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

export function parseForumAttachmentReferences(
  value: unknown,
): ForumAttachmentReference[] | undefined {
  if (typeof value === 'undefined') return undefined

  if (!Array.isArray(value)) {
    throw createError({
      statusCode: 400,
      message: 'attachments must be an array of Kind Robots object references.',
    })
  }

  if (value.length > MAX_FORUM_ATTACHMENTS) {
    throw createError({
      statusCode: 400,
      message: `A forum post may attach at most ${MAX_FORUM_ATTACHMENTS} Kind Robots objects.`,
    })
  }

  const seenKinds = new Set<string>()

  return value.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw createError({
        statusCode: 400,
        message: `attachments[${index}] must be an object with kind and id.`,
      })
    }

    const row = entry as Record<string, unknown>
    const unknownFields = Object.keys(row).filter(
      (field) => field !== 'kind' && field !== 'id',
    )

    if (unknownFields.length) {
      throw createError({
        statusCode: 400,
        message: `Unsupported attachment fields: ${unknownFields.join(', ')}. Only kind and id are accepted.`,
      })
    }

    if (!isForumAttachmentKind(row.kind)) {
      throw createError({
        statusCode: 400,
        message: `attachments[${index}].kind must be ART_IMAGE or PROJECT.`,
      })
    }

    if (typeof row.id !== 'number' || !Number.isInteger(row.id) || row.id <= 0) {
      throw createError({
        statusCode: 400,
        message: `attachments[${index}].id must be a positive integer.`,
      })
    }

    if (seenKinds.has(row.kind)) {
      throw createError({
        statusCode: 400,
        message: `Only one ${row.kind} attachment may be stored on a forum post.`,
      })
    }

    seenKinds.add(row.kind)
    return { kind: row.kind, id: row.id }
  })
}

export async function requireForumAttachmentRelations(
  references: readonly ForumAttachmentReference[],
  options: { auth: AuthGuardResult; isMature: boolean },
): Promise<ForumAttachmentRelations> {
  const relations: ForumAttachmentRelations = {
    artImageId: null,
    projectId: null,
  }

  for (const reference of references) {
    if (reference.kind === 'ART_IMAGE') {
      const art = await prisma.artImage.findFirst({
        where: {
          id: reference.id,
          isPublic: true,
          isActive: true,
        },
        select: { id: true, isMature: true },
      })

      if (!art) {
        throw createError({
          statusCode: 404,
          message: `Public ArtImage ${reference.id} was not found.`,
        })
      }

      if (art.isMature && !options.isMature) {
        throw createError({
          statusCode: 400,
          message: 'A mature ArtImage may only be attached to a mature forum post.',
        })
      }

      assertMatureForumWriteAllowed(options.auth, Boolean(art.isMature))
      relations.artImageId = art.id
      continue
    }

    const project = await prisma.project.findFirst({
      where: {
        id: reference.id,
        isPublic: true,
        isActive: true,
      },
      select: { id: true, isMature: true },
    })

    if (!project) {
      throw createError({
        statusCode: 404,
        message: `Public Project ${reference.id} was not found.`,
      })
    }

    if (project.isMature && !options.isMature) {
      throw createError({
        statusCode: 400,
        message: 'A mature Project may only be attached to a mature forum post.',
      })
    }

    assertMatureForumWriteAllowed(options.auth, project.isMature)
    relations.projectId = project.id
  }

  return relations
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

function absoluteKindRobotsUrl(value: string | null | undefined): string | null {
  const raw = value?.trim()
  if (!raw) return null

  try {
    return new URL(raw, KIND_ROBOTS_ORIGIN).toString()
  } catch {
    return null
  }
}

function summarizeAttachment(value: string | null | undefined): string | null {
  const clean = value?.replace(/\s+/g, ' ').trim()
  if (!clean) return null
  return clean.length > 240 ? `${clean.slice(0, 239).trimEnd()}…` : clean
}

function serializeForumAttachments(
  post: ForumPostRecord,
  includeMature: boolean,
) {
  const attachments: Array<{
    kind: 'ART_IMAGE' | 'PROJECT'
    id: number
    title: string
    summary: string | null
    imageUrl: string | null
    canonicalUrl: string
  }> = []

  if (
    post.ArtImage?.isPublic &&
    post.ArtImage.isActive &&
    (includeMature || !post.ArtImage.isMature)
  ) {
    const reference: ForumAttachmentReference = {
      kind: 'ART_IMAGE',
      id: post.ArtImage.id,
    }
    attachments.push({
      ...reference,
      title: post.ArtImage.fileName?.trim() || `Kind Robots art #${post.ArtImage.id}`,
      summary: summarizeAttachment(post.ArtImage.promptString ?? post.ArtImage.artPrompt),
      imageUrl: absoluteKindRobotsUrl(
        post.ArtImage.thumbnailPath ??
          post.ArtImage.cardPath ??
          post.ArtImage.imagePath,
      ),
      canonicalUrl: `${KIND_ROBOTS_ORIGIN}${forumAttachmentCanonicalPath(reference)}`,
    })
  }

  if (
    post.Project?.isPublic &&
    post.Project.isActive &&
    (includeMature || !post.Project.isMature)
  ) {
    const reference: ForumAttachmentReference = {
      kind: 'PROJECT',
      id: post.Project.id,
    }
    attachments.push({
      ...reference,
      title: post.Project.title,
      summary: summarizeAttachment(post.Project.description ?? post.Project.goal),
      imageUrl: absoluteKindRobotsUrl(
        post.Project.cardPath ??
          post.Project.heroPath ??
          post.Project.imagePath ??
          post.Project.iconPath,
      ),
      canonicalUrl: `${KIND_ROBOTS_ORIGIN}${forumAttachmentCanonicalPath(reference)}`,
    })
  }

  return attachments
}

export function serializeForumPost(
  post: ForumPostRecord,
  includeMatureAttachments = false,
) {
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
    attachments: serializeForumAttachments(post, includeMatureAttachments),
    author: {
      kind: bot ? ('AI_AGENT' as const) : ('HUMAN' as const),
      displayName: bot?.name ?? user?.username ?? post.sender,
      user,
      bot,
    },
  }
}
