// server/api/components/[name]/index.get.ts

import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  let response

  try {
    // Extract folder name from the route parameter
    const folderName = String(event.context.params?.name)
    if (!folderName) {
      throw new Error('Invalid folder name.')
    }

    // Fetch components from the database where the folderName matches
    const components = await prisma.component.findMany({
      where: { folderName },
      select: {
        componentName: true, // Only select component names
      },
    })

    if (!components.length) {
      return {
        success: false,
        message: `No components found for folder: ${folderName}`,
        statusCode: 404,
      }
    }

    // Extract component names from the result
    const data = components.map((component) => component.componentName)

    // Return the list of component names
    response = {
      success: true,
      data,
      message: 'Component list fetched successfully.',
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Failed to fetch component list:', handledError)

    // Set response and status code based on handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to fetch component list.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
