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

// `maxLength`/`field` are optional so existing unbounded callers keep their
// current behavior, but every caller writing into a fixed-width DB column
// (VarChar) MUST pass one — without it, a value longer than the column
// allows reaches Prisma unchecked and MySQL rejects the write with a raw
// "Data too long for column 'N'" error (strict mode; a silent truncation
// otherwise), which surfaces as an opaque 500 instead of the clean 400
// every sibling field already returns (model-builder/t-029, cycle 45):
// `label`/`generation`/`outputKey`/`recipeVersion`/`stage`/`reason` are all
// validated with an explicit cap
// via requiredString or `.slice(0, N)`, but `sourceLabel` on the run PATCH
// route (runs/[id].patch.ts), and `staleReason`/`targetType` on the item
// PATCH routes, called this function with no cap at all — even though the
// run CREATE route (runs/index.post.ts) already truncates `sourceLabel` to
// 255 chars, so the same field was validated on create and not on update.
export function normalizeText(
  value: unknown,
  opts?: { maxLength?: number; field?: string },
): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, message: 'Expected a text value.' })
  }
  if (opts?.maxLength !== undefined && value.length > opts.maxLength) {
    throw createError({
      statusCode: 400,
      message: `"${opts.field ?? 'value'}" must be ${opts.maxLength} characters or fewer.`,
    })
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
  // Present only when the request's stageStatuses differs from the item as it
  // stood when this request was validated (`existing`) — the specific stage
  // keys that changed, not the whole blob. `data` deliberately does NOT carry
  // a `stageStatuses` write: the caller must merge these keys onto a *fresh*
  // read of the item immediately before its own transaction write (see
  // mergeStageStatusChanges below) rather than writing this object directly,
  // or a concurrent write to a stage this request never touched gets clobbered.
  stageStatusChanges: Record<string, unknown> | null
  // Every assertContentStageEditable(existing.stageStatuses, ...) call this
  // invocation performed, so the caller can re-run the identical check a
  // second time against a value read immediately before the write (model-
  // builder/t-029): the check above only ever sees `existing`, a single
  // findUnique done once at request start, before readBody/artImageId
  // validation/the transaction even open. A concurrent request that changes
  // this same stage's status (most plainly: approveStage, which writes only
  // stageStatuses, never pitch/fieldsDraft/promptDraft/artImageId) can land
  // in the window between that read and this request's own write — the
  // eager check above then okays a content write against a status that is
  // no longer current, silently overwriting an approved stage's content
  // while its badge keeps showing 'approved', exactly the outcome this gate
  // exists to prevent. Empty when this request touched no gated field.
  contentStageChecks: Array<{ stageKey: ContentStageKey; fieldLabel: string }>
}

// The client always sends item.stages in full — every stage key, including
// ones this particular action didn't touch — because that's simply what its
// local reactive state looks like at click time (mirrors every other
// stageStatuses payload in modelBuilderStore.ts: pushItem, batchPushItems,
// recordArtifact's callers). Writing that whole blob straight to the DB
// column (the pre-fix behavior here) silently discards any OTHER stage key
// a concurrent request changed in the window between this request's
// `existing` read and its own eventual write — the exact class of bug
// commit.post.ts's stageStatuses merge (see its own header comment) already
// fixes for the COMMIT key specifically. Generalizes the same fix to every
// PATCH-driven stage-status write: diff the request against its own
// `existing` snapshot to find which keys it actually intends to change, then
// (in the caller, right before the real write) merge only those keys onto
// whatever is currently in the DB — never the stale `existing` copy.
export function diffStageStatusChanges(
  existingRaw: unknown,
  requestedRaw: string,
): Record<string, unknown> | null {
  const existingStages = parseStoredJson<Record<string, unknown>>(
    existingRaw,
    {},
  )
  const requestedStages = parseStoredJson<Record<string, unknown>>(
    requestedRaw,
    {},
  )
  const changes: Record<string, unknown> = {}
  for (const key of Object.keys(requestedStages)) {
    if (
      JSON.stringify(requestedStages[key]) !==
      JSON.stringify(existingStages[key])
    ) {
      changes[key] = requestedStages[key]
    }
  }
  return Object.keys(changes).length ? changes : null
}

