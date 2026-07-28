import { createError, defineEventHandler, readBody } from 'h3'
import type { ColoringBookPromptUpdate } from '~/types/coloringBookStudio'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { conductorGet, conductorPut } from '@/server/utils/conductor-github'
import {
  coloringBookConfig,
  proposalBelongsToBook,
  replaceColoringBookPrompt,
} from '@/server/utils/coloringBookStudio'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const body = (await readBody(event)) as Partial<ColoringBookPromptUpdate> | null
    const bookSlug = String(body?.bookSlug || '').trim().toLowerCase()
    const proposalId = String(body?.proposalId || '').trim().toLowerCase()
    const prompt = String(body?.prompt || '').replace(/\r/g, '').trim()
    const config = coloringBookConfig(bookSlug)

    if (!config || !proposalBelongsToBook(bookSlug, proposalId)) {
      throw createError({ statusCode: 400, message: 'Invalid book or proposal id.' })
    }
    if (prompt.length < 20) {
      throw createError({
        statusCode: 400,
        message: 'The production prompt must be at least 20 characters.',
      })
    }
    if (prompt.length > 6000) {
      throw createError({
        statusCode: 400,
        message: 'The production prompt must be 6000 characters or fewer.',
      })
    }

    const source = await conductorGet(config.promptPath)
    if (!source) {
      throw createError({
        statusCode: 404,
        message: `Prompt source was not found: ${config.promptPath}`,
      })
    }

    const content = replaceColoringBookPrompt(
      config,
      source.content,
      proposalId,
      prompt,
    )
    await conductorPut(
      config.promptPath,
      content,
      `coloring-book: update ${proposalId} production prompt`,
      source.sha,
    )

    return {
      success: true,
      message: `${proposalId} prompt saved to the canonical Conductor source.`,
      data: { bookSlug, proposalId, prompt },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to update the coloring-book prompt.',
      statusCode,
    }
  }
})
