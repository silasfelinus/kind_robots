// /server/api/scenarios/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import prisma from '../utils/prisma'
import type { Prisma, Scenario } from '~/server/generated/prisma'

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

    // Read and validate scenario data from the request body
    const scenarioData = await readBody<Partial<Scenario>>(event)

    // Ensure required "title" field is provided and is a string
    if (!scenarioData.title || typeof scenarioData.title !== 'string') {
      event.node.res.statusCode = 400
      return {
        success: false,
        data: null,
        message: 'The "title" field is required and must be a string.',
      }
    }

    // Prepare the full scenario data
    const fullData: Prisma.ScenarioCreateInput = {
      User: { connect: { id: authenticatedUserId } },
      title: scenarioData.title,
      description: scenarioData.description || '',
      intros: scenarioData.intros || '',
      locations: scenarioData.locations || '',
      ArtImage: scenarioData.artImageId
        ? { connect: { id: scenarioData.artImageId } }
        : undefined,
    }

    // Create the scenario and return a success response
    const data = await prisma.scenario.create({
      data: fullData,
      include: { ArtImage: true }, // Include ArtImage in the response
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      data,
      message: 'Scenario created successfully.',
    }
  } catch (error: unknown) {
    // Handle errors using the centralized error handler
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      data: null,
      message: message || 'Failed to create scenario.',
    }
  }
})
