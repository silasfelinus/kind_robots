// /server/api/stylist/appointment/index.post.ts
//
// Save an appointment for the authed user. The server owns the money math
// (rate x time + products, in cents) and auto-creates/links the named client.
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'

type AppointmentBody = {
  clientName?: string | null
  date?: string | null
  hourlyRateCents?: number | null
  minutes?: number | null
  productCostCents?: number | null
}

function toCount(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const body = (await readBody(event)) as AppointmentBody | null

    const clientName = body?.clientName?.trim()
    const date = body?.date?.trim()

    if (!clientName) {
      throw createError({ statusCode: 400, message: 'Missing required field: clientName.' })
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw createError({ statusCode: 400, message: 'date must be YYYY-MM-DD.' })
    }

    const hourlyRateCents = toCount(body?.hourlyRateCents)
    const minutes = toCount(body?.minutes)
    const productCostCents = toCount(body?.productCostCents)
    const totalCents = Math.round((hourlyRateCents * minutes) / 60) + productCostCents

    const client =
      (await prisma.stylistClient.findFirst({
        where: { userId: auth.user.id, name: clientName },
      })) ??
      (await prisma.stylistClient.create({
        data: { userId: auth.user.id, name: clientName, email: null },
      }))

    const appointment = await prisma.stylistAppointment.create({
      data: {
        userId: auth.user.id,
        clientId: client.id,
        clientName,
        date,
        hourlyRateCents,
        minutes,
        productCostCents,
        totalCents,
      },
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'Appointment saved.',
      statusCode: 201,
      data: { appointment, client },
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      statusCode: handled.statusCode || 500,
      message: handled.message || 'Failed to save the appointment.',
    }
  }
})
