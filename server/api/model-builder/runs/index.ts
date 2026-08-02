// /server/api/model-builder/runs/index.ts
import { createError, getRouterParam } from 'h3'
import type { H3Event } from 'h3'
import type {
  Prisma,
  ModelBuildStatus,
  ModelBuildItem,
} from '~/prisma/generated/prisma/client'
import { userIsAdmin } from '../../../utils/authUser'

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
  if (!userIsAdmin(user) && run.userId !== user.id) {
    throw createError({
      statusCode: 403,
      message: 'You do not have permission to modify this build run.',
    })
  }
}

// cancelRun() marks a run CANCELLED specifically so no further work lands on
// it — but that intent is enforced only client-side, and only for the one
// store instance that issued the cancellation: modelBuilderStore.ts's
// cancelledRunIds is an in-memory Set that guards a single tab's own
// in-flight calls racing the exact moment of cancellation, and cancelRun()
// only clears that tab's remembered-run localStorage key when the cancelled
// run happens to be the one currently open in that same tab. A second
// browser tab (or a later page load reading a stale `modelBuilder:runId`
// left behind because the cancellation happened in a different tab) has no
// way to learn the run was cancelled and would otherwise keep editing
// fields, generating assets, and even durably committing records into a run
// the user already told the app to abandon. Every write-capable item route
// must refuse once the run itself says it's done.
export function assertRunWritable(run: { status: ModelBuildStatus }): void {
  if (run.status === 'CANCELLED') {
    throw createError({
      statusCode: 409,
      message: 'This build run was cancelled and can no longer be modified.',
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

// A stage's content is only safe to overwrite while it is workable — ready,
// stale, or rejected. Mirrors modelBuilderStore.ts's isStageEditable, which
// the client uses to gate every content-editing call site (updatePitch/
// updateFields/updatePrompt, batchSetField). That gate is client-side only:
// this route trusted the client to have gotten there, so a direct PATCH (bad
// client state, a retried/replayed request, or just curl) for an item whose
// PITCH or FIELDS_AND_PROMPTS stage is already 'approved' (or still 'locked')
// could silently overwrite reviewed content while its badge keeps showing
// 'approved' — the same "review gate would be lying about what's actually
// stored" outcome commit.post.ts's own stage-approval gate exists to prevent,
// just reached through the item-edit route instead of the commit route.
//
// The same gap existed for artImageId against GENERATE_ASSETS: the store's
// own generateItemAsset/pollAsyncArtJob already refuse to overwrite an
// approved candidate mid-flight (verifyModelBuilderApprovedAssetGuard.ts),
// but that guard lives entirely client-side too, and this route applied
// body.artImageId unconditionally regardless of the item's actual
// GENERATE_ASSETS status. A direct PATCH for an item whose GENERATE_ASSETS
// is already 'approved' could silently repoint the item at a different
// ArtImage (any the caller may attach per assertArtImageAttachable — their
// own or public) with no re-review, while the stage badge kept showing
// 'approved' for the old, actually-reviewed image.
const CONTENT_STAGE_EDITABLE_STATUSES = new Set(['ready', 'stale', 'rejected'])

function assertContentStageEditable(
  stageStatuses: unknown,
  stageKey: 'PITCH' | 'FIELDS_AND_PROMPTS' | 'GENERATE_ASSETS',
  fieldLabel: string,
): void {
  const stages = parseStoredJson<Record<string, { status?: string }>>(
    stageStatuses,
    {},
  )
  const status = stages[stageKey]?.status
  if (status !== undefined && !CONTENT_STAGE_EDITABLE_STATUSES.has(status)) {
    throw createError({
      statusCode: 400,
      message: `${fieldLabel} cannot be edited while its stage is ${status}. Reopen the stage first.`,
    })
  }
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
  if (body.pitch !== undefined) {
    assertContentStageEditable(existing.stageStatuses, 'PITCH', 'Pitch')
    data.pitch = normalizeText(body.pitch)
  }
  if (body.fieldsDraft !== undefined) {
    assertContentStageEditable(
      existing.stageStatuses,
      'FIELDS_AND_PROMPTS',
      'Fields',
    )
    data.fieldsDraft = normalizeText(body.fieldsDraft)
  }
  if (body.promptDraft !== undefined) {
    assertContentStageEditable(
      existing.stageStatuses,
      'FIELDS_AND_PROMPTS',
      'Prompt',
    )
    data.promptDraft = normalizeText(body.promptDraft)
  }
  const relationshipDraft = normalizeJson(body.relationshipDraft)
  if (relationshipDraft !== undefined)
    data.relationshipDraft = relationshipDraft
  if (body.staleReason !== undefined)
    data.staleReason = normalizeText(body.staleReason)
  if (body.error !== undefined) data.error = normalizeText(body.error)
  if (body.artImageId !== undefined) {
    assertContentStageEditable(
      existing.stageStatuses,
      'GENERATE_ASSETS',
      'Art image',
    )
    data.artImageId = normalizeNullableId(body.artImageId)
  }
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
