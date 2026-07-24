// /server/api/art/queue/repair-weak-prompts.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'
import {
  parseArtJobPayload,
  serializeArtJobPayload,
  type ArtJobPayloadRecord,
} from '../../../utils/artJobPayload'
import {
  applyArtJobOverrides,
  prepareArtJobRetryPayload,
} from '../../../utils/artJobRetry'
import {
  assessArtPrompt,
  cleanArtPrompt,
  firstUsefulArtPrompt,
} from '../../../utils/artPromptQuality'
import { extractRenderRequest } from '../../comfy/utils/engineWorkflow'

type RepairBody = {
  dryRun?: boolean
  limit?: number
}

type RepairResult = {
  jobId: number
  status: string
  prompt: string
  referencedArtImageId: number | null
  action: 'REQUEUE_IN_PLACE' | 'OVERWRITE_RETRY' | 'NEW_OUTPUT_RETRY'
  replacementJobId?: number
}

type UnresolvedResult = {
  jobId: number
  status: string
  weakPrompt: string
  reasons: string[]
  referencedArtImageId: number | null
}

type JsonRecord = Record<string, unknown>

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as JsonRecord
}

function renderPrompt(payload: unknown): string {
  try {
    return cleanArtPrompt(extractRenderRequest(parseArtJobPayload(payload)).prompt)
  } catch {
    return cleanArtPrompt(asRecord(parseArtJobPayload(payload)).promptString)
  }
}

function retryIds(payload: unknown): number[] {
  const retry = asRecord(parseArtJobPayload(payload).retry)
  return [retry.sourceJobId, retry.rootJobId]
    .map(Number)
    .filter((id, index, all) => {
      return Number.isInteger(id) && id > 0 && all.indexOf(id) === index
    })
}

function alreadyRepairQueued(payload: unknown): boolean {
  const repair = asRecord(parseArtJobPayload(payload).promptRepair)
  return Number.isInteger(Number(repair.replacementJobId))
}

async function promptFromJobIds(ids: number[]): Promise<string> {
  if (!ids.length) return ''
  const jobs = await prisma.artJob.findMany({
    where: { id: { in: ids } },
    orderBy: { id: 'desc' },
    select: { payload: true },
  })
  return firstUsefulArtPrompt(...jobs.map((job) => renderPrompt(job.payload)))
}

async function promptFromArtImage(imageId: number | null): Promise<string> {
  if (!imageId) return ''

  const [image, jobs] = await Promise.all([
    prisma.artImage.findUnique({
      where: { id: imageId },
      select: { promptString: true, artPrompt: true },
    }),
    prisma.artJob.findMany({
      where: { artImageId: imageId },
      orderBy: { id: 'desc' },
      take: 20,
      select: { payload: true },
    }),
  ])

  return firstUsefulArtPrompt(
    image?.promptString,
    image?.artPrompt,
    ...jobs.map((job) => renderPrompt(job.payload)),
  )
}

async function recoverPrompt(job: {
  payload: string
  artImageId: number | null
}): Promise<{ prompt: string; referencedArtImageId: number | null }> {
  const weakPrompt = renderPrompt(job.payload)
  const assessment = assessArtPrompt(weakPrompt)
  const payload = parseArtJobPayload(job.payload)
  const record = asRecord(payload)
  const repair = asRecord(record.promptRepair)

  const direct = firstUsefulArtPrompt(
    repair.correctedPrompt,
    record.originalPrompt,
    record.sourcePrompt,
  )
  if (direct) {
    return {
      prompt: direct,
      referencedArtImageId: assessment.referencedArtImageId,
    }
  }

  const ancestryPrompt = await promptFromJobIds(retryIds(payload))
  if (ancestryPrompt) {
    return {
      prompt: ancestryPrompt,
      referencedArtImageId: assessment.referencedArtImageId,
    }
  }

  const referencedArtImageId =
    assessment.referencedArtImageId || job.artImageId || null
  const imagePrompt = await promptFromArtImage(referencedArtImageId)

  return { prompt: imagePrompt, referencedArtImageId }
}

