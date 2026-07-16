// /server/api/projects/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import type {
  Prisma,
  ProjectPriority,
  ProjectStatus,
} from '~/prisma/generated/prisma/client'
import prisma, {
  createIsolatedPrismaClient,
  isStaleDatabaseConnectionError,
} from '~/server/utils/prisma'
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

async function createProjectWithIsolatedFallback(
  data: Prisma.ProjectUncheckedCreateInput,
  conductorSlug: string,
) {
  try {
    return await prisma.project.create({
      data,
      include: projectInclude,
    })
  } catch (error: unknown) {
    if (!isStaleDatabaseConnectionError(error)) throw error

    const isolatedPrisma = createIsolatedPrismaClient()
    console.warn('[project-sync:isolated-prisma-fallback]', {
      conductorSlug,
      action: 'upsert',
    })

    try {
      return await isolatedPrisma.project.upsert({
        where: { conductorSlug },
        create: data,
        update: data,
        include: projectInclude,
      })
    } finally {
      try {
        await isolatedPrisma.$disconnect()
      } catch (disconnectError: unknown) {
        console.warn('[project-sync:isolated-prisma-disconnect-failed]', {
          conductorSlug,
          message:
            disconnectError instanceof Error
              ? disconnectError.message
              : String(disconnectError),
        })
      }
    }
  }
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
    if (!slug) {
      throw createError({
        statusCode: 400,
        message: 'Project slug is required.',
      })
    }

    const conductorSlug = normalizeSlug(body.conductorSlug ?? slug)
    if (!conductorSlug) {
      throw createError({
        statusCode: 400,
        message: 'Conductor slug is required.',
      })
    }

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

    const projectData = {
      title,
      slug,
      description: normalizeOptionalText(body.description),
      pitch: normalizeOptionalText(body.pitch),
      flavorText: normalizeOptionalText(body.flavorText),
      goal: normalizeOptionalText(body.goal),
      status,
      priority,
      conductorSlug,
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
    } satisfies Prisma.ProjectUncheckedCreateInput

    const project = await createProjectWithIsolatedFallback(
      projectData,
      conductorSlug,
    )

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