// Applies a stage-status diff (from diffStageStatusChanges) onto a freshly
// read stageStatuses value. Callers must fetch `currentRaw` immediately
// before the write this feeds, not reuse any earlier-in-the-request snapshot
// — see PreparedItemUpdate.stageStatusChanges' doc comment for why.
export function mergeStageStatusChanges(
  currentRaw: unknown,
  changes: Record<string, unknown> | null,
): string | undefined {
  if (!changes) return undefined
  const current = parseStoredJson<Record<string, unknown>>(currentRaw, {})
  return JSON.stringify({ ...current, ...changes })
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

export type ContentStageKey = 'PITCH' | 'FIELDS_AND_PROMPTS' | 'GENERATE_ASSETS'

// pitch/fieldsDraft/promptDraft are `@db.Text` (prisma/model-builder.prisma)
// -- MySQL TEXT, a real 65,535-*byte* limit (not unbounded the way Postgres
// TEXT is), so an oversized multi-byte value can still trip the same "Data
// too long for column" write failure the VarChar fields above risk, just at
// a much higher character count for typical text. Capped at the application
// layer (model-builder/t-029, cycle 45) so a runaway AI draft response or a
// direct API call can't wedge an arbitrarily large blob into an item's
// editable content. Matches commit.post.ts's own LONG_TEXT_MAX (20000) --
// the cap its pickText() already applies to this same content at commit
// time (see verifyModelBuilderCommitTextTruncationGuard.ts) -- rather than
// picking an independent number, so a draft can never grow past what commit
// would keep anyway.
export const MAX_DRAFT_TEXT_LENGTH = 20_000

// Exported so callers can re-run this exact check a second time, against a
// freshly-read stageStatuses value immediately before their write — see
// PreparedItemUpdate.contentStageChecks' doc comment for why the single
// check performed inside prepareItemUpdate below (against the request-start
// `existing` snapshot) is not sufficient on its own.
export function assertContentStageEditable(
  stageStatuses: unknown,
  stageKey: ContentStageKey,
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
  const contentStageChecks: PreparedItemUpdate['contentStageChecks'] = []

  let stageStatusChanges: Record<string, unknown> | null = null
  if (body.stageStatuses !== undefined && body.stageStatuses !== null) {
    const stageStatuses = normalizeJson(body.stageStatuses)
    // Deliberately not assigned straight onto `data.stageStatuses` here — see
    // PreparedItemUpdate.stageStatusChanges' doc comment. The caller merges
    // these changed keys onto a fresh read at write time instead.
    if (typeof stageStatuses === 'string') {
      stageStatusChanges = diffStageStatusChanges(
        existing.stageStatuses,
        stageStatuses,
      )
    }
  }
  if (body.pitch !== undefined) {
    assertContentStageEditable(existing.stageStatuses, 'PITCH', 'Pitch')
    contentStageChecks.push({ stageKey: 'PITCH', fieldLabel: 'Pitch' })
    data.pitch = normalizeText(body.pitch, {
      maxLength: MAX_DRAFT_TEXT_LENGTH,
      field: 'Pitch',
    })
  }
  if (body.fieldsDraft !== undefined) {
    assertContentStageEditable(
      existing.stageStatuses,
      'FIELDS_AND_PROMPTS',
      'Fields',
    )
    contentStageChecks.push({
      stageKey: 'FIELDS_AND_PROMPTS',
      fieldLabel: 'Fields',
    })
    data.fieldsDraft = normalizeText(body.fieldsDraft, {
      maxLength: MAX_DRAFT_TEXT_LENGTH,
      field: 'Fields',
    })
  }
  if (body.promptDraft !== undefined) {
    assertContentStageEditable(
      existing.stageStatuses,
      'FIELDS_AND_PROMPTS',
      'Prompt',
    )
    contentStageChecks.push({
      stageKey: 'FIELDS_AND_PROMPTS',
      fieldLabel: 'Prompt',
    })
    data.promptDraft = normalizeText(body.promptDraft, {
      maxLength: MAX_DRAFT_TEXT_LENGTH,
      field: 'Prompt',
    })
  }
  if (body.relationshipDraft !== undefined) {
    assertContentStageEditable(
      existing.stageStatuses,
      'FIELDS_AND_PROMPTS',
      'Relationships',
    )
    contentStageChecks.push({
      stageKey: 'FIELDS_AND_PROMPTS',
      fieldLabel: 'Relationships',
    })
  }
  const relationshipDraft = normalizeJson(body.relationshipDraft)
  if (relationshipDraft !== undefined)
    data.relationshipDraft = relationshipDraft
  if (body.staleReason !== undefined)
    // staleReason is `@db.VarChar(255)` -- capped so an oversized value gets
    // a clean 400 here instead of reaching Prisma unchecked and failing at
    // the DB with a raw "Data too long for column" error (model-builder/
    // t-029, cycle 45).
    data.staleReason = normalizeText(body.staleReason, {
      maxLength: 255,
      field: 'Stale reason',
    })
  // error is `@db.Text` -- an unbounded column; no cap needed here, this is
  // server-set diagnostic text, not user-authored content.
  if (body.error !== undefined) data.error = normalizeText(body.error)
  if (body.artImageId !== undefined) {
    assertContentStageEditable(
      existing.stageStatuses,
      'GENERATE_ASSETS',
      'Art image',
    )
    contentStageChecks.push({
      stageKey: 'GENERATE_ASSETS',
      fieldLabel: 'Art image',
    })
    data.artImageId = normalizeNullableId(body.artImageId)
  }
  if (body.targetType !== undefined)
    // targetType is `@db.VarChar(64)`. The only client-writable route into
    // prepareItemUpdate (items/[id].patch.ts, items/batch.patch.ts) already
    // rejects any request body carrying targetType before it ever reaches
    // here (patch-policy.ts's assertItemPatchFieldsAreClientWritable) --
    // this branch is currently dead for client input, reached only if a
    // future caller of prepareItemUpdate skips that check. Capped anyway,
    // matching this same file's other defense-in-depth checks (see
    // assertRunWritable's doc comment), so that stays true if it changes.
    data.targetType = normalizeText(body.targetType, {
      maxLength: 64,
      field: 'Target type',
    })
  if (body.targetId !== undefined)
    data.targetId = normalizeNullableId(body.targetId)

  const contentChanged =
    body.pitch !== undefined ||
    body.fieldsDraft !== undefined ||
    body.promptDraft !== undefined ||
    body.relationshipDraft !== undefined

  if (!contentChanged)
    return { data, revision: null, stageStatusChanges, contentStageChecks }

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
  // Audit-record only, not the live write — mergeStageStatusChanges applied
  // against this same request's own `existing` snapshot documents what this
  // request intended to change, same base as previousPayload above. The
  // actual DB write (see mergeStageStatusChanges call sites in the PATCH
  // routes) merges stageStatusChanges onto a fresh read at write time
  // instead, which is deliberately allowed to differ from this record when a
  // concurrent request also touched stageStatuses in between.
  const nextPayload = JSON.stringify({
    pitch: data.pitch ?? existing.pitch,
    fieldsDraft: data.fieldsDraft ?? existing.fieldsDraft,
    promptDraft: data.promptDraft ?? existing.promptDraft,
    stageStatuses:
      mergeStageStatusChanges(existing.stageStatuses, stageStatusChanges) ??
      existing.stageStatuses,
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
    stageStatusChanges,
    contentStageChecks,
  }
}
