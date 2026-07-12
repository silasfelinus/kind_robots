// /server/api/model-builder/items/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import {
  assertRunAccess,
  getItemId,
  normalizeJson,
  normalizeNullableId,
  normalizeText,
} from '../runs/index'

const itemInclude = {
  Artifacts: { orderBy: { id: 'asc' } },
  Revisions: { orderBy: { id: 'asc' } },
} satisfies Prisma.ModelBuildItemInclude

type ItemPatchBody = {
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

export default defineEventHandler(async (event) => {
  try {
    const id = getItemId(event)
    const auth = await requireApiUser(event)

    const existing = await prisma.modelBuildItem.findUnique({
      where: { id },
      include: { Run: { select: { userId: true } } },
    })
    if (!existing) {
      event.node.res.statusCode = 404
      return {
        success: false,
        message: 'Build item not found.',
        statusCode: 404,
      }
    }
    assertRunAccess(existing.Run, auth.user)

    const body = await readBody<ItemPatchBody>(event)
    const data: Prisma.ModelBuildItemUncheckedUpdateInput = {}

    if (body.stageStatuses !== undefined && typeof body.stageStatuses === 'object' && body.stageStatuses !== null) {
      data.stageStatuses = body.stageStatuses as Prisma.InputJsonValue
    }
    if (body.pitch !== undefined) data.pitch = normalizeText(body.pitch)
    if (body.fieldsDraft !== undefined)
      data.fieldsDraft = normalizeText(body.fieldsDraft)
    if (body.promptDraft !== undefined)
      data.promptDraft = normalizeText(body.promptDraft)
    const relationshipDraft = normalizeJson(body.relationshipDraft)
    if (relationshipDraft !== undefined)
      data.relationshipDraft = relationshipDraft
    if (body.staleReason !== undefined)
      data.staleReason = normalizeText(body.staleReason)
    if (body.error !== undefined) data.error = normalizeText(body.error)
    if (body.artImageId !== undefined)
      data.artImageId = normalizeNullableId(body.artImageId)
    if (body.targetType !== undefined)
      data.targetType = normalizeText(body.targetType)
    if (body.targetId !== undefined)
      data.targetId = normalizeNullableId(body.targetId)

    // Record a revision whenever editable draft content changes, so upstream
    // edits are never silently lost. Stage-status transitions (approve/reject/
    // stale) are frequent and not themselves revisions.
    const contentChanged =
      body.pitch !== undefined ||
      body.fieldsDraft !== undefined ||
      body.promptDraft !== undefined ||
      body.relationshipDraft !== undefined

    const stageLabel =
      typeof body.stage === 'string' ? body.stage.slice(0, 48) : 'EDIT'
    const reason =
      typeof body.reason === 'string' ? body.reason.slice(0, 255) : null

    const previousPayload = {
      pitch: existing.pitch,
      fieldsDraft: existing.fieldsDraft,
      promptDraft: existing.promptDraft,
      stageStatuses: existing.stageStatuses,
      relationshipDraft: existing.relationshipDraft,
    } as unknown as Prisma.InputJsonValue
    const nextPayload = {
      pitch: data.pitch ?? existing.pitch,
      fieldsDraft: data.fieldsDraft ?? existing.fieldsDraft,
      promptDraft: data.promptDraft ?? existing.promptDraft,
      stageStatuses: data.stageStatuses ?? existing.stageStatuses,
      relationshipDraft: data.relationshipDraft ?? existing.relationshipDraft,
    } as unknown as Prisma.InputJsonValue

    const item = await prisma.$transaction(async (tx) => {
      if (contentChanged) {
        await tx.modelBuildRevision.create({
          data: {
            itemId: id,
            stage: stageLabel,
            reason,
            actor: auth.user.username ?? String(auth.user.id),
            previousPayload,
            nextPayload,
          },
        })
      }
      return tx.modelBuildItem.update({
        where: { id },
        data,
        include: itemInclude,
      })
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Build item updated successfully.',
      data: item,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode
    return { ...handled, statusCode }
  }
})
