// /server/api/tags/batch.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import prisma from '../utils/prisma'
import type { Prisma, Tag } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Use validateApiKey to authenticate
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
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

    // Validate and format each tag entry
    const validTags: Prisma.TagCreateManyInput[] = tagsData.map((tag) => {
      if (!tag.title || !tag.label) {
        throw createError({
          statusCode: 400,
          message: 'Each tag must include "title" and "label" fields.',
        })
      }
      return {
        title: toTitleCase(tag.title),
        label: toTitleCase(tag.label),
        userId: authenticatedUserId,
      }
    })

    // Create tags in batch and retrieve the created tags
    await prisma.tag.createMany({
      data: validTags,
      skipDuplicates: true,
    })

    // Retrieve and return the newly created tags
    const createdTags = await prisma.tag.findMany({
      where: {
        OR: validTags.map((tag) => ({
          title: tag.title,
          label: tag.label,
          userId: authenticatedUserId,
        })),
      },
    })

    return {
      success: true,
      data: createdTags,
      message: 'Tags created successfully',
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

// Utility function to convert string to Title Case
function toTitleCase(str: string): string {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
  )
}
