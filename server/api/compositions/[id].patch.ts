// /server/api/compositions/[id].patch.ts
import { defineEventHandler, createError, getRouterParam, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import type { Composition, Prisma } from '~/prisma/generated/prisma/client'

type CompositionPatchBody = Partial<Composition>

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function asOptionalNullableString(value: unknown): string | null | undefined {
  if (value === null) return null
  if (typeof value !== 'string') return undefined

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function asOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function asOptionalPositiveInt(value: unknown): number | undefined {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function relationUpdate(
  value: unknown,
): { connect: { id: number } } | { disconnect: true } | undefined {
  if (value === null) return { disconnect: true }

  const id = asOptionalPositiveInt(value)

  return id ? { connect: { id } } : undefined
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
        message: 'Invalid Composition ID.',
      })
    }

    const { isValid, user, kind } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const existing = await prisma.composition.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        message: 'Composition not found.',
      })
    }

    const isAdmin = user.Role === 'ADMIN' || user.id === 1
    const isServerKey = kind === 'server'
    const isOwner = existing.userId === user.id

    if (!isOwner && !isAdmin && !isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this Composition.',
      })
    }

    const body = await readBody<CompositionPatchBody>(event)

    if (!body || Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const updateData: Prisma.CompositionUpdateInput = {
      title: asOptionalString(body.title),
      description: asOptionalNullableString(body.description),
      label: asOptionalNullableString(body.label),
      mode: asOptionalString(body.mode),
      designer: asOptionalString(body.designer),
      characterBlurb: asOptionalNullableString(body.characterBlurb),
      dreamBlurb: asOptionalNullableString(body.dreamBlurb),
      scenarioBlurb: asOptionalNullableString(body.scenarioBlurb),
      pitchBlurb: asOptionalNullableString(body.pitchBlurb),
      rewardBlurb: asOptionalNullableString(body.rewardBlurb),
      narrativeText: asOptionalNullableString(body.narrativeText),
      artPrompt: asOptionalNullableString(body.artPrompt),
      isPublic: asOptionalBoolean(body.isPublic),
      isMature: asOptionalBoolean(body.isMature),
      isActive: asOptionalBoolean(body.isActive),
      Character: relationUpdate(body.characterId),
      Dream: relationUpdate(body.dreamId),
      Scenario: relationUpdate(body.scenarioId),
      Pitch: relationUpdate(body.pitchId),
      Reward: relationUpdate(body.rewardId),
      ArtImage: relationUpdate(body.artImageId),
    }

    if (!hasUpdateData(updateData as Record<string, unknown>)) {
      throw createError({
        statusCode: 400,
        message: 'No valid composition fields provided for update.',
      })
    }

    const data = await prisma.composition.update({
      where: { id },
      data: updateData,
      include: {
        Character: true,
        Dream: true,
        Scenario: true,
        Pitch: true,
        Reward: true,
        ArtImage: {
          select: {
            id: true,
            imagePath: true,
            fileName: true,
          },
        },
      },
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Composition updated successfully.',
      data,
      statusCode: 200,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)

    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || `Failed to update Composition with ID ${id}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
