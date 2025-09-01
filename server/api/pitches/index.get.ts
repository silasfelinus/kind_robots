// /server/api/pitches/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

// Helpers
function toBool(v: unknown): boolean | undefined {
  if (v === undefined) return undefined
  const s = String(v).toLowerCase()
  if (['true', '1', 'yes', 'y'].includes(s)) return true
  if (['false', '0', 'no', 'n'].includes(s)) return false
  return undefined
}

function toInt(v: unknown): number | undefined {
  if (v === undefined) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

function normalizePitchType(q: Record<string, unknown>): string | undefined {
  // accept PitchType, type, pitchType, case-insensitive
  const keys = Object.keys(q)
  const key = keys.find(
    (k) => k.toLowerCase() === 'pitchtype' || k.toLowerCase() === 'type',
  )
  if (!key) return undefined
  const val = String(q[key]).toUpperCase()
  // allow only known enums; extend if you add more
  const allowed = new Set(['ARTPITCH', 'VIBE'])
  return allowed.has(val) ? val : undefined
}

export default defineEventHandler(async (event) => {
  try {
    const q = getQuery(event)

    // Filters
    const PitchType = normalizePitchType(q)
    const isPublic = toBool(q.isPublic)
    const isMature = toBool(q.isMature)
    const userId = toInt(q.userId)
    const title = typeof q.title === 'string' ? q.title.trim() : undefined
    const search = typeof q.q === 'string' ? q.q.trim() : undefined

    // ids=1,2,3
    const ids =
      typeof q.ids === 'string'
        ? q.ids
            .split(',')
            .map((s) => Number(s.trim()))
            .filter((n) => Number.isFinite(n))
        : undefined

    // Pagination
    const pageSize = Math.min(Math.max(toInt(q.pageSize) ?? 20, 1), 100)
    const page = Math.max(toInt(q.page) ?? 1, 1)
    const skip = (page - 1) * pageSize
    const take = pageSize

    // Sorting
    const sortByRaw = typeof q.sortBy === 'string' ? q.sortBy : 'updatedAt'
    const orderRaw = String(q.order ?? 'desc').toLowerCase()
    const order: 'asc' | 'desc' = orderRaw === 'asc' ? 'asc' : 'desc'
    const sortableFields = new Set([
      'id',
      'createdAt',
      'updatedAt',
      'title',
      'PitchType',
      'userId',
      'isPublic',
      'isMature',
    ])
    const sortBy = sortableFields.has(sortByRaw) ? sortByRaw : 'updatedAt'

    // where clause
    const where: any = {}
    if (PitchType) where.PitchType = PitchType
    if (isPublic !== undefined) where.isPublic = isPublic
    if (isMature !== undefined) where.isMature = isMature
    if (userId !== undefined) where.userId = userId
    if (ids?.length) where.id = { in: ids }
    if (title) where.title = { contains: title, mode: 'insensitive' }
    if (search) {
      // Search in title OR pitch
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { pitch: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.pitch.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: order },
      }),
      prisma.pitch.count({ where }),
    ])

    return {
      success: true,
      message: 'Pitches fetched successfully.',
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        sortBy,
        order,
        filters: {
          PitchType,
          isPublic,
          isMature,
          userId,
          title,
          q: search,
          ids,
        },
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const { success, message, statusCode } = errorHandler(error)
    return { success, message, statusCode }
  }
})
