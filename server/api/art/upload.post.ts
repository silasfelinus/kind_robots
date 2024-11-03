import { defineEventHandler, readMultipartFormData } from 'h3'
import { uploadArtImage } from './../utils/UploadArtImage'
import { errorHandler } from './../utils/error'

function validUserId(userId: string | undefined): boolean {
  return !isNaN(Number(userId)) && Number(userId) > 0
}

function validGalleryId(galleryId: string | undefined): boolean {
  return !isNaN(Number(galleryId)) && Number(galleryId) > 0
}

export default defineEventHandler(async (event) => {
  try {
    // Parse the multipart form data
    const form = await readMultipartFormData(event)

    if (!form) {
      event.node.res.statusCode = 400 // Bad Request
      return { success: false, message: 'No form data received', statusCode: 400 }
    }

    // Extract the image file and form fields
    const imageFile = form.find((file) => file.name === 'image')
    const galleryName =
      form.find((field) => field.name === 'galleryName')?.data.toString() ||
      'userUpload' // Default to 'userUpload' if missing
    const userId =
      form.find((field) => field.name === 'userId')?.data.toString() || '10' // Default to '10' if missing
    const galleryId =
      form.find((field) => field.name === 'galleryId')?.data.toString() || '21' // Default to '21' if missing
    const fileType =
      form.find((field) => field.name === 'fileType')?.data.toString() || 'png' // Default to 'png' if missing

    // Ensure required fields are present and valid
    if (!imageFile?.data || !validUserId(userId) || !validGalleryId(galleryId)) {
      event.node.res.statusCode = 400 // Bad Request
      return {
        success: false,
        message: 'Missing required fields or invalid data',
        statusCode: 400,
      }
    }

    // Call the uploadArtImage function and pass both the data and filename
    const artImage = await uploadArtImage(
      {
        data: imageFile.data, // file data as Buffer
        filename: imageFile.filename || 'default-filename.webp', // fallback filename if missing
      },
      galleryName,
      Number(userId),
      Number(galleryId),
      fileType,
    )

    event.node.res.statusCode = 201 // Created
    return { success: true, artImage, statusCode: 201 }
  } catch (error: unknown) {
    // Use errorHandler for consistent error handling
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500 // Default to 500 if no status code is provided

    return {
      success: false,
      message: 'Error uploading the art image',
      error: message || 'An unknown error occurred',
      statusCode: statusCode || 500,
    }
  }
})
