// server/api/galleries/[id].random.ts
import path from 'path'
import prisma from '../prisma'

export default defineEventHandler(async (event) => {
  const { id, name } = event.context.params || {}

  let gallery = null

  if (id) {
    gallery = await prisma.gallery.findUnique({
      where: { id: Number(id) }
    })
  } else if (name) {
    gallery = await prisma.gallery.findFirst({
      where: { name }
    })
  }

  if (!gallery) {
    const notFoundError = createError({
      statusCode: 404,
      statusMessage: 'Gallery not found'
    })
    sendError(event, notFoundError)
  } else {
    // Fetch image list from images.json
    const response = await fetch(`/images/${gallery.name}/images.json`)
    const images = await response.json()

    if (images && images.length > 0) {
      // Select random image
      const randomImage = images[Math.floor(Math.random() * images.length)]

      // Create full path to the image
      const imagePath = path.join('/', 'images', gallery.name, randomImage)

      return {
        statusCode: 200,
        body: JSON.stringify({
          imagePath
        })
      }
    } else {
      const notFoundError = createError({
        statusCode: 404,
        statusMessage: 'No images found for the gallery'
      })
      sendError(event, notFoundError)
    }
  }
})
