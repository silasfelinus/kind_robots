import { errorHandler } from './../api/utils/error'

export default defineEventHandler(async (event) => {
  try {
    const requestUrl = event.node.req?.url ?? 'Unknown URL'

    // Attempt to log request asynchronously (don't block the response)
    console.log(
      `Console Log: requestUrl: ${requestUrl}`,
    )
  } catch (error: unknown) {
    const { message } = errorHandler(error)
    console.error(`Failed to process request: ${message}`)
  }
})
