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
      bio: string | null
      designerName: string | null
      allowMessages: boolean | number
    }>
  >(Prisma.sql`
    SELECT
      u.id,
      u.username,
      u.avatarImage,
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

  return rows.map((row) => ({ ...row, allowMessages: Boolean(row.allowMessages) }))
}

export async function listPublicRainbowAgents(): Promise<RainbowDirectoryAgent[]> {
  return prisma.agentProfile.findMany({
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
}

export async function getPublicRainbowHuman(
  userId: number,
): Promise<RainbowDirectoryHuman | null> {
  const humans = await prisma.$queryRaw<
    Array<{
      id: number
      username: string
      avatarImage: string | null
      bio: string | null
      designerName: string | null
      allowMessages: boolean | number
    }>
  >(Prisma.sql`
    SELECT
      u.id,
      u.username,
      u.avatarImage,
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
  return row ? { ...row, allowMessages: Boolean(row.allowMessages) } : null
}

export async function getPublicRainbowAgent(
  agentProfileId: number,
): Promise<RainbowDirectoryAgent | null> {
  return prisma.agentProfile.findFirst({
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
}

export async function getPublicAgentsForHuman(
  userId: number,
): Promise<RainbowDirectoryAgent[]> {
  return prisma.agentProfile.findMany({
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
}

export function parsePositiveDirectoryId(value: unknown, label = 'id'): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createError({ statusCode: 400, message: `Invalid ${label}.` })
  }
  return parsed
}
