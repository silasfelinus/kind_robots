// /server/api/tags/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import type { Prisma, Tag } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const tagData = await readBody<Partial<Tag>>(event)

    // Validate required fields
    if (!tagData.title || !tagData.label) {
      return {
        success: false,
        message: '"title" and "label" are required fields.',
        statusCode: 400,
      }
    }

    const result = await addTag(tagData)

    if (result.error) {
      throw new Error(result.error)
    }

    return { success: true, tag: result.tag }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)

    return {
      success: false,
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
