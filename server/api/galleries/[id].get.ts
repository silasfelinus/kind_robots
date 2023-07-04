// server/api/galleries/[id].get.ts
import prisma from '../prisma'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  const gallery = await prisma.gallery.findUnique({
    where: {
      id: Number(id)
    }
  })
  if (!gallery) {
    const notFoundError = createError({
      statusCode: 404,
      statusMessage: 'Gallery not found '
    })
    sendError(event, notFoundError)
  }
  return gallery
})
