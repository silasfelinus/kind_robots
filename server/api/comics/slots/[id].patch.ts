import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import {
  readComicId,
  requireComicSlot,
  toComicSlotDto,
} from '@/server/utils/comicStudio'
import { applyComicSlotPatch } from '@/server/utils/comicStudioSlots'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const id = readComicId(event, 'slot id')
    const slot = await requireComicSlot(id)
    const result = await applyComicSlotPatch(slot, await readBody(event))
    if (result.errors.length)
      throw createError({ statusCode: 400, message: result.errors.join(' ') })
    const updated = await prisma.comicSlot.findUniqueOrThrow({ where: { id } })
    return {
      success: true,
      statusCode: 200,
      message: 'Slot saved.',
      data: toComicSlotDto(updated),
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
