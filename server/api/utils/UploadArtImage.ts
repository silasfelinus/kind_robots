// server/api/utils/UploadArtImage.ts
import { PrismaClient } from '@prisma/client'
import { errorHandler } from '../utils/error'
import path from 'path'
import fs from 'fs/promises'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    // Read the form data from the request
    const body = await readMultipartFormData(event)

    if (!body || !Array.isArray(body)) {
      throw new Error('Invalid upload request. Missing required form data.')
    }

    // Parse the multipart data
    let uploadedFile: Buffer | null = null
    let galleryName = ''
    let userId = 0
    let galleryId = 0
    let fileType = 'png'

    // Loop through body to extract the file and fields
    for (const item of body) {
      if (item.type === 'file' && item.filename) {
        uploadedFile = item.data // Get the file buffer
        fileType = item.filename.split('.').pop() || 'png' // Extract the file extension safely
      } else if (item.name === 'galleryName') {
        galleryName = item.data.toString()
      } else if (item.name === 'userId') {
        userId = parseInt(item.data.toString(), 10)
      } else if (item.name === 'galleryId') {
        galleryId = parseInt(item.data.toString(), 10)
      }
    }

    if (!uploadedFile || !galleryName || !userId || !galleryId) {
      throw new Error('Missing required fields.')
    }

    // Ensure the file type and sanitize input
    const validExtensions = ['png', 'jpeg', 'jpg', 'webp']
    const extension = fileType.toLowerCase()

    if (!validExtensions.includes(extension)) {
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
      await fs.writeFile(filePath, uploadedFile)

      // Optionally return the local file path for development
      console.log(`Image saved to: ${filePath}`)
    }

    // Save the image data to the database, including fileType
    const artImage = await prisma.artImage.create({
      data: {
        galleryId,
        imageData: uploadedFile.toString('base64'), // Store the image in base64 format
        fileName,
        fileType: `.${fileType}`, // Ensure proper file extension format (e.g., ".png")
        userId,
      },
    })

    // Return the image object from the database as 'artImage'
    return {
      success: true,
      artImage,
    }
  } catch (error: unknown) {
    // Use the errorHandler for proper error handling
    return errorHandler(error)
  }
})
