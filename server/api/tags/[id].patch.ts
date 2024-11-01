// /server/api/tags/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { verifyJwtToken } from '../auth'
import type { Tag } from '@prisma/client'

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    // Parse and validate the tag ID from the URL params
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid tag ID.',
      })
    }

    // Extract and validate the JWT token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const verificationResult = await verifyJwtToken(token)
    if (!verificationResult || !verificationResult.userId) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = verificationResult.userId // Use userId from the token

    // Fetch the existing tag and verify ownership
    const existingTag = await prisma.tag.findUnique({ where: { id } })
    if (!existingTag) {
      throw createError({
        statusCode: 404,
        message: 'Tag not found.',
      })
    }
    if (existingTag.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this tag.',
      })
    }

    // Parse the request body as partial Tag data
    const tagData: Partial<Tag> = await readBody(event)

    // Update the tag in the database
    const updatedTag = await prisma.tag.update({
      where: { id },
      data: tagData,
    })

    return { success: true, tag: updatedTag }
  } catch (error: unknown) {
    return errorHandler({
      error,
      context: `Updating tag with ID ${id}`,
    })
  }
})
