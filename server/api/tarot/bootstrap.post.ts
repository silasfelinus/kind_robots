import { defineEventHandler } from 'h3'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { errorHandler } from '~/server/utils/error'
import { bootstrapTarotStudio } from '~/server/utils/tarotStudio'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const created = await bootstrapTarotStudio()
    return {
      success: true,
      statusCode: 200,
      message:
        'Starter decks and designs seeded; untouched card prompts moved to the current recipe, edits kept.',
      data: created,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
