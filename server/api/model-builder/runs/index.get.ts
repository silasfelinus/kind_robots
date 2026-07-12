// /server/api/model-builder/runs/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import type {
  ModelBuildStatus,
  Prisma,
} from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { modelBuildStatuses, runInclude } from './index'

type RunListQuery = {
  status?: string
  includeCancelled?: string
  take?: string
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const query = getQuery<RunListQuery>(event)

    const and: Prisma.ModelBuildRunWhereInput[] = [{ userId: auth.user.id }]

    if (modelBuildStatuses.has(query.status as ModelBuildStatus)) {
      and.push({ status: query.status as ModelBuildStatus })
    } else if (query.includeCancelled !== 'true') {
      and.push({ status: { not: 'CANCELLED' } })
    }

    const take = Math.min(
      Math.max(Number(query.take) || 25, 1),
      100,
    )

    const runs = await prisma.modelBuildRun.findMany({
      where: { AND: and },
      include: runInclude,
      orderBy: { updatedAt: 'desc' },
      take,
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Build runs fetched successfully.',
      data: runs,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode
    return { ...handled, statusCode }
  }
})
