// /server/api/contenders/index.get.ts
import { createError, defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'

const contenderKinds = new Set(['AGENT_STACK', 'LLM_MODEL', 'ART_GENERATOR'])

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const requestedKind =
      query.kind === undefined || query.kind === null || query.kind === ''
        ? undefined
        : String(query.kind).trim().toUpperCase()

    if (requestedKind && !contenderKinds.has(requestedKind)) {
      throw createError({ statusCode: 400, message: 'Invalid contender kind.' })
    }

    const contenders = await prisma.contender.findMany({
      where: {
        isActive: true,
        kind: requestedKind as never,
      },
      include: {
        AvatarImage: {
          select: {
            id: true,
            imagePath: true,
            thumbnailPath: true,
            fileName: true,
          },
        },
        _count: {
          select: { Submissions: true },
        },
      },
      orderBy: [{ kind: 'asc' }, { name: 'asc' }],
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Contenders fetched successfully.',
      data: contenders.map(({ _count, ...contender }) => ({
        ...contender,
        submissionCount: _count.Submissions,
      })),
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode

    return { ...handled, statusCode }
  }
})
