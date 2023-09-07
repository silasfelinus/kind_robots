import prisma from './../api/utils/prisma'
import { fetchUserById } from './../api/users/'

export default defineEventHandler(async (event) => {
  const userId = event.context.user?.id
  let username: string | null = null

  if (userId) {
    const user = await fetchUserById(userId)
    username = user?.username ?? null
  }

  // Assuming event.req.url is the correct way to get the URL in your setup
  const requestUrl = event.node.req?.url ?? 'Unknown URL'

  // Create a new log entry
  await prisma.log.create({
    data: {
      message: `New request: ${requestUrl}`,
      username,
      timestamp: new Date()
    }
  })
})
