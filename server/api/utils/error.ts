// server/api/utils/error.ts
import { Prisma } from '@prisma/client'

type ErrorHandlerInput = Prisma.PrismaClientKnownRequestError | Error | any

export function errorHandler(error: ErrorHandlerInput): {
  success: boolean
  message: string
  statusCode?: number
} {
  console.error(`Operation failed:`, error)

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return { success: false, message: 'Record already exists.', statusCode: 409 }
      default:
        return {
          success: false,
          message: `Database operation failed: ${error.message}`,
          statusCode: 500
        }
    }
  }

  if (error instanceof Error) {
    return { success: false, message: error.message, statusCode: 400 }
  }

  // Fallback for any other errors
  return { success: false, message: 'An unknown error occurred.', statusCode: 500 }
}
