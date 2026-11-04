import { createError, defineEventHandler, readBody } from 'h3'
import type { ColoringBookConceptUpdate } from '~/types/coloringBookStudio'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { conductorGet, conductorPut } from '@/server/utils/conductor-github'
import {
  coloringBookConceptPath,
  coloringBookConfig,
  proposalBelongsToBook,
  upsertColoringBookConcept,
} from '@/server/utils/coloringBookStudio'

function clean(value: unknown, field: string): string {
  const text = String(value ?? '')
    .replace(/\r/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length > 600) {
    throw createError({
      statusCode: 400,
      message: `${field} must be 600 characters or fewer.`,
    })
  }
  return text
}

// Edits a page's "Riffing on" (source_lineage) and "Recast" brief in the set's
// homage-concepts.yaml in Conductor (Silas, 2026-11-04 PT).
export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const body = (await readBody(
      event,
    )) as Partial<ColoringBookConceptUpdate> | null
    const bookSlug = String(body?.bookSlug || '')
      .trim()
      .toLowerCase()
    const proposalId = String(body?.proposalId || '')
      .trim()
      .toLowerCase()
    const config = coloringBookConfig(bookSlug)
    if (!config || !proposalBelongsToBook(bookSlug, proposalId)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid book or proposal id.',
      })
    }
    const sourceLineage = clean(body?.sourceLineage, 'Riffing on')
    const recast = clean(body?.recast, 'Recast')
    if (!sourceLineage && !recast) {
      throw createError({
        statusCode: 400,
        message: 'Add a riff or a recast before saving.',
      })
    }

    const ledger = await conductorGet(config.ledgerPath)
    const titleMatch = ledger?.content
      .split(/^- slot:/m)
      .find((block) =>
        new RegExp(`^  id:\\s*["']?${proposalId}["']?\\s*$`, 'm').test(block),
      )
      ?.match(/^ {2}title:\s*(.*?)\s*$/m)
    const title = (titleMatch?.[1] ?? proposalId).replace(/^["']|["']$/g, '')

    const path = coloringBookConceptPath(config)
    const source = await conductorGet(path)
    const content = upsertColoringBookConcept(
      source?.content ?? '',
      bookSlug,
      proposalId,
      { sourceLineage, recast },
      title,
    )
    await conductorPut(
      path,
      content,
      `coloring-book: update ${proposalId} riff and recast`,
      source?.sha,
    )

    return {
      success: true,
      message: `${proposalId} riff and recast saved to Conductor.`,
      data: { bookSlug, proposalId, sourceLineage, recast },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to save the riff and recast.',
      statusCode,
    }
  }
})
