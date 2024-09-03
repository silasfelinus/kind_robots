// server/api/reactions/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import { type Reaction, createReaction } from '.'

export default defineEventHandler(async (event) => {
  try {
    const reactionData: Partial<Reaction> = await readBody(event)
    const newReaction = await createReaction(reactionData)
    return { success: true, newReaction }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
