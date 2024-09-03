import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import { type Reaction, updateReaction } from '.'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const updatedReactionData: Partial<Reaction> = await readBody(event)
    const updatedReaction = await updateReaction(id, updatedReactionData)
    return { success: true, updatedReaction }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
