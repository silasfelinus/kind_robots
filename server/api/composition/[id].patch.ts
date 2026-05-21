// @ts-nocheck
/* eslint-disable */
// test-ignore

// /server/api/compositions/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { Prisma } from '~/prisma/generated/prisma/client'

export default defineEventHandler(async (event) => {
  let id = 0
  let response

  try {
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid Composition ID.' })
    }

    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const existing = await prisma.composition.findUnique({ where: { id } })
    if (!existing) {
      throw createError({ statusCode: 404, message: 'Composition not found.' })
    }

    if (existing.userId !== user.id && user.Role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this Composition.',
      })
    }

    const body = await readBody(event)
    if (!body || Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Strip any relation objects from the body; handle FKs as connect/disconnect
    const {
      Character,
      Dream,
      Scenario,
      Pitch,
      Reward,
      ArtImage,
      User,
      characterId,
      dreamId,
      scenarioId,
      pitchId,
      rewardId,
      artImageId,
      ...scalarUpdates
    } = body

    const updateData: Prisma.CompositionUpdateInput = { ...scalarUpdates }

    if (characterId !== undefined) {
      updateData.Character = characterId
        ? { connect: { id: characterId } }
        : { disconnect: true }
    }
    if (dreamId !== undefined) {
      updateData.Dream = dreamId
        ? { connect: { id: dreamId } }
        : { disconnect: true }
    }
    if (scenarioId !== undefined) {
      updateData.Scenario = scenarioId
        ? { connect: { id: scenarioId } }
        : { disconnect: true }
    }
    if (pitchId !== undefined) {
      updateData.Pitch = pitchId
        ? { connect: { id: pitchId } }
        : { disconnect: true }
    }
    if (rewardId !== undefined) {
      updateData.Reward = rewardId
        ? { connect: { id: rewardId } }
        : { disconnect: true }
    }
    if (artImageId !== undefined) {
      updateData.ArtImage = artImageId
        ? { connect: { id: artImageId } }
        : { disconnect: true }
    }

    const data = await prisma.composition.update({
      where: { id },
      data: updateData,
    })

    response = {
      success: true,
      message: 'Composition updated successfully.',
      data,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message || `Failed to update Composition with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
