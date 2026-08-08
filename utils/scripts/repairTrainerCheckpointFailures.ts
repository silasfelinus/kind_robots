import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import { ResourceType } from '../../prisma/generated/prisma/client'
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
import { applyResolvedCheckpointResourceToArtJobPayload } from '../../server/utils/artJobResourceRefresh'
import {
  createScriptPrismaClient,
  withDatabaseRetry,
} from '../../scripts/lib/databaseRetry'

const APPLY = process.argv.includes('--apply')
const DEFAULT_LIMIT = 100
const MAX_LIMIT = 1000

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

function normalizePath(value: unknown): string {
  return typeof value === 'string'
    ? value.trim().replaceAll('\\', '/')
    : ''
}

function normalizeIdentity(value: unknown): string {
  return normalizePath(value).toLowerCase()
}

function basename(value: unknown): string {
  const normalized = normalizeIdentity(value).replace(/^\/+|\/+$/g, '')
  return normalized.split('/').pop() || ''
}

function checkpointFailure(error: unknown): boolean {
  const message = String(error || '')
  return (
    /CheckpointLoaderSimple|ckpt_name/i.test(message) &&
    /value_not_in_list|value not in list/i.test(message)
  )
}

function workflowCheckpoint(payload: ArtJobPayloadRecord): string | null {
  const workflow = asRecord(payload.workflow)
  for (const nodeValue of Object.values(workflow)) {
    const node = asRecord(nodeValue)
    if (String(node.class_type || '') !== 'CheckpointLoaderSimple') continue
    const checkpoint = normalizePath(asRecord(node.inputs).ckpt_name)
    if (checkpoint) return checkpoint
  }
  return normalizePath(payload.checkpoint) || null
}

