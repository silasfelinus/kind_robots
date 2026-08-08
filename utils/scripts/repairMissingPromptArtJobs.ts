import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import {
  enrichArtJobPayload,
  readArtJobProvenance,
} from '../../server/utils/artJobProvenance'
import {
  parseArtJobPayload,
  serializeArtJobPayload,
  type ArtJobPayloadRecord,
} from '../../server/utils/artJobPayload'
import { normalizeQueuedArtJobPayload } from '../../server/utils/artJobNormalization'
import { refreshArtJobLoraResources } from '../../server/utils/artJobResourceRefresh'
import {
  createScriptPrismaClient,
  withDatabaseRetry,
} from '../../scripts/lib/databaseRetry'

const APPLY = process.argv.includes('--apply')
const DEFAULT_LIMIT = 200
const MAX_LIMIT = 1000
const KIND_ROBOTS_REPO = 'silasfelinus/kind_robots'

function asRecord(value: unknown): ArtJobPayloadRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as ArtJobPayloadRecord
}

function positiveInt(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function optionNumber(name: string, fallback: number): number {
  const index = process.argv.indexOf(name)
  if (index < 0) return fallback
  const value = Number(process.argv[index + 1])
  if (!Number.isFinite(value) || value <= 0) return fallback
  return Math.min(Math.floor(value), MAX_LIMIT)
}

function missingPromptFailure(error: unknown): boolean {
  const message = String(error || '')
  return (
    /requires a non-empty promptString/i.test(message) ||
    /missing promptString/i.test(message)
  )
}

function dailyDreamIdentity(payload: ArtJobPayloadRecord): {
  isDailyDream: boolean
  requestId: string | null
  targetChanged: boolean
} {
  const target = asRecord(payload.dailyDreamTarget)
  const conductor = asRecord(payload.conductorRequest)
  const source = String(target.source || conductor.source || '').trim().toLowerCase()
  const isDailyDream =
    source === 'dream-cycle' ||
    String(payload.collection || '').trim().toLowerCase() === 'dream-cycle'

  if (!isDailyDream) {
    return { isDailyDream: false, requestId: null, targetChanged: false }
  }

  let targetChanged = false
  const requestId = String(target.requestId || conductor.id || '').trim() || null
  const imagePath = String(target.imagePath || conductor.imagePath || '').trim()
  const sourceUrl = String(target.sourceUrl || conductor.sourceUrl || '').trim()

  if (imagePath && !String(payload.imagePath || '').trim()) {
    payload.imagePath = imagePath
    targetChanged = true
  }
  if (sourceUrl && !String(payload.sourceUrl || '').trim()) {
    payload.sourceUrl = sourceUrl
    targetChanged = true
  }
  if (imagePath && !String(payload.targetRepo || '').trim()) {
    payload.targetRepo = KIND_ROBOTS_REPO
    targetChanged = true
  }

  const entityId = positiveInt(target.entityId)
  const model = String(target.model || '').trim().toLowerCase()
  const entityType =
    model === 'dream'
      ? 'dream'
      : model === 'character'
        ? 'character'
        : model === 'reward'
          ? 'reward'
          : model === 'scenario'
            ? 'scenario'
            : null

  if (
    entityType &&
    entityId &&
    !Object.keys(asRecord(payload.entityArt)).length
  ) {
    payload.entityArt = {
      entityType,
      entityId,
      field: String(target.field || 'imagePath').trim() || 'imagePath',
      preserveOriginal: true,
      mode: 'recreate',
    }
    targetChanged = true
  }

  return { isDailyDream: true, requestId, targetChanged }
}

function promptPreview(value: unknown): string {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  return text.length > 120 ? `${text.slice(0, 117)}...` : text
}

async function repair(): Promise<void> {
  const prisma = createScriptPrismaClient()
  const limit = optionNumber('--limit', DEFAULT_LIMIT)

  try {
    const failed = await prisma.artJob.findMany({
      where: { status: 'FAILED' },
      orderBy: { id: 'desc' },
      take: limit,
      select: {
        id: true,
        engine: true,
        payload: true,
        priority: true,
        projectSlug: true,
        error: true,
      },
    })

    const candidates = failed.filter((job) => missingPromptFailure(job.error))
    console.log(
      `[prompt-repair] ${APPLY ? 'APPLY' : 'DRY RUN'}: ${candidates.length} missing-prompt failure(s) among ${failed.length} recent FAILED ArtJobs.`,
    )

    let repaired = 0
    let unresolved = 0
    let dailyDreamCount = 0
    let dailyDreamTargetsAdded = 0

    for (const job of candidates) {
      try {
        const parsed = structuredClone(parseArtJobPayload(job.payload))
        const daily = dailyDreamIdentity(parsed)
        if (daily.isDailyDream) dailyDreamCount += 1
        if (daily.targetChanged) dailyDreamTargetsAdded += 1

        const normalized = normalizeQueuedArtJobPayload(parsed)
        const resources = await refreshArtJobLoraResources(normalized.payload)
        const prior = readArtJobProvenance(job.payload)
        const projectSlug = daily.isDailyDream
          ? 'dream-cycle'
          : job.projectSlug
        const { payload } = enrichArtJobPayload(
          job.engine as 'A1111' | 'COMFY',
          resources.payload,
          {
            projectSlug,
            idempotencyKey: prior?.idempotencyKey || daily.requestId,
            requireCompletionProof: prior?.requireCompletionProof,
          },
        )

        payload.queueRepair = {
          ...asRecord(payload.queueRepair),
          repairedAt: new Date().toISOString(),
          reason: 'missing-top-level-prompt-recovered-from-workflow',
          previousError: String(job.error || '').slice(0, 1000),
          dailyDreamTargetRepaired: daily.targetChanged,
          imagePathChanged: normalized.imagePathChanged,
          loraPathChanged: resources.changed,
        }

        console.log(
          `[prompt-repair] ${job.id}: recoverable${daily.isDailyDream ? ' [dream-cycle]' : ''} prompt="${promptPreview(payload.promptString)}"${daily.targetChanged ? ' + target metadata' : ''}`,
        )

        if (APPLY) {
          const updated = await prisma.artJob.updateMany({
            where: { id: job.id, status: 'FAILED' },
            data: {
              payload: serializeArtJobPayload(payload),
              status: 'PENDING',
              attempts: 0,
              claimedAt: null,
              claimedBy: null,
              error: null,
              projectSlug,
              priority: daily.isDailyDream ? 100 : job.priority,
            },
          })

          if (updated.count !== 1) {
            throw new Error(`ArtJob ${job.id} changed while it was being repaired.`)
          }
        }

        repaired += 1
      } catch (error) {
        unresolved += 1
        console.log(
          `[prompt-repair] ${job.id}: SKIP ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }

    console.log(
      `[prompt-repair] summary: recoverable=${repaired} unresolved=${unresolved} dream-cycle=${dailyDreamCount} dream-target-metadata-added=${dailyDreamTargetsAdded}${APPLY ? ' (requeued in place)' : ' (no writes)'}.`,
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function main(): Promise<void> {
  await withDatabaseRetry('repair missing ArtJob prompts', async () => repair())
}

const isDirectRun = process.argv[1]
  ? fileURLToPath(import.meta.url) === fileURLToPath(new URL(process.argv[1], 'file:'))
  : false

if (isDirectRun) {
  main().catch((error) => {
    console.error('[prompt-repair] failed', error)
    process.exitCode = 1
  })
}
