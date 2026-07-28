import { defineEventHandler } from 'h3'
import { errorHandler } from '@/server/utils/error'
import { conductorGet } from '@/server/utils/conductor-github'
import { COLORING_BOOK_QUEUE_PATH } from '@/server/utils/coloringBookStudio'
import { buildColoringBookProductionData } from '@/server/utils/coloringBookProductionState'

export default defineEventHandler(async (event) => {
  try {
    const queueFile = await conductorGet(COLORING_BOOK_QUEUE_PATH)
    if (!queueFile) throw new Error('Canonical coloring-book queue was not found.')

    const data = buildColoringBookProductionData(queueFile.content)
    return {
      success: true,
      message: `${Object.keys(data.states).length} production records loaded from Conductor.`,
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to load coloring-book production state.',
      statusCode,
    }
  }
})
