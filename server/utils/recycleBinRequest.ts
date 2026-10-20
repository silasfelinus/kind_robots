// /server/utils/recycleBinRequest.ts
//
// Shared body parsing and per-item execution for the Recycle Bin's restore
// and purge routes. Each id is handled on its own so one refusal (a 403 on
// someone else's image, a 409 on something not in the bin) reports against
// that id instead of failing the rest of the batch.
import { createError } from 'h3'
import { errorHandler } from '~/server/utils/error'
import type {
  RecycleBinActor,
  RecycleBinOutcome,
} from '~/server/utils/artRecycleBin'

const MAX_IDS_PER_REQUEST = 200

export type RecycleBinRequest = {
  imageIds: number[]
  collectionIds: number[]
}

export type RecycleBinItemResult = {
  kind: 'image' | 'collection'
  id: number
  success: boolean
  message: string
}

function readIds(value: unknown, label: string): number[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    throw createError({
      statusCode: 400,
      message: `${label} must be an array.`,
    })
  }
  const ids = value.map(Number)
  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw createError({
      statusCode: 400,
      message: `${label} must contain positive integer ids.`,
    })
  }
  return [...new Set(ids)]
}

export function readRecycleBinRequest(body: unknown): RecycleBinRequest {
  const source =
    body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const imageIds = readIds(source.imageIds, 'imageIds')
  const collectionIds = readIds(source.collectionIds, 'collectionIds')
  if (!imageIds.length && !collectionIds.length) {
    throw createError({
      statusCode: 400,
      message: 'Choose at least one image or collection.',
    })
  }
  if (imageIds.length + collectionIds.length > MAX_IDS_PER_REQUEST) {
    throw createError({
      statusCode: 400,
      message: `At most ${MAX_IDS_PER_REQUEST} items per request.`,
    })
  }
  return { imageIds, collectionIds }
}

export async function runRecycleBinRequest(
  request: RecycleBinRequest,
  actor: RecycleBinActor,
  handlers: {
    image: (id: number, actor: RecycleBinActor) => Promise<RecycleBinOutcome>
    collection: (
      id: number,
      actor: RecycleBinActor,
    ) => Promise<RecycleBinOutcome>
  },
): Promise<RecycleBinItemResult[]> {
  const results: RecycleBinItemResult[] = []
  const jobs = [
    ...request.collectionIds.map((id) => ({ kind: 'collection' as const, id })),
    ...request.imageIds.map((id) => ({ kind: 'image' as const, id })),
  ]
  for (const { kind, id } of jobs) {
    try {
      const outcome = await handlers[kind](id, actor)
      results.push({ kind, id, success: true, message: outcome.message })
    } catch (error: unknown) {
      const handled = errorHandler(error)
      results.push({
        kind,
        id,
        success: false,
        message: handled.message || `Failed to process ${kind} ${id}.`,
      })
    }
  }
  return results
}
