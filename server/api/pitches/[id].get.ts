import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { fetchPitchById } from '.'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)

    if (!id) throw new Error('Invalid tag ID.')

    if (isNaN(id)) {
      return { success: false, message: 'Invalid ID', statusCode: 400 }
    }

    const pitch = await fetchPitchById(id)

    return { success: true, pitch }
  } catch (error: any) {
    return errorHandler(error)
  }
})
