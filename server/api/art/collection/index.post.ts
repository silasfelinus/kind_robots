// server/api/art/collection/index.post.ts

import { defineEventHandler, readBody } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    // Parse the request body
    const { userId, artIds } = await readBody(event)

    // Validate the userId is provided and is a valid number
    if (!userId || typeof userId !== 'number') {
      return { success: false, message: 'Invalid or missing userId', statusCode: 400 }
    }

    // Ensure the user exists in the database
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return { success: false, message: `User with ID ${userId} not found`, statusCode: 404 }
    }

    // Ensure all art IDs provided exist in the Art table
    const artList = artIds ? await prisma.art.findMany({
      where: { id: { in: artIds } }
    }) : []

    if (artIds && artList.length !== artIds.length) {
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
