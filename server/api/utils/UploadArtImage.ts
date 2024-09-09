import { PrismaClient } from '@prisma/client'
import { errorHandler } from '../utils/error'
import path from 'path'
import fs from 'fs/promises'

const prisma = new PrismaClient()

export async function uploadArtImage(
  uploadedFile: { data: Buffer, filename: string }, // Adjusted for Nuxt's file handling
  galleryName: string,
  userId: number,
  galleryId: number
): Promise<{ id: number; fileName: string }> {
  try {
    const timestamp = Date.now()
    const extension = path.extname(uploadedFile.filename) || '.webp'
    const fileName = `${galleryName}-${timestamp}${extension}`

    // Save to the local filesystem (if not in production)
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

      // Save the image to the local filesystem
      await fs.writeFile(filePath, uploadedFile.data)

      // Optionally return the local file path for development
      console.log(`Image saved to: ${filePath}`)
    }

    // Save the image data to the database
    const savedImage = await prisma.artImage.create({
      data: {
        galleryId,
        imageData: uploadedFile.data.toString('base64'), // Store the image in base64 format
        fileName,
        userId,
      },
    })

    // Return the image ID and file name from the database
    return {
        id: savedImage.id,
        fileName: savedImage.fileName ?? 'default-filename.webp', // Use a fallback if fileName is null
      }
      
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
