// /server/api/challenges/[slug].delete.ts
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { userIsAdmin } from '~/server/utils/authUser'
import { challengeMutationSelect } from '~/server/utils/challengeResource'
import { validateApiKey } from '~/server/utils/validateKey'

export default defineEventHandler(async (event) => {
  try {
    const auth = await validateApiKey(event)

    if (!auth.isValid || !auth.user) {
      throw createError({ statusCode: 401, message: 'Authentication required.' })
    }

    if (!userIsAdmin(auth.user)) {
      throw createError({ statusCode: 403, message: 'Admin access required.' })
    }

    const slug = getRouterParam(event, 'slug')?.trim()

    if (!slug) {
      throw createError({ statusCode: 400, message: 'Challenge slug is required.' })
    }

    const existing = await prisma.challenge.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!existing) {
      throw createError({ statusCode: 404, message: 'Challenge not found.' })
    }

    const challenge = await prisma.challenge.delete({
      where: { id: existing.id },
      select: challengeMutationSelect,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Challenge deleted successfully.',
      data: challenge,
      statusCode: 200,
    }
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003'
    ) {
      event.node.res.statusCode = 409
      return {
        success: false,
        message: 'Challenges with submissions cannot be deleted.',
        statusCode: 409,
      }
    }

    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode

    return { ...handled, statusCode }
  }
})
