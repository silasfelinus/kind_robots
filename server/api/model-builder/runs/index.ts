// /server/api/model-builder/runs/index.ts
import { createError, getRouterParam } from 'h3'
import type { H3Event } from 'h3'
import type {
  Prisma,
  ModelBuildStatus,
  ModelBuildItem,
} from '~/prisma/generated/prisma/client'

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

// Structured model-builder fields are stored as JSON text. Preserve already
// serialized JSON, serialize objects/arrays/scalars, and keep the tri-state
// undefined (leave unchanged) / null (clear) / string value.
export function normalizeJson(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null

    try {
      JSON.parse(trimmed)
      return trimmed
    } catch {
      return JSON.stringify(trimmed)
    }
  }

  try {
    return JSON.stringify(value)
  } catch {
    throw createError({
      statusCode: 400,
      message: 'Expected a JSON-serializable value.',
    })
  }
}

export function parseStoredJson<T = unknown>(value: unknown, fallback: T): T {
  if (typeof value !== 'string' || !value.trim()) return fallback

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export type ItemPatchBody = {
  stageStatuses?: unknown
  pitch?: unknown
  fieldsDraft?: unknown
  promptDraft?: unknown
  relationshipDraft?: unknown
  staleReason?: unknown
  error?: unknown
  artImageId?: unknown
  targetType?: unknown
  targetId?: unknown
  // Revision metadata (optional):
  stage?: unknown
  reason?: unknown
}

export type PreparedItemUpdate = {
  data: Prisma.ModelBuildItemUncheckedUpdateInput
  // Present only when editable draft content changed, so the caller records a
  // ModelBuildRevision alongside the update.
  revision: {
    stage: string
    reason: string | null
    actor: string
    previousPayload: string
    nextPayload: string
  } | null
}

// Shared by the single-item and batch PATCH routes: validates/normalizes an
// ItemPatchBody against an existing item and builds the Prisma update input
// plus (when editable content changed) the revision-history entry to record
// alongside it. Stage-status-only transitions (approve/reject/stale) are
// frequent and not themselves revisions.
export function prepareItemUpdate(
  existing: Pick<
    ModelBuildItem,
    | 'pitch'
    | 'fieldsDraft'
    | 'promptDraft'
    | 'stageStatuses'
    | 'relationshipDraft'
  >,
  body: ItemPatchBody,
  actor: string,
): PreparedItemUpdate {
  const data: Prisma.ModelBuildItemUncheckedUpdateInput = {}

  if (body.stageStatuses !== undefined && body.stageStatuses !== null) {
    const stageStatuses = normalizeJson(body.stageStatuses)
    if (typeof stageStatuses === 'string') data.stageStatuses = stageStatuses
  }
  if (body.pitch !== undefined) data.pitch = normalizeText(body.pitch)
  if (body.fieldsDraft !== undefined)
    data.fieldsDraft = normalizeText(body.fieldsDraft)
  if (body.promptDraft !== undefined)
    data.promptDraft = normalizeText(body.promptDraft)
  const relationshipDraft = normalizeJson(body.relationshipDraft)
  if (relationshipDraft !== undefined)
    data.relationshipDraft = relationshipDraft
  if (body.staleReason !== undefined)
    data.staleReason = normalizeText(body.staleReason)
  if (body.error !== undefined) data.error = normalizeText(body.error)
  if (body.artImageId !== undefined)
    data.artImageId = normalizeNullableId(body.artImageId)
  if (body.targetType !== undefined)
    data.targetType = normalizeText(body.targetType)
  if (body.targetId !== undefined)
    data.targetId = normalizeNullableId(body.targetId)

  const contentChanged =
    body.pitch !== undefined ||
    body.fieldsDraft !== undefined ||
    body.promptDraft !== undefined ||
    body.relationshipDraft !== undefined

  if (!contentChanged) return { data, revision: null }

  const stageLabel =
    typeof body.stage === 'string' ? body.stage.slice(0, 48) : 'EDIT'
  const reason =
    typeof body.reason === 'string' ? body.reason.slice(0, 255) : null

  const previousPayload = JSON.stringify({
    pitch: existing.pitch,
    fieldsDraft: existing.fieldsDraft,
    promptDraft: existing.promptDraft,
    stageStatuses: existing.stageStatuses,
    relationshipDraft: existing.relationshipDraft,
  })
  const nextPayload = JSON.stringify({
    pitch: data.pitch ?? existing.pitch,
    fieldsDraft: data.fieldsDraft ?? existing.fieldsDraft,
    promptDraft: data.promptDraft ?? existing.promptDraft,
    stageStatuses: data.stageStatuses ?? existing.stageStatuses,
    relationshipDraft: data.relationshipDraft ?? existing.relationshipDraft,
  })

  return {
    data,
    revision: {
      stage: stageLabel,
      reason,
      actor,
      previousPayload,
      nextPayload,
    },
  }
}
