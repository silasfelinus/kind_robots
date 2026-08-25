// /server/api/aquarium/browse/index.get.ts
//
// Public tank index -- paginated, unauthenticated (cthulhuquarium/t-009).
// Exposes display name + tank summary only, never email or userId.
//
// Query: ?take=20&skip=0 (take capped and defaulted like other browse
// endpoints in this codebase's list conventions, e.g. server/api/dreams).

import { defineEventHandler, getQuery } from 'h3'
import { errorHandler } from '../../../utils/error'
import { listPublicTanks } from '../../../utils/aquarium'

const DEFAULT_TAKE = 20
const MAX_TAKE = 50

function parsePositiveInt(
  value: unknown,
  fallback: number,
  max?: number,
): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return fallback
  const truncated = Math.trunc(parsed)
  return max ? Math.min(truncated, max) : truncated
}

export default defineEventHandler(async (event) => {
  let response

  try {
    const query = getQuery(event)
    const take =
      parsePositiveInt(query.take, DEFAULT_TAKE, MAX_TAKE) || DEFAULT_TAKE
    const skip = parsePositiveInt(query.skip, 0)

    const result = await listPublicTanks(take, skip)

    response = {
      success: true,
      data: result.data,
      meta: { take: result.take, skip: result.skip, total: result.total },
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to load public tanks.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
