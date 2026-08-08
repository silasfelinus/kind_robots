// /server/utils/artJobQueueCoverage.ts
//
// Claim-time queue hygiene for baseline artwork.
//
// The ArtJob fingerprint protects against byte-equivalent re-enqueues, but it
// deliberately treats a different seed/workflow/slot as a different attempt.
// That is correct for explicit rerenders and terrible for a coverage backlog:
// the Facet catalog historically queued imagePath + iconPath + cardPath +
// heroPath independently, so one database object could consume four renders
// while another object still had none.
//
// This module applies two conservative rules immediately before claim:
//   1. Facet baseline coverage keeps at most ONE active slot job, preferring
//      imagePath -> cardPath -> heroPath -> iconPath. Existing art satisfies the
//      baseline and cancels still-pending coverage work. RUNNING work is never
//      cancelled.
//   2. Static delivery jobs with the exact same repo + path + normalized prompt
//      are duplicate work. Keep the candidate (or an already-RUNNING sibling)
//      and cancel the other PENDING copies.
//
// Explicit retries carry payload.retry and are excluded from both policies.
// Cancellation preserves the ArtJob row/provenance while removing it from the
// runnable queue.

import type { ArtJob } from '~/prisma/generated/prisma/client'
import prisma from './prisma'
import { parseArtJobPayload } from './artJobPayload'
import { assertArtPromptContract } from './artPromptContract'
import { normalizeArtPrompt } from './artJobProvenance'

export const FACET_COVERAGE_FIELD_ORDER = [
  'imagePath',
  'cardPath',
  'heroPath',
  'iconPath',
] as const

type QueueCandidate = Pick<
  ArtJob,
  'id' | 'status' | 'projectSlug' | 'payload' | 'priority' | 'engine'
>

type JsonRecord = Record<string, unknown>

type CoverageResult = {
  skipCandidate: boolean
  cancelledCount: number
  reason?: string
}

type FacetCoverageTarget = {
  facetId: number
  field: string
}

