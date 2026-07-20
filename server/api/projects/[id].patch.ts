// /server/api/projects/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import type {
  Prisma,
  ProjectPriority,
  ProjectStatus,
} from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { enforceProjectCap } from '~/server/utils/projectCap'
import { assertJsonObject, assertOnlyFields } from '~/server/utils/chatApi'
import {
  assertProjectAccess,
  assertProjectRelationsAttachable,
  getProjectId,
  normalizeNullableDateTime,
  normalizeNullableId,
  normalizeOptionalText,
  normalizeSlug,
  projectMutationFields,
  projectPriorities,
  projectStatuses,
} from './index'
import { projectMutationSelect } from './selects'

type ProjectPatchBody = Record<string, unknown>

function countsTowardProjectCap(status: ProjectStatus, isActive: boolean) {
  return isActive && (status === 'ACTIVE' || status === 'PAUSED')
}

export default defineEventHandler(async (event) => {
  try {
    const id = getProjectId(event)
    const auth = await requireApiUser(event)
    const existing = await prisma.project.findUnique({ where: { id } })

    if (!existing) {
      event.node.res.statusCode = 404

      return {
        success: false,
        message: 'Project not found.',
        statusCode: 404,
      }
    }

    assertProjectAccess(existing, auth.user)
    const body = await readBody<ProjectPatchBody>(event)

    assertJsonObject(body, 'Project patch payload must be a JSON object.')
    assertOnlyFields(body, projectMutationFields, 'Project')

    await assertProjectRelationsAttachable(body, auth.user.id, auth.isAdmin)

    const data: Prisma.ProjectUncheckedUpdateInput = {}
    const nextStatus = projectStatuses.has(body.status as ProjectStatus)
      ? (body.status as ProjectStatus)
      : existing.status
    const nextIsActive =
      typeof body.isActive === 'boolean' ? body.isActive : existing.isActive

    if (
      !countsTowardProjectCap(existing.status, existing.isActive) &&
      countsTowardProjectCap(nextStatus, nextIsActive)
    ) {
      await enforceProjectCap({
        userId: auth.user.id,
        userRole: auth.user.Role,
        isAdmin: auth.isAdmin || auth.user.id === 1,
      })
    }

    if (body.title !== undefined) {
      data.title = normalizeOptionalText(body.title) ?? existing.title
    }

    if (body.slug !== undefined) data.slug = normalizeSlug(body.slug)
    if (body.description !== undefined) {
      data.description = normalizeOptionalText(body.description)
    }
    if (body.pitch !== undefined) data.pitch = normalizeOptionalText(body.pitch)
    if (body.flavorText !== undefined) {
      data.flavorText = normalizeOptionalText(body.flavorText)
    }
    if (body.goal !== undefined) data.goal = normalizeOptionalText(body.goal)
    if (body.conductorSlug !== undefined) {
      data.conductorSlug = normalizeSlug(body.conductorSlug)
    }
    if (body.lastSyncedAt !== undefined) {
      data.lastSyncedAt = normalizeNullableDateTime(body.lastSyncedAt)
    }
    if (body.repoUrl !== undefined) {
      data.repoUrl = normalizeOptionalText(body.repoUrl)
    }
    if (body.liveUrl !== undefined) {
      data.liveUrl = normalizeOptionalText(body.liveUrl)
    }
    if (body.channelKey !== undefined) {
      data.channelKey = normalizeOptionalText(body.channelKey)
    }
    if (body.tabKey !== undefined) {
      data.tabKey = normalizeOptionalText(body.tabKey)
    }
    if (body.highlightImage !== undefined) {
      data.highlightImage = normalizeOptionalText(body.highlightImage)
    }
    if (body.icon !== undefined) data.icon = normalizeOptionalText(body.icon)
    if (body.imagePath !== undefined) {
      data.imagePath = normalizeOptionalText(body.imagePath)
    }
    if (body.cardPath !== undefined) {
      data.cardPath = normalizeOptionalText(body.cardPath)
    }
    if (body.heroPath !== undefined) {
      data.heroPath = normalizeOptionalText(body.heroPath)
    }
    if (body.designer !== undefined) {
      data.designer = normalizeOptionalText(body.designer)
    }
    if (body.managerBotId !== undefined) {
      data.managerBotId = normalizeNullableId(body.managerBotId)
    }
    if (body.artImageId !== undefined) {
      data.artImageId = normalizeNullableId(body.artImageId)
    }
    if (body.artCollectionId !== undefined) {
      data.artCollectionId = normalizeNullableId(body.artCollectionId)
    }
    if (typeof body.allowReviews === 'boolean') {
      data.allowReviews = body.allowReviews
    }
    if (typeof body.isPublic === 'boolean') data.isPublic = body.isPublic
    if (typeof body.isMature === 'boolean') data.isMature = body.isMature
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive
    if (projectStatuses.has(body.status as ProjectStatus)) {
      data.status = body.status as ProjectStatus
    }
    if (projectPriorities.has(body.priority as ProjectPriority)) {
      data.priority = body.priority as ProjectPriority
    }

    const project = await prisma.project.update({
      where: { id },
      data,
      select: projectMutationSelect,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Project updated successfully.',
      data: project,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode

    return { ...handled, statusCode }
  }
})
