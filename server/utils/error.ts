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

const transientDatabaseMessages = [
  'Cannot execute new commands: connection closed',
  'pool timeout: failed to retrieve a connection from pool',
  'Max connect timeout reached',
]

const authenticationErrorCodes = new Set([
  'ERR_JWT_EXPIRED',
  'ERR_JWS_INVALID',
  'ERR_JWT_CLAIM_VALIDATION_FAILED',
  'ERR_JWT_INVALID',
])

function errorCode(error: ErrorHandlerInput): string | undefined {
  if (!error || typeof error !== 'object' || !('code' in error)) return undefined

  return typeof error.code === 'string' ? error.code : undefined
}

function errorMessage(error: ErrorHandlerInput): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }

  return 'Unknown error'
}

function isTransientDatabaseError(error: ErrorHandlerInput): boolean {
  const message = errorMessage(error)
  return transientDatabaseMessages.some((candidate) => message.includes(candidate))
}

function isAuthenticationError(error: ErrorHandlerInput): boolean {
  const code = errorCode(error)
  if (code && authenticationErrorCodes.has(code)) return true

  const message = errorMessage(error)
  return [
    'Authentication required',
    'Invalid API Key',
    'Authorization token is required',
    'Invalid or expired token',
  ].some((candidate) => message.includes(candidate))
}

function logError(error: ErrorHandlerInput, statusCode: number): void {
  const payload = {
    name: error instanceof Error ? error.name : typeof error,
    code: errorCode(error),
    message: errorMessage(error),
    statusCode,
  }

  // 4xx responses are handled client rejections, not server incidents. Keeping
  // them at warning level prevents expected auth/validation probes from flooding
  // Vercel's runtime error clusters while preserving them in searchable logs.
  if (statusCode < 500) {
    console.warn('Operation rejected:', payload)
    return
  }

  console.error('Operation failed:', payload)
}

export function errorHandler(error: ErrorHandlerInput): ErrorHandlerOutput {
  let result: ErrorHandlerOutput

  if (!error) {
    result = {
      success: false,
      message: 'An unknown error occurred.',
      statusCode: 500,
    }
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    result = handlePrismaError(error)
  } else if (isTransientDatabaseError(error)) {
    result = {
      success: false,
      message: 'Database connection was temporarily unavailable.',
      statusCode: 503,
    }
  } else if (isAuthenticationError(error)) {
    result = {
      success: false,
      message: errorMessage(error),
      statusCode: 401,
    }
  } else if (error instanceof Error) {
    const customError = error as CustomError
    result = {
      success: false,
      message: error.message,
      statusCode: customError.statusCode || 400,
    }
  } else if (typeof error === 'string') {
    result = {
      success: false,
      message: error,
      statusCode: 400,
    }
  } else {
    result = {
      success: false,
      message: 'An unknown error occurred.',
      statusCode: 500,
    }
  }

  logError(error, result.statusCode || 500)
  return result
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
