// /server/api/projects/index.get.ts
import { defineEventHandler, getHeader, getQuery } from 'h3'
import type { Prisma, ProjectPriority, ProjectStatus } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { validateApiKey } from '~/server/utils/validateKey'
import { projectInclude, projectPriorities, projectStatuses } from './index'

type ProjectListQuery = {
  take?: string
  skip?: string
  includeMature?: string
  includeInactive?: string
  mine?: string
  search?: string
  status?: string
  priority?: string
  channelKey?: string
}

function numberParam(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) return fallback
  return Math.min(parsed, max)
}

function booleanParam(value: unknown): boolean {
  return value === true || value === 'true' || value === '1'
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery<ProjectListQuery>(event)
    const authorization = getHeader(event, 'authorization')
    let userId: number | null = null
    let isAdmin = false

    if (authorization?.startsWith('Bearer ')) {
      try {
        const auth = await validateApiKey(event)
        if (auth.isValid && auth.user) {
          userId = auth.user.id
          isAdmin = auth.user.Role === 'ADMIN'
        }
      } catch {
        userId = null
        isAdmin = false
      }
    }

    const and: Prisma.ProjectWhereInput[] = []
    const includeInactive = booleanParam(query.includeInactive)
    const includeMature = booleanParam(query.includeMature)
    const mine = booleanParam(query.mine)
    const search = typeof query.search === 'string' ? query.search.trim() : ''
    const status = projectStatuses.has(query.status as ProjectStatus)
      ? (query.status as ProjectStatus)
      : undefined
    const priority = projectPriorities.has(query.priority as ProjectPriority)
      ? (query.priority as ProjectPriority)
      : undefined

    if (!includeInactive) and.push({ isActive: true })
    if (!includeMature && !isAdmin) and.push({ isMature: false })

    if (mine) {
      and.push(userId ? { userId } : { id: -1 })
    } else if (!isAdmin) {
      and.push(userId ? { OR: [{ isPublic: true }, { userId }] } : { isPublic: true })
    }

    if (status) and.push({ status })
    if (priority) and.push({ priority })
    if (query.channelKey) and.push({ channelKey: query.channelKey })
    if (search) {
      and.push({
        OR: [
          { title: { contains: search } },
          { slug: { contains: search } },
          { conductorSlug: { contains: search } },
          { description: { contains: search } },
        ],
      })
    }

    const projects = await prisma.project.findMany({
      where: and.length ? { AND: and } : undefined,
      include: projectInclude,
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }, { title: 'asc' }],
      take: numberParam(query.take, 100, 250),
      skip: numberParam(query.skip, 0, 100000),
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Projects fetched successfully.',
      data: projects,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode
    return { ...handled, statusCode }
  }
})
