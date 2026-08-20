// /server/api/model-builder/items/[id]/artifacts.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import type { ModelBuildReviewState } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import {
  assertContentStageEditable,
  assertRunAccess,
  assertRunWritable,
  getItemId,
  normalizeNullableId,
} from '../../runs/index'
import { assertArtImageAttachable } from '../../relations'

const reviewStates = new Set<ModelBuildReviewState>([
  'PENDING',
  'APPROVED',
  'REJECTED',
])

type ArtifactBody = {
  kind?: unknown
  provider?: unknown
  model?: unknown
  seed?: unknown
  prompt?: unknown
  negativePrompt?: unknown
  width?: unknown
  height?: unknown
  workflow?: unknown
  format?: unknown
  artImageId?: unknown
  draftPath?: unknown
  promotedPath?: unknown
  reviewState?: unknown
  usageInfo?: unknown
}

function str(value: unknown, max: number): string | null {
  return typeof value === 'string' ? value.slice(0, max) : null
}

function int(value: unknown): number | null {
  const n = Number(value)
  return Number.isInteger(n) ? n : null
}

export default defineEventHandler(async (event) => {
  try {
    const itemId = getItemId(event)
    const auth = await requireApiUser(event)

    const item = await prisma.modelBuildItem.findUnique({
      where: { id: itemId },
      include: { Run: { select: { userId: true, status: true } } },
    })
    if (!item) {
      event.node.res.statusCode = 404
      return {
        success: false,
        message: 'Build item not found.',
        statusCode: 404,
      }
    }
    assertRunAccess(item.Run, auth.user)
    assertRunWritable(item.Run)
    // Every other GENERATE_ASSETS write goes through prepareItemUpdate's
    // assertContentStageEditable(..., 'GENERATE_ASSETS', ...) gate (items/
    // [id].patch.ts and items/batch.patch.ts, for body.artImageId) -- this
    // route never did (model-builder/t-029 cycle 28), even though it's the
    // one that actually persists each generated candidate as a durable
    // ModelBuildArtifact row. modelBuilderStore.ts's generateItemAsset/
    // pollAsyncArtJob only check their OWN in-memory item.stages.
    // GENERATE_ASSETS before calling this route (verifyModelBuilder
    // ApprovedAssetGuard.ts) -- a second browser tab (or a slow in-flight
    // render that resolves after a *different* tab already approved the
    // stage) has stale local state that still reads 'ready'/'in-progress',
    // so it sails past that client-side check and lands here regardless of
    // the item's actual server-side stage. The follow-up pushItem PATCH that
    // sets item.artImageId IS correctly rejected by the item-patch-stage
    // guard once the stage is 'approved' -- so item.artImageId itself never
    // gets corrupted -- but this route already created the orphaned
    // ModelBuildArtifact row for the stale render by then. adaptItem's
    // imagePath reads Artifacts[Artifacts.length - 1]?.promotedPath ??
    // draftPath (stores/modelBuilderStore.ts), i.e. whichever artifact row
    // was created LAST, with no relation at all to which one artImageId
    // actually points at -- so on the next resume/reload the item's
    // displayed candidate silently becomes the orphaned, never-reviewed
    // render instead of the one actually approved and committed, with the
    // stage badge still reading 'approved'. Gating here the same way every
    // sibling GENERATE_ASSETS write already is closes it at the source.
    assertContentStageEditable(
      item.stageStatuses,
      'GENERATE_ASSETS',
      'Art image',
    )

    const body = await readBody<ArtifactBody>(event)
    if (typeof body.kind !== 'string' || !body.kind.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Artifact "kind" is required.',
      })
    }
    await assertArtImageAttachable(body.artImageId, auth.user.id, auth.isAdmin)
    // Narrowed to a plain local before entering the transaction closure below
    // -- TS's control-flow narrowing of body.kind (from the typeof check
    // above) does not carry into a nested async arrow function.
    const kind = body.kind.slice(0, 64)

    const artifact = await prisma.$transaction(async (tx) => {
      // Re-read stageStatuses immediately before the write, same reasoning
      // as items/[id].patch.ts's identical re-check: the eager check above
      // only ever saw the request-start `item` snapshot, read before
      // readBody/assertArtImageAttachable's own awaits -- a concurrent
      // approveStage landing in that window is invisible to it otherwise.
      const fresh = await tx.modelBuildItem.findUnique({
        where: { id: itemId },
        select: { stageStatuses: true },
      })
      assertContentStageEditable(
        fresh?.stageStatuses,
        'GENERATE_ASSETS',
        'Art image',
      )
      return tx.modelBuildArtifact.create({
        data: {
          itemId,
          kind,
          provider: str(body.provider, 64),
          model: str(body.model, 191),
          seed: str(body.seed, 64),
          prompt: str(body.prompt, 20000),
          negativePrompt: str(body.negativePrompt, 20000),
          width: int(body.width),
          height: int(body.height),
          workflow:
            body.workflow && typeof body.workflow === 'object'
              ? JSON.stringify(body.workflow)
              : undefined,
          format: str(body.format, 32),
          artImageId: normalizeNullableId(body.artImageId) ?? null,
          draftPath: str(body.draftPath, 20000),
          promotedPath: str(body.promotedPath, 20000),
          reviewState: reviewStates.has(
            body.reviewState as ModelBuildReviewState,
          )
            ? (body.reviewState as ModelBuildReviewState)
            : 'PENDING',
          usageInfo:
            body.usageInfo && typeof body.usageInfo === 'object'
              ? JSON.stringify(body.usageInfo)
              : undefined,
        },
      })
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      message: 'Artifact recorded successfully.',
      data: artifact,
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode
    return { ...handled, statusCode }
  }
})
