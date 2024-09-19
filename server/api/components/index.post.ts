import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import type { Tag } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const componentData = await readBody(event)

    // Ensure Tags is an array before mapping
    const tags = componentData.Tags || [];

    // Use the `upsert` method to either create a new component or update an existing one
    const upsertedComponent = await prisma.component.upsert({
      where: {
        componentName: componentData.componentName, // Ensure componentName is unique in Prisma schema
      },
      update: {
        folderName: componentData.folderName,
        isWorking: componentData.isWorking !== undefined ? componentData.isWorking : true,
        underConstruction: componentData.underConstruction !== undefined ? componentData.underConstruction : false,
        isBroken: componentData.isBroken !== undefined ? componentData.isBroken : false,
        title: componentData.title || componentData.componentName,
        Tags: {
          connectOrCreate: tags.map((tag: Tag) => ({
            where: { label: tag.label }, // Use another unique field for the Tags (assuming `label` is unique)
            create: {
              label: tag.label,
              title: tag.title,
              flavorText: tag.flavorText,
              pitch: tag.pitch,
              isPublic: tag.isPublic,
              isMature: tag.isMature,
              userId: tag.userId,
              channelId: tag.channelId,
            },
          })),
        },
        updatedAt: new Date(),
      },
      create: {
        folderName: componentData.folderName,
        componentName: componentData.componentName,
        isWorking: componentData.isWorking || true,
        underConstruction: componentData.underConstruction || false,
        isBroken: componentData.isBroken || false,
        title: componentData.title || componentData.componentName,
        Tags: {
          connectOrCreate: tags.map((tag: Tag) => ({
            where: { label: tag.label }, // Ensure `label` is unique for new tags
            create: {
              label: tag.label,
              title: tag.title,
              flavorText: tag.flavorText,
              pitch: tag.pitch,
              isPublic: tag.isPublic,
              isMature: tag.isMature,
              userId: tag.userId,
              channelId: tag.channelId,
            },
          })),
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