async function resolveCheckpoint(
  prisma: ReturnType<typeof createScriptPrismaClient>,
  input: {
    resourceIds: Array<number | null>
    names: unknown[]
  },
): Promise<{ id: number; localPath: string } | null> {
  for (const id of input.resourceIds) {
    if (!id) continue
    const resource = await prisma.resource.findFirst({
      where: {
        id,
        isActive: true,
        resourceType: ResourceType.CHECKPOINT,
      },
      select: { id: true, localPath: true },
    })
    const localPath = normalizePath(resource?.localPath)
    if (resource && localPath) return { id: resource.id, localPath }
  }

  const requested = [...new Set(input.names.map(normalizeIdentity).filter(Boolean))]
  if (!requested.length) return null
  const requestedBasenames = new Set(requested.map(basename).filter(Boolean))

  const resources = await prisma.resource.findMany({
    where: {
      isActive: true,
      resourceType: ResourceType.CHECKPOINT,
    },
    select: {
      id: true,
      name: true,
      customLabel: true,
      localPath: true,
    },
    orderBy: { id: 'asc' },
  })

  const exact = resources.filter((resource) =>
    [resource.localPath, resource.name, resource.customLabel]
      .map(normalizeIdentity)
      .filter(Boolean)
      .some((identity) => requested.includes(identity)),
  )
  const byBasename = resources.filter((resource) => {
    const candidate = basename(resource.localPath || resource.name)
    return candidate && requestedBasenames.has(candidate)
  })
  const matches = exact.length ? exact : byBasename
  const distinct = [...new Map(matches.map((resource) => [resource.id, resource])).values()]

  if (distinct.length !== 1) return null
  const resource = distinct[0]!
  const localPath = normalizePath(resource.localPath)
  return localPath ? { id: resource.id, localPath } : null
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

    const candidates = failed.filter((job) => {
      const trainer = asRecord(parseArtJobPayload(job.payload).trainerRedo)
      return (
        job.engine === 'COMFY' &&
        String(trainer.model || '').toUpperCase() === 'SDXL' &&
        checkpointFailure(job.error)
      )
    })

    console.log(
      `[trainer-checkpoint-repair] ${APPLY ? 'APPLY' : 'DRY RUN'}: ${candidates.length} SDXL trainer checkpoint failure(s) among ${failed.length} recent FAILED ArtJobs.`,
    )

    let recoverable = 0
    let unresolved = 0

    for (const job of candidates) {
      try {
        const original = parseArtJobPayload(job.payload)
        const trainer = asRecord(original.trainerRedo)
        const failedResources = asRecord(original.resources)
        const sourceArtImageId = positiveInt(trainer.sourceArtImageId)
        const sourceJobId = positiveInt(trainer.sourceJobId)

        if (!sourceArtImageId) {
          throw new Error('trainerRedo.sourceArtImageId is missing.')
        }

        const [sourceImage, sourceJob] = await Promise.all([
          prisma.artImage.findUnique({
            where: { id: sourceArtImageId },
            select: {
              checkpointResourceId: true,
              checkpoint: true,
            },
          }),
          sourceJobId
            ? prisma.artJob.findUnique({
                where: { id: sourceJobId },
                select: { payload: true },
              })
            : Promise.resolve(null),
        ])

        if (!sourceImage) {
          throw new Error(`Source ArtImage ${sourceArtImageId} no longer exists.`)
        }

        const sourcePayload = sourceJob
          ? parseArtJobPayload(sourceJob.payload)
          : ({} as ArtJobPayloadRecord)
        const sourceResources = asRecord(sourcePayload.resources)
        const resource = await resolveCheckpoint(prisma, {
          resourceIds: [
            positiveInt(trainer.checkpointResourceId),
            positiveInt(failedResources.checkpointResourceId),
            positiveInt(sourceImage.checkpointResourceId),
            positiveInt(sourceResources.checkpointResourceId),
            positiveInt(sourcePayload.checkpointResourceId),
          ],
          names: [
            trainer.checkpointName,
            failedResources.checkpointName,
            sourceImage.checkpoint,
            sourceResources.checkpointName,
            sourcePayload.checkpoint,
          ],
        })

        if (!resource) {
          throw new Error(
            `Could not uniquely resolve source ArtImage ${sourceArtImageId} to an active CHECKPOINT Resource.`,
          )
        }

        const oldCheckpoint = workflowCheckpoint(original)
        if (
          oldCheckpoint &&
          normalizeIdentity(oldCheckpoint) === normalizeIdentity(resource.localPath)
        ) {
          throw new Error(
            `Resource ${resource.id} still points at rejected checkpoint "${resource.localPath}"; repair the checkpoint Resource catalog before requeueing.`,
          )
        }

        const refreshed = applyResolvedCheckpointResourceToArtJobPayload(
          original,
          resource,
        )
        const normalized = normalizeQueuedArtJobPayload(refreshed.payload)
        const prior = readArtJobProvenance(job.payload)
        const enriched = enrichArtJobPayload('COMFY', normalized.payload, {
          projectSlug: job.projectSlug,
          idempotencyKey: prior?.idempotencyKey,
          requireCompletionProof: prior?.requireCompletionProof,
        })
        const payload = enriched.payload

        payload.trainerRedo = {
          ...asRecord(payload.trainerRedo),
          checkpointResourceId: resource.id,
          checkpointName: resource.localPath,
        }
        payload.queueRepair = {
          ...asRecord(payload.queueRepair),
          repairedAt: new Date().toISOString(),
          reason: 'trainer-sdxl-checkpoint-resource-refresh',
          previousCheckpoint: oldCheckpoint,
          checkpointResourceId: resource.id,
          checkpointName: resource.localPath,
          previousError: String(job.error || '').slice(0, 1000),
        }

        console.log(
          `[trainer-checkpoint-repair] ${job.id}: recoverable sourceImage=${sourceArtImageId} checkpoint=${JSON.stringify(oldCheckpoint)} -> Resource #${resource.id} ${JSON.stringify(resource.localPath)}`,
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
              priority: Math.max(100, job.priority),
            },
          })

          if (updated.count !== 1) {
            throw new Error(`ArtJob ${job.id} changed while it was being repaired.`)
          }
        }

        recoverable += 1
      } catch (error) {
        unresolved += 1
        console.log(
          `[trainer-checkpoint-repair] ${job.id}: SKIP ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }

    console.log(
      `[trainer-checkpoint-repair] summary: recoverable=${recoverable} unresolved=${unresolved}${APPLY ? ' (requeued in place)' : ' (no writes)'}.`,
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function main(): Promise<void> {
  await withDatabaseRetry('repair Trainer checkpoint failures', async () => repair())
}

const isDirectRun = process.argv[1]
  ? fileURLToPath(import.meta.url) === fileURLToPath(new URL(process.argv[1], 'file:'))
  : false

if (isDirectRun) {
  main().catch((error) => {
    console.error('[trainer-checkpoint-repair] failed', error)
    process.exitCode = 1
  })
}
