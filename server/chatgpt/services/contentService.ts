// /server/chatgpt/services/contentService.ts
import { createError } from 'h3'
import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import type { ChatGptActor } from '../auth/resolveActor'
import type { ChatGptResource } from '../schemas/operationSchemas'
import { getModelConfig } from '../registry/models'

const CURRENT_ADMIN_USER_ID = 1
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

const ListFilterSchema = z
  .object({
    limit: z.number().int().min(1).max(MAX_LIMIT).optional(),
    offset: z.number().int().min(0).optional(),
    page: z.number().int().min(1).optional(),
    isActive: z.boolean().optional(),
    isPublic: z.boolean().optional(),
    isMature: z.boolean().optional(),
    userId: z.number().int().positive().optional(),
    ids: z.array(z.number().int().positive()).optional(),
    q: z.string().trim().min(1).optional(),
    orderBy: z.string().trim().min(1).optional(),
    orderDirection: z.enum(['asc', 'desc']).optional(),
  })
  .catchall(z.unknown())

type ListFilter = z.infer<typeof ListFilterSchema>

type PrismaDelegate = {
  create(args: Record<string, unknown>): Promise<Record<string, unknown>>
  findUnique(
    args: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null>
  findMany(args: Record<string, unknown>): Promise<Record<string, unknown>[]>
  update(args: Record<string, unknown>): Promise<Record<string, unknown>>
  count(args: Record<string, unknown>): Promise<number>
}

type RuntimeModelConfig = {
  prisma: string
  ownerField?: string
  activeField?: string
  createSchema: z.ZodTypeAny
  updateSchema: z.ZodTypeAny
  publicSelect: Record<string, boolean>
  searchableFields?: string[]
  filterFields?: string[]
  defaultOrderBy?: Record<string, 'asc' | 'desc'>
}

type ContentServiceResponse<TData = unknown> = {
  success: true
  operation:
    | 'content.create'
    | 'content.get'
    | 'content.list'
    | 'content.update'
    | 'content.setActive'
  resource: ChatGptResource
  data: TData
  message?: string
  meta?: {
    limit?: number
    offset?: number
    count?: number
  }
}

function getActorUserId(actor: ChatGptActor): number {
  return actor.userId || CURRENT_ADMIN_USER_ID
}

function isAdminActor(actor: ChatGptActor): boolean {
  return actor.role === 'admin' || actor.userId === CURRENT_ADMIN_USER_ID
}

function getRuntimeModelConfig(resource: ChatGptResource): RuntimeModelConfig {
  return getModelConfig(resource) as RuntimeModelConfig
}

function getDelegate(resource: ChatGptResource): {
  config: RuntimeModelConfig
  delegate: PrismaDelegate
} {
  const config = getRuntimeModelConfig(resource)
  const delegate = (
    prisma as unknown as Record<string, PrismaDelegate | undefined>
  )[config.prisma]

  if (!delegate) {
    throw createError({
      statusCode: 500,
      statusMessage: `Prisma delegate not found for ${resource}: ${config.prisma}`,
    })
  }

  return {
    config,
    delegate,
  }
}

function getOwnerField(config: RuntimeModelConfig): string | undefined {
  if (!config.ownerField) return undefined
  if (config.ownerField === 'id') return undefined

  return config.ownerField
}

function getActiveField(config: RuntimeModelConfig): string | undefined {
  return config.activeField || undefined
}

function getSelectWithOwner(
  config: RuntimeModelConfig,
): Record<string, boolean> {
  const ownerField = getOwnerField(config)

  if (!ownerField) return config.publicSelect

  return {
    ...config.publicSelect,
    [ownerField]: true,
  }
}

function removeProtectedFields(
  data: Record<string, unknown>,
  config: RuntimeModelConfig,
): Record<string, unknown> {
  const ownerField = getOwnerField(config)

  const protectedFields = new Set([
    'id',
    'createdAt',
    'updatedAt',
    ...(ownerField ? [ownerField] : []),
  ])

  return Object.fromEntries(
    Object.entries(data).filter(([key]) => !protectedFields.has(key)),
  )
}

function applyDefaults({
  data,
  config,
  actor,
}: {
  data: Record<string, unknown>
  config: RuntimeModelConfig
  actor: ChatGptActor
}): Record<string, unknown> {
  const ownerField = getOwnerField(config)
  const activeField = getActiveField(config)

  const createData: Record<string, unknown> = {
    ...data,
  }

  if (ownerField) {
    createData[ownerField] = getActorUserId(actor)
  }

  if (activeField) {
    createData[activeField] =
      typeof data[activeField] === 'boolean' ? data[activeField] : true
  }

  if (
    Object.prototype.hasOwnProperty.call(config.publicSelect, 'isPublic') &&
    typeof createData.isPublic !== 'boolean'
  ) {
    createData.isPublic = true
  }

  if (
    Object.prototype.hasOwnProperty.call(config.publicSelect, 'isMature') &&
    typeof createData.isMature !== 'boolean'
  ) {
    createData.isMature = false
  }

  return createData
}

function assertReadableRecord({
  actor,
  config,
  resource,
  record,
}: {
  actor: ChatGptActor
  config: RuntimeModelConfig
  resource: ChatGptResource
  record: Record<string, unknown>
}) {
  if (isAdminActor(actor)) return

  const ownerField = getOwnerField(config)

  if (!ownerField) return
  if (record[ownerField] === getActorUserId(actor)) return
  if (record.isPublic === true) return

  throw createError({
    statusCode: 403,
    statusMessage: `You cannot read this ${resource}`,
  })
}

async function assertWritableRecord({
  actor,
  resource,
  id,
}: {
  actor: ChatGptActor
  resource: ChatGptResource
  id: number
}) {
  if (isAdminActor(actor)) return

  const { config, delegate } = getDelegate(resource)
  const ownerField = getOwnerField(config)

  if (!ownerField) {
    throw createError({
      statusCode: 403,
      statusMessage: `You cannot update this ${resource}`,
    })
  }

  const record = await delegate.findUnique({
    where: { id },
    select: {
      id: true,
      [ownerField]: true,
    },
  })

  if (!record) {
    throw createError({
      statusCode: 404,
      statusMessage: `${resource} not found`,
    })
  }

  if (record[ownerField] !== getActorUserId(actor)) {
    throw createError({
      statusCode: 403,
      statusMessage: `You do not own this ${resource}`,
    })
  }
}

function buildSearchWhere(
  config: RuntimeModelConfig,
  query: string | undefined,
): Record<string, unknown> | undefined {
  if (!query) return undefined

  const searchableFields = config.searchableFields ?? []

  if (!searchableFields.length) return undefined

  return {
    OR: searchableFields.map((field) => ({
      [field]: {
        contains: query,
      },
    })),
  }
}

function buildBaseWhere({
  actor,
  config,
  filter,
}: {
  actor: ChatGptActor
  config: RuntimeModelConfig
  filter: ListFilter
}): Record<string, unknown> {
  const where: Record<string, unknown> = {}
  const ownerField = getOwnerField(config)
  const activeField = getActiveField(config)

  if (filter.ids?.length) {
    where.id = {
      in: filter.ids,
    }
  }

  if (activeField) {
    where[activeField] =
      typeof filter.isActive === 'boolean' ? filter.isActive : true
  }

  if (
    Object.prototype.hasOwnProperty.call(config.publicSelect, 'isPublic') &&
    typeof filter.isPublic === 'boolean'
  ) {
    where.isPublic = filter.isPublic
  }

  if (
    Object.prototype.hasOwnProperty.call(config.publicSelect, 'isMature') &&
    typeof filter.isMature === 'boolean'
  ) {
    where.isMature = filter.isMature
  }

  if (ownerField && typeof filter.userId === 'number') {
    where[ownerField] = filter.userId
  }

  if (!isAdminActor(actor) && ownerField) {
    where.OR = [{ isPublic: true }, { [ownerField]: getActorUserId(actor) }]
  }

  const allowedFilterFields = new Set(config.filterFields ?? [])

  for (const [key, value] of Object.entries(filter)) {
    if (!allowedFilterFields.has(key)) continue
    if (value === undefined || value === null || value === '') continue

    where[key] = value
  }

  const searchWhere = buildSearchWhere(config, filter.q)

  if (!searchWhere) return where

  if (where.OR) {
    return {
      AND: [where, searchWhere],
    }
  }

  return {
    ...where,
    ...searchWhere,
  }
}

function getPagination(filter: ListFilter): {
  limit: number
  offset: number
} {
  const limit = filter.limit ?? DEFAULT_LIMIT
  const offset =
    typeof filter.page === 'number'
      ? (filter.page - 1) * limit
      : (filter.offset ?? 0)

  return {
    limit,
    offset,
  }
}

function getOrderBy(
  config: RuntimeModelConfig,
  filter: ListFilter,
): Record<string, 'asc' | 'desc'> {
  if (filter.orderBy) {
    return {
      [filter.orderBy]: filter.orderDirection ?? 'desc',
    }
  }

  if (config.defaultOrderBy) return config.defaultOrderBy

  if (Object.prototype.hasOwnProperty.call(config.publicSelect, 'updatedAt')) {
    return {
      updatedAt: 'desc',
    }
  }

  return {
    id: 'desc',
  }
}

export async function createContent({
  resource,
  data,
  actor,
}: {
  resource: ChatGptResource
  data: unknown
  actor: ChatGptActor
}): Promise<ContentServiceResponse<Record<string, unknown>>> {
  const { config, delegate } = getDelegate(resource)
  const parsed = config.createSchema.parse(data) as Record<string, unknown>

  const createData = applyDefaults({
    data: parsed,
    config,
    actor,
  })

  const record = await delegate.create({
    data: createData,
    select: config.publicSelect,
  })

  return {
    success: true,
    operation: 'content.create',
    resource,
    data: record,
    message: `${resource} created successfully.`,
  }
}

export async function getContent({
  resource,
  id,
  actor,
}: {
  resource: ChatGptResource
  id: number
  actor: ChatGptActor
}): Promise<ContentServiceResponse<Record<string, unknown>>> {
  const { config, delegate } = getDelegate(resource)

  const record = await delegate.findUnique({
    where: { id },
    select: getSelectWithOwner(config),
  })

  if (!record) {
    throw createError({
      statusCode: 404,
      statusMessage: `${resource} not found`,
    })
  }

  assertReadableRecord({
    actor,
    config,
    resource,
    record,
  })

  return {
    success: true,
    operation: 'content.get',
    resource,
    data: record,
  }
}

export async function listContent({
  resource,
  filter = {},
  actor,
}: {
  resource: ChatGptResource
  filter?: Record<string, unknown>
  actor: ChatGptActor
}): Promise<ContentServiceResponse<Record<string, unknown>[]>> {
  const { config, delegate } = getDelegate(resource)
  const parsedFilter = ListFilterSchema.parse(filter)
  const { limit, offset } = getPagination(parsedFilter)

  const where = buildBaseWhere({
    actor,
    config,
    filter: parsedFilter,
  })

  const [records, count] = await Promise.all([
    delegate.findMany({
      where,
      select: config.publicSelect,
      take: limit,
      skip: offset,
      orderBy: getOrderBy(config, parsedFilter),
    }),
    delegate.count({
      where,
    }),
  ])

  return {
    success: true,
    operation: 'content.list',
    resource,
    data: records,
    meta: {
      limit,
      offset,
      count,
    },
  }
}

export async function updateContent({
  resource,
  id,
  data,
  actor,
}: {
  resource: ChatGptResource
  id: number
  data: unknown
  actor: ChatGptActor
}): Promise<ContentServiceResponse<Record<string, unknown>>> {
  await assertWritableRecord({
    actor,
    resource,
    id,
  })

  const { config, delegate } = getDelegate(resource)
  const parsed = config.updateSchema.parse(data) as Record<string, unknown>
  const updateData = removeProtectedFields(parsed, config)

  if (!Object.keys(updateData).length) {
    throw createError({
      statusCode: 400,
      statusMessage: `No editable fields were provided for ${resource}`,
    })
  }

  const record = await delegate.update({
    where: { id },
    data: updateData,
    select: config.publicSelect,
  })

  return {
    success: true,
    operation: 'content.update',
    resource,
    data: record,
    message: `${resource} updated successfully.`,
  }
}

export async function setContentActive({
  resource,
  id,
  isActive,
  actor,
}: {
  resource: ChatGptResource
  id: number
  isActive: boolean
  actor: ChatGptActor
}): Promise<ContentServiceResponse<Record<string, unknown>>> {
  await assertWritableRecord({
    actor,
    resource,
    id,
  })

  const { config, delegate } = getDelegate(resource)
  const activeField = getActiveField(config)

  if (!activeField) {
    throw createError({
      statusCode: 400,
      statusMessage: `${resource} does not support isActive`,
    })
  }

  const record = await delegate.update({
    where: { id },
    data: {
      [activeField]: isActive,
    },
    select: config.publicSelect,
  })

  return {
    success: true,
    operation: 'content.setActive',
    resource,
    data: record,
    message: isActive
      ? `${resource} restored successfully.`
      : `${resource} deactivated successfully.`,
  }
}
