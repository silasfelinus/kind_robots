// server/api/components/index.post.ts

import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  let response

  try {
    // Parse the incoming component data from the request body
    const componentData = await readBody(event)

    // Ensure Tags is an array before processing it
    const tags = componentData.Tags || []

    // Use the `upsert` method to either create or update an existing component
    const data = await prisma.component.upsert({
      where: {
        componentName: componentData.componentName, // Assuming componentName is unique in the schema
      },
      update: {
        folderName: componentData.folderName,
        isWorking: componentData.isWorking ?? true,
        underConstruction: componentData.underConstruction ?? false,
        isBroken: componentData.isBroken ?? false,
        title: componentData.title || componentData.componentName,
        updatedAt: new Date(),
      },
      create: {
        folderName: componentData.folderName,
        componentName: componentData.componentName,
        isWorking: componentData.isWorking ?? true,
        underConstruction: componentData.underConstruction ?? false,
        isBroken: componentData.isBroken ?? false,
        title: componentData.title || componentData.componentName,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // Set the success response with the upserted component data
    response = {
      success: true,
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    // Handle errors with errorHandler for consistent structure
    const handledError = errorHandler(error)
    response = {
      success: false,
      message: handledError.message || 'Failed to create or update component.',
      statusCode: handledError.statusCode || 500,
    }
  }

  return response
})
