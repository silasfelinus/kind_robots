// server/api/utils/UploadArtImage.ts
import { PrismaClient } from '@prisma/client'
import type { ArtImage } from '@prisma/client'
import { errorHandler } from '../utils/error'
import path from 'path'
import fs from 'fs/promises'

const prisma = new PrismaClient()

export async function uploadArtImage(
  uploadedFile: { data: Buffer; filename: string }, // Adjusted for Nuxt's file handling
  galleryName: string = 'userUpload',
  userId: number = 10,
  galleryId: number = 21,
  fileType: string = 'png', // Assuming fileType is already validated and sent
): Promise<{ artImage: ArtImage }> {
  try {
    // Ensure fileType has a valid value and sanitize input
    const validExtensions = ['png', 'jpeg', 'jpg', 'webp']
    if (!validExtensions.includes(fileType.toLowerCase())) {
      throw new Error(
        `Unsupported file type: ${fileType}. Accepted types are ${validExtensions.join(', ')}`,
      )
    }

    const timestamp = Date.now()
    const fileName = `${galleryName}-${timestamp}.${fileType}`

    // Save to the local filesystem (if not in production)
    if (process.env.APP_ENV !== 'production') {
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

    // Save the image data to the database, including fileType
    const artImage = await prisma.artImage.create({
      data: {
        galleryId,
        imageData: uploadedFile.data.toString('base64'), // Store the image in base64 format
        fileName,
        fileType: `.${fileType}`, // Ensure proper file extension format (e.g., ".png")
        userId,
      },
    })

    // Return the image object from the database as 'artImage'
    return { artImage }
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
