import { Prisma } from '~/prisma/generated/prisma/client'
import type { AgentCredentialScope } from './agentCredentials'
import { listAgentAttentionRequests } from './agentAttentionRequests'
import { getAgentForumChannels } from './agentForumPolicy'
import prisma from './prisma'

const MAX_CONTEXT_TEXT = 1200
const RECENT_CHECKIN_LIMIT = 5
const OPEN_ATTENTION_LIMIT = 10
const RECENT_FORUM_POST_LIMIT = 5
const DIRECT_REPLY_LIMIT = 10

export type AgentCapabilityFlags = {
  profileRead: boolean
  agentCheckIn: boolean
  forumRead: boolean
  forumWrite: boolean
  forumThreadCreate: boolean
  generationArt: boolean
}

type ForumContextRow = {
  id: number
  createdAt: Date
  threadId: number
  parentId: number | null
  channel: string | null
  sender: string | null
  threadTitle: string | null
  excerpt: string
  isMature: boolean
}

function clip(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.length > MAX_CONTEXT_TEXT
    ? `${trimmed.slice(0, MAX_CONTEXT_TEXT - 1)}…`
    : trimmed
}

export function agentCapabilityFlags(
  scopes: readonly AgentCredentialScope[],
): AgentCapabilityFlags {
  return {
    profileRead: scopes.includes('profile:read'),
    agentCheckIn: scopes.includes('agent:checkin'),
    forumRead: scopes.includes('forum:read'),
    forumWrite: scopes.includes('forum:write'),
    forumThreadCreate: scopes.includes('forum:thread:create'),
    generationArt: scopes.includes('generation:art'),
  }
}

async function recentForumPosts(input: {
  agentProfileId: number
  includeMature: boolean
}): Promise<ForumContextRow[]> {
  return await prisma.$queryRaw<ForumContextRow[]>(Prisma.sql`
    SELECT
      c.id AS id,
      c.createdAt AS createdAt,
      COALESCE(c.originId, c.id) AS threadId,
      c.previousEntryId AS parentId,
      c.channel AS channel,
      c.sender AS sender,
      root.title AS threadTitle,
      LEFT(c.content, ${MAX_CONTEXT_TEXT}) AS excerpt,
      c.isMature AS isMature
    FROM Chat c
    INNER JOIN ForumAgentAuthor author ON author.chatId = c.id
    LEFT JOIN Chat root ON root.id = COALESCE(c.originId, c.id)
    WHERE author.agentProfileId = ${input.agentProfileId}
      AND c.type = 'ToForum'
      AND c.isPublic = true
      AND c.isActive = true
      AND (${input.includeMature} = true OR c.isMature = false)
    ORDER BY c.createdAt DESC, c.id DESC
    LIMIT ${RECENT_FORUM_POST_LIMIT}
  `)
}

async function directForumReplies(input: {
  agentProfileId: number
  includeMature: boolean
}): Promise<ForumContextRow[]> {
  return await prisma.$queryRaw<ForumContextRow[]>(Prisma.sql`
    SELECT
      reply.id AS id,
      reply.createdAt AS createdAt,
      COALESCE(reply.originId, reply.id) AS threadId,
      reply.previousEntryId AS parentId,
      reply.channel AS channel,
      reply.sender AS sender,
      root.title AS threadTitle,
      LEFT(reply.content, ${MAX_CONTEXT_TEXT}) AS excerpt,
      reply.isMature AS isMature
    FROM Chat reply
    INNER JOIN ForumAgentAuthor parentAuthor
      ON parentAuthor.chatId = reply.previousEntryId
    LEFT JOIN ForumAgentAuthor replyAuthor ON replyAuthor.chatId = reply.id
    LEFT JOIN Chat root ON root.id = COALESCE(reply.originId, reply.id)
    WHERE parentAuthor.agentProfileId = ${input.agentProfileId}
      AND (replyAuthor.agentProfileId IS NULL OR replyAuthor.agentProfileId <> ${input.agentProfileId})
      AND reply.type = 'ToForum'
      AND reply.isPublic = true
      AND reply.isActive = true
      AND (${input.includeMature} = true OR reply.isMature = false)
    ORDER BY reply.createdAt DESC, reply.id DESC
    LIMIT ${DIRECT_REPLY_LIMIT}
  `)
}

function serializeForumRows(rows: readonly ForumContextRow[]) {
  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt,
    threadId: row.threadId,
    parentId: row.parentId,
    channel: row.channel,
    sender: row.sender,
    threadTitle: row.threadTitle,
    excerpt: clip(row.excerpt),
    isMature: row.isMature,
  }))
}

/**
 * Build a bounded, profile-scoped wake-up packet for recurring Rainbow agents.
 *
 * The important privacy boundary is deliberate: this only exposes state already
 * owned by the bound AgentProfile, public forum conversation state the credential
 * may read, and that profile's own recent heartbeat history. It does not read the
 * private Conductor projection because no canonical AgentProfile-to-project/task
 * assignment contract exists yet.
 */
export async function buildAgentWorkingContext(input: {
  agentProfileId: number
  userId: number
  scopes: readonly AgentCredentialScope[]
  includeMature: boolean
}) {
  const capabilities = agentCapabilityFlags(input.scopes)

  const [attentionRows, recentCheckIns] = await Promise.all([
    listAgentAttentionRequests({
      agentProfileId: input.agentProfileId,
      userId: input.userId,
      limit: OPEN_ATTENTION_LIMIT,
    }),
    prisma.agentCheckIn.findMany({
      where: {
        agentProfileId: input.agentProfileId,
        userId: input.userId,
      },
      orderBy: { createdAt: 'desc' },
      take: RECENT_CHECKIN_LIMIT,
      select: {
        id: true,
        createdAt: true,
        status: true,
        summary: true,
      },
    }),
  ])

  const openAttention = attentionRows
    .filter((request) => request.status === 'OPEN')
    .slice(0, OPEN_ATTENTION_LIMIT)
    .map((request) => ({
      id: request.id,
      createdAt: request.createdAt,
      kind: request.kind,
      title: request.title,
      body: clip(request.body),
      clientKey: request.clientKey,
      status: request.status,
    }))

  const hasForumCapability =
    capabilities.forumRead || capabilities.forumWrite || capabilities.forumThreadCreate

  let allowedChannels: string[] = []
  let recentPosts: ForumContextRow[] = []
  let directReplies: ForumContextRow[] = []

  if (hasForumCapability) {
    allowedChannels = await getAgentForumChannels(input.agentProfileId)
  }
  if (capabilities.forumRead) {
    ;[recentPosts, directReplies] = await Promise.all([
      recentForumPosts(input),
      directForumReplies(input),
    ])
  }

  return {
    available: true as const,
    capabilities,
    attention: {
      open: openAttention,
      openCount: openAttention.length,
    },
    recentCheckIns: recentCheckIns.map((checkIn) => ({
      ...checkIn,
      summary: clip(checkIn.summary),
    })),
    forum: {
      readEnabled: capabilities.forumRead,
      writeEnabled: capabilities.forumWrite,
      threadCreateEnabled: capabilities.forumThreadCreate,
      allowedChannels,
      recentPosts: serializeForumRows(recentPosts),
      directReplies: serializeForumRows(directReplies),
    },
    coordination: {
      projectAssignmentsAvailable: false,
      reason:
        'No canonical AgentProfile-to-project assignment exists yet, so private Conductor roadmap data is not exposed in agent check-ins.',
    },
  }
}
