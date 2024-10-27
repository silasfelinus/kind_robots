// server/api/art/image/[id].get.ts
import { defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)

  try {
    const artImage = await prisma.artImage.findUnique({
      where: { id },
    })

    if (!artImage) {
      throw new Error(`Collection with ID ${id} not found.`)
    }

    return { success: true, artImage }
  } catch (error) {
    return errorHandler(error)
  }
})
