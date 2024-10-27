// server/api/art/image/[id].delete.ts

import { defineEventHandler } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const imageId = Number(event.context.params?.id)

    const artImage = await prisma.artImage.findUnique({
      where: { id: imageId },
    })

    if (!artImage) {
      throw new Error(`Art image with ID ${imageId} not found.`)
    }

    await prisma.artImage.delete({
      where: { id: imageId },
    })

    return {
      success: true,
      message: `Art image ${imageId} deleted successfully.`,
    }
  } catch (error: unknown) {
    return errorHandler(error) // Do not concatenate error with string
  }
})
