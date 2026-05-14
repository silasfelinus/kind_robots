import { createError } from 'h3'
import { prisma } from '~/server/utils/prisma'
import type { ChatGptActor } from '../auth/resolveActor'
import type { ChatGptResource } from '../schemas/operationSchemas'
import { getModelConfig } from '../registry/models'

const DEFAULT_GUEST_USER_ID = 10

function getActorUserId(actor: ChatGptActor) {
  return actor.userId || DEFAULT_GUEST_USER_ID
}

function getDelegate(resource: ChatGptResource) {
  const config = getModelConfig(resource)
  const delegate = (prisma as any)[config.prisma]

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

async function assertCanUpdate(
  actor: ChatGptActor,
  resource: ChatGptResource,
  id: number,
) {
  if (actor.role === 'admin') return

  const { config, delegate } = getDelegate(resource)

  const record = await delegate.findUnique({
    where: { id },
    select: {
      id: true,
      [config.ownerField]: true,
    },
  })

  if (!record) {
    throw createError({
      statusCode: 404,
      statusMessage: `${resource} not found`,
    })
  }

  if (record[config.ownerField] !== getActorUserId(actor)) {
    throw createError({
      statusCode: 403,
      statusMessage: `You do not own this ${resource}`,
    })
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
}) {
  const { config, delegate } = getDelegate(resource)

  console.log('[contentService createContent input]', {
    resource,
    data,
    actor: {
      userId: actor.userId,
      role: actor.role,
    },
  })

  const parsed = config.createSchema.parse(data) as Record<string, any>

  const createData: Record<string, any> = {
    ...parsed,
    [config.ownerField]: getActorUserId(actor),
  }

  if (config.activeField) {
    createData[config.activeField] = parsed[config.activeField] ?? true
  }

  console.log('[contentService createContent createData]', {
    resource,
    createData,
  })

  try {
    const record = await delegate.create({
      data: createData,
      select: config.publicSelect,
    })

    console.log('[contentService createContent result]', {
      resource,
      id: record?.id,
    })

    return {
      ok: true,
      operation: 'content.create',
      resource,
      data: record,
      message: `${resource} created successfully.`,
    }
  } catch (error) {
    console.error('[contentService createContent error]', {
      resource,
      createData,
      error,
    })

    throw error
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
}) {
  const { config, delegate } = getDelegate(resource)

  const record = await delegate.findUnique({
    where: { id },
    select: config.publicSelect,
  })

  if (!record) {
    throw createError({
      statusCode: 404,
      statusMessage: `${resource} not found`,
    })
  }

  const ownerId = record[config.ownerField]
  const isPublic = record.isPublic

  if (
    actor.role !== 'admin' &&
    ownerId !== getActorUserId(actor) &&
    isPublic === false
  ) {
    throw createError({
      statusCode: 403,
      statusMessage: `You cannot read this ${resource}`,
    })
  }

  return {
    ok: true,
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
}) {
  const { config, delegate } = getDelegate(resource)

  const limit =
    typeof filter.limit === 'number'
      ? Math.min(Math.max(filter.limit, 1), 100)
      : 20

  const offset = typeof filter.offset === 'number' ? filter.offset : 0

  const where: Record<string, any> = {}

  if (config.activeField) {
    where[config.activeField] =
      typeof filter.isActive === 'boolean' ? filter.isActive : true
  }

  if (typeof filter.isPublic === 'boolean') {
    where.isPublic = filter.isPublic
  }

  if (typeof filter.userId === 'number') {
    where[config.ownerField] = filter.userId
  }

  if (actor.role !== 'admin') {
    where.OR = [
      { isPublic: true },
      { [config.ownerField]: getActorUserId(actor) },
    ]
  }

  const records = await delegate.findMany({
    where,
    select: config.publicSelect,
    take: limit,
    skip: offset,
    orderBy: { updatedAt: 'desc' },
  })

  return {
    ok: true,
    operation: 'content.list',
    resource,
    data: records,
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
}) {
  await assertCanUpdate(actor, resource, id)

  const { config, delegate } = getDelegate(resource)
  const parsed = config.updateSchema.parse(data) as Record<string, any>

  const record = await delegate.update({
    where: { id },
    data: parsed,
    select: config.publicSelect,
  })

  return {
    ok: true,
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
}) {
  await assertCanUpdate(actor, resource, id)

  const { config, delegate } = getDelegate(resource)

  if (!config.activeField) {
    throw createError({
      statusCode: 400,
      statusMessage: `${resource} does not support isActive`,
    })
  }

  const record = await delegate.update({
    where: { id },
    data: {
      [config.activeField]: isActive,
    },
    select: config.publicSelect,
  })

  return {
    ok: true,
    operation: 'content.setActive',
    resource,
    data: record,
    message: isActive
      ? `${resource} restored successfully.`
      : `${resource} archived successfully.`,
  }
}
