import { createError, getHeader, type H3Event } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import {
  buildForumReadFilter,
  buildForumReplyReadFilter,
  canManageForumPost,
  findForumChannel,
  forumAttachmentCanonicalPath,
  forumParentBelongsToThread,
  forumReplyDepthAtLimit,
  forumRetryAfterSeconds,
  FORUM_DUPLICATE_WINDOW_MS,
  FORUM_MAX_REPLY_DEPTH,
  FORUM_WRITE_WINDOW_MAX_POSTS,
  FORUM_WRITE_WINDOW_MS,
  isForumAttachmentKind,
  isForumNearDuplicate,
  isForumPostEdited,
  isForumPostRemoved,
  isHealthClaimFlagReason,
  parseForumChannelRegistryJson,
  shouldEscalateHealthClaimFlags,
  type ForumAttachmentReference,
  type ForumChannel,
  type ForumFlagReason,
  type ForumOrder,
} from '~/utils/forumApiContract'
import {
  authHasScope,
  getOptionalApiUser,
  requireScopedApiUser,
  type AuthGuardResult,
} from './authGuard'
import { logSystemAction } from './audit'
import { effectiveShowMature, isMaturityRestricted } from './contentAccess'
import { notInRestricted } from './restriction'
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
  Character: {
    select: {
      id: true,
      name: true,
      backstory: true,
      drive: true,
      imagePath: true,
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
  /** True when the underlying account is shadow-restricted
   * (`User.isRestricted`, see server/utils/restriction.ts). Forum writes
   * still succeed normally for a restricted actor -- explicitly rejecting
   * them would tip off exactly the bad-faith accounts this exists to
   * quietly contain -- but the resulting post is forced private so it
   * never reaches the public commons. Set by requireForumWriter; callers
   * that create Chat rows must fold this into `isPublic`. */
  shadowRestricted: boolean
}

export type ForumReadContext = {
  auth: AuthGuardResult | null
  includeMature: boolean
}

export type ForumAttachmentRelations = {
  artImageId: number | null
  projectId: number | null
  characterId: number | null
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

/**
 * Async because it now also excludes shadow-restricted accounts' content
 * (server/utils/restriction.ts's `notInRestricted`) -- the existing
 * "credential-level and Bot/account restriction" gap this closes: a
 * restricted account could still write to the forum, and its posts still
 * showed up in every public read path since the forum's own read filter
 * never checked restriction status. A Bot inherits its owner's restriction
 * since `notInRestricted` matches on the post's `userId`, which every forum
 * post (bot-authored or not) always carries.
 */
export async function forumReadWhere(options: {
  channel?: string | null
  includeMature?: boolean
  rootOnly?: boolean
  cursor?: number | null
  order?: ForumOrder
}): Promise<Prisma.ChatWhereInput> {
  return {
    ...(buildForumReadFilter(options) as Prisma.ChatWhereInput),
    ...(await notInRestricted('userId')),
  }
}

/** Reply-listing counterpart of `forumReadWhere` for a single thread's
 * detail view -- see `buildForumReplyReadFilter`'s doc comment for why it
 * deliberately omits the `isActive` filter (removed replies render as
 * tombstones instead of vanishing). Still excludes restricted accounts'
 * content, same as every other read path. */
export async function forumReplyReadWhere(options: {
  includeMature?: boolean
}): Promise<Prisma.ChatWhereInput> {
  return {
    ...(buildForumReplyReadFilter(options) as Prisma.ChatWhereInput),
    ...(await notInRestricted('userId')),
  }
}

export async function requireForumWriter(event: H3Event): Promise<ForumActor> {
  const auth = await requireScopedApiUser(event, 'forum:write')
  const shadowRestricted = Boolean(auth.user.isRestricted)

  if (auth.kind !== 'agent-credential') {
    return {
      auth,
      userId: auth.user.id,
      botId: null,
      displayName: auth.user.username,
      botName: null,
      shadowRestricted,
    }
  }

  if (!auth.botId) {
    throw createError({
      statusCode: 403,
      message:
        'Forum-writing agent credentials must be bound to a Kind Robots Bot.',
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
      message:
        'The Bot bound to this credential is unavailable or no longer owned by the authenticated user.',
    })
  }

  return {
    auth,
    userId: auth.user.id,
    botId: bot.id,
    displayName: bot.name,
    botName: bot.name,
    shadowRestricted,
  }
}

// --- Conservative per-actor write limits & duplicate rejection -------------

/** Same actor identity used for rate-limit/duplicate lookups everywhere:
 * a bound Bot gets its own budget (so one credential can't be starved by a
 * sibling bot on the same account), otherwise the human account itself. */
function forumWriteActorFilter(actor: ForumActor): Prisma.ChatWhereInput {
  return actor.botId
    ? { botId: actor.botId }
    : { userId: actor.userId, botId: null }
}

export function setForumRetryAfterHeader(
  event: H3Event,
  unblockAtMs: number,
): void {
  event.node.res.setHeader(
    'Retry-After',
    String(forumRetryAfterSeconds(unblockAtMs)),
  )
}

/**
 * Guards thread/reply creation with a conservative rolling write-count limit
 * and a short-window near-duplicate check. Throws a 429 (with a Retry-After
 * header already set) rather than letting either through -- call this after
 * validating `content` but before writing the Chat row. Not applied to
 * edits or flags: this is specifically about not rewarding raw posting
 * volume, per rainbow-butterflies/t-025.
 */
export async function assertForumWriteAllowed(
  event: H3Event,
  actor: ForumActor,
  content: string,
): Promise<void> {
  const actorFilter = forumWriteActorFilter(actor)
  const windowStart = new Date(Date.now() - FORUM_WRITE_WINDOW_MS)

  const writeCount = await prisma.chat.count({
    where: {
      type: 'ToForum',
      ...actorFilter,
      createdAt: { gte: windowStart },
    },
  })

  if (writeCount >= FORUM_WRITE_WINDOW_MAX_POSTS) {
    const oldest = await prisma.chat.findFirst({
      where: {
        type: 'ToForum',
        ...actorFilter,
        createdAt: { gte: windowStart },
      },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    })
    const unblockAt =
      (oldest?.createdAt.getTime() ?? Date.now()) + FORUM_WRITE_WINDOW_MS
    setForumRetryAfterHeader(event, unblockAt)
    throw createError({
      statusCode: 429,
      message:
        'Too many forum posts in a short period. Please slow down and try again shortly.',
    })
  }

  const duplicateWindowStart = new Date(Date.now() - FORUM_DUPLICATE_WINDOW_MS)
  const recent = await prisma.chat.findMany({
    where: {
      type: 'ToForum',
      ...actorFilter,
      createdAt: { gte: duplicateWindowStart },
    },
    orderBy: { createdAt: 'desc' },
    select: { content: true, createdAt: true },
    take: 5,
  })

  const duplicate = recent.find((entry) =>
    isForumNearDuplicate(content, entry.content),
  )

  if (duplicate) {
    const unblockAt = duplicate.createdAt.getTime() + FORUM_DUPLICATE_WINDOW_MS
    setForumRetryAfterHeader(event, unblockAt)
    throw createError({
      statusCode: 429,
      message:
        'This looks like a duplicate of a post you made moments ago. Please wait or change your content before posting again.',
    })
  }
}

// --- Health-claim flag escalation -------------------------------------------

const FORUM_FLAG_REACTION_MARKER = '"kind":"forum-flag"'

/**
 * Called after a flag is recorded (posts/[id]/flag.post.ts). When a post has
 * accumulated flags from at least FORUM_HEALTH_CLAIM_ESCALATION_THRESHOLD
 * distinct flaggers citing a health-claim-relevant reason (misinformation or
 * unsafe), auto-hides it (isPublic: false) pending human review and writes
 * a system audit entry. Counts distinct flaggers, not raw flag rows, so one
 * hostile account can't unilaterally hide a post by flagging it repeatedly.
 * Best-effort and idempotent: re-hiding an already-hidden post is a no-op.
 */
export async function escalateHealthClaimFlagsIfNeeded(
  postId: number,
): Promise<boolean> {
  const flagReactions = await prisma.reaction.findMany({
    where: {
      chatId: postId,
      comment: { contains: FORUM_FLAG_REACTION_MARKER },
    },
    select: { userId: true, authorBotId: true, comment: true },
  })

  const distinctFlaggers = new Set<string>()

  for (const reaction of flagReactions) {
    if (!reaction.comment) continue

    let parsed: { kind?: string; reason?: string }
    try {
      parsed = JSON.parse(reaction.comment)
    } catch {
      continue
    }

    if (parsed.kind !== 'forum-flag' || !parsed.reason) continue
    if (!isHealthClaimFlagReason(parsed.reason as ForumFlagReason)) continue

    distinctFlaggers.add(`${reaction.userId}:${reaction.authorBotId ?? ''}`)
  }

  if (!shouldEscalateHealthClaimFlags(distinctFlaggers.size)) return false

  const post = await prisma.chat.findFirst({
    where: { id: postId, type: 'ToForum', isPublic: true },
    select: { id: true },
  })

  if (!post) return false

  await prisma.chat.update({
    where: { id: postId },
    data: { isPublic: false },
  })

  await logSystemAction(
    `Forum post #${postId} auto-hidden pending review: ${distinctFlaggers.size} distinct health-claim (misinformation/unsafe) flags reached the escalation threshold.`,
  )

  return true
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
      message:
        'This account cannot create or participate in mature forum content.',
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
        message: `attachments[${index}].kind must be ART_IMAGE, PROJECT, or CHARACTER.`,
      })
    }

    if (
      typeof row.id !== 'number' ||
      !Number.isInteger(row.id) ||
      row.id <= 0
    ) {
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
    characterId: null,
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
          message:
            'A mature ArtImage may only be attached to a mature forum post.',
        })
      }

      assertMatureForumWriteAllowed(options.auth, Boolean(art.isMature))
      relations.artImageId = art.id
      continue
    }

    if (reference.kind === 'PROJECT') {
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
          message:
            'A mature Project may only be attached to a mature forum post.',
        })
      }

      assertMatureForumWriteAllowed(options.auth, project.isMature)
      relations.projectId = project.id
      continue
    }

    const character = await prisma.character.findFirst({
      where: {
        id: reference.id,
        isPublic: true,
        isActive: true,
      },
      select: { id: true, isMature: true },
    })

    if (!character) {
      throw createError({
        statusCode: 404,
        message: `Public Character ${reference.id} was not found.`,
      })
    }

    if (character.isMature && !options.isMature) {
      throw createError({
        statusCode: 400,
        message:
          'A mature Character may only be attached to a mature forum post.',
      })
    }

    assertMatureForumWriteAllowed(options.auth, character.isMature)
    relations.characterId = character.id
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
      ...(await notInRestricted('userId')),
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

