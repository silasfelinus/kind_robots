// /server/api/model-builder/items/[id]/artifacts.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import type { ModelBuildReviewState } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { assertRunAccess, getItemId, normalizeNullableId } from '../../runs/index'

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
      include: { Run: { select: { userId: true } } },
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

    const body = await readBody<ArtifactBody>(event)
    if (typeof body.kind !== 'string' || !body.kind.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Artifact "kind" is required.',
      })
    }

    const artifact = await prisma.modelBuildArtifact.create({
      data: {
        itemId,
        kind: body.kind.slice(0, 64),
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
        reviewState: reviewStates.has(body.reviewState as ModelBuildReviewState)
          ? (body.reviewState as ModelBuildReviewState)
          : 'PENDING',
        usageInfo:
          body.usageInfo && typeof body.usageInfo === 'object'
            ? JSON.stringify(body.usageInfo)
            : undefined,
      },
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
