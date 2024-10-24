// server/api/art/collection/index.post.ts

import { defineEventHandler, readBody } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    // Parse request body
    const body = await readBody(event)

    // Check if userId is present
    const { userId, artIds = [] } = body  // artIds defaults to an empty array if not provided

    if (!userId) {
      return { success: false, message: 'Missing userId', statusCode: 400 }
    }

    // Create the new art collection for the user
    const newCollection = await prisma.artCollection.create({
      data: {
        userId,
        art: {
          connect: artIds.length ? artIds.map((id: number) => ({ id })) : [], // Only connect if artIds is not empty
        },
      },
      include: {
        art: true,
      },
    })

    // Return the new collection in the response
    return { success: true, collection: newCollection }
  } catch (error: unknown) {
    return errorHandler(error)  // Handle errors with the custom error handler
  }
})

