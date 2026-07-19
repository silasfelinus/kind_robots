// server/api/components/folder/[name].get.ts

import { defineEventHandler } from 'h3'
import { errorHandler } from '../../../utils/error'
import prisma from '../../../utils/prisma'
import { getOptionalApiUser } from '../../../utils/authGuard'
import { projectComponentForViewer } from '../../../utils/componentProjection'

export default defineEventHandler(async (event) => {
  let response

  try {
    const folderName = event.context.params?.name
    if (!folderName) {
      throw new Error('Folder name is required.')
    }

    const [components, auth] = await Promise.all([
      prisma.component.findMany({
        where: {
          folderName,
        },
      }),
      getOptionalApiUser(event),
    ])

    if (!components.length) {
      return {
        success: false,
        message: `No components found in the folder "${folderName}".`,
        statusCode: 404,
      }
    }

    response = {
      success: true,
      data: components.map((component) =>
        projectComponentForViewer(component, auth?.isAdmin === true),
      ),
      message: 'Components retrieved successfully.',
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error retrieving components:', handledError)

    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to retrieve components.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
