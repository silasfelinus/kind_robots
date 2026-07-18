// /server/api/model-builder/items/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import {
  assertRunAccess,
  getItemId,
  prepareItemUpdate,
  type ItemPatchBody,
} from '../runs/index'

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
    const { data, revision } = prepareItemUpdate(
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
