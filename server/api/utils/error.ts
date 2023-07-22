// /server/api/utils/error.ts

export const ErrorHandler = async (
  handler: () => Promise<any>,
  errorMessage = 'An error occurred'
) => {
  try {
    return await handler()
  } catch (error) {
    if (error instanceof Error) {
      errorMessage += ` Details: ${error.message}`
    }
    throw createError({
      statusCode: 500,
      statusMessage: errorMessage
    })
  }
}
