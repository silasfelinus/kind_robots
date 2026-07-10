// /server/api/stylist/suite.get.ts
//
// Hair by Superkate suite: load the authed user's client book and appointment
// history in one call. Private business data — owner-scoped, never public.
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)

    const [clients, appointments] = await Promise.all([
      prisma.stylistClient.findMany({
        where: { userId: auth.user.id },
        orderBy: { name: 'asc' },
      }),
      prisma.stylistAppointment.findMany({
        where: { userId: auth.user.id },
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
      }),
    ])

    return {
      success: true,
      message: `${clients.length} client(s), ${appointments.length} appointment(s).`,
      statusCode: 200,
      data: { clients, appointments },
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to load the stylist suite.',
    }
  }
})
