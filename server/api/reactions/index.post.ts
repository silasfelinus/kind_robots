// server/api/reactions/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import { type ArtReaction, createArtReaction } from '.'

export default defineEventHandler(async (event) => {
  try {
    const reactionData: Partial<ArtReaction> = await readBody(event)
    const newReaction = await createArtReaction(reactionData)
    return { success: true, newReaction }
  } catch (error: any) {
    return errorHandler(error)
  }
})
