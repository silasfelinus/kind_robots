// /server/chatgpt/services/currentContentService.ts
import { createError } from 'h3'
import { prisma } from '~/server/utils/prisma'
import type { ChatGptActor } from '../auth/resolveActor'
import type { ChatGptResource } from '../schemas/operationSchemas'
import {
  getCurrentModelConfig,
  type CurrentModelConfig,
} from '../registry/currentModels'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

const CONTROL_FILTER_FIELDS = new Set([
  'ids',
  'isActive',
  'isMature',
  'isPublic',
  'limit',
  'offset',
  'orderBy',
  'orderDirection',
  'page',
  'q',
  'userId',
])

const PROTECTED_WRITE_FIELDS = new Set(['id', 'createdAt', 'updatedAt'])

type PrismaDelegate = {
  fields?: Record<string, unknown>
  create(args: Record<string, unknown>): Promise<Record<string, unknown>>
  findUnique(
    args: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null>
  findMany(args: Record<string, unknown>): Promise<Record<string, unknown>[]>
  update(args: Record<string, unknown>): Promise<Record<string, unknown>>
  count(args: Record<string, unknown>): Promise<number>
}

type ContentOperation =
  | 'content.create'
  | 'content.get'
  | 'content.list'
  | 'content.update'
  | 'content.setActive'

type ContentServiceResponse<TData = unknown> = {
  success: true
  operation: ContentOperation
  resource: ChatGptResource
  data: TData
  message?: string
  meta?: {
    limit?: number
    offset?: number
    count?: number
  }
}

type ListFilter = Record<string, unknown> & {
  ids?: number[]
  isActive?: boolean
  isMature?: boolean
  isPublic?: boolean
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  page?: number
  q?: string
  userId?: number
}

function isAdminActor(actor: ChatGptActor): boolean {
  return actor.role === 'admin'
}

function getDelegate(resource: ChatGptResource): {
  config: CurrentModelConfig
  delegate: PrismaDelegate
} {
  const config = getCurrentModelConfig(resource)
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

function getScalarFields({
  resource,
  delegate,
}: {
  resource: ChatGptResource
  delegate: PrismaDelegate
}): Set<string> {
  const fields = new Set(Object.keys(delegate.fields ?? {}))

  if (!fields.size) {
    throw createError({
      statusCode: 500,
      statusMessage: `Prisma scalar field metadata is unavailable for ${resource}`,
    })
  }

  return fields
}

function getHiddenFields(
  config: CurrentModelConfig,
  mode: 'detail' | 'list',
): Set<string> {
  return new Set([
    ...(config.hiddenFields ?? []),
    ...(mode === 'list' ? (config.listHiddenFields ?? []) : []),
  ])
}

function buildPublicSelect({
  config,
  scalarFields,
  mode,
}: {
  config: CurrentModelConfig
  scalarFields: Set<string>
  mode: 'detail' | 'list'
}): Record<string, boolean> {
  const hiddenFields = getHiddenFields(config, mode)

  return Object.fromEntries(
    [...scalarFields]
      .filter((field) => !hiddenFields.has(field))
      .map((field) => [field, true]),
  )
}

function addPermissionFields({
  select,
  config,
  scalarFields,
}: {
  select: Record<string, boolean>
  config: CurrentModelConfig
  scalarFields: Set<string>
}): Record<string, boolean> {
  const result = { ...select }

  for (const field of [config.ownerField, config.publicField, config.activeField]) {
    if (field && scalarFields.has(field)) result[field] = true
  }

  if (scalarFields.has('id')) result.id = true

  return result
}

function assertPlainObject(
  value: unknown,
  label: string,
): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw createError({
      statusCode: 400,
      statusMessage: `${label} must be an object`,
    })
  }
}

