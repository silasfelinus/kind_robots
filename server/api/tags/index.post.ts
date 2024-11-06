// /server/api/tags/index.post.ts
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

    // Read and validate the tag data from the request body
    const tagData = await readBody<Partial<Tag>>(event)

    // Validate required fields
    if (!tagData.title || !tagData.label) {
      return {
        success: false,
        data: null,
        message: '"title" and "label" are required fields.',
        statusCode: 400,
      }
    }

    // Add the authenticated user's ID to the tag data
    tagData.userId = authenticatedUserId

    // Create the tag
    const result = await addTag(tagData)

    if (result.error) {
      throw new Error(result.error)
    }

    return {
      success: true,
      data: { tag: result.tag },
      message: 'Tag created successfully',
      statusCode: 201,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)

    return {
      success: false,
      data: null,
      message: 'Failed to create a new tag',
      error: message || 'An unknown error occurred',
      statusCode: statusCode || 500,
    }
  }
})

export async function addTag(
  tagData: Partial<Tag>,
): Promise<{ tag: Tag | null; error: string | null }> {
  try {
    const tag = await prisma.tag.create({
      data: tagData as Prisma.TagCreateInput,
    })
    return { tag, error: null }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown database error'
    return { tag: null, error: `Failed to create tag: ${errorMessage}` }
  }
}
