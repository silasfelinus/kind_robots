// server/api/components/folders.get.ts

import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async () => {
  let response

  try {
    // Fetch distinct folder names
    const folders = await prisma.component.findMany({
      select: {
        folderName: true,
      },
      distinct: ['folderName'], // Ensure unique folder names
    })

    // Map the result to extract folder names
    const folderNames = folders.map((folder) => folder.folderName)

    // Return consistent response structure
    response = {
      success: true,
      data: { folderNames },
      statusCode: 200,
    }
  } catch (error: unknown) {
    // Pass the error through errorHandler for structured error handling
    const handledError = errorHandler(error)
    response = {
      success: false,
      message: handledError.message || 'Failed to fetch folder names.',
      statusCode: handledError.statusCode || 500,
    }
  }

  return response
})
