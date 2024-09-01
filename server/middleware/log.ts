import prisma from './../api/utils/prisma'
import { fetchUserById } from './../api/users/'
import { errorHandler } from './../api/utils/error'

export default defineEventHandler(async (event) => {
  try {
    const userId = event.context.user?.id
    let username: string | null = null

    if (userId) {
      const user = await fetchUserById(userId)
      username = user?.username ?? null
    }

    const requestUrl = event.node.req?.url ?? 'Unknown URL'
    logRequest(username, requestUrl);
  } catch (error: unknown) {
    const { message } = errorHandler(error)
    console.error(`Failed to fetch user or process request: ${message}`)
  }
})

async function logRequest(username: string | null, requestUrl: string) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await prisma.log.create({
        data: {
          message: `New request: ${requestUrl}`,
          username,
          timestamp: new Date(),
        },
      })
      break; // Exit the loop on successful logging
    } catch  {
      console.error(`Attempt ${attempt}: Failed to create log`);
      if (attempt === 3) {
        console.error(`Final attempt failed, logging to alternate service`);
        // Implement alternative logging mechanism here
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
    }
  }
}
