// /server/api/stylist/client/[id].delete.ts
//
// Delete a client from the authed user's book. Appointment history keeps its
// clientName snapshot; the FK detaches (SET NULL) per the delete-detach rule.
import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const id = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid client id.' })
    }

    const existing = await prisma.stylistClient.findUnique({ where: { id } })

    if (!existing || existing.userId !== auth.user.id) {
      throw createError({ statusCode: 404, message: `Client ${id} not found.` })
    }

    await prisma.stylistClient.delete({ where: { id } })

    return { success: true, message: 'Client deleted.', statusCode: 200 }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to delete the client.',
    }
  }
})
