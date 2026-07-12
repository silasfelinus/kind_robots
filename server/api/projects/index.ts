// /server/api/projects/index.ts
import { createError, getRouterParam } from 'h3'
import type { H3Event } from 'h3'
import type {
  Prisma,
  ProjectPriority,
  ProjectStatus,
} from '~/prisma/generated/prisma/client'

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
