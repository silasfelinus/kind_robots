import { createError } from 'h3'
import { prisma } from '~/server/utils/prisma'
import type { ChatGptActor } from '../auth/resolveActor'
import type { ChatGptResource } from '../schemas/operationSchemas'
import { getModelConfig } from '../registry/models'

function getDelegate(resource: ChatGptResource) {
  const config = getModelConfig(resource)
  return {
    config,
    delegate: (prisma as any)[config.prisma],
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

  if (record[config.ownerField] !== actor.userId) {
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

  const parsed = config.createSchema.parse(data)

  return delegate.create({
    data: {
      ...parsed,
      [config.ownerField]: actor.userId || 10,
      [config.activeField]: parsed[config.activeField] ?? true,
    },
    select: config.publicSelect,
  })
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

  if (
    actor.role !== 'admin' &&
    record.userId !== actor.userId &&
    record.isPublic === false
  ) {
    throw createError({
      statusCode: 403,
      statusMessage: `You cannot read this ${resource}`,
    })
  }

  return record
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

  const where: Record<string, unknown> = {}

  if (config.activeField) {
    where[config.activeField] =
      typeof filter.isActive === 'boolean' ? filter.isActive : true
  }

  if (typeof filter.isPublic === 'boolean') {
    where.isPublic = filter.isPublic
  }

  if (actor.role !== 'admin') {
    where.OR = [{ isPublic: true }, { [config.ownerField]: actor.userId }]
  }

  return delegate.findMany({
    where,
    select: config.publicSelect,
    take: limit,
    skip: offset,
    orderBy: { updatedAt: 'desc' },
  })
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
  const parsed = config.updateSchema.parse(data)

  return delegate.update({
    where: { id },
    data: parsed,
    select: config.publicSelect,
  })
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

  return delegate.update({
    where: { id },
    data: {
      [config.activeField]: isActive,
    },
    select: config.publicSelect,
  })
}