function assertKnownFields({
  resource,
  data,
  scalarFields,
}: {
  resource: ChatGptResource
  data: Record<string, unknown>
  scalarFields: Set<string>
}) {
  const unknownFields = Object.keys(data).filter(
    (field) => !scalarFields.has(field),
  )

  if (!unknownFields.length) return

  throw createError({
    statusCode: 400,
    statusMessage: `Unknown ${resource} field${unknownFields.length === 1 ? '' : 's'}: ${unknownFields.join(', ')}`,
    data: {
      success: false,
      resource,
      unknownFields,
      allowedFields: [...scalarFields].sort(),
    },
  })
}

function assertMutationAllowed({
  resource,
  config,
  actor,
}: {
  resource: ChatGptResource
  config: CurrentModelConfig
  actor: ChatGptActor
}) {
  if (!config.adminOnly || isAdminActor(actor)) return

  throw createError({
    statusCode: 403,
    statusMessage: `Admin access is required to modify ${resource}`,
  })
}

function normalizeCreateData({
  resource,
  data,
  config,
  scalarFields,
  actor,
}: {
  resource: ChatGptResource
  data: Record<string, unknown>
  config: CurrentModelConfig
  scalarFields: Set<string>
  actor: ChatGptActor
}): Record<string, unknown> {
  assertKnownFields({ resource, data, scalarFields })

  const createData = Object.fromEntries(
    Object.entries(data).filter(([field]) => !PROTECTED_WRITE_FIELDS.has(field)),
  )

  const ownerField = config.ownerField

  if (ownerField && ownerField !== 'id' && scalarFields.has(ownerField)) {
    if (!isAdminActor(actor) || typeof createData[ownerField] !== 'number') {
      createData[ownerField] = actor.userId
    }
  }

  if (
    config.activeField &&
    scalarFields.has(config.activeField) &&
    typeof createData[config.activeField] !== 'boolean'
  ) {
    createData[config.activeField] = true
  }

  if (
    config.publicField &&
    scalarFields.has(config.publicField) &&
    typeof createData[config.publicField] !== 'boolean'
  ) {
    createData[config.publicField] = true
  }

  if (
    scalarFields.has('isMature') &&
    typeof createData.isMature !== 'boolean'
  ) {
    createData.isMature = false
  }

  return createData
}

function normalizeUpdateData({
  resource,
  data,
  config,
  scalarFields,
  actor,
}: {
  resource: ChatGptResource
  data: Record<string, unknown>
  config: CurrentModelConfig
  scalarFields: Set<string>
  actor: ChatGptActor
}): Record<string, unknown> {
  assertKnownFields({ resource, data, scalarFields })

  const protectedFields = new Set(PROTECTED_WRITE_FIELDS)

  if (!isAdminActor(actor) && config.ownerField) {
    protectedFields.add(config.ownerField)
  }

  const updateData = Object.fromEntries(
    Object.entries(data).filter(([field]) => !protectedFields.has(field)),
  )

  if (!Object.keys(updateData).length) {
    throw createError({
      statusCode: 400,
      statusMessage: `No editable fields were provided for ${resource}`,
    })
  }

  return updateData
}

function assertReadableRecord({
  resource,
  config,
  actor,
  record,
}: {
  resource: ChatGptResource
  config: CurrentModelConfig
  actor: ChatGptActor
  record: Record<string, unknown>
}) {
  if (isAdminActor(actor)) return

  if (resource === 'user') {
    if (record.id === actor.userId) return

    throw createError({
      statusCode: 403,
      statusMessage: 'You cannot read this user',
    })
  }

  if (config.ownerField && record[config.ownerField] === actor.userId) return
  if (config.publicField && record[config.publicField] === true) return

  throw createError({
    statusCode: 403,
    statusMessage: `You cannot read this ${resource}`,
  })
}

async function assertWritableRecord({
  resource,
  id,
  actor,
}: {
  resource: ChatGptResource
  id: number
  actor: ChatGptActor
}) {
  const { config, delegate } = getDelegate(resource)
  assertMutationAllowed({ resource, config, actor })

  const scalarFields = getScalarFields({ resource, delegate })
  const select: Record<string, boolean> = { id: true }

  if (config.ownerField && scalarFields.has(config.ownerField)) {
    select[config.ownerField] = true
  }

  const record = await delegate.findUnique({
    where: { id },
    select,
  })

  if (!record) {
    throw createError({
      statusCode: 404,
      statusMessage: `${resource} not found`,
    })
  }

  if (isAdminActor(actor)) return

  if (resource === 'user' && record.id === actor.userId) return

  if (config.ownerField && record[config.ownerField] === actor.userId) return

  throw createError({
    statusCode: 403,
    statusMessage: `You do not own this ${resource}`,
  })
}

