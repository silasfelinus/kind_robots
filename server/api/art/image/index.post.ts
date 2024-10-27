// server/api/art/image/index.post.ts

import { defineEventHandler, readBody } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    // Parse the request body
    const body = await readBody(event)

    // Check if body is parsed correctly
    if (!body || typeof body !== 'object') {
      return { success: false, message: 'Invalid JSON body', statusCode: 400 }
    }

    // Destructure the fields from the body, with default values where necessary
    const { imageData, fileName, fileType = 'png', artId, userId } = body

    // Validate the required fields
    if (!artId || typeof artId !== 'number') {
      return {
        success: false,
        message: 'Invalid or missing artId',
        statusCode: 400,
      }
    }
    if (!imageData || typeof imageData !== 'string') {
      return {
        success: false,
        message: 'Invalid or missing imageData',
        statusCode: 400,
      }
    }

    // Ensure the artId exists in the Art table
    const art = await prisma.art.findUnique({ where: { id: artId } })
    if (!art) {
      return {
        success: false,
        message: `Art with ID ${artId} not found`,
        statusCode: 404,
      }
    }

    // Optionally ensure the userId exists if provided
    let user = null
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) {
        return {
          success: false,
          message: `User with ID ${userId} not found`,
          statusCode: 404,
        }
      }
    }

    // Create the new art image
    const newArtImage = await prisma.artImage.create({
      data: {
        imageData,
        fileName,
        fileType,
        artId,
        userId,
      },
    })

    // Return the newly created art image
    return { success: true, artImage: newArtImage }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
