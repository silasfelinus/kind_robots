import { createError, defineEventHandler, readBody } from 'h3'
import type {
  ProjectPriority,
  ProjectStatus,
} from '~/prisma/generated/prisma/client'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { conductorGet, conductorPut } from '@/server/utils/conductor-github'
import {
  projectPriorityToConductorPriority,
  projectStatusToConductorStatus,
  updateConductorProjectOverride,
} from '@/server/utils/conductorProjectRegistry'
import { errorHandler } from '@/server/utils/error'
import prisma from '@/server/utils/prisma'
import {
  projectInclude,
  projectPriorities,
  projectStatuses,
} from '@/server/api/projects/index'

const OVERRIDES_PATH = 'project-overrides.yaml'

type ProjectStateBody = {
  projectId?: number
  status?: ProjectStatus
  priority?: ProjectPriority
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const body = await readBody<ProjectStateBody>(event)
    const projectId = Number(body.projectId)
    if (!Number.isInteger(projectId) || projectId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'A valid Project ID is required.',
      })
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      throw createError({ statusCode: 404, message: 'Project not found.' })
    }

    const nextStatus = projectStatuses.has(body.status as ProjectStatus)
      ? (body.status as ProjectStatus)
      : undefined
    const nextPriority = projectPriorities.has(body.priority as ProjectPriority)
      ? (body.priority as ProjectPriority)
      : undefined
    if (!nextStatus && !nextPriority) {
      throw createError({
        statusCode: 400,
        message: 'A valid status or priority is required.',
      })
    }

    const conductorSlug = project.conductorSlug || project.slug
    const conductorStatus = nextStatus
      ? projectStatusToConductorStatus(nextStatus)
      : undefined
    if (nextStatus === 'BRAINSTORM' && conductorSlug) {
      throw createError({
        statusCode: 400,
        message:
          'A synced Conductor project cannot use BRAINSTORM. Pause it in Conductor or keep it as a database-only idea.',
      })
    }

    if (conductorSlug) {
      const current = await conductorGet(OVERRIDES_PATH)
      if (!current) {
        throw createError({
          statusCode: 502,
          message: `Could not read ${OVERRIDES_PATH} from Conductor.`,
        })
      }
      const content = updateConductorProjectOverride(current.content, conductorSlug, {
        ...(conductorStatus ? { status: conductorStatus } : {}),
        ...(nextPriority
          ? { priority: projectPriorityToConductorPriority(nextPriority) }
          : {}),
      })
      if (content !== current.content) {
        await conductorPut(
          OVERRIDES_PATH,
          content,
          `project: sync ${conductorSlug} lifecycle from workspace`,
          current.sha,
        )
      }
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(nextStatus
          ? {
              status: nextStatus,
              isActive: nextStatus !== 'ARCHIVED',
            }
          : {}),
        ...(nextPriority ? { priority: nextPriority } : {}),
        lastSyncedAt: new Date(),
      },
      include: projectInclude,
    })

    return {
      success: true,
      message: conductorSlug
        ? 'Project lifecycle updated in Conductor and Kind Robots.'
        : 'Database-only Project lifecycle updated.',
      data: updated,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode
    return { ...handled, statusCode }
  }
})
