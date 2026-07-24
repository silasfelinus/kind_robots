// /server/api/art/queue/index.get.ts
//
// List queued jobs. Regular users see their own; admin/server credentials
// see everything. Filterable by status and projectSlug for dashboards and
// the conductor consumer's batch bookkeeping. Dashboard callers can page
// through the complete result set instead of silently losing older jobs.
import { createError, defineEventHandler, getQuery } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'
import { decodeArtJobPayload } from '../../../utils/artJobPayload'

const STATUSES = new Set(['PENDING', 'RUNNING', 'DONE', 'FAILED', 'CANCELLED'])
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 200

function positiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

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

    const requestedPageSize = positiveInteger(
      query.pageSize ?? query.limit,
      DEFAULT_PAGE_SIZE,
    )
    const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE)
    const requestedPage = positiveInteger(query.page, 1)
    const totalCount = await prisma.artJob.count({ where })
    const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))
    const page = Math.min(requestedPage, pageCount)

    const storedJobs = await prisma.artJob.findMany({
      where,
      orderBy: [{ id: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    })
    const jobs = storedJobs.map(decodeArtJobPayload)

    return {
      success: true,
      message: `${jobs.length} of ${totalCount} job(s).`,
      data: {
        jobs,
        pagination: {
          page,
          pageSize,
          totalCount,
          pageCount,
          hasPreviousPage: page > 1,
          hasNextPage: page < pageCount,
        },
      },
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
