// /server/api/stylist/appointment/[id].delete.ts
//
// Delete one of the authed user's appointments.
import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const id = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid appointment id.' })
    }

    const existing = await prisma.stylistAppointment.findUnique({ where: { id } })

    if (!existing || existing.userId !== auth.user.id) {
      throw createError({ statusCode: 404, message: `Appointment ${id} not found.` })
    }

    await prisma.stylistAppointment.delete({ where: { id } })

    return { success: true, message: 'Appointment deleted.', statusCode: 200 }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to delete the appointment.',
    }
  }
})
