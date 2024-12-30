import { Prisma } from '@prisma/client'

type ErrorHandlerInput = Prisma.PrismaClientKnownRequestError | Error | unknown

// Extend the Error type to include `statusCode` as an optional property
interface CustomError extends Error {
  statusCode?: number
}

export type ErrorHandlerOutput = {
  success: boolean
  message: string
  statusCode?: number
}

export function errorHandler(error: ErrorHandlerInput): ErrorHandlerOutput {
  console.error('Operation failed:', error)

  if (!error) {
    return {
      success: false,
      message: 'An unknown error occurred.',
      statusCode: 500,
    }
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error)
  }

  if (error instanceof Error) {
    // Use type assertion to handle `statusCode` if present on error
    const customError = error as CustomError
    const statusCode = customError.statusCode || 400

    // Check for specific error messages that indicate a 401 Unauthorized error
    if (
      error.message.includes('Authentication required') ||
      error.message.includes('Invalid API Key') ||
      error.message.includes('Authorization token is required')
    ) {
      return {
        success: false,
        message: error.message,
        statusCode: 401,
      }
    }

    return {
      success: false,
      message: error.message,
      statusCode,
    }
  }

  // Handle string errors or other unknown error types
  if (typeof error === 'string') {
    return {
      success: false,
      message: error,
      statusCode: 400,
    }
  }

  // Fallback for unhandled error types
  return {
    success: false,
    message: 'An unknown error occurred.',
    statusCode: 500,
  }
}

// Helper function to handle Prisma-specific errors
function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError,
): ErrorHandlerOutput {
  switch (error.code) {
    case 'P2002':
      return {
        success: false,
        message: 'Record already exists.',
        statusCode: 409,
      }
    case 'P1001':
      return {
        success: false,
        message: 'Cannot connect to database.',
        statusCode: 503,
      }
    default:
      return {
        success: false,
        message: `Database operation failed: ${error.message}`,
        statusCode: 500,
      }
  }
}
