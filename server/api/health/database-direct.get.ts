import { defineEventHandler, setResponseHeader } from 'h3'
import { probeDatabaseDirect } from '~/server/utils/databaseDirectProbe'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')

  const result = await probeDatabaseDirect()
  const statusCode = result.success ? 200 : 503
  event.node.res.statusCode = statusCode

  return {
    success: result.success,
    message: result.success
      ? 'Direct database connection succeeded.'
      : 'Direct database connection failed.',
    data: result,
    statusCode,
  }
})
