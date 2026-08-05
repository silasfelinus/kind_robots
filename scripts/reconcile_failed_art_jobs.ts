// scripts/reconcile_failed_art_jobs.ts
//
// Classifies every FAILED ArtJob, deletes superseded or irreparable rows, and
// returns repairable requests to PENDING in place. Dry-run is the default.
//
// Usage:
//   npx tsx scripts/reconcile_failed_art_jobs.ts
//   npx tsx scripts/reconcile_failed_art_jobs.ts --write

import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import {
  canonicalJson,
  enrichArtJobPayload,
  readArtJobProvenance,
} from '../server/utils/artJobProvenance'
import {
  parseArtJobPayload,
  serializeArtJobPayload,
  type ArtJobPayloadRecord,
} from '../server/utils/artJobPayload'
import { normalizeQueuedArtJobPayload } from '../server/utils/artJobNormalization'
import { refreshArtJobLoraResources } from '../server/utils/artJobResourceRefresh'
import {
  createScriptPrismaClient,
  withDatabaseRetry,
} from './lib/databaseRetry'

const WRITE = process.argv.includes('--write')
const OPERATION_ID = 'failed-artjobs-2026-08-05'
const ACTIVE_STATUSES = ['PENDING', 'RUNNING', 'DONE'] as const

type ErrorFamily =
  | 'SERVER_OR_NETWORK'
  | 'RESOURCE_OR_MODEL'
  | 'PAYLOAD_OR_WORKFLOW'
  | 'COMPLETION_OR_DELIVERY'
  | 'UNKNOWN'

type FailedJob = {
  id: number
  createdAt: Date
  updatedAt: Date | null
  engine: string
  projectSlug: string | null
  payload: string
  error: string | null
  attempts: number
  artImageId: number | null
}

type ActiveJob = {
  id: number
  status: string
  payload: string
}

type Decision = {
  id: number
  family: ErrorFamily
  action: 'REQUEUE' | 'DELETE'
  reason: string
  error: string
  payloadChanged: boolean
  imagePathChanged: boolean
  promptChanged: boolean
  loraPathChanged: boolean
}

function asRecord(value: unknown): ArtJobPayloadRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as ArtJobPayloadRecord
}

