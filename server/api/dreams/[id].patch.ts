import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { requireApiUser } from '@/server/utils/authGuard'
import type {
  CreationSource,
  DreamType,
  Prisma,
} from '~/prisma/generated/prisma/client'
import {
  assertDreamAccess,
  dreamInclude,
  dreamTypes,
  getDreamId,
  normalizeCreationSource,
  normalizeIdArray,
  normalizeNullableId,
  normalizeOptionalText,
  normalizeSlug,
  relationFromNullableId,
  scenariosRelationFromPatch,
} from './index'

type DreamPatchBody = {
  title?: string
  slug?: string | null
  dreamType?: DreamType
  creationSource?: CreationSource
  description?: string | null
  pitch?: string | null
  flavorText?: string | null
  examples?: string | null
  artPrompt?: string | null
  imagePath?: string | null
  cardPath?: string | null
  heroPath?: string | null
  highlightImage?: string | null
  icon?: string | null
  designer?: string | null
  artImageId?: number | null
  artCollectionId?: number | null
  scenarioId?: number | null
  scenarioIds?: number[]
  Scenarios?: number[]
  isPublic?: boolean
  isMature?: boolean
  isActive?: boolean
  allowReviews?: boolean
  projectStatus?: 'ACTIVE' | 'PAUSED' | 'DONE' | 'ARCHIVED' | 'BRAINSTORM'
  repoUrl?: string | null
  liveUrl?: string | null
  goal?: string | null
  waypoints?: string | null
  characterIds?: number[]
  rewardIds?: number[]
  artImageIds?: number[]
  artCollectionIds?: number[]
  addArtImageToCollection?: boolean
  updateNote?: string | null
}

function uniqueIds(values: Array<number | null | undefined>): number[] {
  return Array.from(
    new Set(
      values.filter(
        (id): id is number =>
          typeof id === 'number' && Number.isInteger(id) && id > 0,
      ),
    ),
  )
}

function idsFromNullable(value: unknown): number[] {
  const id = normalizeNullableId(value)
  return id ? [id] : []
}

function forbiddenRelationError(label: string) {
  return createError({
    statusCode: 403,
    message: `You do not have permission to attach one or more ${label} records to this Dream.`,
  })
}

async function assertAttachableRelations(
  body: DreamPatchBody,
  userId: number,
  userRole: string,
) {
  if (userRole === 'ADMIN') return

  const artImageIds = uniqueIds([
    ...idsFromNullable(body.artImageId),
    ...(normalizeIdArray(body.artImageIds) ?? []),
  ])

  if (artImageIds.length) {
    const count = await prisma.artImage.count({
      where: {
        id: { in: artImageIds },
        OR: [{ userId }, { isPublic: true }],
      },
    })

    if (count !== artImageIds.length) throw forbiddenRelationError('ArtImage')
  }

  const artCollectionIds = uniqueIds([
    ...idsFromNullable(body.artCollectionId),
    ...(normalizeIdArray(body.artCollectionIds) ?? []),
  ])

  if (artCollectionIds.length) {
    const count = await prisma.artCollection.count({
      where: {
        id: { in: artCollectionIds },
        OR: [{ userId }, { isPublic: true }],
      },
    })

    if (count !== artCollectionIds.length)
      throw forbiddenRelationError('ArtCollection')
  }

  const scenarioIds = uniqueIds([
    ...idsFromNullable(body.scenarioId),
    ...(normalizeIdArray(body.scenarioIds) ?? []),
    ...(normalizeIdArray(body.Scenarios) ?? []),
  ])

  if (scenarioIds.length) {
    const count = await prisma.scenario.count({
      where: {
        id: { in: scenarioIds },
        OR: [{ userId }, { isPublic: true }],
      },
    })

    if (count !== scenarioIds.length) throw forbiddenRelationError('Scenario')
  }

  const characterIds = normalizeIdArray(body.characterIds) ?? []

  if (characterIds.length) {
    const count = await prisma.character.count({
      where: {
        id: { in: characterIds },
        OR: [{ userId }, { isPublic: true }],
      },
    })

    if (count !== characterIds.length) throw forbiddenRelationError('Character')
  }

  const rewardIds = normalizeIdArray(body.rewardIds) ?? []

  if (rewardIds.length) {
    const count = await prisma.reward.count({
      where: {
        id: { in: rewardIds },
        OR: [{ userId }, { isPublic: true }],
      },
    })

    if (count !== rewardIds.length) throw forbiddenRelationError('Reward')
  }
}

