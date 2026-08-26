// /server/api/aquarium/catalog.get.ts
//
// Lists Cthulhuquarium species the authenticated user's tank does not yet
// own, priced the same way POST /api/aquarium/purchase actually charges
// (cthulhuquarium/t-011) -- the unlock panel reads this instead of a
// hardcoded species list.
//
// Query: ?take=24&skip=0

import { defineEventHandler, getQuery } from 'h3'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'
import { listCatalogForUser } from '../../utils/aquarium'

const DEFAULT_TAKE = 24
const MAX_TAKE = 60

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
    const { user } = await requireApiUser(event)

    const query = getQuery(event)
    const take =
      parsePositiveInt(query.take, DEFAULT_TAKE, MAX_TAKE) || DEFAULT_TAKE
    const skip = parsePositiveInt(query.skip, 0)

    const result = await listCatalogForUser(user.id, user.username, take, skip)

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
      message: handledError.message || 'Failed to load the species catalog.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
