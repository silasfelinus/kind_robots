// /server/api/projects/index.ts
import { createError, getRouterParam } from 'h3'
import type { H3Event } from 'h3'
import type {
  Prisma,
  ProjectPriority,
  ProjectStatus,
} from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'

export const projectStatuses = new Set<ProjectStatus>([
  'ACTIVE',
  'PAUSED',
  'DONE',
  'ARCHIVED',
  'BRAINSTORM',
])

export const projectPriorities = new Set<ProjectPriority>([
  'LOW',
  'NORMAL',
  'HIGH',
])

// Explicit mutation allowlist: every Project column the routes may read, plus the
// relation keys a round-tripped row (from the store's broad Partial<Project>) can
// carry. Identity/system columns (id, userId, timestamps) are tolerated here but
// never trusted — the routes set userId from authentication and ignore the rest.
// Anything outside this set is rejected instead of silently dropped.
export const projectMutationFields = new Set<string>([
  'id',
  'createdAt',
  'updatedAt',
  'title',
  'slug',
  'description',
  'pitch',
  'flavorText',
  'goal',
  'status',
  'priority',
  'conductorSlug',
  'repoUrl',
  'liveUrl',
  'channelKey',
  'tabKey',
  'lastSyncedAt',
  'allowReviews',
  'highlightImage',
  'icon',
  'imagePath',
  'cardPath',
  'heroPath',
  'designer',
  'creationSource',
  'userId',
  'managerBotId',
  'artImageId',
  'artCollectionId',
  'isPublic',
  'isMature',
  'isActive',
  // relation keys tolerated when a full row is round-tripped by the client
  'ArtJobs',
  'Chats',
  'PitchSheet',
  'ArtCollection',
  'ArtImage',
  'Manager',
  'User',
  'ArtCollectionLinks',
  'ArtImageLinks',
  'Reactions',
  'Todos',
])

export const projectInclude = {
  Manager: {
    select: {
      id: true,
      name: true,
      slug: true,
      avatarImage: true,
      imagePath: true,
    },
  },
  ArtImage: {
    select: {
      id: true,
      imagePath: true,
      thumbnailPath: true,
      fileName: true,
    },
  },
  ArtCollection: {
    select: {
      id: true,
      label: true,
      imagePath: true,
    },
  },
  PitchSheet: {
    select: {
      id: true,
      title: true,
      subtitle: true,
      hook: true,
      imagePath: true,
      artImageId: true,
      isActive: true,
      isPublic: true,
    },
  },
  _count: {
    select: {
      Chats: true,
      Todos: true,
      Reactions: true,
      ArtJobs: true,
      ArtImageLinks: true,
      ArtCollectionLinks: true,
    },
  },
} satisfies Prisma.ProjectInclude

export function getProjectId(event: H3Event): number {
  const value = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(value) || value <= 0) {
    throw createError({
      statusCode: 400,
      message: 'A valid Project ID is required.',
    })
  }
  return value
}

export function normalizeOptionalText(
  value: unknown,
): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, message: 'Expected a text value.' })
  }
  const trimmed = value.trim()
  return trimmed || null
}

export function normalizeSlug(value: unknown): string | null | undefined {
  const text = normalizeOptionalText(value)
  if (text === undefined || text === null) return text
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Project slug must contain letters or numbers.',
    })
  }
  return slug
}

export function normalizeNullableDateTime(
  value: unknown,
): Date | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) {
    throw createError({ statusCode: 400, message: 'Expected an ISO datetime.' })
  }
  return date
}

export function normalizeNullableId(value: unknown): number | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: 'Expected a positive integer ID.',
    })
  }
  return id
}

export function assertProjectAccess(
  // null userId = orphaned (owner deleted): only admins can modify
  project: { userId: number | null },
  user: { id: number; Role?: string | null },
): void {
  if (user.Role !== 'ADMIN' && project.userId !== user.id) {
    throw createError({
      statusCode: 403,
      message: 'You do not have permission to modify this Project.',
    })
  }
}

async function assertRelationTargetAttachable(
  id: number | null | undefined,
  find: (
    targetId: number,
  ) => Promise<{ userId: number | null; isPublic: boolean | null } | null>,
  label: string,
  userId: number,
): Promise<void> {
  if (id === null || id === undefined) return

  const row = await find(id)
  if (!row) {
    throw createError({ statusCode: 404, message: `${label} not found: ${id}.` })
  }

  if (row.userId !== userId && row.isPublic !== true) {
    throw createError({
      statusCode: 403,
      message: `You do not have permission to attach this ${label} to a Project.`,
    })
  }
}

// A non-admin may only connect a manager Bot, ArtImage, or ArtCollection that is
// public or self-owned. Each is a single nullable scalar FK; admins bypass.
export async function assertProjectRelationsAttachable(
  input: {
    managerBotId?: unknown
    artImageId?: unknown
    artCollectionId?: unknown
  },
  userId: number,
  isAdmin: boolean,
): Promise<void> {
  if (isAdmin) return

  const managerBotId = normalizeNullableId(input.managerBotId)
  const artImageId = normalizeNullableId(input.artImageId)
  const artCollectionId = normalizeNullableId(input.artCollectionId)

  await Promise.all([
    assertRelationTargetAttachable(
      managerBotId,
      (id) =>
        prisma.bot.findUnique({
          where: { id },
          select: { userId: true, isPublic: true },
        }),
      'Bot',
      userId,
    ),
    assertRelationTargetAttachable(
      artImageId,
      (id) =>
        prisma.artImage.findUnique({
          where: { id },
          select: { userId: true, isPublic: true },
        }),
      'ArtImage',
      userId,
    ),
    assertRelationTargetAttachable(
      artCollectionId,
      (id) =>
        prisma.artCollection.findUnique({
          where: { id },
          select: { userId: true, isPublic: true },
        }),
      'ArtCollection',
      userId,
    ),
  ])
}
