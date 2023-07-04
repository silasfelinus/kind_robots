// server/api/users/[id].get.ts
import prisma from '../prisma'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  const user = await prisma.user.findUnique({
    where: {
      id: Number(id)
    }
  })
  if (!user) {
    const notFoundError = createError({
      statusCode: 404,
      statusMessage: 'User not found '
    })
    sendError(event, notFoundError)
  }
  return user
})
