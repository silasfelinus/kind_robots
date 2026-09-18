// /server/api/lora/probe-plan.post.ts
//
// Resolves the render plan for LoRA preview probes without enqueuing anything.
//
// Every LoRA in the catalog is currently previewed by a hotlink to a third
// party (Civitai, and 163 rows to img.genur.art, whose DNS record is gone), and
// none has a generated image of its own. This endpoint answers "what would we
// render, on which base, with which prompt" for a set of LoRAs, and the caller
// then posts each plan to /api/art/enqueue. Splitting it this way keeps the
// family/checkpoint/prompt mapping server-side and testable while reusing the
// existing enqueue path for gating, workflow building and queueing rather than
// duplicating any of it.
import { defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireAdminApiUser } from '../../utils/authGuard'
import {
  buildLoraProbePrompt,
  classifyLoraFamily,
  hasBlindPreview,
  LORA_PROBE_RECIPES,
  probeTriggerText,
  selectProbeCheckpoint,
  type LoraProbeFamily,
  type ProbeCheckpointCandidate,
} from '~/utils/loraProbe'

type ProbePlanRequest = {
  scope?: 'blind' | 'ids' | null
  resourceIds?: number[] | null
  limit?: number | null
}

const DEFAULT_LIMIT = 250
const MAX_LIMIT = 2500

function normalizeIds(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  const ids = value
    .map((entry) => Number(entry))
    .filter((id) => Number.isInteger(id) && id > 0)
  return [...new Set(ids)]
}