function setTextField<T extends keyof Prisma.DreamUpdateInput>(
  dataInput: Prisma.DreamUpdateInput,
  key: T,
  value: unknown,
) {
  const normalized = normalizeOptionalText(value)

  if (normalized !== undefined) {
    dataInput[key] = normalized as Prisma.DreamUpdateInput[T]
  }
}

function getUpdateSummary(body: DreamPatchBody): string {
  const changes: string[] = []

  if (body.title !== undefined) changes.push('name')
  if (body.description !== undefined || body.pitch !== undefined) {
    changes.push('idea')
  }
  if (body.dreamType !== undefined) changes.push('type')
  if (body.creationSource !== undefined) changes.push('source')
  if (body.artPrompt !== undefined) changes.push('prompt')
  if (
    body.artImageId !== undefined ||
    body.artImageIds !== undefined ||
    body.imagePath !== undefined ||
    body.highlightImage !== undefined
  ) {
    changes.push('visuals')
  }
  if (
    body.artCollectionId !== undefined ||
    body.artCollectionIds !== undefined
  ) {
    changes.push('collections')
  }
  if (body.scenarioId !== undefined || body.scenarioIds !== undefined) {
    changes.push('scenarios')
  }
  if (body.characterIds !== undefined) changes.push('cast')
  if (body.rewardIds !== undefined) changes.push('items')
  if (
    body.isPublic !== undefined ||
    body.isMature !== undefined ||
    body.isActive !== undefined ||
    body.allowReviews !== undefined
  ) {
    changes.push('settings')
  }

  if (
    body.projectStatus !== undefined ||
    body.repoUrl !== undefined ||
    body.liveUrl !== undefined ||
    body.goal !== undefined ||
    body.waypoints !== undefined
  ) {
    changes.push('project')
  }

  if (!changes.length) return 'Dream updated.'

  return `Dream updated: ${changes.join(', ')}.`
}

