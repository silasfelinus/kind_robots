// server/api/components/[name]/index.get.ts

import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  let response

  try {
    // Extract folder name from the route parameters
    const folderName = event.context.params?.name
    if (!folderName) {
      throw new Error('Folder name is required.')
    }

    // Fetch components from the database where the folderName matches the given name
    const data = await prisma.component.findMany({
      where: {
        folderName,
      },
      include: {
        Tags: true, // Include tags related to the component
      },
    })

    if (!data.length) {
      return {
        success: false,
        message: `No components found in the folder "${folderName}".`,
        statusCode: 404,
      }
    }

    // Return success response with components
    response = {
      success: true,
      data,
      message: 'Components retrieved successfully.',
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error retrieving components:', handledError)

    // Set response and status code based on handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to retrieve components.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
