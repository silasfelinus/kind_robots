// /server/api/tags/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import type { Prisma, Tag } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const tagsData = await readBody(event)

    if (!Array.isArray(tagsData)) {
      return {
        success: false,
        message: 'Invalid JSON body. Expected an array of tags or strings.',
      }
    }

    // Transform to Title Case and validate
    const transformedTags: Prisma.TagCreateManyInput[] = tagsData.map((tag) => {
      if (typeof tag === 'string') {
        return {
          label: 'Default', // Default label
          title: tag.replace(
            /\w\S*/g,
            (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
          ),
        }
      }

      return {
        label:
          tag.label.charAt(0).toUpperCase() + tag.label.slice(1).toLowerCase(),
        title: tag.title.replace(
          /\w\S*/g,
          (txt: string) =>
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
        ),
      }
    })

    // Create tags in a batch and skip duplicates
    const result = await addTags(transformedTags)

    return { success: true, count: result.count }
  } catch (error) {
    // Use the error handler to process the error
    const { message, statusCode } = errorHandler(error)

    return {
      success: false,
      message: 'Failed to create new tags',
      error: message,
      statusCode: statusCode || 500, // Default to 500 if no status code is provided
    }
  }
})

async function addTags(
  tagsData: Prisma.TagCreateManyInput[],
): Promise<{ count: number }> {
  try {
    const result = await prisma.tag.createMany({
      data: tagsData,
      skipDuplicates: true,
    })
    return { count: result.count }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    throw new Error(errorMessage)
  }
}