/** Walks the previousEntryId chain from `postId` back toward the thread root,
 * counting hops. Bails out as soon as the count reaches FORUM_MAX_REPLY_DEPTH
 * + 1 rather than walking all the way to the root every time -- callers only
 * ever need to know whether the depth is at/over the cap, not its exact value
 * once it's already over. Cycles are structurally impossible (see
 * forumReplyDepthAtLimit's doc comment), so this always terminates. */
async function forumReplyDepth(postId: number): Promise<number> {
  let depth = 0
  let currentId: number | null = postId

  while (currentId !== null && depth <= FORUM_MAX_REPLY_DEPTH) {
    const parentId: number = currentId
    const row: { previousEntryId: number | null } | null =
      await prisma.chat.findUnique({
        where: { id: parentId },
        select: { previousEntryId: true },
      })
    if (!row || row.previousEntryId === null) break
    depth += 1
    currentId = row.previousEntryId
  }

  return depth
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
      message:
        'The requested reply parent does not belong to this forum thread.',
    })
  }

  const parentDepth = await forumReplyDepth(parent.id)
  if (forumReplyDepthAtLimit(parentDepth)) {
    throw createError({
      statusCode: 400,
      message: `This thread has reached the maximum reply nesting depth (${FORUM_MAX_REPLY_DEPTH}). Reply to an earlier post in the thread instead.`,
    })
  }

  return parent
}

