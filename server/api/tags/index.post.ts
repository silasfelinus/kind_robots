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
          title: toTitleCase(tag),
        }
      }

      return {
        label: toTitleCase(tag.label),
        title: toTitleCase(tag.title),
      }
    })

    // Create tags in a batch and skip duplicates
    const newTags = await addTags(transformedTags)

    return { success: true, newTags }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)

    return {
      success: false,
      message: 'Failed to create new tags',
      error: message,
      statusCode: statusCode || 500, // Default to 500 if no status code is provided
    }
  }
})

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
  )
}

async function addTags(
  tagsData: Prisma.TagCreateManyInput[],
): Promise<Tag[]> {
  try {
    await prisma.tag.createMany({
      data: tagsData,
      skipDuplicates: true,
    })

    // Retrieve the created tags
    const newTags = await prisma.tag.findMany({
      where: {
        OR: tagsData.map((tag) => ({
          title: tag.title,
          label: tag.label,
        })),
      },
    })

    return newTags
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    throw new Error(errorMessage)
  }
}
