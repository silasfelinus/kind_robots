// server/api/utils/error.ts
import { Prisma } from '@prisma/client';

type ErrorHandlerInput = Prisma.PrismaClientKnownRequestError | Error | unknown;

// Define a type for the error object
export type ErrorHandlerOutput = {
  success: boolean;
  message: string;
  statusCode?: number;
};

export function errorHandler(error: ErrorHandlerInput): ErrorHandlerOutput {
  if (!error) {
    console.error('No error object provided.');
    return { success: false, message: 'An unknown error occurred.', statusCode: 500 };
  }

  // Log the error (consider using different logging levels)
  console.error(`Operation failed:`, error);

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return { success: false, message: 'Record already exists.', statusCode: 409 };
      case 'P1001':
        return { success: false, message: 'Cannot connect to database.', statusCode: 503 };
      default:
        return {
          success: false,
          message: `Database operation failed: ${error.message}`,
          statusCode: 500,
        };
    }
  }

  if (error instanceof Error) {
    return { success: false, message: error.message, statusCode: 400 };
  }

  // Handle cases where the error might be a string or another type
  if (typeof error === 'string') {
    return { success: false, message: error, statusCode: 400 };
  }

  // Fallback for any other errors
  return { success: false, message: 'An unknown error occurred.', statusCode: 500 };
}
