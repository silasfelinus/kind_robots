import prisma from '../prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const id = Number(event.context.params?.id)

    if (!id) {
      throw new Error('Missing ID parameter.')
    }

    // Fetch the gallery from the database
    let gallery = await prisma.gallery.findUnique({ where: { id } })

    if (!gallery) {
      throw new Error('Gallery not found.')
    }

    // Update only the provided fields
    gallery = await prisma.gallery.update({
      where: { id },
      data: {
        name: body.name ?? gallery.name,
        content: body.content ?? gallery.content,
        description: body.description ?? gallery.description,
        highlightImage: body.highlightImage ?? gallery.highlightImage,
        isNSFW: body.isNSFW ?? gallery.isNSFW,
        isAuth: body.isAuth ?? gallery.isAuth,
        user: body.user ?? gallery.user
      }
    })

    return gallery
  } catch (error) {
    let errorMessage = 'An error occurred while updating the gallery.'

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
