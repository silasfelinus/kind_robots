// server/api/art/image/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const imageId = Number(event.context.params?.id)

    // Log to check if the body is parsed correctly
    const body = await readBody(event)
    console.log('Received body:', body) // Debugging: log the received body

    const { imageData, fileName, fileType } = body // Destructure the fields from the body

    // Fetch the art image to ensure it exists
    const artImage = await prisma.artImage.findUnique({
      where: { id: imageId },
    })

    if (!artImage) {
      return {
        success: false,
        message: `Art image with ID ${imageId} not found.`,
        statusCode: 404,
      }
    }

    // Update the art image with new data
    const updatedArtImage = await prisma.artImage.update({
      where: { id: imageId },
      data: {
        imageData: imageData ?? artImage.imageData,
        fileName: fileName ?? artImage.fileName,
        fileType: fileType ?? artImage.fileType,
      },
    })

    return { success: true, artImage: updatedArtImage }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
