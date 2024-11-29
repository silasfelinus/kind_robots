import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import type { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
  let id: number | null = null
  let response

  try {
    // Parse and validate the character ID from the URL params
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid character ID. It must be a positive integer.',
      })
    }

    // Use validateApiKey to authenticate
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Fetch the existing character to verify ownership
    const existingCharacter = await prisma.character.findUnique({
      where: { id },
    })
    if (!existingCharacter) {
      throw createError({
        statusCode: 404,
        message: 'Character not found.',
      })
    }

    // Verify ownership of the character
    if (existingCharacter.userId !== userId && user.Role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this character.',
      })
    }

    // Parse the incoming request body as partial character data
    const characterData: Prisma.CharacterUpdateInput = await readBody(event)
    if (!characterData || Object.keys(characterData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Update the character in the database
    const data = await prisma.character.update({
      where: { id },
      data: characterData,
    })

    // Successful response with updated character
    response = {
      success: true,
      message: 'Character updated successfully.',
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
        handledError.message || `Failed to update character with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
