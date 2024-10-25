import { defineEventHandler, readMultipartFormData } from 'h3'
import { uploadArtImage } from './../utils/UploadArtImage'

export default defineEventHandler(async (event) => {
  try {
    // Parse the multipart form data
    const form = await readMultipartFormData(event)

    if (!form) {
      return { success: false, message: 'No form data received' }
    }

    // Extract the image file and form fields
    const imageFile = form.find((file) => file.name === 'image')
    const galleryName = form
      .find((field) => field.name === 'galleryName')
      ?.data.toString()
    const userId = form
      .find((field) => field.name === 'userId')
      ?.data.toString()
    const galleryId = form
      .find((field) => field.name === 'galleryId')
      ?.data.toString()
    const fileType = form
      .find((field) => field.name === 'fileType')
      ?.data.toString()

    // Check if the image file and necessary fields exist
    if (
      !imageFile?.data ||
      !galleryName ||
      !userId ||
      !galleryId ||
      !fileType
    ) {
      return { success: false, message: 'Missing required fields' }
    }

    // Call your uploadArtImage function and pass both the data and filename
    const artImage = await uploadArtImage(
      {
        data: imageFile.data, // file data as Buffer
        filename: imageFile.filename || 'default-filename.webp', // use a fallback filename if missing
      },
      galleryName,
      Number(userId),
      Number(galleryId),
      fileType,
    )

    return { success: true, artImage }
  } catch (error: unknown) {
    // Type guard for error
    if (error instanceof Error) {
      return {
        success: false,
        message: 'Image upload failed: ' + error.message,
      }
    } else {
      return { success: false, message: 'An unknown error occurred' }
    }
  }
})
