import { createError, type H3Event } from 'h3'
import prisma from './prisma'
import {
  assertForumPostManageable,
  requireForumWriter,
  serializeForumPost,
  type ForumActor,
  type ForumPostRecord,
} from './forumApi'
import { requireScopedApiUser, type AuthGuardResult } from './authGuard'
import { canManageForumPost } from '~/utils/forumApiContract'
import {
  assertAgentForumChannelAllowed,
  forumAgentAuthorUpsertSql,
  getForumAgentAuthor,
  getForumAgentAuthorMap,
  type ForumAgentProfileAuthor,
} from './agentForumPolicy'

export type ForumV2Actor = ForumActor & {
  agentProfileId: number | null
}

/**
 * Forum writer resolution for the v2 identity model.
 *
 * Legacy Bot-bound credentials keep the existing path unchanged. New Rainbow
 * credentials identify a durable AgentProfile instead, while every Chat row
 * still belongs to the human liaison through Chat.userId.
 */
export async function requireForumV2Writer(event: H3Event): Promise<ForumV2Actor> {
  const auth = await requireScopedApiUser(event, 'forum:write')
  const shadowRestricted = Boolean(auth.user.isRestricted)

  if (auth.kind !== 'agent-credential') {
    return {
      auth,
      userId: auth.user.id,
      botId: null,
      agentProfileId: null,
      displayName: auth.user.username,
      botName: null,
      shadowRestricted,
    }
  }

  if (auth.agentProfileId) {
    const profile = await prisma.agentProfile.findFirst({
      where: {
        id: auth.agentProfileId,
        userId: auth.user.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    })

    if (!profile) {
      throw createError({
        statusCode: 403,
        message:
          'The AgentProfile bound to this credential is unavailable or no longer owned by the authenticated user.',
      })
    }

    return {
      auth,
      userId: auth.user.id,
      botId: null,
      agentProfileId: profile.id,
      displayName: profile.name,
      botName: null,
      shadowRestricted,
    }
  }

  // Preserve the legacy Bot writer behavior verbatim for older credentials.
  if (auth.botId) {
    const legacy = await requireForumWriter(event)
    return { ...legacy, agentProfileId: null }
  }

  throw createError({
    statusCode: 403,
    message:
      'Forum-writing agent credentials must be bound to an active AgentProfile or legacy Kind Robots Bot.',
  })
}

export async function persistForumAgentAuthor(
  tx: { $executeRaw: typeof prisma.$executeRaw },
  chatId: number,
  actor: ForumV2Actor,
): Promise<void> {
  if (!actor.agentProfileId) return
  await tx.$executeRaw(
    forumAgentAuthorUpsertSql(chatId, actor.agentProfileId),
  )
}

/** Non-throwing exact identity check used when ownership selects a behavior
 * (e.g. attach-to-own-post vs build-a-new-contribution) rather than deciding
 * whether the action is allowed at all. */
export async function canManageForumV2Post(
  auth: AuthGuardResult,
  post: Pick<ForumPostRecord, 'id' | 'userId' | 'botId' | 'channel'>,
): Promise<boolean> {
  if (auth.kind !== 'agent-credential' || !auth.agentProfileId) {
    return canManageForumPost(
      {
        kind: auth.kind,
        userId: auth.user.id,
        botId: auth.botId,
        isAdmin: auth.isAdmin,
      },
      post,
    )
  }

  if (post.userId !== auth.user.id) return false
  const author = await getForumAgentAuthor(post.id)
  return Boolean(author && author.id === auth.agentProfileId)
}

/**
 * Exact author boundary for mutations. Human owners keep the existing Kind
 * Robots rule. Legacy Bot credentials keep exact-Bot ownership. AgentProfile
 * credentials use ForumAgentAuthor so rotating a key does not lose authorship,
 * while a sibling agent owned by the same human cannot edit this post.
 */
export async function assertForumV2PostManageable(
  auth: AuthGuardResult,
  post: Pick<ForumPostRecord, 'id' | 'userId' | 'botId' | 'channel'>,
): Promise<void> {
  if (auth.kind !== 'agent-credential' || !auth.agentProfileId) {
    assertForumPostManageable(auth, post)
    return
  }

  await assertAgentForumChannelAllowed(auth, post.channel)
  if (!(await canManageForumV2Post(auth, post))) {
    throw createError({
      statusCode: 403,
      message:
        post.userId === auth.user.id
          ? 'This forum post belongs to a different agent identity under the same human account.'
          : 'You do not have permission to modify this forum post.',
    })
  }
}

export type SerializedForumAgentProfile = {
  id: number
  name: string
  avatarImage: string | null
}

function withAgentProfileAuthor<T extends ReturnType<typeof serializeForumPost>>(
  serialized: T,
  profile: ForumAgentProfileAuthor | null | undefined,
): T & {
  author: T['author'] & { agentProfile?: SerializedForumAgentProfile | null }
} {
  if (!profile || serialized.removed) return serialized

  return {
    ...serialized,
    author: {
      ...serialized.author,
      kind: 'AI_AGENT' as const,
      displayName: profile.name,
      bot: null,
      agentProfile: {
        id: profile.id,
        name: profile.name,
        avatarImage: profile.avatarImage,
      },
    },
  }
}

export async function serializeForumPostV2(
  post: ForumPostRecord,
  includeMatureAttachments = false,
  knownAuthor?: ForumAgentProfileAuthor | null,
) {
  const profile =
    knownAuthor === undefined ? await getForumAgentAuthor(post.id) : knownAuthor
  return withAgentProfileAuthor(
    serializeForumPost(post, includeMatureAttachments),
    profile,
  )
}

export async function serializeForumPostsV2(
  posts: readonly ForumPostRecord[],
  includeMatureAttachments = false,
) {
  const authorMap = await getForumAgentAuthorMap(posts.map((post) => post.id))
  return posts.map((post) =>
    withAgentProfileAuthor(
      serializeForumPost(post, includeMatureAttachments),
      authorMap.get(post.id),
    ),
  )
}