type StaticDeliveryTarget = {
  targetRepo: string
  imagePath: string
  prompt: string
}

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as JsonRecord
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function positiveInteger(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function finiteNumber(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function hasRetry(payload: unknown): boolean {
  return Object.keys(asRecord(asRecord(payload).retry)).length > 0
}

function workflowNodes(payload: unknown): JsonRecord[] {
  return Object.values(asRecord(asRecord(payload).workflow)).map(asRecord)
}

/** Infer the model family from the actual Comfy graph, not only relay engine. */
export function inferQueuedArtEngine(
  payload: unknown,
  fallbackEngine?: string | null,
): string {
  const record = asRecord(payload)
  const explicit = clean(record.engine).toLowerCase()
  if (explicit && explicit !== 'comfy') return explicit

  let sawCheckpointLoader = false
  for (const node of workflowNodes(record)) {
    const classType = clean(node.class_type)
    const inputs = asRecord(node.inputs)
    const clipType = clean(inputs.type).toLowerCase()
    const modelName = `${clean(inputs.unet_name)} ${clean(inputs.ckpt_name)}`.toLowerCase()

    if (clipType === 'krea2' || modelName.includes('krea-2')) return 'krea2'
    if (clipType === 'flux2' || modelName.includes('flux-2-klein')) return 'flux2'
    if (classType === 'FluxGuidance' || clipType === 'flux') return 'flux'
    if (classType === 'CheckpointLoaderSimple') sawCheckpointLoader = true
  }

  if (sawCheckpointLoader) return 'comfy'
  return clean(fallbackEngine).toLowerCase()
}

/** Read the settings the sampler will actually execute. */
export function queuedArtSamplerSettings(payload: unknown): {
  steps: number | null
  cfg: number | null
} {
  const record = asRecord(payload)
  for (const node of workflowNodes(record)) {
    if (clean(node.class_type) !== 'KSampler') continue
    const inputs = asRecord(node.inputs)
    return {
      steps: finiteNumber(inputs.steps) ?? finiteNumber(record.steps),
      cfg: finiteNumber(inputs.cfg) ?? finiteNumber(record.cfg),
    }
  }
  return {
    steps: finiteNumber(record.steps),
    cfg: finiteNumber(record.cfg),
  }
}

function queuedArtPrompt(payload: unknown): string {
  const record = asRecord(payload)
  const topLevel = clean(record.promptString) || clean(record.prompt)
  if (topLevel) return topLevel

  for (const node of workflowNodes(record)) {
    const classType = clean(node.class_type)
    if (classType !== 'CLIPTextEncode' && classType !== 'ImpactWildcardEncode') {
      continue
    }
    const title = clean(asRecord(node._meta).title).toLowerCase()
    if (title.includes('negative')) continue
    const inputs = asRecord(node.inputs)
    const prompt = clean(inputs.text) || clean(inputs.wildcard_text)
    if (prompt) return prompt
  }
  return ''
}

/**
 * Apply today's prompt/model contract to old PENDING rows too. The enqueue gate
 * protects new work; this guard stops pre-gate backlog rows from quietly
 * rendering with stale Krea settings or known-bad prompt vocabulary.
 */
export function assertQueuedArtPromptContract(
  engine: string,
  payload: unknown,
): void {
  const actualEngine = inferQueuedArtEngine(payload, engine)
  const sampler = queuedArtSamplerSettings(payload)
  assertArtPromptContract({
    prompt: queuedArtPrompt(payload),
    engine: actualEngine,
    steps: sampler.steps,
    cfg: sampler.cfg,
  })
}

export function readFacetCoverageTarget(
  payload: unknown,
): FacetCoverageTarget | null {
  const record = asRecord(payload)
  if (hasRetry(record)) return null
  const entityArt = asRecord(record.entityArt)
  if (clean(entityArt.entityType).toLowerCase() !== 'facet') return null
  const facetId = positiveInteger(entityArt.entityId)
  const field = clean(entityArt.field)
  if (!facetId || !field) return null
  return { facetId, field }
}

function readStaticDeliveryTarget(payload: unknown): StaticDeliveryTarget | null {
  const record = asRecord(payload)
  if (hasRetry(record)) return null
  const targetRepo = clean(record.targetRepo).toLowerCase()
  const imagePath = clean(record.imagePath).replace(/\\/g, '/')
  const prompt = normalizeArtPrompt(queuedArtPrompt(record))
  if (!targetRepo || !imagePath || !prompt) return null
  return { targetRepo, imagePath, prompt }
}

function fieldRank(field: string): number {
  const index = FACET_COVERAGE_FIELD_ORDER.indexOf(
    field as (typeof FACET_COVERAGE_FIELD_ORDER)[number],
  )
  return index === -1 ? FACET_COVERAGE_FIELD_ORDER.length : index
}

export function selectFacetCoverageKeeper<
  T extends { id: number; priority: number; field: string },
>(jobs: T[]): T | null {
  if (!jobs.length) return null
  return [...jobs].sort((left, right) => {
    const byField = fieldRank(left.field) - fieldRank(right.field)
    if (byField) return byField
    const byPriority = right.priority - left.priority
    if (byPriority) return byPriority
    return left.id - right.id
  })[0]!
}

async function cancelPending(ids: number[], reason: string): Promise<number> {
  const uniqueIds = [...new Set(ids)].filter((id) => Number.isInteger(id) && id > 0)
  if (!uniqueIds.length) return 0
  const result = await prisma.artJob.updateMany({
    where: {
      id: { in: uniqueIds },
      status: 'PENDING',
    },
    data: {
      status: 'CANCELLED',
      claimedAt: null,
      claimedBy: null,
      error: reason.slice(0, 4000),
    },
  })
  return result.count
}

async function reconcileFacetCoverage(
  candidate: QueueCandidate,
  parsedPayload: JsonRecord,
): Promise<CoverageResult | null> {
  if (candidate.status !== 'PENDING' || candidate.projectSlug !== 'facet-catalog') {
    return null
  }
  const target = readFacetCoverageTarget(parsedPayload)
  if (!target) return null

  const facet = await prisma.facet.findUnique({
    where: { id: target.facetId },
    select: {
      imagePath: true,
      cardPath: true,
      heroPath: true,
      iconPath: true,
      artImageId: true,
    },
  })

  if (!facet) {
    const cancelledCount = await cancelPending(
      [candidate.id],
      `Cancelled before claim: Facet ${target.facetId} no longer exists.`,
    )
    return {
      skipCandidate: cancelledCount > 0,
      cancelledCount,
      reason: 'missing-facet',
    }
  }

  const marker = `\"entityType\":\"facet\",\"entityId\":${target.facetId},`
  const siblings = await prisma.artJob.findMany({
    where: {
      projectSlug: 'facet-catalog',
      status: { in: ['PENDING', 'RUNNING'] },
      payload: { contains: marker },
    },
    select: {
      id: true,
      status: true,
      priority: true,
      payload: true,
    },
  })

  const active = siblings
    .map((job) => ({
      ...job,
      target: readFacetCoverageTarget(parseArtJobPayload(job.payload)),
    }))
    .filter((job) => job.target?.facetId === target.facetId)

  const hasDisplayArt = Boolean(
    clean(facet.imagePath) ||
      clean(facet.cardPath) ||
      clean(facet.heroPath) ||
      clean(facet.iconPath) ||
      facet.artImageId,
  )

  if (hasDisplayArt) {
    const pendingIds = active
      .filter((job) => job.status === 'PENDING')
      .map((job) => job.id)
    const cancelledCount = await cancelPending(
      pendingIds,
      `Cancelled before claim: Facet ${target.facetId} already has display artwork; baseline coverage is satisfied.`,
    )
    return {
      skipCandidate: pendingIds.includes(candidate.id),
      cancelledCount,
      reason: 'facet-already-covered',
    }
  }

  const running = active.find((job) => job.status === 'RUNNING')
  if (running) {
    const pendingIds = active
      .filter((job) => job.status === 'PENDING')
      .map((job) => job.id)
    const cancelledCount = await cancelPending(
      pendingIds,
      `Cancelled before claim: ArtJob ${running.id} is already rendering baseline art for Facet ${target.facetId}.`,
    )
    return {
      skipCandidate: pendingIds.includes(candidate.id),
      cancelledCount,
      reason: 'facet-coverage-running',
    }
  }

  const pending = active
    .filter(
      (job): job is typeof job & { target: FacetCoverageTarget } =>
        job.status === 'PENDING' && Boolean(job.target),
    )
    .map((job) => ({
      id: job.id,
      priority: job.priority,
      field: job.target.field,
    }))

  // A payload search from an older serialization may fail to return the current
  // row. Keep the candidate in the decision set so it can never cancel itself
  // merely because its siblings were encoded differently.
  if (!pending.some((job) => job.id === candidate.id)) {
    pending.push({
      id: candidate.id,
      priority: candidate.priority,
      field: target.field,
    })
  }

  const keeper = selectFacetCoverageKeeper(pending)
  if (!keeper) return null
  const duplicateIds = pending
    .filter((job) => job.id !== keeper.id)
    .map((job) => job.id)
  const cancelledCount = await cancelPending(
    duplicateIds,
    `Cancelled before claim: Facet ${target.facetId} needs one baseline image, not four. Keeping ArtJob ${keeper.id} (${keeper.field}); fallback order is imagePath → cardPath → heroPath → iconPath.`,
  )

  return {
    skipCandidate: candidate.id !== keeper.id,
    cancelledCount,
    reason: duplicateIds.length ? 'facet-coverage-deduped' : undefined,
  }
}

async function reconcileStaticDelivery(
  candidate: QueueCandidate,
  parsedPayload: JsonRecord,
): Promise<CoverageResult | null> {
  if (candidate.status !== 'PENDING') return null
  const target = readStaticDeliveryTarget(parsedPayload)
  if (!target) return null

  const pathNeedle = `\"imagePath\":${JSON.stringify(target.imagePath)}`
  const siblings = await prisma.artJob.findMany({
    where: {
      status: { in: ['PENDING', 'RUNNING'] },
      payload: { contains: pathNeedle },
    },
    select: {
      id: true,
      status: true,
      payload: true,
    },
  })

  const matching = siblings.filter((job) => {
    const siblingTarget = readStaticDeliveryTarget(parseArtJobPayload(job.payload))
    return (
      siblingTarget?.targetRepo === target.targetRepo &&
      siblingTarget.imagePath === target.imagePath &&
      siblingTarget.prompt === target.prompt
    )
  })

  const running = matching.find((job) => job.status === 'RUNNING')
  const keeperId = running?.id ?? candidate.id
  const duplicateIds = matching
    .filter((job) => job.status === 'PENDING' && job.id !== keeperId)
    .map((job) => job.id)

  const cancelledCount = await cancelPending(
    duplicateIds,
    `Cancelled before claim: duplicate static delivery for ${target.targetRepo}:${target.imagePath}. Keeping ArtJob ${keeperId}.`,
  )

  return {
    skipCandidate: keeperId !== candidate.id,
    cancelledCount,
    reason: duplicateIds.length ? 'static-delivery-deduped' : undefined,
  }
}

/**
 * Reconcile only the candidate's small equivalence class. This avoids a 2,600
 * row sweep on every relay poll while still deleting redundant work naturally
 * as the queue drains.
 */
export async function reconcileQueuedArtJobCoverage(
  candidate: QueueCandidate,
): Promise<CoverageResult> {
  const parsedPayload = parseArtJobPayload(candidate.payload)
  const facet = await reconcileFacetCoverage(candidate, parsedPayload)
  if (facet) return facet
  const staticDelivery = await reconcileStaticDelivery(candidate, parsedPayload)
  if (staticDelivery) return staticDelivery
  return { skipCandidate: false, cancelledCount: 0 }
}
