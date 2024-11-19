// server/api/utils/UploadArtImage.ts
import { PrismaClient } from '@prisma/client'
import type { ArtImage } from '@prisma/client'
import { errorHandler } from '../utils/error'
import path from 'path'
import fs from 'fs/promises'

const prisma = new PrismaClient()

export async function uploadArtImage(
  uploadedFile: { data: Buffer; filename: string },
  galleryName: string = 'userUpload',
  userId: number = 10,
  galleryId: number = 21,
  fileType: string = 'png',
): Promise<{ artImage: ArtImage }> {
  try {
    console.log('uploadArtImage called with:', {
      uploadedFile,
      galleryName,
      userId,
      galleryId,
      fileType,
    })

    const validExtensions = ['png', 'jpeg', 'jpg', 'webp']
    const normalizedFileType = fileType.replace('image/', '').toLowerCase()

    if (!validExtensions.includes(normalizedFileType)) {
      throw new Error(
        `Unsupported file type: ${fileType}. Accepted types are ${validExtensions.join(', ')}`,
      )
    }

    const timestamp = Date.now()
    const fileName = `${galleryName}-${timestamp}.${normalizedFileType}`
    console.log('Generated fileName:', fileName)

    if (process.env.APP_ENV !== 'production') {
      const dirPath = path.join(
        process.env.IMAGES_PATH || './public/images',
        galleryName,
      )
      const filePath = path.join(dirPath, fileName)

      try {
        await fs.access(dirPath)
      } catch {
        console.log(`Creating directory: ${dirPath}`)
        await fs.mkdir(dirPath, { recursive: true })
      }

      console.log('Saving image to:', filePath)
      await fs.writeFile(filePath, uploadedFile.data)
    }

    console.log('Saving image to database...')
    const artImage = await prisma.artImage.create({
      data: {
        galleryId,
        imageData: uploadedFile.data.toString('base64'),
        fileName,
        fileType: `.${normalizedFileType}`,
        userId,
      },
    })

    console.log('Database save successful:', artImage)
    return { artImage }
  } catch (error: unknown) {
    console.error('Error in uploadArtImage:', error)
    throw errorHandler(error)
  }
}