function correctedPayload(
  payload: unknown,
  prompt: string,
  metadata: JsonRecord,
): ArtJobPayloadRecord {
  const next = applyArtJobOverrides(
    structuredClone(parseArtJobPayload(payload)),
    { promptString: prompt },
  )
  next.promptRepair = metadata
  return next
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin access required to repair ArtJob prompts.',
      })
    }

    const body = (await readBody(event).catch(() => null)) as RepairBody | null
    const dryRun = body?.dryRun === true
    const limit = Math.min(Math.max(Number(body?.limit) || 2000, 1), 5000)

    const candidates = await prisma.artJob.findMany({
      where: { status: { in: ['PENDING', 'FAILED', 'DONE'] } },
      orderBy: { id: 'asc' },
      take: limit,
      select: {
        id: true,
        status: true,
        engine: true,
        payload: true,
        priority: true,
        projectSlug: true,
        projectId: true,
        userId: true,
        artImageId: true,
      },
    })

    const repaired: RepairResult[] = []
    const unresolved: UnresolvedResult[] = []

    for (const job of candidates) {
      const weakPrompt = renderPrompt(job.payload)
      const assessment = assessArtPrompt(weakPrompt)
      if (assessment.useful || alreadyRepairQueued(job.payload)) continue

      const recovered = await recoverPrompt(job)
      if (!recovered.prompt) {
        unresolved.push({
          jobId: job.id,
          status: job.status,
          weakPrompt,
          reasons: assessment.reasons,
          referencedArtImageId: recovered.referencedArtImageId,
        })
        continue
      }

      if (job.status === 'PENDING' || job.status === 'FAILED') {
        repaired.push({
          jobId: job.id,
          status: job.status,
          prompt: recovered.prompt,
          referencedArtImageId: recovered.referencedArtImageId,
          action: 'REQUEUE_IN_PLACE',
        })

        if (!dryRun) {
          const payload = correctedPayload(job.payload, recovered.prompt, {
            correctedPrompt: recovered.prompt,
            repairedAt: new Date().toISOString(),
            repairMode: 'REQUEUE_IN_PLACE',
          })

          await prisma.artJob.update({
            where: { id: job.id },
            data: {
              payload: serializeArtJobPayload(payload),
              status: 'PENDING',
              attempts: 0,
              claimedAt: null,
              claimedBy: null,
              error: null,
            },
          })
        }
        continue
      }

      const mode = job.artImageId ? 'OVERWRITE' : 'NEW_OUTPUT'
      const action = job.artImageId ? 'OVERWRITE_RETRY' : 'NEW_OUTPUT_RETRY'
      const prepared = prepareArtJobRetryPayload(
        job.payload,
        job.id,
        job.artImageId,
        mode,
        true,
      )
      const replacementPayload = correctedPayload(prepared, recovered.prompt, {
        correctedPrompt: recovered.prompt,
        repairedAt: new Date().toISOString(),
        repairMode: action,
        sourceJobId: job.id,
      })

      const result: RepairResult = {
        jobId: job.id,
        status: job.status,
        prompt: recovered.prompt,
        referencedArtImageId: recovered.referencedArtImageId,
        action,
      }

      if (!dryRun) {
        const replacement = await prisma.artJob.create({
          data: {
            engine: job.engine,
            payload: serializeArtJobPayload(replacementPayload),
            priority: job.priority,
            projectSlug: job.projectSlug,
            projectId: job.projectId,
            userId: job.userId,
          },
        })
        result.replacementJobId = replacement.id

        const sourcePayload = structuredClone(parseArtJobPayload(job.payload))
        sourcePayload.promptRepair = {
          correctedPrompt: recovered.prompt,
          repairedAt: new Date().toISOString(),
          repairMode: action,
          replacementJobId: replacement.id,
        }
        await prisma.artJob.update({
          where: { id: job.id },
          data: { payload: serializeArtJobPayload(sourcePayload) },
        })
      }

      repaired.push(result)
    }

    return {
      success: true,
      message: dryRun
        ? `Found ${repaired.length} recoverable and ${unresolved.length} unresolved weak-prompt jobs.`
        : `Repaired ${repaired.length} weak-prompt jobs; ${unresolved.length} remain unresolved.`,
      data: {
        dryRun,
        scannedCount: candidates.length,
        repairedCount: repaired.length,
        unresolvedCount: unresolved.length,
        repaired,
        unresolved,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to repair weak ArtJob prompts.',
      statusCode,
    }
  }
})
