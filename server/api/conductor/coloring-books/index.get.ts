import { defineEventHandler } from 'h3'
import { errorHandler } from '@/server/utils/error'
import { conductorGet } from '@/server/utils/conductor-github'
import {
  buildColoringBookStudioData,
  COLORING_BOOK_CONFIG,
  COLORING_BOOK_QUEUE_PATH,
} from '@/server/utils/coloringBookStudio'

export default defineEventHandler(async (event) => {
  try {
    const queueFile = await conductorGet(COLORING_BOOK_QUEUE_PATH)
    if (!queueFile) throw new Error('Canonical coloring-book queue was not found.')

    const sourcePairs = await Promise.all(
      COLORING_BOOK_CONFIG.map(async (config) => {
        const [ledger, promptSource] = await Promise.all([
          conductorGet(config.ledgerPath),
          config.promptPath === config.ledgerPath
            ? Promise.resolve(null)
            : conductorGet(config.promptPath),
        ])
        if (!ledger) throw new Error(`Coloring-book ledger was not found: ${config.ledgerPath}`)
        return {
          config,
          ledger: ledger.content,
          prompt: promptSource?.content ?? ledger.content,
        }
      }),
    )

    const data = buildColoringBookStudioData({
      queue: queueFile.content,
      ledgers: Object.fromEntries(
        sourcePairs.map(({ config, ledger }) => [config.slug, ledger]),
      ),
      prompts: Object.fromEntries(
        sourcePairs.map(({ config, prompt }) => [config.slug, prompt]),
      ),
    })

    return {
      success: true,
      message: `${data.books.length} coloring books loaded from Conductor.`,
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to load the Coloring Book Studio.',
      statusCode,
    }
  }
})
