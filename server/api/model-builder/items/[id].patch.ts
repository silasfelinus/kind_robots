// /server/api/model-builder/items/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import {
  assertRunAccess,
  assertRunWritable,
  getItemId,
  mergeStageStatusChanges,
  prepareItemUpdate,
  type ItemPatchBody,
} from '../runs/index'
import { assertArtImageAttachable } from '../relations'
import { assertItemPatchFieldsAreClientWritable } from './patch-policy'

const itemInclude = {
  Artifacts: { orderBy: { id: 'asc' } },
  Revisions: { orderBy: { id: 'asc' } },
} satisfies Prisma.ModelBuildItemInclude

export default defineEventHandler(async (event) => {
  try {
    const id = getItemId(event)
    const auth = await requireApiUser(event)

    const existing = await prisma.modelBuildItem.findUnique({
      where: { id },
      include: { Run: { select: { userId: true, status: true } } },
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
    assertRunWritable(existing.Run)

    const body = await readBody<ItemPatchBody>(event)
    assertItemPatchFieldsAreClientWritable(body)
    if (body.artImageId !== undefined) {
      await assertArtImageAttachable(body.artImageId, auth.user.id, auth.isAdmin)
    }
    const { data, revision, stageStatusChanges } = prepareItemUpdate(
      existing,
      body,
      auth.user.username ?? String(auth.user.id),
    )

    const item = await prisma.$transaction(async (tx) => {
      if (revision) {
        await tx.modelBuildRevision.create({
          data: { itemId: id, ...revision },
        })
      }
      // Re-read stageStatuses immediately before the write rather than
      // trusting the request-start `existing` snapshot: another request
      // (a concurrent single-item PATCH, batch PATCH, or commit) can change
      // OTHER stage keys in the window between that read and this write.
      // stageStatusChanges only carries the keys THIS request actually
      // intends to change (see prepareItemUpdate/diffStageStatusChanges),
      // merged onto whatever is live right now — never onto the stale copy.
      if (stageStatusChanges) {
        const fresh = await tx.modelBuildItem.findUnique({
          where: { id },
          select: { stageStatuses: true },
        })
        data.stageStatuses = mergeStageStatusChanges(
          fresh?.stageStatuses,
          stageStatusChanges,
        )
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
