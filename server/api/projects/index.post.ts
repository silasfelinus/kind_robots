// /server/api/projects/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import type {
  Prisma,
  ProjectPriority,
  ProjectStatus,
} from '~/prisma/generated/prisma/client'
import prisma, { isStaleDatabaseConnectionError } from '~/server/utils/prisma'
import {
  projectScaffoldTodoContent,
  upsertProjectDirect,
} from '~/server/utils/projectDirectWrite'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { enforceProjectCap } from '~/server/utils/projectCap'
import { assertJsonObject, assertOnlyFields } from '~/server/utils/chatApi'
import {
  assertProjectRelationsAttachable,
  normalizeNullableDateTime,
  normalizeNullableId,
  normalizeOptionalText,
  normalizeSlug,
  projectMutationFields,
  projectPriorities,
  projectStatuses,
} from './index'
import { projectMutationSelect } from './selects'
import { userRoles } from '~/server/utils/authUser'

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
  isActive?: unknown
}

function getWorkerUserId(): number {
  const raw = Number(process.env.BETA_ADMIN_USER_ID || 1)
  return Number.isInteger(raw) && raw > 0 ? raw : 1
}

async function createProjectWithScaffoldTodo(
  data: Prisma.ProjectUncheckedCreateInput,
  conductorSlug: string,
  requesterUserId: number,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data,
        select: projectMutationSelect,
      })
      const todoContent = projectScaffoldTodoContent({
        conductorSlug,
        projectId: project.id,
        requesterUserId,
        // Carry the pitch across: this todo is Conductor's only view of a
        // project created here, so a slug on its own is not a briefable handoff.
        title: data.title,
        description: data.description,
        goal: data.goal,
        pitch: data.pitch,
        repoUrl: data.repoUrl,
      })

      await tx.todo.create({
        data: {
          ...todoContent,
          status: 'OPEN',
          priority: 'HIGH',
          category: 'AGENT',
          userId: getWorkerUserId(),
          projectId: project.id,
        },
      })

      return project
    })
  } catch (error: unknown) {
    if (!isStaleDatabaseConnectionError(error)) throw error

    console.warn('[project-sync:direct-mariadb-fallback]', {
      conductorSlug,
      action: 'upsert-with-scaffold-todo',
    })

    return upsertProjectDirect(data, conductorSlug)
  }
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const body = await readBody<ProjectCreateBody>(event)

    assertJsonObject(body, 'Project create payload must be a JSON object.')
    assertOnlyFields(body, projectMutationFields, 'Project')

    await assertProjectRelationsAttachable(body, auth.user.id, auth.isAdmin)

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
    const isActive =
      typeof body.isActive === 'boolean' ? body.isActive : status !== 'ARCHIVED'

    if (isActive && (status === 'ACTIVE' || status === 'PAUSED')) {
      await enforceProjectCap({
        userId: auth.user.id,
        userRoles: [...userRoles(auth.user)],
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
      isActive,
      userId: auth.user.id,
    } satisfies Prisma.ProjectUncheckedCreateInput

    const project = await createProjectWithScaffoldTodo(
      projectData,
      conductorSlug,
      auth.user.id,
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
