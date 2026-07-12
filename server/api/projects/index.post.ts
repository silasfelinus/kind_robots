// /server/api/projects/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import type {
  ProjectPriority,
  ProjectStatus,
} from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { enforceProjectCap } from '~/server/utils/projectCap'
import {
  normalizeNullableDateTime,
  normalizeNullableId,
  normalizeOptionalText,
  normalizeSlug,
  projectInclude,
  projectPriorities,
  projectStatuses,
} from './index'

type ProjectCreateBody = {
  title?: unknown
  slug?: unknown
  description?: unknown
  pitch?: unknown
  flavorText?: unknown
  goal?: unknown
  waypoints?: unknown
  status?: unknown
  priority?: unknown
  conductorSlug?: unknown
  lastSyncedAt?: unknown
  repoUrl?: unknown
  liveUrl?: unknown
  channelKey?: unknown
  tabKey?: unknown
  allowReviews?: unknown
  highlightImage?: unknown
  icon?: unknown
  imagePath?: unknown
  cardPath?: unknown
  heroPath?: unknown
  designer?: unknown
  managerBotId?: unknown
  artImageId?: unknown
  artCollectionId?: unknown
  isPublic?: unknown
  isMature?: unknown
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const body = await readBody<ProjectCreateBody>(event)
    const title = normalizeOptionalText(body?.title)

    if (!title) {
      throw createError({
        statusCode: 400,
        message: 'Project title is required.',
      })
    }

    const slug = normalizeSlug(body.slug ?? title)
    const status = projectStatuses.has(body.status as ProjectStatus)
      ? (body.status as ProjectStatus)
      : 'BRAINSTORM'
    const priority = projectPriorities.has(body.priority as ProjectPriority)
      ? (body.priority as ProjectPriority)
      : 'NORMAL'

    if (status === 'ACTIVE' || status === 'PAUSED') {
      await enforceProjectCap({
        userId: auth.user.id,
        userRole: auth.user.Role,
        isAdmin: auth.isAdmin || auth.user.id === 1,
      })
    }

    const project = await prisma.project.create({
      data: {
        title,
        slug,
        description: normalizeOptionalText(body.description),
        pitch: normalizeOptionalText(body.pitch),
        flavorText: normalizeOptionalText(body.flavorText),
        goal: normalizeOptionalText(body.goal),
        waypoints: normalizeOptionalText(body.waypoints),
        status,
        priority,
        conductorSlug: normalizeSlug(body.conductorSlug ?? slug),
        lastSyncedAt: normalizeNullableDateTime(body.lastSyncedAt),
        repoUrl: normalizeOptionalText(body.repoUrl),
        liveUrl: normalizeOptionalText(body.liveUrl),
        channelKey: normalizeOptionalText(body.channelKey),
        tabKey: normalizeOptionalText(body.tabKey),
        allowReviews: body.allowReviews === true,
        highlightImage: normalizeOptionalText(body.highlightImage),
        icon: normalizeOptionalText(body.icon),
        imagePath: normalizeOptionalText(body.imagePath),
        cardPath: normalizeOptionalText(body.cardPath),
        heroPath: normalizeOptionalText(body.heroPath),
        designer: normalizeOptionalText(body.designer),
        managerBotId: normalizeNullableId(body.managerBotId),
        artImageId: normalizeNullableId(body.artImageId),
        artCollectionId: normalizeNullableId(body.artCollectionId),
        isPublic: body.isPublic !== false,
        isMature: body.isMature === true,
        userId: auth.user.id,
      },
      include: projectInclude,
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      message: 'Project created successfully.',
      data: project,
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode
    return { ...handled, statusCode }
  }
})