function asPositiveInt(value: unknown, fallback?: number): number | undefined {
  if (value === undefined || value === null || value === '') return fallback

  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function asNonNegativeInt(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback
}

function normalizeFilter(filter: Record<string, unknown>): ListFilter {
  const normalized: ListFilter = { ...filter }

  normalized.limit = Math.min(
    asPositiveInt(filter.limit, DEFAULT_LIMIT) ?? DEFAULT_LIMIT,
    MAX_LIMIT,
  )
  normalized.offset = asNonNegativeInt(filter.offset)
  normalized.page = asPositiveInt(filter.page)
  normalized.userId = asPositiveInt(filter.userId)
  normalized.q =
    typeof filter.q === 'string' && filter.q.trim() ? filter.q.trim() : undefined
  normalized.orderBy =
    typeof filter.orderBy === 'string' && filter.orderBy.trim()
      ? filter.orderBy.trim()
      : undefined
  normalized.orderDirection =
    filter.orderDirection === 'asc' || filter.orderDirection === 'desc'
      ? filter.orderDirection
      : undefined

  if (Array.isArray(filter.ids)) {
    normalized.ids = filter.ids
      .map((value) => asPositiveInt(value))
      .filter((value): value is number => Boolean(value))
  }

  return normalized
}

function buildWhere({
  resource,
  config,
  scalarFields,
  actor,
  filter,
}: {
  resource: ChatGptResource
  config: CurrentModelConfig
  scalarFields: Set<string>
  actor: ChatGptActor
  filter: ListFilter
}): Record<string, unknown> {
  const clauses: Record<string, unknown>[] = []

  if (filter.ids?.length && scalarFields.has('id')) {
    clauses.push({ id: { in: filter.ids } })
  }

  if (config.activeField && scalarFields.has(config.activeField)) {
    clauses.push({
      [config.activeField]:
        typeof filter.isActive === 'boolean' ? filter.isActive : true,
    })
  }

  if (resource === 'user' && !isAdminActor(actor)) {
    clauses.push({ id: actor.userId })
  } else if (!isAdminActor(actor) && config.ownerField) {
    if (config.publicField && scalarFields.has(config.publicField)) {
      clauses.push({
        OR: [
          { [config.publicField]: true },
          { [config.ownerField]: actor.userId },
        ],
      })
    } else {
      clauses.push({ [config.ownerField]: actor.userId })
    }
  } else {
    if (
      config.publicField &&
      scalarFields.has(config.publicField) &&
      typeof filter.isPublic === 'boolean'
    ) {
      clauses.push({ [config.publicField]: filter.isPublic })
    }

    if (
      config.ownerField &&
      config.ownerField !== 'id' &&
      scalarFields.has(config.ownerField) &&
      typeof filter.userId === 'number'
    ) {
      clauses.push({ [config.ownerField]: filter.userId })
    }
  }

  if (scalarFields.has('isMature') && typeof filter.isMature === 'boolean') {
    clauses.push({ isMature: filter.isMature })
  }

  const allowedFilterFields = new Set(config.filterFields ?? [])

  for (const [field, value] of Object.entries(filter)) {
    if (CONTROL_FILTER_FIELDS.has(field)) continue
    if (!allowedFilterFields.has(field) || !scalarFields.has(field)) continue
    if (value === undefined || value === null || value === '') continue

    clauses.push({ [field]: value })
  }

  const searchableFields = (config.searchableFields ?? []).filter((field) =>
    scalarFields.has(field),
  )

  if (filter.q && searchableFields.length) {
    clauses.push({
      OR: searchableFields.map((field) => ({
        [field]: {
          contains: filter.q,
        },
      })),
    })
  }

  if (!clauses.length) return {}
  if (clauses.length === 1) return clauses[0] ?? {}

  return {
    AND: clauses,
  }
}

function getPagination(filter: ListFilter): {
  limit: number
  offset: number
} {
  const limit = filter.limit ?? DEFAULT_LIMIT
  const offset = filter.page
    ? (filter.page - 1) * limit
    : (filter.offset ?? 0)

  return {
    limit,
    offset,
  }
}

function getOrderBy({
  config,
  scalarFields,
  filter,
}: {
  config: CurrentModelConfig
  scalarFields: Set<string>
  filter: ListFilter
}): Record<string, 'asc' | 'desc'> {
  if (filter.orderBy) {
    if (!scalarFields.has(filter.orderBy)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Unknown orderBy field: ${filter.orderBy}`,
      })
    }

    return {
      [filter.orderBy]: filter.orderDirection ?? 'desc',
    }
  }

  if (
    config.defaultOrderBy &&
    scalarFields.has(config.defaultOrderBy.field)
  ) {
    return {
      [config.defaultOrderBy.field]: config.defaultOrderBy.direction,
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
  assertPlainObject(data, 'data')

  const { config, delegate } = getDelegate(resource)
  assertMutationAllowed({ resource, config, actor })

  const scalarFields = getScalarFields({ resource, delegate })
  const createData = normalizeCreateData({
    resource,
    data,
    config,
    scalarFields,
    actor,
  })
  const select = buildPublicSelect({
    config,
    scalarFields,
    mode: 'detail',
  })

  const record = await delegate.create({
    data: createData,
    select,
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
  const scalarFields = getScalarFields({ resource, delegate })
  const select = addPermissionFields({
    select: buildPublicSelect({
      config,
      scalarFields,
      mode: 'detail',
    }),
    config,
    scalarFields,
  })

  const record = await delegate.findUnique({
    where: { id },
    select,
  })

  if (!record) {
    throw createError({
      statusCode: 404,
      statusMessage: `${resource} not found`,
    })
  }

  assertReadableRecord({ resource, config, actor, record })

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
  assertPlainObject(filter, 'filter')

  const { config, delegate } = getDelegate(resource)
  const scalarFields = getScalarFields({ resource, delegate })
  const parsedFilter = normalizeFilter(filter)
  const { limit, offset } = getPagination(parsedFilter)
  const where = buildWhere({
    resource,
    config,
    scalarFields,
    actor,
    filter: parsedFilter,
  })
  const select = buildPublicSelect({
    config,
    scalarFields,
    mode: 'list',
  })

  const [records, count] = await Promise.all([
    delegate.findMany({
      where,
      select,
      take: limit,
      skip: offset,
      orderBy: getOrderBy({ config, scalarFields, filter: parsedFilter }),
    }),
    delegate.count({ where }),
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
  assertPlainObject(data, 'data')
  await assertWritableRecord({ resource, id, actor })

  const { config, delegate } = getDelegate(resource)
  const scalarFields = getScalarFields({ resource, delegate })
  const updateData = normalizeUpdateData({
    resource,
    data,
    config,
    scalarFields,
    actor,
  })
  const select = buildPublicSelect({
    config,
    scalarFields,
    mode: 'detail',
  })

  const record = await delegate.update({
    where: { id },
    data: updateData,
    select,
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
  await assertWritableRecord({ resource, id, actor })

  const { config, delegate } = getDelegate(resource)
  const scalarFields = getScalarFields({ resource, delegate })
  const activeField = config.activeField

  if (!activeField || !scalarFields.has(activeField)) {
    throw createError({
      statusCode: 400,
      statusMessage: `${resource} does not support isActive`,
    })
  }

  const select = buildPublicSelect({
    config,
    scalarFields,
    mode: 'detail',
  })
  const record = await delegate.update({
    where: { id },
    data: {
      [activeField]: isActive,
    },
    select,
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