function cleanText(value: unknown, maxLength = 280): string {
  return String(value || '')
    .replace(/https?:\/\/[^\s)]+/gi, '[url]')
    .replace(/\b(?:bearer|token|api[_ -]?key)\s*[:=]\s*\S+/gi, '[credential]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

function errorFamily(value: unknown): ErrorFamily {
  const message = String(value || '')

  if (
    /ECONNREFUSED|ECONNRESET|ENOTFOUND|EHOSTUNREACH|fetch failed|network|timed? ?out|timeout|502|503|504|offline|unavailable|connection (?:closed|refused|reset)|server.*(?:down|unreachable)/i.test(
      message,
    )
  ) {
    return 'SERVER_OR_NETWORK'
  }

  if (
    /LoRA|checkpoint|model|node type|class_type|safetensors|ckpt|missing node|resource .*missing|not found in (?:the )?(?:model|resource|node)/i.test(
      message,
    )
  ) {
    return 'RESOURCE_OR_MODEL'
  }

  if (
    /payload|workflow|promptString|prompt metadata|imagePath|unsafe path|invalid request|malformed|unsupported|bad request|status 400|status 409|status 422/i.test(
      message,
    )
  ) {
    return 'PAYLOAD_OR_WORKFLOW'
  }

  if (
    /completion|provenance|ArtImage|upload|delivery|attach|entity art|persist|save-generated/i.test(
      message,
    )
  ) {
    return 'COMPLETION_OR_DELIVERY'
  }

  return 'UNKNOWN'
}

function retryRoot(payload: unknown): number | null {
  const retry = asRecord(parseArtJobPayload(payload).retry)
  const rootJobId = Number(retry.rootJobId)
  if (Number.isInteger(rootJobId) && rootJobId > 0) return rootJobId

  const sourceJobId = Number(retry.sourceJobId)
  return Number.isInteger(sourceJobId) && sourceJobId > 0
    ? sourceJobId
    : null
}

function targetKey(payload: unknown): string | null {
  const parsed = parseArtJobPayload(payload)
  const targetRepo = String(parsed.targetRepo || '').trim()
  const imagePath = String(parsed.imagePath || '').trim().replaceAll('\\', '/')

  if (targetRepo && imagePath) return `repo:${targetRepo}:${imagePath}`

  const entityArt = asRecord(parsed.entityArt)
  if (Object.keys(entityArt).length) {
    return `entity:${canonicalJson(entityArt)}`
  }

  return null
}

function rememberLatest(map: Map<string, number>, key: string | null, id: number) {
  if (!key) return
  const previous = map.get(key) || 0
  if (id > previous) map.set(key, id)
}

function activeIndexes(jobs: ActiveJob[]) {
  const idempotency = new Map<string, number>()
  const fingerprints = new Map<string, number>()
  const targets = new Map<string, number>()
  const roots = new Map<number, number>()

  for (const job of jobs) {
    const provenance = readArtJobProvenance(job.payload)
    rememberLatest(idempotency, provenance?.idempotencyKey || null, job.id)
    rememberLatest(fingerprints, provenance?.attemptFingerprint || null, job.id)
    rememberLatest(targets, targetKey(job.payload), job.id)

    const root = retryRoot(job.payload)
    if (root) roots.set(root, Math.max(roots.get(root) || 0, job.id))
  }

  return { idempotency, fingerprints, targets, roots }
}

function supersedingJobId(
  job: FailedJob,
  repairedPayload: ArtJobPayloadRecord,
  indexes: ReturnType<typeof activeIndexes>,
): number | null {
  const provenance = readArtJobProvenance(repairedPayload)
  const idempotentMatch = provenance?.idempotencyKey
    ? indexes.idempotency.get(provenance.idempotencyKey)
    : null
  if (idempotentMatch) return idempotentMatch

  const fingerprintMatch = provenance?.attemptFingerprint
    ? indexes.fingerprints.get(provenance.attemptFingerprint)
    : null
  if (fingerprintMatch) return fingerprintMatch

  const laterTarget = indexes.targets.get(targetKey(repairedPayload) || '')
  if (laterTarget && laterTarget > job.id) return laterTarget

  const root = retryRoot(repairedPayload)
  const laterRetry = root ? indexes.roots.get(root) : null
  if (laterRetry && laterRetry > job.id) return laterRetry

  return null
}

async function reconcile(): Promise<void> {
  const prisma = createScriptPrismaClient()

  try {
    const [failedJobs, activeJobs] = await Promise.all([
      prisma.artJob.findMany({
        where: { status: 'FAILED' },
        orderBy: { id: 'asc' },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          engine: true,
          projectSlug: true,
          payload: true,
          error: true,
          attempts: true,
          artImageId: true,
        },
      }),
      prisma.artJob.findMany({
        where: { status: { in: [...ACTIVE_STATUSES] } },
        select: {
          id: true,
          status: true,
          payload: true,
        },
      }),
    ])

    const indexes = activeIndexes(activeJobs as ActiveJob[])
    const decisions: Decision[] = []

    console.log(
      `[failed-artjobs] ${WRITE ? 'write' : 'dry-run'} start: ${failedJobs.length} FAILED row(s).`,
    )

    for (const row of failedJobs as FailedJob[]) {
      const family = errorFamily(row.error)
      const error = cleanText(row.error || 'Generation failed without an error message.')
      let repairedPayload: ArtJobPayloadRecord | null = null
      let imagePathChanged = false
      let promptChanged = false
      let loraPathChanged = false
      let reason = ''

      try {
        const parsed = parseArtJobPayload(row.payload)
        if (!Object.keys(parsed).length) {
          throw new Error('Payload is empty or invalid JSON.')
        }

        if (row.engine !== 'A1111' && row.engine !== 'COMFY') {
          throw new Error(`Unsupported ArtJob engine ${row.engine}.`)
        }

        const normalized = normalizeQueuedArtJobPayload(row.payload)
        const resources = await refreshArtJobLoraResources(normalized.payload)
        const priorProvenance = readArtJobProvenance(row.payload)
        const enriched = enrichArtJobPayload(row.engine, resources.payload, {
          projectSlug: row.projectSlug,
          idempotencyKey: priorProvenance?.idempotencyKey,
          requireCompletionProof: priorProvenance?.requireCompletionProof,
        })

        repairedPayload = enriched.payload
        imagePathChanged = normalized.imagePathChanged
        promptChanged = normalized.promptChanged
        loraPathChanged = resources.changed
      } catch (errorValue) {
        reason = `irreparable: ${cleanText(
          errorValue instanceof Error ? errorValue.message : errorValue,
        )}`
      }

      if (!repairedPayload) {
        if (WRITE) {
          await prisma.artJob.deleteMany({
            where: { id: row.id, status: 'FAILED' },
          })
        }
        decisions.push({
          id: row.id,
          family,
          action: 'DELETE',
          reason,
          error,
          payloadChanged: false,
          imagePathChanged,
          promptChanged,
          loraPathChanged,
        })
        continue
      }

      const supersededBy = supersedingJobId(row, repairedPayload, indexes)
      if (supersededBy) {
        reason = `superseded by active ArtJob ${supersededBy}`
        if (WRITE) {
          await prisma.artJob.deleteMany({
            where: { id: row.id, status: 'FAILED' },
          })
        }
        decisions.push({
          id: row.id,
          family,
          action: 'DELETE',
          reason,
          error,
          payloadChanged: serializeArtJobPayload(repairedPayload) !== row.payload,
          imagePathChanged,
          promptChanged,
          loraPathChanged,
        })
        continue
      }

      repairedPayload.queueRepair = {
        operationId: OPERATION_ID,
        repairedAt: new Date().toISOString(),
        previousErrorFamily: family,
        imagePathChanged,
        promptChanged,
        loraPathChanged,
      }

      const serializedPayload = serializeArtJobPayload(repairedPayload)
      if (WRITE) {
        const updated = await prisma.artJob.updateMany({
          where: { id: row.id, status: 'FAILED' },
          data: {
            payload: serializedPayload,
            status: 'PENDING',
            claimedAt: null,
            claimedBy: null,
            error: null,
            attempts: 0,
          },
        })

        if (updated.count !== 1) {
          throw new Error(`ArtJob ${row.id} changed while it was being reconciled.`)
        }
      }

      decisions.push({
        id: row.id,
        family,
        action: 'REQUEUE',
        reason: 'payload validated, normalized, and returned to PENDING in place',
        error,
        payloadChanged: serializedPayload !== row.payload,
        imagePathChanged,
        promptChanged,
        loraPathChanged,
      })
    }

    const grouped = new Map<
      string,
      { family: ErrorFamily; error: string; count: number; ids: number[] }
    >()

    for (const decision of decisions) {
      const key = `${decision.family}:${decision.error}`
      const group = grouped.get(key) || {
        family: decision.family,
        error: decision.error,
        count: 0,
        ids: [],
      }
      group.count += 1
      group.ids.push(decision.id)
      grouped.set(key, group)
    }

    const requeued = decisions.filter((decision) => decision.action === 'REQUEUE')
    const deleted = decisions.filter((decision) => decision.action === 'DELETE')

    console.log('[failed-artjobs] Failure groups:')
    for (const group of [...grouped.values()].sort((a, b) => b.count - a.count)) {
      console.log(
        `  ${group.family} x${group.count} ids=${group.ids.join(',')} :: ${group.error}`,
      )
    }

    console.log(
      `[failed-artjobs] Decisions: requeue=${requeued.length} delete=${deleted.length} imagePathRepairs=${requeued.filter((item) => item.imagePathChanged).length} promptRepairs=${requeued.filter((item) => item.promptChanged).length} loraRepairs=${requeued.filter((item) => item.loraPathChanged).length}.`,
    )

    for (const decision of deleted) {
      console.log(
        `[failed-artjobs] delete ${decision.id}: ${decision.reason}; previous=${decision.error}`,
      )
    }

    const remainingFailed = WRITE
      ? await prisma.artJob.count({ where: { status: 'FAILED' } })
      : failedJobs.length

    console.log(
      `[failed-artjobs] ${WRITE ? 'write' : 'dry-run'} complete: remaining FAILED=${remainingFailed}.`,
    )

    if (WRITE && remainingFailed !== 0) {
      throw new Error(
        `Failed ArtJob reconciliation left ${remainingFailed} FAILED row(s).`,
      )
    }
  } finally {
    await prisma.$disconnect()
  }
}

export async function main(): Promise<void> {
  await withDatabaseRetry('reconcile failed ArtJobs', async () => reconcile())
}

const isDirectRun = process.argv[1]
  ? fileURLToPath(import.meta.url) === fileURLToPath(new URL(process.argv[1], 'file:'))
  : false

if (isDirectRun) {
  main().catch((error) => {
    console.error('[failed-artjobs] reconciliation failed', error)
    process.exitCode = 1
  })
}
