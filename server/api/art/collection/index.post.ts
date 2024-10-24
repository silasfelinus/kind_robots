// server/api/art/collection/index.post.ts

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

    // Validate the userId and ensure it's a valid number
    const { userId, artIds = [] } = body // Default artIds to an empty array if not provided

    if (!userId || typeof userId !== 'number') {
      return { success: false, message: 'Invalid or missing userId', statusCode: 400 }
    }

    // Ensure the user exists in the database
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return { success: false, message: `User with ID ${userId} not found`, statusCode: 404 }
    }

    // Ensure all art IDs provided exist in the Art table
    const artList = artIds.length > 0 ? await prisma.art.findMany({
      where: { id: { in: artIds } }
    }) : []

    if (artIds.length > 0 && artList.length !== artIds.length) {
      return { success: false, message: 'One or more provided art IDs do not exist', statusCode: 400 }
    }

    // Create the new art collection
    const newCollection = await prisma.artCollection.create({
      data: {
        userId,
        art: {
          connect: artList.map(art => ({ id: art.id }))  // Connect existing art items
        },
      },
      include: {
        art: true,  // Include connected art in the response
      },
    })

    // Return the newly created collection
    return { success: true, collection: newCollection }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
