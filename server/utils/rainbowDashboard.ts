import { Prisma } from '~/prisma/generated/prisma/client'
import prisma from './prisma'

const RECENT_REPLY_LIMIT = 12
const RECENT_OBJECT_LIMIT_PER_KIND = 8
const RECENT_OBJECT_LIMIT = 16
const EXCERPT_LIMIT = 1200

type RecentReplyRow = {
  id: number
  createdAt: Date
  threadId: number
  parentId: number
  channel: string | null
  sender: string | null
  threadTitle: string | null
  excerpt: string
  isMature: boolean
}

type DashboardObject = {
  kind: 'ART_IMAGE' | 'CHARACTER' | 'PROJECT'
  id: number
  label: string
  detail: string | null
  createdAt: Date
  updatedAt: Date | null
  isPublic: boolean
  isMature: boolean
  imagePath: string | null
}

function clip(value: string | null | undefined, limit = EXCERPT_LIMIT): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.length > limit ? `${trimmed.slice(0, limit - 1)}…` : trimmed
}

async function loadRecentDirectReplies(input: { userId: number; includeMature: boolean }) {
  const rows = await prisma.$queryRaw<RecentReplyRow[]>(Prisma.sql`
    SELECT
      reply.id AS id,
      reply.createdAt AS createdAt,
      COALESCE(reply.originId, reply.id) AS threadId,
      reply.previousEntryId AS parentId,
      reply.channel AS channel,
      reply.sender AS sender,
      root.title AS threadTitle,
      LEFT(reply.content, ${EXCERPT_LIMIT}) AS excerpt,
      reply.isMature AS isMature
    FROM Chat reply
    INNER JOIN Chat parent ON parent.id = reply.previousEntryId
    LEFT JOIN Chat root ON root.id = COALESCE(reply.originId, reply.id)
    WHERE parent.userId = ${input.userId}
      AND (reply.userId IS NULL OR reply.userId <> ${input.userId})
      AND reply.type = 'ToForum'
      AND reply.isPublic = true
      AND reply.isActive = true
      AND (${input.includeMature} = true OR reply.isMature = false)
    ORDER BY reply.createdAt DESC, reply.id DESC
    LIMIT ${RECENT_REPLY_LIMIT}
  `)

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

async function loadRecentObjects(input: { userId: number; includeMature: boolean }) {
  const matureWhere = input.includeMature ? {} : { isMature: false }

  const [artImages, characters, projects] = await Promise.all([
    prisma.artImage.findMany({
      where: {
        userId: input.userId,
        isActive: true,
        ...matureWhere,
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      take: RECENT_OBJECT_LIMIT_PER_KIND,
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        isPublic: true,
        isMature: true,
        artPrompt: true,
        promptString: true,
        thumbnailPath: true,
        cardPath: true,
        imagePath: true,
      },
    }),
    prisma.character.findMany({
      where: {
        userId: input.userId,
        isActive: true,
        ...matureWhere,
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      take: RECENT_OBJECT_LIMIT_PER_KIND,
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        isPublic: true,
        isMature: true,
        name: true,
        title: true,
        species: true,
        role: true,
        iconPath: true,
        cardPath: true,
        imagePath: true,
      },
    }),
    prisma.project.findMany({
      where: {
        userId: input.userId,
        isActive: true,
        ...matureWhere,
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      take: RECENT_OBJECT_LIMIT_PER_KIND,
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        isPublic: true,
        isMature: true,
        title: true,
        description: true,
        iconPath: true,
        cardPath: true,
        imagePath: true,
      },
    }),
  ])

  const objects: DashboardObject[] = [
    ...artImages.map((item) => ({
      kind: 'ART_IMAGE' as const,
      id: item.id,
      label: clip(item.artPrompt || item.promptString, 120) || `ArtImage #${item.id}`,
      detail: clip(item.promptString || item.artPrompt, 280),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      isPublic: Boolean(item.isPublic),
      isMature: Boolean(item.isMature),
      imagePath: item.thumbnailPath || item.cardPath || item.imagePath,
    })),
    ...characters.map((item) => ({
      kind: 'CHARACTER' as const,
      id: item.id,
      label: item.name || item.title || `Character #${item.id}`,
      detail: clip([item.species, item.role].filter(Boolean).join(' · '), 280),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      isPublic: Boolean(item.isPublic),
      isMature: Boolean(item.isMature),
      imagePath: item.iconPath || item.cardPath || item.imagePath,
    })),
    ...projects.map((item) => ({
      kind: 'PROJECT' as const,
      id: item.id,
      label: item.title || `Project #${item.id}`,
      detail: clip(item.description, 280),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      isPublic: Boolean(item.isPublic),
      isMature: Boolean(item.isMature),
      imagePath: item.iconPath || item.cardPath || item.imagePath,
    })),
  ]

  objects.sort((a, b) => {
    const aTime = (a.updatedAt || a.createdAt).getTime()
    const bTime = (b.updatedAt || b.createdAt).getTime()
    return bTime - aTime || b.id - a.id
  })

  return objects.slice(0, RECENT_OBJECT_LIMIT)
}

/**
 * Private workspace context for the authenticated human behind Rainbow.
 *
 * Agent-created forum posts and canonical objects already carry the accountable
 * human's userId, so querying by userId includes work from that human's agents
 * without inventing a second ownership graph in Rainbow.
 */
export async function buildRainbowDashboardWorkspace(input: {
  userId: number
  includeMature: boolean
}) {
  const [recentReplies, recentObjects] = await Promise.all([
    loadRecentDirectReplies(input),
    loadRecentObjects(input),
  ])

  return {
    recentReplies,
    recentObjects,
    semantics: {
      repliesAreUnread: false,
      mentionsAvailable: false,
      objectOwnership:
        'Canonical Kind Robots userId ownership; agent-created objects are accountable to the same human user.',
    },
  }
}
