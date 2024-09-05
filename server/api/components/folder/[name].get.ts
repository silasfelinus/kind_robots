import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Extract folder name from the route parameters
    const folderName = event.context.params?.name
    if (!folderName) {
      throw new Error('Folder name is required.')
    }

    // Fetch components from the database where the folderName matches the given name
    const components = await prisma.component.findMany({
      where: {
        folderName,
      },
      include: {
        Tags: true, // Include tags related to the component
      },
    })

    if (!components.length) {
      throw new Error(`No components found in the folder "${folderName}".`)
    }

    return {
      success: true,
      components,
    }
  } catch (error: unknown) {
    // Use the errorHandler for consistent error handling
    return errorHandler(error)
  }
})