export default defineEventHandler(async (event) => {
  let id = 0

  try {
    id = getDreamId(event)

    const auth = await requireApiUser(event)
    const user = auth.user

    const existingDream = await prisma.dream.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        title: true,
        isPublic: true,
      },
    })

    if (!existingDream) {
      throw createError({
        statusCode: 404,
        message: 'Dream not found.',
      })
    }

    assertDreamAccess({
      dream: existingDream,
      userId: user.id,
      userRole: user.Role,
      action: 'mutate',
    })

    const body = await readBody<DreamPatchBody>(event)

    if (!body || Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    await assertAttachableRelations(body, user.id, user.Role)

    const dataInput: Prisma.DreamUpdateInput = {}

    if (typeof body.title === 'string') {
      const title = body.title.trim()

      if (!title) {
        throw createError({
          statusCode: 400,
          message: 'The "title" field cannot be empty.',
        })
      }

      dataInput.title = title
    }

    if (body.slug !== undefined) {
      dataInput.slug = body.slug ? normalizeSlug(body.slug) : null
    }

    if (body.dreamType !== undefined && dreamTypes.includes(body.dreamType)) {
      dataInput.dreamType = body.dreamType
    }

    if (body.creationSource !== undefined) {
      dataInput.creationSource = normalizeCreationSource(body.creationSource)
    }

    if (body.description !== undefined) {
      setTextField(dataInput, 'description', body.description)
    }

    if (body.pitch !== undefined) {
      setTextField(dataInput, 'pitch', body.pitch)
    }

    if (body.flavorText !== undefined) {
      setTextField(dataInput, 'flavorText', body.flavorText)
    }

    if (body.examples !== undefined) {
      setTextField(dataInput, 'examples', body.examples)
    }

    if (body.artPrompt !== undefined) {
      setTextField(dataInput, 'artPrompt', body.artPrompt)
    }

    if (body.imagePath !== undefined) {
      setTextField(dataInput, 'imagePath', body.imagePath)
    }

    if (body.cardPath !== undefined) {
      setTextField(dataInput, 'cardPath', body.cardPath)
    }

    if (body.heroPath !== undefined) {
      setTextField(dataInput, 'heroPath', body.heroPath)
    }

    if (body.highlightImage !== undefined) {
      setTextField(dataInput, 'highlightImage', body.highlightImage)
    }

    if (body.icon !== undefined) {
      setTextField(dataInput, 'icon', body.icon)
    }

    if (body.designer !== undefined) {
      setTextField(dataInput, 'designer', body.designer)
    }

    if (body.artImageId !== undefined) {
      const relation = relationFromNullableId(body.artImageId)
      if (relation) dataInput.ArtImage = relation
    }

    if (body.artCollectionId !== undefined) {
      const relation = relationFromNullableId(body.artCollectionId)
      if (relation) dataInput.ArtCollection = relation
    }

    const scenariosRelation = scenariosRelationFromPatch(body)

    if (scenariosRelation) {
      dataInput.Scenarios = scenariosRelation
    }

    if (typeof body.isPublic === 'boolean') {
      dataInput.isPublic = body.isPublic
    }

    if (typeof body.isMature === 'boolean') {
      dataInput.isMature = body.isMature
    }

    if (typeof body.isActive === 'boolean') {
      dataInput.isActive = body.isActive
    }

    const validProjectStatuses = [
      'ACTIVE',
      'PAUSED',
      'DONE',
      'ARCHIVED',
      'BRAINSTORM',
    ] as const
    if (
      body.projectStatus !== undefined &&
      validProjectStatuses.includes(body.projectStatus)
    ) {
      dataInput.projectStatus = body.projectStatus
    }

    if (body.repoUrl !== undefined) {
      setTextField(dataInput, 'repoUrl', body.repoUrl)
    }

    if (body.liveUrl !== undefined) {
      setTextField(dataInput, 'liveUrl', body.liveUrl)
    }

    if (body.goal !== undefined) {
      setTextField(dataInput, 'goal', body.goal)
    }

    if (body.waypoints !== undefined) {
      setTextField(dataInput, 'waypoints', body.waypoints)
    }

    if (typeof body.allowReviews === 'boolean') {
      dataInput.allowReviews = body.allowReviews
    }

    const characterIds = normalizeIdArray(body.characterIds)
    const rewardIds = normalizeIdArray(body.rewardIds)
    const artImageIds = normalizeIdArray(body.artImageIds)
    const artCollectionIds = normalizeIdArray(body.artCollectionIds)

    if (characterIds !== undefined) {
      dataInput.Characters = {
        set: characterIds.map((characterId) => ({ id: characterId })),
      }
    }

    if (rewardIds !== undefined) {
      dataInput.Rewards = {
        set: rewardIds.map((rewardId) => ({ id: rewardId })),
      }
    }

    if (artImageIds !== undefined) {
      dataInput.ArtImages = {
        set: artImageIds.map((artImageId) => ({ id: artImageId })),
      }
    }

    if (artCollectionIds !== undefined) {
      dataInput.ArtCollections = {
        set: artCollectionIds.map((collectionId) => ({ id: collectionId })),
      }
    }

    const updated = await prisma.dream.update({
      where: { id },
      data: dataInput,
      include: dreamInclude,
    })

    if (
      body.addArtImageToCollection &&
      updated.artImageId &&
      updated.artCollectionId
    ) {
      await prisma.artCollection.update({
        where: { id: updated.artCollectionId },
        data: {
          ArtImages: {
            connect: { id: updated.artImageId },
          },
        },
      })
    }

    const data =
      (await prisma.dream.findUnique({
        where: { id },
        include: dreamInclude,
      })) ?? updated

    const sender = user.username || `User ${user.id}`
    const updateNote = normalizeOptionalText(body.updateNote)
    const content = updateNote || getUpdateSummary(body)

    await prisma.chat.create({
      data: {
        type: 'Dream',
        sender,
        content,
        title: data.title,
        userId: user.id,
        dreamId: id,
        artImageId: data.artImageId ?? undefined,
        isPublic: data.isPublic,
        isMature: data.isMature,
        channel: `dream-${id}`,
      },
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Dream updated successfully.',
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || `Failed to update Dream with ID ${id}.`,
      data: null,
      statusCode,
    }
  }
})
