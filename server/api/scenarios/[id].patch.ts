// /server/api/scenarios/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import type { Prisma } from '~/server/generated/prisma'

export default defineEventHandler(async (event) => {
  let id: number | null = null
  let response

  try {
    // Parse and validate the scenario ID from the URL params
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid scenario ID. It must be a positive integer.',
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

    // Fetch the existing scenario to verify ownership
    const existingScenario = await prisma.scenario.findUnique({
      where: { id },
    })
    if (!existingScenario) {
      throw createError({
        statusCode: 404,
        message: 'Scenario not found.',
      })
    }

    // Verify ownership of the scenario
    if (existingScenario.userId !== userId && user.Role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this scenario.',
      })
    }

    // Parse the incoming request body as partial scenario data
    const scenarioData: Prisma.ScenarioUpdateInput = await readBody(event)
    if (!scenarioData || Object.keys(scenarioData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Update the scenario in the database
    const data = await prisma.scenario.update({
      where: { id },
      data: scenarioData,
    })

    // Successful response with updated scenario
    response = {
      success: true,
      message: 'Scenario updated successfully.',
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
        handledError.message || `Failed to update scenario with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
