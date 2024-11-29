import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import prisma from '../utils/prisma'
import type { Prisma, Character } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Authenticate using API key
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const authenticatedUserId = user.id

    // Read and validate character data from the request body
    const characterData = await readBody<Partial<Character>>(event)

    // Ensure required "name" field is provided and is a string
    if (!characterData.name || typeof characterData.name !== 'string') {
      event.node.res.statusCode = 400
      return {
        success: false,
        data: null,
        message: 'The "name" field is required and must be a string.',
      }
    }

    // Prepare the full character data
    const fullData: Prisma.CharacterCreateInput = {
      User: { connect: { id: authenticatedUserId } },
      name: characterData.name,
      alignment: characterData.alignment || null,
      level: characterData.level || 1,
      experience: characterData.experience || 0,
      class: characterData.class || null,
      species: characterData.species || null,
      backstory: characterData.backstory || null,
      drive: characterData.drive || null,
      inventory: characterData.inventory || null,
      statName1: characterData.statName1 || 'Strength',
      statValue1: characterData.statValue1 || 10,
      statName2: characterData.statName2 || 'Dexterity',
      statValue2: characterData.statValue2 || 10,
      statName3: characterData.statName3 || 'Constitution',
      statValue3: characterData.statValue3 || 10,
      statName4: characterData.statName4 || 'Intelligence',
      statValue4: characterData.statValue4 || 10,
      statName5: characterData.statName5 || 'Wisdom',
      statValue5: characterData.statValue5 || 10,
      statName6: characterData.statName6 || 'Charisma',
      statValue6: characterData.statValue6 || 10,
      goalStat1Name: characterData.goalStat1Name || 'Principled|Chaotic',
      goalStat1Value: characterData.goalStat1Value || 0,
      goalStat2Name: characterData.goalStat2Name || 'Social|Individual',
      goalStat2Value: characterData.goalStat2Value || 0,
      goalStat3Name: characterData.goalStat3Name || 'Active|Receptive',
      goalStat3Value: characterData.goalStat3Value || 0,
      goalStat4Name: characterData.goalStat4Name || 'Kindness|Self-Support',
      goalStat4Value: characterData.goalStat4Value || 0,
      quirks: characterData.quirks || null,
      skills: characterData.skills || null,
      genre: characterData.genre || null,
      artPrompt: characterData.artPrompt || null,
      artImageId: characterData.artImageId || null,
    }

    // Create the character and return a success response
    const data = await prisma.character.create({ data: fullData })
    event.node.res.statusCode = 201

    return {
      success: true,
      data,
      message: 'Character created successfully.',
    }
  } catch (error: unknown) {
    // Handle errors using the centralized error handler
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      data: null,
      message: message || 'Failed to create character.',
    }
  }
})
