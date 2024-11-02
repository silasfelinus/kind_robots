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

    // Create the tag
    const newTag = await prisma.tag.create({
      data: tagData as Prisma.TagCreateInput,
    })

    return { success: true, tag: newTag }
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
