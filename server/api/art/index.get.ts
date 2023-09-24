import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { fetchAllArt } from '.'

export default defineEventHandler(async () => {
  try {
    const artEntries = await fetchAllArt()
    return { success: true, artEntries }
  } catch (error: any) {
    return errorHandler(error)
  }
})
