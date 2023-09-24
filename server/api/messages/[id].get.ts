import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { fetchMessageById } from './index'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const message = await fetchMessageById(id)
    return { success: true, message }
  } catch (error: any) {
    return errorHandler(error)
  }
})
