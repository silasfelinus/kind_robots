// /server/api/art/prompts/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import type { Prompt } from '@prisma/client'
import { errorHandler } from '../utils/error'
import { updatePrompt } from './artQueries'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const updatedPromptData: Partial<Prompt> = await readBody(event)

    if (isNaN(id)) {
      throw new Error('Invalid ID.')
    }

    const updatedPrompt = await updatePrompt(id, updatedPromptData)

    if (!updatedPrompt) {
      throw new Error('Failed to update Prompt.')
    }

    return { success: true, updatedPrompt }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
