import { defineEventHandler } from 'h3'
import { errorHandler } from '@/server/utils/error'
import { conductorGet } from '@/server/utils/conductor-github'
import { COLORING_BOOK_QUEUE_PATH } from '@/server/utils/coloringBookStudio'
import {
  buildColoringBookCoverStates,
  COLORING_BOOK_COVER_QUEUE_PATH,
} from '@/server/utils/coloringBookCoverState'
import { buildColoringBookProductionData } from '@/server/utils/coloringBookProductionState'

export default defineEventHandler(async (event) => {
  try {
    const [queueFile, coverQueueFile] = await Promise.all([
      conductorGet(COLORING_BOOK_QUEUE_PATH),
      conductorGet(COLORING_BOOK_COVER_QUEUE_PATH),
    ])
    if (!queueFile) throw new Error('Canonical coloring-book queue was not found.')
    if (!coverQueueFile) throw new Error('Canonical coloring-book cover queue was not found.')

    const data = buildColoringBookProductionData(queueFile.content)
    data.covers = buildColoringBookCoverStates(coverQueueFile.content)
    return {
      success: true,
      message: `${Object.keys(data.states).length} interior records and ${Object.keys(data.covers).length} cover records loaded from Conductor.`,
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
