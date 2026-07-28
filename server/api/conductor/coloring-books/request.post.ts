import { randomUUID } from 'node:crypto'
import { createError, defineEventHandler, readBody } from 'h3'
import type { ColoringBookRenderRequest } from '~/types/coloringBookStudio'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import {
  conductorList,
  conductorPut,
} from '@/server/utils/conductor-github'
import {
  coloringBookConfig,
  proposalBelongsToBook,
} from '@/server/utils/coloringBookStudio'

function compact(value: string): string {
  return value.replace(/\r/g, '').replace(/\s+/g, ' ').trim()
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const body = (await readBody(event)) as Partial<ColoringBookRenderRequest> | null
    const bookSlug = compact(String(body?.bookSlug || '')).toLowerCase()
    const proposalId = compact(String(body?.proposalId || '')).toLowerCase()
    const force = body?.force === true
    const note = compact(String(body?.note || '')).slice(0, 500)

    if (!coloringBookConfig(bookSlug) || !proposalBelongsToBook(bookSlug, proposalId)) {
      throw createError({ statusCode: 400, message: 'Invalid book or proposal id.' })
    }

    const eventFiles = (await conductorList('color-art-events')) ?? []
    const alreadyQueued = eventFiles.some(
      (entry) => entry.type === 'file' && entry.name.includes(`-${proposalId}-`),
    )
    if (alreadyQueued) {
      throw createError({
        statusCode: 409,
        message: `${proposalId} already has a queued Coloring Book Studio request.`,
      })
    }

    const requestedAt = new Date()
    const stamp = requestedAt.toISOString().replace(/[-:.]/g, '').replace('Z', 'Z')
    const suffix = randomUUID().slice(0, 8)
    const path = `color-art-events/${stamp}-${proposalId}-${suffix}.yaml`
    const content = [
      'version: 1',
      'operation: generate-color-proposals',
      `book: ${bookSlug}`,
      'proposal_ids:',
      `  - ${proposalId}`,
      'timeout: 600',
      `force: ${force ? 'true' : 'false'}`,
      'requested_by: kind-robots-coloring-studio',
      'task: coloring-book/t-028',
      `note: ${JSON.stringify(note || `${force ? 'Revision' : 'Color candidate'} requested from the production studio.`)}`,
      '',
    ].join('\n')

    await conductorPut(
      path,
      content,
      `coloring-book: request ${proposalId} ${force ? 'revision' : 'color candidate'}`,
    )

    return {
      success: true,
      message: `${proposalId} ${force ? 'revision' : 'color candidate'} queued in Conductor.`,
      data: { bookSlug, proposalId, force, eventPath: path },
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to request a coloring-book render.',
      statusCode,
    }
  }
})
