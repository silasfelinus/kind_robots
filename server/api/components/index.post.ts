import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const componentData = await readBody(event)

    const newComponent = await prisma.component.create({
      data: {
        folderName: componentData.folderName,
        componentName: componentData.componentName,
        isWorking: componentData.isWorking || true,
        underConstruction: componentData.underConstruction || false,
        isBroken: componentData.isBroken || false,
        title: componentData.title || componentData.componentName,
        Tags: componentData.Tags || [],
      },
    })

    return {
      success: true,
      newComponent,
    }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
