// server/api/art/image/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from './../../utils/prisma'
import { errorHandler } from './../../utils/error'

export default defineEventHandler(async () => {
  try {
    const artImages = await fetchAllArtImages()

    if (!artImages || artImages.length === 0) {
      return {
        success: false,
        message: 'No art images found.',
        statusCode: 404,
      }
    }

    return { success: true, artImages }
  } catch (error) {
    return errorHandler(error) // Do not concatenate error with string
  }
})

export async function fetchAllArtImages() {
  return await prisma.artImage.findMany({
    include: {
      Art: true, // Include the associated Art model in the results
    },
  })
}
