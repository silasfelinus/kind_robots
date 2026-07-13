import { Prisma } from '~/prisma/generated/prisma/client'

type ErrorHandlerInput = Prisma.PrismaClientKnownRequestError | Error | unknown

interface CustomError extends Error {
  statusCode?: number
  code?: string
}

export type ErrorHandlerOutput = {
  success: boolean
  message: string
  statusCode?: number
}

function logError(error: ErrorHandlerInput): void {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error('Operation failed:', {
      name: error.name,
      code: error.code,
      message: error.message,
    })
    return
  }

  if (error instanceof Error) {
    const customError = error as CustomError

    console.error('Operation failed:', {
      name: error.name,
      code: customError.code,
      message: error.message,
      statusCode: customError.statusCode,
    })
    return
  }

  console.error('Operation failed:', {
    type: typeof error,
    message: typeof error === 'string' ? error : 'Unknown error',
  })
}

export function errorHandler(error: ErrorHandlerInput): ErrorHandlerOutput {
  logError(error)

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
    const customError = error as CustomError
    const statusCode = customError.statusCode || 400

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

  if (typeof error === 'string') {
    return {
      success: false,
      message: error,
      statusCode: 400,
    }
  }

  return {
    success: false,
    message: 'An unknown error occurred.',
    statusCode: 500,
  }
}

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
