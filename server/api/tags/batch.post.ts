// /server/api/tags/batch.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import type { Prisma, Tag } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Validate authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const authenticatedUserId = user.id

    // Read and validate tags data from the request body
    const tagsData = await readBody<Partial<Tag>[]>(event)

    if (!Array.isArray(tagsData) || tagsData.length === 0) {
      return {
        success: false,
        message: 'Expected a non-empty array of tags.',
        statusCode: 400,
      }
    }

    // Validate and transform tag data
    const validTags: Prisma.TagCreateManyInput[] = []
    for (const tag of tagsData) {
      if (!tag.title || !tag.label) {
        return {
          success: false,
          message: 'Each tag must include "title" and "label" fields.',
          statusCode: 400,
        }
      }
      validTags.push({
        title: toTitleCase(tag.title),
        label: toTitleCase(tag.label),
        userId: authenticatedUserId,
      })
    }

    // Add tags to the database
    const result = await addTags(validTags)

    if (result.error) {
      throw new Error(result.error)
    }

    return {
      success: true,
      data: { tags: result.tags },
      statusCode: 201,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)

    return {
      success: false,
      data: null,
      message: 'Failed to create tags in batch',
      error: message || 'An unknown error occurred',
      statusCode: statusCode || 500,
    }
  }
})

function toTitleCase(str: string): string {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
  )
}

async function addTags(
  tagsData: Prisma.TagCreateManyInput[],
): Promise<{ tags: Tag[] | null; error: string | null }> {
  try {
    await prisma.tag.createMany({
      data: tagsData,
      skipDuplicates: true,
    })

    // Retrieve created tags
    const createdTags = await prisma.tag.findMany({
      where: {
        OR: tagsData.map((tag) => ({
          title: tag.title,
          label: tag.label,
        })),
      },
    })

    return { tags: createdTags, error: null }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown database error'
    return { tags: null, error: `Failed to create tags: ${errorMessage}` }
  }
}
