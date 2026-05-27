// /server/api/characters/[id].patch.ts
import { defineEventHandler, createError, getRouterParam, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import type { Character, Prisma } from '~/prisma/generated/prisma/client'

type CharacterPatchBody = Partial<Character> & {
  rewardIds?: number[]
  scenarioIds?: number[]
  dreamIds?: number[]
}

function normalizeIdArray(value: unknown): number[] {
  if (!Array.isArray(value)) return []

  return Array.from(
    new Set(
      value
        .map((entry) => Number(entry))
        .filter((entry) => Number.isInteger(entry) && entry > 0),
    ),
  )
}

function getStringOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function getBooleanOrUndefined(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function getNumberOrUndefined(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function hasUpdateData(data: Record<string, unknown>): boolean {
  return Object.values(data).some((value) => value !== undefined)
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

    const rewardIds = normalizeIdArray(body.rewardIds)
    const scenarioIds = normalizeIdArray(body.scenarioIds)
    const dreamIds = normalizeIdArray(body.dreamIds)

    const updateData: Prisma.CharacterUpdateInput = {
      name: getStringOrUndefined(body.name),
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

      ArtImage:
        typeof body.artImageId === 'number'
          ? { connect: { id: body.artImageId } }
          : body.artImageId === null
            ? { disconnect: true }
            : undefined,

      Rewards: rewardIds.length
        ? {
            connect: rewardIds.map((rewardId) => ({ id: rewardId })),
          }
        : undefined,

      Scenarios: scenarioIds.length
        ? {
            connect: scenarioIds.map((scenarioId) => ({ id: scenarioId })),
          }
        : undefined,

      Dreams: dreamIds.length
        ? {
            connect: dreamIds.map((dreamId) => ({ id: dreamId })),
          }
        : undefined,
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
      include: {
        ArtImage: {
          select: {
            id: true,
            imagePath: true,
            fileName: true,
          },
        },
        Rewards: {
          select: {
            id: true,
            label: true,
          },
        },
        Scenarios: {
          select: {
            id: true,
            title: true,
          },
        },
        Dreams: {
          select: {
            id: true,
            title: true,
          },
        },
      },
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
