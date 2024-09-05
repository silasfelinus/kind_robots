import prisma from './../api/utils/prisma'
import { errorHandler } from './../api/utils/error'

export default defineEventHandler(async (event) => {
  try {
    const userId = event.context.user?.id || null // Assume the userId can be null if not logged in
    const requestUrl = event.node.req?.url ?? 'Unknown URL'

    // Attempt to log request asynchronously (don't block the response)
    logRequest(userId, requestUrl).catch((error) => {
      const { message } = errorHandler(error)
      console.error(`Failed to log request: ${message}`)
    })
  } catch (error: unknown) {
    const { message } = errorHandler(error)
    console.error(`Failed to process request: ${message}`)
  }
})

async function logRequest(userId: string | null, requestUrl: string) {
  try {
    const parsedUserId = userId ? parseInt(userId, 10) : null

    if (parsedUserId && isNaN(parsedUserId)) {
      throw new Error("Invalid userId, expected a number")
    }

    // Attempt to log to the database
    await prisma.log.create({
      data: {
        message: `New request: ${requestUrl}`,
        userId: parsedUserId, // Ensure this is a number or null
        timestamp: new Date(),
      },
    })
    console.log('Request successfully logged to the database')
  } catch (error) {
    // Log failure to the console if database logging fails
    console.error(`Failed to create log in the database, logging to console`, error)
    console.log(`Log data: userId: ${userId}, requestUrl: ${requestUrl}, timestamp: ${new Date().toISOString()}`)
  }
}
