// /server/api/server/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'

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

function normalizeServerType(v: unknown): string | undefined {
  if (v === undefined) return undefined
  const val = String(v).toUpperCase()

  const allowed = new Set([
    'ART',
    'TEXT',
    'COMFY',
    'A1111',
    'OPENAI_COMPATIBLE',
    'OTHER',
  ])

  return allowed.has(val) ? val : undefined
}

export default defineEventHandler(async (event) => {
  try {
    const q = getQuery(event)

    console.log('[server.get] Fetching servers...')

    const rawDb = await prisma.$queryRawUnsafe('SELECT DATABASE() AS db')

    const { isValid, user } = await validateApiKey(event)
    const includeUserData = isValid && user && typeof user.id === 'number'

    const serverType = normalizeServerType(q.serverType ?? q.type)
    const isPublic = toBool(q.isPublic)
    const isOfficial = toBool(q.isOfficial)
    const isDefault = toBool(q.isDefault)
    const isActive = toBool(q.isActive)
    const isEditable = toBool(q.isEditable)
    const userId = toInt(q.userId)
    const title = typeof q.title === 'string' ? q.title.trim() : undefined
    const label = typeof q.label === 'string' ? q.label.trim() : undefined
    const category =
      typeof q.category === 'string' ? q.category.trim() : undefined
    const search = typeof q.q === 'string' ? q.q.trim() : undefined

    const ids =
      typeof q.ids === 'string'
        ? q.ids
            .split(',')
            .map((s) => Number(s.trim()))
            .filter((n) => Number.isFinite(n))
        : undefined

    const pageSize = Math.min(Math.max(toInt(q.pageSize) ?? 20, 1), 100)
    const page = Math.max(toInt(q.page) ?? 1, 1)
    const skip = (page - 1) * pageSize
    const take = pageSize

    const sortByRaw = typeof q.sortBy === 'string' ? q.sortBy : 'sortOrder'
    const orderRaw = String(q.order ?? 'asc').toLowerCase()
    const order: 'asc' | 'desc' = orderRaw === 'desc' ? 'desc' : 'asc'

    const sortableFields = new Set([
      'id',
      'title',
      'label',
      'serverType',
      'category',
      'baseUrl',
      'isPublic',
      'isOfficial',
      'isDefault',
      'isActive',
      'isEditable',
      'sortOrder',
      'createdAt',
      'updatedAt',
      'lastCheckedAt',
    ])

    const sortBy = sortableFields.has(sortByRaw) ? sortByRaw : 'sortOrder'

    const where: Record<string, any> = {}

    if (includeUserData) {
      where.OR = [{ isPublic: true }, { userId: user.id }]
    } else {
      where.isPublic = true
    }

    if (serverType) where.serverType = serverType
    if (isPublic !== undefined) where.isPublic = isPublic
    if (isOfficial !== undefined) where.isOfficial = isOfficial
    if (isDefault !== undefined) where.isDefault = isDefault
    if (isActive !== undefined) where.isActive = isActive
    if (isEditable !== undefined) where.isEditable = isEditable
    if (userId !== undefined) where.userId = userId
    if (ids?.length) where.id = { in: ids }
    if (title) where.title = { contains: title }
    if (label) where.label = { contains: label }
    if (category) where.category = { contains: category }

    if (search) {
      const searchFilters = [
        { title: { contains: search } },
        { label: { contains: search } },
        { description: { contains: search } },
        { category: { contains: search } },
        { baseUrl: { contains: search } },
        { endpointPath: { contains: search } },
        { healthPath: { contains: search } },
        { apiLink: { contains: search } },
        { model: { contains: search } },
        { designer: { contains: search } },
        { version: { contains: search } },
        { notes: { contains: search } },
      ]

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchFilters }]
        delete where.OR
      } else {
        where.OR = searchFilters
      }
    }

    const [data, total] = await Promise.all([
      prisma.server.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: order },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          title: true,
          label: true,
          description: true,
          serverType: true,
          category: true,
          baseUrl: true,
          endpointPath: true,
          healthPath: true,
          userId: true,
          isPublic: true,
          isOfficial: true,
          isDefault: true,
          isActive: true,
          isEditable: true,
          requiresApiKey: true,
          apiKeyName: true,
          supportsTxt2Img: true,
          supportsImg2Img: true,
          supportsChat: true,
          supportsComfyWorkflow: true,
          supportsCheckpointOverride: true,
          supportsSampler: true,
          supportsNegativePrompt: true,
          supportsSeed: true,
          supportsSteps: true,
          supportsVideo: true,
          model: true,
          designer: true,
          version: true,
          notes: true,
          sortOrder: true,
          lastCheckedAt: true,
          lastStatus: true,
          apiLink: true,
        },
      }),
      prisma.server.count({ where }),
    ])

    event.node.res.statusCode = 200
    return {
      success: true,
      message: includeUserData
        ? `Servers retrieved for user ${user.id}.`
        : 'Public servers retrieved successfully.',
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        sortBy,
        order,
        filters: {
          serverType,
          isPublic,
          isOfficial,
          isDefault,
          isActive,
          isEditable,
          userId,
          title,
          label,
          category,
          q: search,
          ids,
          includeUserData,
        },
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const { success, message, statusCode } = errorHandler(error)
    return {
      success,
      message,
      data: [],
      statusCode,
    }
  }
})
