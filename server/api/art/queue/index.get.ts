// /server/api/art/queue/index.get.ts
//
// List queued jobs. Regular users see their own; admin/server credentials
// see everything. Filterable by status and projectSlug for dashboards and
// the conductor consumer's batch bookkeeping.
import { createError, defineEventHandler, getQuery } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'
import { decodeArtJobPayload } from '../../../utils/artJobPayload'

const STATUSES = new Set(['PENDING', 'RUNNING', 'DONE', 'FAILED', 'CANCELLED'])

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    const query = getQuery(event)

    const where: Prisma.ArtJobWhereInput = {}

    if (!auth.isAdmin && !auth.isServerKey) {
      where.userId = auth.user.id
    }

    const status = String(query.status || '').toUpperCase()

    if (status) {
      if (!STATUSES.has(status)) {
        throw createError({ statusCode: 400, message: `Invalid status "${status}".` })
      }
      where.status = status as Prisma.ArtJobWhereInput['status']
    }

    const projectSlug = String(query.projectSlug || '').trim().toLowerCase()

    if (projectSlug) {
      where.projectSlug = projectSlug
    }

    const take = Math.min(Math.max(Number(query.limit) || 50, 1), 200)

    const storedJobs = await prisma.artJob.findMany({
      where,
      orderBy: [{ id: 'desc' }],
      take,
    })
    const jobs = storedJobs.map(decodeArtJobPayload)

    return {
      success: true,
      message: `${jobs.length} job(s).`,
      data: { jobs },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to list art jobs.',
      statusCode,
    }
  }
})
