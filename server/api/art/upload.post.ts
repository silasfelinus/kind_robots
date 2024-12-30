import { defineEventHandler, readMultipartFormData } from 'h3'
import { errorHandler } from './../utils/error'
import { PrismaClient } from '@prisma/client'
import type { ArtImage } from '@prisma/client'
import path from 'path'
import fs from 'fs/promises'

const prisma = new PrismaClient()

export async function uploadArtImage(
  uploadedFile: { data: Buffer; filename: string },
  galleryName: string = 'userUpload',
  userId: number = 10,
  galleryId: number = 21,
  fileType: string = 'png',
): Promise<ArtImage> {
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
    const data = await prisma.artImage.create({
      data: {
        galleryId,
        imageData: uploadedFile.data.toString('base64'),
        fileName,
        fileType: `.${normalizedFileType}`,
        userId,
      },
    })

    console.log('Database save successful:', data)
    return data
  } catch (error: unknown) {
    console.error('Error in uploadArtImage:', error)
    throw errorHandler(error)
  }
}

function validUserId(userId: string | undefined): boolean {
  return !isNaN(Number(userId)) && Number(userId) > 0
}

function validGalleryId(galleryId: string | undefined): boolean {
  return !isNaN(Number(galleryId)) && Number(galleryId) > 0
}

export default defineEventHandler(async (event) => {
  try {
    console.log('Received request at /api/art/upload')

    const form = await readMultipartFormData(event)
    console.log('Parsed Form Data:', form)

    if (!form) {
      event.node.res.statusCode = 400
      console.error('No form data received')
      return { success: false, message: 'No form data received' }
    }

    const imageFile = form.find((file) => file.name === 'image')
    const galleryName =
      form.find((field) => field.name === 'galleryName')?.data.toString() ||
      'userUpload'
    const userId =
      form.find((field) => field.name === 'userId')?.data.toString() || '10'
    const galleryId =
      form.find((field) => field.name === 'galleryId')?.data.toString() || '21'
    const fileType =
      form.find((field) => field.name === 'fileType')?.data.toString() || 'png'

    console.log('Extracted Fields:', {
      imageFile,
      galleryName,
      userId,
      galleryId,
      fileType,
    })

    if (
      !imageFile?.data ||
      !validUserId(userId) ||
      !validGalleryId(galleryId)
    ) {
      event.node.res.statusCode = 400
      console.error('Validation failed:', {
        imageFile: !!imageFile?.data,
        userId: validUserId(userId),
        galleryId: validGalleryId(galleryId),
      })
      return {
        success: false,
        message: 'Missing required fields or invalid data',
      }
    }

    console.log('Calling uploadArtImage...')
    const data = await uploadArtImage(
      {
        data: imageFile.data,
        filename: imageFile.filename || 'Kind Image',
      },
      galleryName,
      Number(userId),
      Number(galleryId),
      fileType,
    )
    console.log('uploadArtImage result:', data)

    event.node.res.statusCode = 201
    return { success: true, data }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error in upload handler:', handledError)
    event.node.res.statusCode = handledError.statusCode || 500
    return {
      success: false,
      message: 'Error uploading the art image',
      error: handledError.message || 'An unknown error occurred',
    }
  }
})