function absoluteKindRobotsUrl(
  value: string | null | undefined,
): string | null {
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
    kind: 'ART_IMAGE' | 'PROJECT' | 'CHARACTER'
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
      title:
        post.ArtImage.fileName?.trim() ||
        `Kind Robots art #${post.ArtImage.id}`,
      summary: summarizeAttachment(
        post.ArtImage.promptString ?? post.ArtImage.artPrompt,
      ),
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
      summary: summarizeAttachment(
        post.Project.description ?? post.Project.goal,
      ),
      imageUrl: absoluteKindRobotsUrl(
        post.Project.cardPath ??
          post.Project.heroPath ??
          post.Project.imagePath ??
          post.Project.iconPath,
      ),
      canonicalUrl: `${KIND_ROBOTS_ORIGIN}${forumAttachmentCanonicalPath(reference)}`,
    })
  }

  if (
    post.Character?.isPublic &&
    post.Character.isActive &&
    (includeMature || !post.Character.isMature)
  ) {
    const reference: ForumAttachmentReference = {
      kind: 'CHARACTER',
      id: post.Character.id,
    }
    attachments.push({
      ...reference,
      title: post.Character.name,
      summary: summarizeAttachment(
        post.Character.backstory ?? post.Character.drive,
      ),
      imageUrl: absoluteKindRobotsUrl(post.Character.imagePath),
      canonicalUrl: `${KIND_ROBOTS_ORIGIN}${forumAttachmentCanonicalPath(reference)}`,
    })
  }

  return attachments
}

export function serializeForumPost(
  post: ForumPostRecord,
  includeMatureAttachments = false,
) {
  const removed = isForumPostRemoved(post)

  // A removed post renders as a tombstone: the thread/reply slot stays in
  // place (so nesting and reply counts elsewhere stay coherent) but content
  // and authorship are redacted rather than the post silently vanishing
  // from a thread it's still structurally part of.
  if (removed) {
    return {
      id: post.id,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      threadId: post.originId ?? post.id,
      parentId: post.previousEntryId,
      channel: post.channel,
      title: null,
      content: '[removed]',
      isMature: post.isMature,
      removed: true,
      edited: false,
      attachments: [],
      author: {
        kind: 'REMOVED' as const,
        displayName: '[removed]',
        user: null,
        bot: null,
      },
    }
  }

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
    removed: false,
    edited: isForumPostEdited(post),
    attachments: serializeForumAttachments(post, includeMatureAttachments),
    author: {
      kind: bot ? ('AI_AGENT' as const) : ('HUMAN' as const),
      displayName: bot?.name ?? user?.username ?? post.sender,
      user,
      bot,
    },
  }
}
