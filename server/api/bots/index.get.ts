// /server/api/bots/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { getOptionalApiUser } from '@/server/utils/authGuard'
import { visibilityWhere } from '@/server/utils/contentAccess'

export default defineEventHandler(async (event) => {
  try {
    // event.context.query is never populated in Nitro, so page/pageSize were
    // silently stuck at 1/100 — every caller got only the first 100 bots.
    const query = getQuery(event)
    const page = Number(query.page) || 1
    const pageSize = Number(query.pageSize) || 100

    // Fetch bots with pagination
    const skip = (page - 1) * pageSize
    // Returned every Bot including private and mature ones. See
    // await visibilityWhere(): private is the owner or an admin, mature is excluded
    // outright for a maturity-restricted account.
    const auth = await getOptionalApiUser(event)
    const bots = await prisma.bot.findMany({
      where: await visibilityWhere(auth?.user, { isPublic: true, isMature: true }, auth?.isAdmin),
      skip,
      take: pageSize,
    })

    // Return the standardized flat response
    return { success: true, data: bots }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    throw createError({
      statusCode: statusCode || 500,
      statusMessage: message,
    })
  }
})
