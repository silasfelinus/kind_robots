import prisma from '../prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!Array.isArray(body)) {
      throw new TypeError('The request body should be an array of galleries to create.')
    }

    const data = body.map((gallery) => {
      const galleryData = {}

      for (let key in gallery) {
        if (gallery[key] !== undefined) {
          galleryData[key] = gallery[key]
        }
      }

      return galleryData
    })

    await prisma.gallery.createMany({ data })

    return { message: 'Galleries created successfully.' }
  } catch (error) {
    let errorMessage = 'An error occurred while creating the galleries.'

    // Check if error is an instance of Error
    if (error instanceof Error) {
      errorMessage += ` Details: ${error.message}`
    }

    throw createError({
      statusCode: 500,
      statusMessage: errorMessage
    })
  }
})
