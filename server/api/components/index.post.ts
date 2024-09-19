//server/api/components/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const componentData = await readBody(event)

    // Use the `upsert` method to either create a new component or update an existing one
    const upsertedComponent = await prisma.component.upsert({
      where: {
        componentName: componentData.componentName, // Assuming componentName is unique
      },
      update: {
        folderName: componentData.folderName,
        isWorking: componentData.isWorking !== undefined ? componentData.isWorking : true,
        underConstruction: componentData.underConstruction !== undefined ? componentData.underConstruction : false,
        isBroken: componentData.isBroken !== undefined ? componentData.isBroken : false,
        title: componentData.title || componentData.componentName,
        Tags: {
          set: componentData.Tags || [], // Update the Tags relationship
        },
        updatedAt: new Date(), // Ensure updatedAt is set to the current time
      },
      create: {
        folderName: componentData.folderName,
        componentName: componentData.componentName,
        isWorking: componentData.isWorking || true,
        underConstruction: componentData.underConstruction || false,
        isBroken: componentData.isBroken || false,
        title: componentData.title || componentData.componentName,
        Tags: {
          set: componentData.Tags || [], // Set the Tags relationship on create
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return {
      success: true,
      component: upsertedComponent,
    }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
