// server/api/backup/index.ts
import { defineEventHandler } from 'h3'
import { backupDatabase } from './../utils/backup'
import { errorHandler } from './../utils/error'

export default defineEventHandler(async () => {
  try {
    await backupDatabase()
    return { success: true }
  } catch (error) {
    const { success, message, statusCode } = errorHandler(error)
    return { success, message, statusCode }
  }
})
