// /server/api/characters/[id].patch.ts
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import { normalizeSlugInput } from '../../../utils/slugify'
import {
  findCharacterNameDuplicate,
  getCharacterNameKey,
  getUniqueCharacterSlug,
} from '../../utils/characterSlug'
import type { Character, Prisma } from '~/prisma/generated/prisma/client'
import { characterMutationSelect } from './selects'

type CharacterPatchBody = Partial<Character> & {
  rewardIds?: unknown
  scenarioIds?: unknown
  dreamIds?: unknown
}

function normalizePositiveIdArray(value: unknown, field: string): number[] {
  if (!Array.isArray(value)) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must be an array of positive integer IDs.`,
    })
  }

  const ids = value.map((entry) => Number(entry))

  if (!ids.every((entry) => Number.isInteger(entry) && entry > 0)) {
    throw createError({
      statusCode: 400,
      message: `The "${field}" field must contain only positive integer IDs.`,
    })
  }

  return [...new Set(ids)]
}

function normalizeArtImageRelation(
  value: unknown,
): Prisma.ArtImageUpdateOneWithoutCharactersNestedInput {
  if (value === null || value === '') return { disconnect: true }

  const id = Number(value)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: 'artImageId must be a positive integer or null when provided.',
    })
  }

  return { connect: { id } }
}

function getStringOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function getTrimmedStringOrUndefined(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

function getBooleanOrUndefined(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function getNumberOrUndefined(value: unknown): number | undefined {
  if (value === null || typeof value === 'undefined' || value === '') {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function hasUpdateData(data: Record<string, unknown>): boolean {
  return Object.values(data).some((value) => value !== undefined)
}

async function assertRelatedRecordsExist(options: {
  rewardIds?: number[]
  scenarioIds?: number[]
  dreamIds?: number[]
}) {
  const { rewardIds, scenarioIds, dreamIds } = options

  if (rewardIds?.length) {
    const records = await prisma.reward.findMany({
      where: { id: { in: rewardIds } },
      select: { id: true },
    })
    const foundIds = new Set(records.map((record) => record.id))
    const missingIds = rewardIds.filter((id) => !foundIds.has(id))

    if (missingIds.length) {
      throw createError({
        statusCode: 404,
        message: `Reward IDs not found: ${missingIds.join(', ')}.`,
      })
    }
  }

  if (scenarioIds?.length) {
    const records = await prisma.scenario.findMany({
      where: { id: { in: scenarioIds } },
      select: { id: true },
    })
    const foundIds = new Set(records.map((record) => record.id))
    const missingIds = scenarioIds.filter((id) => !foundIds.has(id))

    if (missingIds.length) {
      throw createError({
        statusCode: 404,
        message: `Scenario IDs not found: ${missingIds.join(', ')}.`,
      })
    }
  }

  if (dreamIds?.length) {
    const records = await prisma.dream.findMany({
      where: { id: { in: dreamIds } },
      select: { id: true },
    })
    const foundIds = new Set(records.map((record) => record.id))
    const missingIds = dreamIds.filter((id) => !foundIds.has(id))

    if (missingIds.length) {
      throw createError({
        statusCode: 404,
        message: `Dream IDs not found: ${missingIds.join(', ')}.`,
      })
    }
  }
}

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  try {
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid character ID. It must be a positive integer.',
      })
    }

    const { isValid, user, kind } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const existingCharacter = await prisma.character.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        name: true,
        slug: true,
      },
    })

    if (!existingCharacter) {
      throw createError({
        statusCode: 404,
        message: 'Character not found.',
      })
    }

    const isAdmin = user.Role === 'ADMIN' || user.id === 1
    const isServerKey = kind === 'server'
    const isOwner = existingCharacter.userId === user.id

    if (!isOwner && !isAdmin && !isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this character.',
      })
    }

    const body = await readBody<CharacterPatchBody>(event)

    if (!body || Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const nextName = getTrimmedStringOrUndefined(body.name)

    if (typeof body.name === 'string' && !nextName) {
      throw createError({
        statusCode: 400,
        message: 'Character name must contain at least one letter or number.',
      })
    }

    if (nextName && !getCharacterNameKey(nextName)) {
      throw createError({
        statusCode: 400,
        message: 'Character name must contain at least one letter or number.',
      })
    }

    if (nextName && nextName !== existingCharacter.name) {
      const duplicate = await findCharacterNameDuplicate(
        prisma,
        existingCharacter.userId,
        nextName,
        id,
      )

      if (duplicate) {
        throw createError({
          statusCode: 409,
          message: `Character "${nextName}" already exists as #${duplicate.id}.`,
        })
      }
    }

    const requestedSlug = normalizeSlugInput(body.slug)
    let nextSlug: string | null | undefined

    if (typeof requestedSlug !== 'undefined') {
      nextSlug = requestedSlug
        ? await getUniqueCharacterSlug(prisma, requestedSlug, { excludeId: id })
        : null
    } else if (!existingCharacter.slug) {
      nextSlug = await getUniqueCharacterSlug(
        prisma,
        nextName ?? existingCharacter.name,
        { excludeId: id },
      )
    }

    const rewardIds =
      'rewardIds' in body
        ? normalizePositiveIdArray(body.rewardIds, 'rewardIds')
        : undefined
    const scenarioIds =
      'scenarioIds' in body
        ? normalizePositiveIdArray(body.scenarioIds, 'scenarioIds')
        : undefined
    const dreamIds =
      'dreamIds' in body
        ? normalizePositiveIdArray(body.dreamIds, 'dreamIds')
        : undefined

    await assertRelatedRecordsExist({ rewardIds, scenarioIds, dreamIds })

    const updateData: Prisma.CharacterUpdateInput = {
      name: nextName,
      slug: nextSlug,
      honorific: getStringOrUndefined(body.honorific),
      title: getStringOrUndefined(body.title),
      role: getStringOrUndefined(body.role),
      class: getStringOrUndefined(body.class),
      species: getStringOrUndefined(body.species),
      gender: getStringOrUndefined(body.gender),
      presentation: getStringOrUndefined(body.presentation),
      genre: getStringOrUndefined(body.genre),
      alignment: getStringOrUndefined(body.alignment),
      personality: getStringOrUndefined(body.personality),
      sampleResponse: getStringOrUndefined(body.sampleResponse),
      voice: getStringOrUndefined(body.voice),
      drive: getStringOrUndefined(body.drive),
      backstory: getStringOrUndefined(body.backstory),
      achievements: getStringOrUndefined(body.achievements),
      quirks: getStringOrUndefined(body.quirks),
      artPrompt: getStringOrUndefined(body.artPrompt),
      imagePath: getStringOrUndefined(body.imagePath),
      designer: getStringOrUndefined(body.designer),
      experience: getNumberOrUndefined(body.experience),
      level: getNumberOrUndefined(body.level),
      isPublic: getBooleanOrUndefined(body.isPublic),
      isMature: getBooleanOrUndefined(body.isMature),
      isActive: getBooleanOrUndefined(body.isActive),
      luck: body.luck,
      might: body.might,
      wits: body.wits,
      grace: body.grace,
      charm: body.charm,
      empathy: body.empathy,
    }

    if ('artImageId' in body) {
      updateData.ArtImage = normalizeArtImageRelation(body.artImageId)
    }

    if (rewardIds) {
      updateData.Rewards = {
        set: rewardIds.map((rewardId) => ({ id: rewardId })),
      }
    }

    if (scenarioIds) {
      updateData.Scenarios = {
        set: scenarioIds.map((scenarioId) => ({ id: scenarioId })),
      }
    }

    if (dreamIds) {
      updateData.Dreams = {
        set: dreamIds.map((dreamId) => ({ id: dreamId })),
      }
    }

    if (!hasUpdateData(updateData as Record<string, unknown>)) {
      throw createError({
        statusCode: 400,
        message: 'No valid character fields provided for update.',
      })
    }

    const data = await prisma.character.update({
      where: { id },
      data: updateData,
      select: characterMutationSelect,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Character updated successfully.',
      data,
      statusCode: 200,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || `Failed to update character with ID ${id}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
