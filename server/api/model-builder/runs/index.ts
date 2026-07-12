// /server/api/model-builder/runs/index.ts
import { createError, getRouterParam } from 'h3'
import type { H3Event } from 'h3'
import { Prisma } from '~/prisma/generated/prisma/client'
import type { ModelBuildStatus } from '~/prisma/generated/prisma/client'

export const modelBuildStatuses = new Set<ModelBuildStatus>([
  'DRAFT',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
])

// Full run graph: items with their artifacts and revisions, in stable order.
export const runInclude = {
  Items: {
    orderBy: { id: 'asc' },
    include: {
      Artifacts: { orderBy: { id: 'asc' } },
      Revisions: { orderBy: { id: 'asc' } },
    },
  },
} satisfies Prisma.ModelBuildRunInclude

export function getRunId(event: H3Event): number {
  const value = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(value) || value <= 0) {
    throw createError({
      statusCode: 400,
      message: 'A valid build run ID is required.',
    })
  }
  return value
}

export function getItemId(event: H3Event): number {
  const value = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(value) || value <= 0) {
    throw createError({
      statusCode: 400,
      message: 'A valid build item ID is required.',
    })
  }
  return value
}

// A run (or a run reached via one of its items) may only be modified by its
// owner or an admin. A null userId means the owner was deleted — admins only.
export function assertRunAccess(
  run: { userId: number | null },
  user: { id: number; Role?: string | null },
): void {
  if (user.Role !== 'ADMIN' && run.userId !== user.id) {
    throw createError({
      statusCode: 403,
      message: 'You do not have permission to modify this build run.',
    })
  }
}

export function normalizeText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, message: 'Expected a text value.' })
  }
  return value
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

// JSON columns use the tri-state undefined (leave) / null (clear) / value.
export function normalizeJson(
  value: unknown,
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (value === undefined) return undefined
  if (value === null) return Prisma.JsonNull
  return value as Prisma.InputJsonValue
}
