import { createError } from 'h3'
import { Prisma } from '~/prisma/generated/prisma/client'
import prisma from './prisma'

export type RainbowDirectoryPreference = {
  userId: number
  isPublic: boolean
  allowMessages: boolean
  updatedAt: Date | null
}

export type RainbowDirectoryAgent = {
  id: number
  userId: number
  name: string
  avatarImage: string | null
  description: string | null
  allowMessages: boolean
  createdAt: Date
}

export type RainbowDirectoryHuman = {
  id: number
  username: string
  avatarImage: string | null
  bio: string | null
  designerName: string | null
  allowMessages: boolean
}

function kindRobotsPublicOrigin(): string {
  const configured = String(process.env.APP_BASE_URL || 'https://kindrobots.org').trim()
  try {
    return new URL(configured).origin
  } catch {
    return 'https://kindrobots.org'
  }
}

/**
 * Rainbow is a separate origin from Kind Robots, so a legacy avatar such as
 * `/images/avatars/foo.webp` must not be handed to Rainbow as a bare relative
 * path. Uploaded user avatars use artImageId as their durable source of truth,
 * matching Kind Robots' own avatar picker.
 */
export function resolveRainbowAvatar(input: {
  avatarImage?: string | null
  artImageId?: number | null
}): string | null {
  const origin = kindRobotsPublicOrigin()
  const artImageId = Number(input.artImageId)
  if (Number.isInteger(artImageId) && artImageId > 0) {
    return `${origin}/api/art/images/${artImageId}/file`
  }

  const raw = input.avatarImage?.trim()
  if (!raw) return null

  try {
    const parsed = new URL(raw)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return parsed.toString()
  } catch {
    // Relative Kind Robots media path. Resolve it against the canonical origin.
  }

  return new URL(raw.replace(/^\.?\//, ''), `${origin}/`).toString()
}

export async function getRainbowDirectoryPreference(
  userId: number,
): Promise<RainbowDirectoryPreference> {
  const rows = await prisma.$queryRaw<
    Array<{
      userId: number
      isPublic: boolean | number
      allowMessages: boolean | number
      updatedAt: Date
    }>
  >(Prisma.sql`
    SELECT userId, isPublic, allowMessages, updatedAt
    FROM RainbowDirectoryPreference
    WHERE userId = ${userId}
    LIMIT 1
  `)

  const row = rows[0]
  return {
    userId,
    isPublic: Boolean(row?.isPublic),
    allowMessages: Boolean(row?.allowMessages),
    updatedAt: row?.updatedAt ?? null,
  }
}

export async function setRainbowDirectoryPreference(input: {
  userId: number
  isPublic: boolean
  allowMessages: boolean
}): Promise<RainbowDirectoryPreference> {
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO RainbowDirectoryPreference (userId, isPublic, allowMessages, updatedAt)
    VALUES (${input.userId}, ${input.isPublic}, ${input.allowMessages}, CURRENT_TIMESTAMP(3))
    ON DUPLICATE KEY UPDATE
      isPublic = VALUES(isPublic),
      allowMessages = VALUES(allowMessages),
      updatedAt = CURRENT_TIMESTAMP(3)
  `)
  return getRainbowDirectoryPreference(input.userId)
}

export async function listPublicRainbowHumans(): Promise<RainbowDirectoryHuman[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      id: number
      username: string
      avatarImage: string | null
      artImageId: number | null
      bio: string | null
      designerName: string | null
      allowMessages: boolean | number
    }>
  >(Prisma.sql`
    SELECT
      u.id,
      u.username,
      u.avatarImage,
      u.artImageId,
      u.bio,
      u.designerName,
      rdp.allowMessages
    FROM RainbowDirectoryPreference rdp
    INNER JOIN User u ON u.id = rdp.userId
    WHERE rdp.isPublic = true
      AND u.isActive = true
      AND u.isGuest = false
    ORDER BY u.username ASC
    LIMIT 500
  `)

  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    avatarImage: resolveRainbowAvatar(row),
    bio: row.bio,
    designerName: row.designerName,
    allowMessages: Boolean(row.allowMessages),
  }))
}

export async function listPublicRainbowAgents(): Promise<RainbowDirectoryAgent[]> {
  const agents = await prisma.agentProfile.findMany({
    where: { isPublic: true, isActive: true },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 500,
    select: {
      id: true,
      userId: true,
      name: true,
      avatarImage: true,
      description: true,
      allowMessages: true,
      createdAt: true,
    },
  })

  return agents.map((agent) => ({
    ...agent,
    avatarImage: resolveRainbowAvatar({ avatarImage: agent.avatarImage }),
  }))
}

export async function getPublicRainbowHuman(
  userId: number,
): Promise<RainbowDirectoryHuman | null> {
  const humans = await prisma.$queryRaw<
    Array<{
      id: number
      username: string
      avatarImage: string | null
      artImageId: number | null
      bio: string | null
      designerName: string | null
      allowMessages: boolean | number
    }>
  >(Prisma.sql`
    SELECT
      u.id,
      u.username,
      u.avatarImage,
      u.artImageId,
      u.bio,
      u.designerName,
      rdp.allowMessages
    FROM RainbowDirectoryPreference rdp
    INNER JOIN User u ON u.id = rdp.userId
    WHERE rdp.userId = ${userId}
      AND rdp.isPublic = true
      AND u.isActive = true
      AND u.isGuest = false
    LIMIT 1
  `)

  const row = humans[0]
  return row
    ? {
        id: row.id,
        username: row.username,
        avatarImage: resolveRainbowAvatar(row),
        bio: row.bio,
        designerName: row.designerName,
        allowMessages: Boolean(row.allowMessages),
      }
    : null
}

export async function getPublicRainbowAgent(
  agentProfileId: number,
): Promise<RainbowDirectoryAgent | null> {
  const agent = await prisma.agentProfile.findFirst({
    where: { id: agentProfileId, isPublic: true, isActive: true },
    select: {
      id: true,
      userId: true,
      name: true,
      avatarImage: true,
      description: true,
      allowMessages: true,
      createdAt: true,
    },
  })

  return agent
    ? { ...agent, avatarImage: resolveRainbowAvatar({ avatarImage: agent.avatarImage }) }
    : null
}

export async function getPublicAgentsForHuman(
  userId: number,
): Promise<RainbowDirectoryAgent[]> {
  const agents = await prisma.agentProfile.findMany({
    where: { userId, isPublic: true, isActive: true },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      userId: true,
      name: true,
      avatarImage: true,
      description: true,
      allowMessages: true,
      createdAt: true,
    },
  })

  return agents.map((agent) => ({
    ...agent,
    avatarImage: resolveRainbowAvatar({ avatarImage: agent.avatarImage }),
  }))
}

export function parsePositiveDirectoryId(value: unknown, label = 'id'): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createError({ statusCode: 400, message: `Invalid ${label}.` })
  }
  return parsed
}
