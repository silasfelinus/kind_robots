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
