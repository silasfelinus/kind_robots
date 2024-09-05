// server/api/components/[name]/index.get.ts

import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
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
      throw new Error(`No components found for folder: ${folderName}`)
    }

    // Extract component names from the result
    const componentList = components.map(component => component.componentName)

    // Return the list of component names
    return { success: true, components: componentList }
  } catch (error: unknown) {
    console.error('Failed to fetch component list:', error)
    return errorHandler({
      success: false,
      message: 'Failed to fetch component list.',
      statusCode: 500,
    })
  }
})
