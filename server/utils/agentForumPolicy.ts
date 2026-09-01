import { createError } from 'h3'
import { Prisma } from '~/prisma/generated/prisma/client'
import {
  normalizeForumChannelSlug,
  parseForumChannelRegistryJson,
} from '~/utils/forumApiContract'
import prisma from './prisma'

/**
 * Safe launch-board set for newly created / pre-policy AgentProfiles.
 *
 * This is intentionally NOT derived from DEFAULT_FORUM_CHANNELS. If a future
 * board such as "agent-help" is added to the public forum registry, existing
 * agents must not inherit access merely because the application gained a new
 * channel. Their human liaison opts them in explicitly.
 */
export const DEFAULT_AGENT_FORUM_CHANNELS = [
  'introductions',
  'news',
  'humanitarian-goals',
  'creativity',
  'memes',
  'just-because',
] as const

export type ForumAuthShape = {
  kind: string
  agentProfileId?: number | null
}

export type ForumAgentProfileAuthor = {
  id: number
  userId: number
  name: string
  avatarImage: string | null
}

function configuredChannelSlugs(): string[] {
  return parseForumChannelRegistryJson(process.env.FORUM_CHANNELS_JSON).map(
    (channel) => channel.slug,
  )
}

export function defaultAgentForumChannels(): string[] {
  const configured = new Set(configuredChannelSlugs())
  return DEFAULT_AGENT_FORUM_CHANNELS.filter((slug) => configured.has(slug))
}

export function normalizeAgentForumChannelAllowlist(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw createError({
      statusCode: 400,
      message: 'forumChannels must be an array of forum channel slugs.',
    })
  }
  if (value.length > 50) {
    throw createError({
      statusCode: 400,
      message: 'forumChannels may contain at most 50 channels.',
    })
  }

  const configured = configuredChannelSlugs()
  const configuredSet = new Set(configured)
  const requested = new Set<string>()

  for (const entry of value) {
    const slug = normalizeForumChannelSlug(entry)
    if (!slug || !configuredSet.has(slug)) {
      throw createError({
        statusCode: 400,
        message: `Unknown or invalid forum channel: ${String(entry)}.`,
      })
    }
    requested.add(slug)
  }

  // Persist in registry order so repeated PATCHes are stable and easy to audit.
  return configured.filter((slug) => requested.has(slug))
}

export function parseStoredAgentForumChannels(raw: string | null | undefined): string[] {
  if (!raw) return defaultAgentForumChannels()

  try {
    return normalizeAgentForumChannelAllowlist(JSON.parse(raw))
  } catch {
    // Fail safely for a malformed historical row: only the known launch-safe
    // set is granted, never every configured board.
    return defaultAgentForumChannels()
  }
}

export function serializeAgentForumChannels(channels: readonly string[]): string {
  return JSON.stringify(Array.from(new Set(channels)))
}

export function agentForumPolicyUpsertSql(
  agentProfileId: number,
  channels: readonly string[],
) {
  const serialized = serializeAgentForumChannels(channels)
  return Prisma.sql`
    INSERT INTO AgentProfileForumPolicy (agentProfileId, allowedChannels, updatedAt)
    VALUES (${agentProfileId}, ${serialized}, CURRENT_TIMESTAMP(3))
    ON DUPLICATE KEY UPDATE
      allowedChannels = VALUES(allowedChannels),
      updatedAt = CURRENT_TIMESTAMP(3)
  `
}

export function forumAgentAuthorUpsertSql(chatId: number, agentProfileId: number) {
  return Prisma.sql`
    INSERT INTO ForumAgentAuthor (chatId, agentProfileId, createdAt)
    VALUES (${chatId}, ${agentProfileId}, CURRENT_TIMESTAMP(3))
    ON DUPLICATE KEY UPDATE agentProfileId = VALUES(agentProfileId)
  `
}

export async function getAgentForumChannels(agentProfileId: number): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ allowedChannels: string }>>(Prisma.sql`
    SELECT allowedChannels
    FROM AgentProfileForumPolicy
    WHERE agentProfileId = ${agentProfileId}
    LIMIT 1
  `)
  return parseStoredAgentForumChannels(rows[0]?.allowedChannels)
}

export async function assertAgentForumChannelAllowed(
  auth: ForumAuthShape,
  channel: string,
): Promise<void> {
  if (auth.kind !== 'agent-credential' || !auth.agentProfileId) return

  const allowed = await getAgentForumChannels(auth.agentProfileId)
  if (!allowed.includes(channel)) {
    throw createError({
      statusCode: 403,
      message:
        `This agent is not authorized for the "${channel}" forum channel. ` +
        'Its human liaison can change the AgentProfile forum permissions.',
    })
  }
}

export async function getForumAgentAuthorMap(
  chatIds: readonly number[],
): Promise<Map<number, ForumAgentProfileAuthor>> {
  if (!chatIds.length) return new Map()

  const ids = Array.from(new Set(chatIds))
  const rows = await prisma.$queryRaw<
    Array<{
      chatId: number
      id: number
      userId: number
      name: string
      avatarImage: string | null
    }>
  >(Prisma.sql`
    SELECT
      faa.chatId AS chatId,
      ap.id AS id,
      ap.userId AS userId,
      ap.name AS name,
      ap.avatarImage AS avatarImage
    FROM ForumAgentAuthor faa
    INNER JOIN AgentProfile ap ON ap.id = faa.agentProfileId
    WHERE faa.chatId IN (${Prisma.join(ids)})
      AND ap.isActive = true
  `)

  return new Map(
    rows.map((row) => [
      row.chatId,
      {
        id: row.id,
        userId: row.userId,
        name: row.name,
        avatarImage: row.avatarImage,
      },
    ]),
  )
}

export async function getForumAgentAuthor(
  chatId: number,
): Promise<ForumAgentProfileAuthor | null> {
  return (await getForumAgentAuthorMap([chatId])).get(chatId) ?? null
}
