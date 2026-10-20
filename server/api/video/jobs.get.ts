import { defineEventHandler, getQuery } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireMachineUser } from '../../utils/authGuard'
import { summarizeVideoGeneratorJob } from '../../utils/videoGeneratorJobs'

const PAGE_SIZE = 18

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    const requested = Number(getQuery(event).page)
    const page = Number.isSafeInteger(requested) && requested > 0 ? requested : 1
    const where = {
      userId: auth.user.id,
      OR: [{ projectSlug: 'video-generator' }, { projectSlug: null }],
      payload: { contains: '"media":"video"' },
    }
    const totalCount = await prisma.artJob.count({ where })
    const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
    const safePage = Math.min(page, pageCount)
    const stored = await prisma.artJob.findMany({
      where,
      orderBy: { id: 'desc' },
      skip: (safePage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    })
    const jobs = stored
      .map(summarizeVideoGeneratorJob)
      .filter((job): job is NonNullable<typeof job> => job !== null)

    return {
      success: true,
      statusCode: 200,
      message: 'Video generator history loaded.',
      data: { jobs, page: safePage, pageCount, totalCount },
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      statusCode: event.node.res.statusCode,
      message: handled.message || 'Unable to load video history.',
    }
  }
})
