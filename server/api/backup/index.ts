// server/api/backup/index.ts
import { defineEventHandler } from 'h3'
import { backupDatabase } from './../utils/backup'
import { errorHandler } from './../utils/error'

export default defineEventHandler(async (event) => {
  try {
    await backupDatabase()
    return { success: true }
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500 // Set HTTP status code directly

    return {
      success: false,
      message: handledError.message || 'Failed to complete backup.',
    }
  }
})
