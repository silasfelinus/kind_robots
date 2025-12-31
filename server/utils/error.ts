// /server/api/utils/error.ts
export type ErrorHandlerInput = Error | unknown

interface CustomError extends Error {
  statusCode?: number
  code?: string
}

export type ErrorHandlerOutput = {
  success: boolean
  message: string
  statusCode?: number
}

type PrismaKnownRequestLike = {
  name: string
  code: string
  message: string
}

function isPrismaKnownRequestError(
  error: unknown,
): error is PrismaKnownRequestLike {
  if (!error || typeof error !== 'object') return false
  const e = error as Partial<PrismaKnownRequestLike>
  return (
    typeof e.code === 'string' &&
    typeof e.message === 'string' &&
    typeof e.name === 'string' &&
    e.name.includes('PrismaClientKnownRequestError')
  )
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

  if (isPrismaKnownRequestError(error)) {
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

function handlePrismaError(error: PrismaKnownRequestLike): ErrorHandlerOutput {
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
