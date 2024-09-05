import { PrismaClient } from '@prisma/client'
import { errorHandler } from '../utils/error'
import path from 'path'
import fs from 'fs/promises'

const prisma = new PrismaClient()

export async function saveImage(
  base64Image: string,
  galleryName: string,
  userId: number,
  galleryId: number
): Promise<{ id: number, fileName: string }> {
  try {
    const timestamp = Date.now()
    const fileName = `${galleryName}-${timestamp}.webp`

    // Always save to the database
    const savedImage = await prisma.artImage.create({
      data: {
        galleryId,
        imageData: base64Image, // store base64 image
        fileName: fileName ?? 'default-filename.webp',  // Ensure fileName is never null
        userId
      },
    })

    // Optionally save to the local filesystem in development
    if (process.env.NODE_ENV !== 'production') {
      const dirPath = path.join(
        process.env.IMAGES_PATH || './public/images',
        galleryName,
      )
      const filePath = path.join(dirPath, fileName)

      // Ensure the gallery directory exists
      try {
        await fs.access(dirPath)
      } catch {
        await fs.mkdir(dirPath, { recursive: true })
      }

      // Save the image locally
      await fs.writeFile(filePath, base64Image, 'base64')

      // Return the ID and local file path for development
      return { id: savedImage.id, fileName: filePath }
    }

    // Return the saved image ID and fileName from the database (just the file name, not a path)
    return { id: savedImage.id, fileName: savedImage.fileName ?? 'default-filename.webp' } // Fallback value

  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
