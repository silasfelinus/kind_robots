// /server/api/scenarios/[id].get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  let response

  try {
    const id = Number(event.context.params?.id)

    if (isNaN(id)) {
      return {
        success: false,
        message: 'Invalid ID',
        statusCode: 400,
      }
    }

    // Fetch the scenario by ID
    const data = await prisma.scenario.findUnique({
      where: { id },
    })
    if (!data) {
      return {
        success: false,
        message: 'Scenario not found',
        statusCode: 404,
      }
    }

    response = {
      success: true,
      message: 'Scenario details fetched successfully.',
      data, // Return the scenario details under data
      statusCode: 200,
    }
    event.node.res.statusCode = response.statusCode
  } catch (error: unknown) {
    return errorHandler(error)
  }

  return response
})
