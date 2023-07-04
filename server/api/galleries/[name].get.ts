// server/api/bots/[name].get.ts
import prisma from '../prisma'

export default defineEventHandler(async (event) => {
  const name = String(event.context.params?.name)
  const gallery = await prisma.gallery.findUnique({
    where: {
      name: String(name)
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
