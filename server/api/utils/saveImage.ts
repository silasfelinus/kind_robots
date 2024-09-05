import { PrismaClient } from '@prisma/client'
import { errorHandler } from '../utils/error'
import path from 'path'
import fs from 'fs/promises'

const prisma = new PrismaClient()

export async function saveImage(
  base64Image: string,
  galleryName: string,
  userId: number,
  galleryId: number,
  artId: number
): Promise<string> {
  try {
    const timestamp = Date.now()
    const fileName = `${galleryName}-${timestamp}.webp`

    if (process.env.NODE_ENV === 'production') {
      // Save to database in production
      const savedImage = await prisma.artImage.create({
        data: {
          galleryId,
          imageData: base64Image, // store base64 image
          fileName: fileName,
          userId,
          artId,
        },
      })
      return savedImage.fileName
    } else {
      // Save to the local filesystem in development
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
      return filePath
    }
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