function skipReason(family: LoraProbeFamily): string {
  if (family === 'unsupported') {
    return 'No still-image probe recipe for this base model (SD 2.1, Kontext, video and audio bases have no text-to-image lane here).'
  }
  return `No ${family} checkpoint is registered to render against.`
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)

    const body = (await readBody(event)) as ProbePlanRequest | null
    const scope = body?.scope === 'ids' ? 'ids' : 'blind'
    const requestedIds = normalizeIds(body?.resourceIds)
    const limit = Math.min(
      Math.max(Number(body?.limit) || DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    )

    const loras = await prisma.resource.findMany({
      where: {
        isActive: true,
        resourceType: { in: ['LORA', 'LYCORIS'] },
        ...(scope === 'ids' && requestedIds.length
          ? { id: { in: requestedIds } }
          : {}),
      },
      select: {
        id: true,
        name: true,
        customLabel: true,
        generation: true,
        supportedServer: true,
        isMature: true,
        isPublic: true,
        defaultTrigger: true,
        triggerWords: true,
        artImageId: true,
        imagePath: true,
        previewImageUrl: true,
      },
      orderBy: { id: 'asc' },
    })

    const checkpointRows = await prisma.resource.findMany({
      where: { isActive: true, resourceType: 'CHECKPOINT' },
      select: {
        id: true,
        name: true,
        localPath: true,
        generation: true,
        isMature: true,
      },
    })
    const checkpoints: ProbeCheckpointCandidate[] = checkpointRows.map(
      (row) => ({
        id: row.id,
        name: row.name,
        localPath: row.localPath,
        generation: row.generation,
        isMature: Boolean(row.isMature),
      }),
    )

    const candidates =
      scope === 'blind' ? loras.filter((lora) => hasBlindPreview(lora)) : loras

    const plans: Array<Record<string, unknown>> = []
    const skipped: Array<Record<string, unknown>> = []

    for (const lora of candidates) {
      if (plans.length >= limit) break

      const label = lora.customLabel || lora.name
      const family = classifyLoraFamily(lora.generation, lora.supportedServer)
      const checkpoint = selectProbeCheckpoint(
        family,
        Boolean(lora.isMature),
        checkpoints,
      )
      const prompt = buildLoraProbePrompt(family, probeTriggerText(lora))
      const recipe =
        family === 'unsupported' ? null : LORA_PROBE_RECIPES[family]

      /*
       * A missing checkpoint only disqualifies a lane that needs one. The flux
       * builder resolves its own UNet and never reads `checkpoint`, so
       * selectProbeCheckpoint returns null for it by design rather than by
       * failure -- treating that as "no base available" would skip every Flux
       * LoRA in the catalog.
       */
      const needsCheckpoint = recipe?.basePolicy === 'catalog-checkpoint'

      if (!prompt || !recipe || (needsCheckpoint && !checkpoint)) {
        skipped.push({
          resourceId: lora.id,
          label,
          family,
          generation: lora.generation,
          reason: skipReason(family),
        })
        continue
      }

      plans.push({
        resourceId: lora.id,
        label,
        family,
        isMature: Boolean(lora.isMature),
        checkpoint: checkpoint
          ? {
              id: checkpoint.id,
              name: checkpoint.name,
              localPath: checkpoint.localPath,
              isMature: checkpoint.isMature,
            }
          : null,
        // Posted to /api/art/enqueue verbatim by the caller.
        enqueue: {
          engine: recipe.engine,
          promptString: prompt.prompt,
          negativePrompt: prompt.negativePrompt || null,
          ...(checkpoint
            ? {
                checkpoint: checkpoint.localPath,
                checkpointResourceId: checkpoint.id,
              }
            : {}),
          loras: [{ resourceId: lora.id, strength: recipe.loraStrength }],
          width: recipe.width,
          height: recipe.height,
          isMature: Boolean(lora.isMature),
          /*
           * INHERITED, not hardcoded false.
           *
           * generate-preview.post.ts has always copied isPublic/isMature from
           * the Resource; this path pinned isPublic to false, so the same LoRA
           * produced a PUBLIC preview through one route and a PRIVATE one
           * through the other. buildArtImageWhere then hid the private half
           * from everyone but its owner and admins, which is why a probed-only
           * LoRA's gallery came back empty for anybody else (ArtImage 27324 on
           * HeavenAngels-000008 is one).
           *
           * Silas, 2026-09-18, on the two paths: "both should inherit". A probe
           * of a public LoRA is no more sensitive than a preview of it.
           */
          isPublic: Boolean(lora.isPublic),
          entityArt: {
            entityType: 'resource',
            entityId: lora.id,
            field: 'imagePath',
            mode: 'recreate',
            preserveOriginal: true,
          },
        },
      })
    }

    /*
     * Order: comfy lane first, grouped by checkpoint; flux last.
     *
     * GROUPING IS THE EXPENSIVE PART. Jobs drain oldest-first, and the relay
     * does not send `smartQueue`, so claim.post.ts's model-affinity bypass is
     * inert -- consecutive jobs on different checkpoints each pay a cold model
     * load. The relay log for 2026-09-14 shows 63 consecutive renders at ~65s
     * each on a resident model, against 12m30s for ArtJob 22835, whose only
     * difference was that cyberrealisticPony had to be loaded first. Enqueuing
     * this batch interleaved across five checkpoints would pay that load
     * repeatedly; grouped, it pays it four times.
     *
     * Flux last (Silas, 2026-09-15): a Flux render measured 28 minutes against
     * ~65s for a warm comfy render, so a Flux job mid-queue stalls everything
     * behind it. Ordering them to the tail lets the comfy-lane previews land
     * first rather than dropping them.
     */
    plans.sort((a, b) => {
      const lane = (plan: Record<string, unknown>) =>
        plan.family === 'flux' ? 1 : 0
      const laneDelta = lane(a) - lane(b)
      if (laneDelta) return laneDelta

      const model = (plan: Record<string, unknown>) => {
        const checkpoint = plan.checkpoint as { localPath?: string } | null
        return checkpoint?.localPath || ''
      }
      const modelDelta = model(a).localeCompare(model(b))
      if (modelDelta) return modelDelta

      return Number(a.resourceId) - Number(b.resourceId)
    })

    return {
      success: true,
      message: `Planned ${plans.length} LoRA preview probe(s).`,
      data: {
        scope,
        considered: candidates.length,
        plans,
        skipped,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const { success, message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success,
      message: message || 'Failed to plan LoRA preview probes.',
      data: null,
      statusCode: statusCode || 500,
    }
  }
})
