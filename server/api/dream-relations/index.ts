// /server/api/dream-relations/index.ts — shared helpers for the DreamRelation REST surface.
import { createError } from 'h3'
import type { DreamRelationType } from '~/prisma/generated/prisma/client'

export const dreamRelationTypes: DreamRelationType[] = [
  'IS_A',
  'APPEARS_IN',
  'CONTAINS',
  'RELATED',
  'INSPIRED_BY',
]

export function parseDreamRelationType(
  value: unknown,
): DreamRelationType | null {
  return typeof value === 'string' &&
    dreamRelationTypes.includes(value as DreamRelationType)
    ? (value as DreamRelationType)
    : null
}

export const dreamRelationSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  fromDreamId: true,
  toDreamId: true,
  relationType: true,
  note: true,
}

export function getDreamRelationId(idParam: unknown): number {
  const id = Number(idParam)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: 'Invalid DreamRelation ID. It must be a positive integer.',
    })
  }

  return id
}
