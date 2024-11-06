// server/api/galleries/count.get.ts
import { defineEventHandler } from 'h3'
import { countGalleries } from '.'
import { errorHandler } from '../utils/error'

type CountResponse = {
  success: boolean
  message?: string
  count?: number
  statusCode?: number
}

export default defineEventHandler(async (): Promise<CountResponse> => {
  let response: CountResponse
  try {
    // Get the count of galleries
    const count = await countGalleries()

    // Return the success response with count
    response = { success: true, count, message: 'Galleries count retrieved successfully.', statusCode: 200 }
  } catch (error: unknown) {
    // Use the errorHandler to handle and format the error
    const handledError = errorHandler(error)
    response = {
      success: false,
      message: handledError.message || 'Failed to get galleries count.',
      statusCode: handledError.statusCode || 500,
    }
  }

  return response
})
