// /server/chatgpt/services/currentRelationService.ts
import { createError } from 'h3'
import { prisma } from '~/server/utils/prisma'
import type { ChatGptActor } from '../auth/resolveActor'
import type {
  ChatGptResource,
  ContentRef,
} from '../schemas/operationSchemas'
import {
  getCurrentModelConfig,
  type CurrentModelConfig,
} from '../registry/currentModels'

type RelationOperation = 'relation.add' | 'relation.remove' | 'relation.list'

type RelationServiceResponse<TData = unknown> = {
  success: true
  operation: RelationOperation
  data: TData
  message?: string
}

type PrismaDelegate = {
  fields?: Record<string, unknown>
  findUnique(
    args: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null>
  update(args: Record<string, unknown>): Promise<Record<string, unknown>>
}

type ScalarRelationConfig = {
  mode: 'scalar'
  fromResource: ChatGptResource
  toResource: ChatGptResource
  sourceField: string
}

type ManyToManyRelationConfig = {
  mode: 'manyToMany'
  fromResource: ChatGptResource
  toResource: ChatGptResource
  relationField: string
}

type RelationConfig = ScalarRelationConfig | ManyToManyRelationConfig

const scalarRelationConfigs = [
  {
    mode: 'scalar',
    fromResource: 'artImage',
    toResource: 'resource',
    sourceField: 'checkpointResourceId',
  },
  {
    mode: 'scalar',
    fromResource: 'artImage',
    toResource: 'server',
    sourceField: 'serverId',
  },
  {
    mode: 'scalar',
    fromResource: 'artImage',
    toResource: 'user',
    sourceField: 'userId',
  },
  {
    mode: 'scalar',
    fromResource: 'artCollection',
    toResource: 'user',
    sourceField: 'userId',
  },
  {
    mode: 'scalar',
    fromResource: 'bot',
    toResource: 'artImage',
    sourceField: 'artImageId',
  },
  {
    mode: 'scalar',
    fromResource: 'bot',
    toResource: 'server',
    sourceField: 'serverId',
  },
  {
    mode: 'scalar',
    fromResource: 'bot',
    toResource: 'user',
    sourceField: 'userId',
  },
  {
    mode: 'scalar',
    fromResource: 'character',
    toResource: 'artImage',
    sourceField: 'artImageId',
  },
  {
    mode: 'scalar',
    fromResource: 'character',
    toResource: 'user',
    sourceField: 'userId',
  },
  {
    mode: 'scalar',
    fromResource: 'chat',
    toResource: 'artImage',
    sourceField: 'artImageId',
  },
  {
    mode: 'scalar',
    fromResource: 'chat',
    toResource: 'bot',
    sourceField: 'botId',
  },
  {
    mode: 'scalar',
    fromResource: 'chat',
    toResource: 'character',
    sourceField: 'characterId',
  },
  {
    mode: 'scalar',
    fromResource: 'chat',
    toResource: 'dream',
    sourceField: 'dreamId',
  },
  {
    mode: 'scalar',
    fromResource: 'chat',
    toResource: 'project',
    sourceField: 'projectId',
  },
  {
    mode: 'scalar',
    fromResource: 'chat',
    toResource: 'prompt',
    sourceField: 'promptId',
  },
  {
    mode: 'scalar',
    fromResource: 'chat',
    toResource: 'server',
    sourceField: 'serverId',
  },
  {
    mode: 'scalar',
    fromResource: 'chat',
    toResource: 'user',
    sourceField: 'userId',
  },
  {
    mode: 'scalar',
    fromResource: 'composition',
    toResource: 'artImage',
    sourceField: 'artImageId',
  },
  {
    mode: 'scalar',
    fromResource: 'composition',
    toResource: 'character',
    sourceField: 'characterId',
  },
  {
    mode: 'scalar',
    fromResource: 'composition',
    toResource: 'dream',
    sourceField: 'dreamId',
  },
  {
    mode: 'scalar',
    fromResource: 'composition',
    toResource: 'reward',
    sourceField: 'rewardId',
  },
  {
    mode: 'scalar',
    fromResource: 'composition',
    toResource: 'scenario',
    sourceField: 'scenarioId',
  },
  {
    mode: 'scalar',
    fromResource: 'composition',
    toResource: 'user',
    sourceField: 'userId',
  },
  {
    mode: 'scalar',
    fromResource: 'dream',
    toResource: 'artCollection',
    sourceField: 'artCollectionId',
  },
  {
    mode: 'scalar',
    fromResource: 'dream',
    toResource: 'artImage',
    sourceField: 'artImageId',
  },
  {
    mode: 'scalar',
    fromResource: 'dream',
    toResource: 'bot',
    sourceField: 'narratorId',
  },
  {
    mode: 'scalar',
    fromResource: 'dream',
    toResource: 'user',
    sourceField: 'userId',
  },
  {
    mode: 'scalar',
    fromResource: 'facet',
    toResource: 'artCollection',
    sourceField: 'artCollectionId',
  },
  {
    mode: 'scalar',
    fromResource: 'facet',
    toResource: 'artImage',
    sourceField: 'artImageId',
  },
  {
    mode: 'scalar',
    fromResource: 'facet',
    toResource: 'user',
    sourceField: 'userId',
  },
  {
    mode: 'scalar',
    fromResource: 'project',
    toResource: 'artCollection',
    sourceField: 'artCollectionId',
  },
  {
    mode: 'scalar',
    fromResource: 'project',
    toResource: 'artImage',
    sourceField: 'artImageId',
  },
  {
    mode: 'scalar',
    fromResource: 'project',
    toResource: 'bot',
    sourceField: 'managerBotId',
  },
  {
    mode: 'scalar',
    fromResource: 'project',
    toResource: 'user',
    sourceField: 'userId',
  },
  {
    mode: 'scalar',
    fromResource: 'prompt',
    toResource: 'artImage',
    sourceField: 'artImageId',
  },
  {
    mode: 'scalar',
    fromResource: 'prompt',
    toResource: 'bot',
    sourceField: 'botId',
  },
  {
    mode: 'scalar',
    fromResource: 'prompt',
    toResource: 'server',
    sourceField: 'serverId',
  },
  {
    mode: 'scalar',
    fromResource: 'prompt',
    toResource: 'user',
    sourceField: 'userId',
  },
  {
    mode: 'scalar',
    fromResource: 'resource',
    toResource: 'artImage',
    sourceField: 'artImageId',
  },
  {
    mode: 'scalar',
    fromResource: 'resource',
    toResource: 'user',
    sourceField: 'userId',
  },
  {
    mode: 'scalar',
    fromResource: 'reward',
    toResource: 'artImage',
    sourceField: 'artImageId',
  },
  {
    mode: 'scalar',
    fromResource: 'reward',
    toResource: 'user',
    sourceField: 'userId',
  },
  {
    mode: 'scalar',
    fromResource: 'scenario',
    toResource: 'artImage',
    sourceField: 'artImageId',
  },
  {
    mode: 'scalar',
    fromResource: 'scenario',
    toResource: 'user',
    sourceField: 'userId',
  },
  {
    mode: 'scalar',
    fromResource: 'server',
    toResource: 'user',
    sourceField: 'userId',
  },
  {
    mode: 'scalar',
    fromResource: 'theme',
    toResource: 'user',
    sourceField: 'userId',
  },
  {
    mode: 'scalar',
    fromResource: 'user',
    toResource: 'artImage',
    sourceField: 'artImageId',
  },
] satisfies ScalarRelationConfig[]

const manyToManyRelationConfigs = [
  {
    mode: 'manyToMany',
    fromResource: 'artCollection',
    toResource: 'artImage',
    relationField: 'ArtImages',
  },
  {
    mode: 'manyToMany',
    fromResource: 'artImage',
    toResource: 'artCollection',
    relationField: 'ArtCollections',
  },
  {
    mode: 'manyToMany',
    fromResource: 'artCollection',
    toResource: 'dream',
    relationField: 'Dreams',
  },
  {
    mode: 'manyToMany',
    fromResource: 'dream',
    toResource: 'artCollection',
    relationField: 'ArtCollections',
  },
  {
    mode: 'manyToMany',
    fromResource: 'artImage',
    toResource: 'dream',
    relationField: 'Dreams',
  },
  {
    mode: 'manyToMany',
    fromResource: 'dream',
    toResource: 'artImage',
    relationField: 'ArtImages',
  },
  {
    mode: 'manyToMany',
    fromResource: 'bot',
    toResource: 'dream',
    relationField: 'Dreams',
  },
  {
    mode: 'manyToMany',
    fromResource: 'dream',
    toResource: 'bot',
    relationField: 'Bots',
  },
  {
    mode: 'manyToMany',
    fromResource: 'character',
    toResource: 'dream',
    relationField: 'Dreams',
  },
  {
    mode: 'manyToMany',
    fromResource: 'dream',
    toResource: 'character',
    relationField: 'Characters',
  },
  {
    mode: 'manyToMany',
    fromResource: 'character',
    toResource: 'reward',
    relationField: 'Rewards',
  },
  {
    mode: 'manyToMany',
    fromResource: 'reward',
    toResource: 'character',
    relationField: 'Characters',
  },
  {
    mode: 'manyToMany',
    fromResource: 'character',
    toResource: 'scenario',
    relationField: 'Scenarios',
  },
  {
    mode: 'manyToMany',
    fromResource: 'scenario',
    toResource: 'character',
    relationField: 'Characters',
  },
  {
    mode: 'manyToMany',
    fromResource: 'dream',
    toResource: 'reward',
    relationField: 'Rewards',
  },
  {
    mode: 'manyToMany',
    fromResource: 'reward',
    toResource: 'dream',
    relationField: 'Dreams',
  },
  {
    mode: 'manyToMany',
    fromResource: 'dream',
    toResource: 'scenario',
    relationField: 'Scenarios',
  },
  {
    mode: 'manyToMany',
    fromResource: 'scenario',
    toResource: 'dream',
    relationField: 'Dreams',
  },
  {
    mode: 'manyToMany',
    fromResource: 'resource',
    toResource: 'server',
    relationField: 'Servers',
  },
  {
    mode: 'manyToMany',
    fromResource: 'server',
    toResource: 'resource',
    relationField: 'Resources',
  },
] satisfies ManyToManyRelationConfig[]

const relationConfigs = [
  ...scalarRelationConfigs,
  ...manyToManyRelationConfigs,
] satisfies RelationConfig[]

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

function getScalarFields(resource: ChatGptResource): Set<string> {
  const { delegate } = getDelegate(resource)
  const fields = new Set(Object.keys(delegate.fields ?? {}))

  if (!fields.size) {
    throw createError({
      statusCode: 500,
      statusMessage: `Prisma scalar field metadata is unavailable for ${resource}`,
    })
  }

  return fields
}

function getRelationConfig({
  fromResource,
  toResource,
}: {
  fromResource: ChatGptResource
  toResource: ChatGptResource
}): RelationConfig {
  const config = relationConfigs.find(
    (candidate) =>
      candidate.fromResource === fromResource &&
      candidate.toResource === toResource,
  )

  if (!config) {
    throw createError({
      statusCode: 400,
      statusMessage: `Relation not supported: ${fromResource} -> ${toResource}`,
    })
  }

  if (config.mode === 'scalar' && !getScalarFields(fromResource).has(config.sourceField)) {
    throw createError({
      statusCode: 500,
      statusMessage: `Configured relation field does not exist: ${fromResource}.${config.sourceField}`,
    })
  }

  return config
}

function buildSafeMinimalSelect(resource: ChatGptResource) {
  const scalarFields = getScalarFields(resource)
  const select: Record<string, boolean> = { id: true }

  for (const field of ['title', 'name', 'slug', 'username', 'label']) {
    if (scalarFields.has(field)) select[field] = true
  }

  return select
}

function buildPermissionSelect(
  resource: ChatGptResource,
  config: CurrentModelConfig,
): Record<string, boolean> {
  const scalarFields = getScalarFields(resource)
  const select: Record<string, boolean> = { id: true }

  for (const field of [config.ownerField, config.publicField, config.activeField]) {
    if (field && scalarFields.has(field)) select[field] = true
  }

  return select
}

async function readPermissionRecord({
  ref,
}: {
  ref: ContentRef
}): Promise<{
  config: CurrentModelConfig
  record: Record<string, unknown>
}> {
  const { config, delegate } = getDelegate(ref.resource)
  const record = await delegate.findUnique({
    where: { id: ref.id },
    select: buildPermissionSelect(ref.resource, config),
  })

  if (!record) {
    throw createError({
      statusCode: 404,
      statusMessage: `${ref.resource} not found`,
    })
  }

  return {
    config,
    record,
  }
}

function assertReadable({
  actor,
  ref,
  config,
  record,
}: {
  actor: ChatGptActor
  ref: ContentRef
  config: CurrentModelConfig
  record: Record<string, unknown>
}) {
  if (isAdminActor(actor)) return

  if (ref.resource === 'user') {
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
    statusMessage: `You cannot read this ${ref.resource}`,
  })
}

function assertWritable({
  actor,
  ref,
  config,
  record,
}: {
  actor: ChatGptActor
  ref: ContentRef
  config: CurrentModelConfig
  record: Record<string, unknown>
}) {
  if (config.adminOnly && !isAdminActor(actor)) {
    throw createError({
      statusCode: 403,
      statusMessage: `Admin access is required to modify ${ref.resource}`,
    })
  }

  if (isAdminActor(actor)) return

  if (ref.resource === 'user' && record.id === actor.userId) return
  if (config.ownerField && record[config.ownerField] === actor.userId) return

  throw createError({
    statusCode: 403,
    statusMessage: `You do not own this ${ref.resource}`,
  })
}

async function assertCanRelate({
  actor,
  from,
  to,
}: {
  actor: ChatGptActor
  from: ContentRef
  to: ContentRef
}) {
  const [fromPermission, toPermission] = await Promise.all([
    readPermissionRecord({ ref: from }),
    readPermissionRecord({ ref: to }),
  ])

  assertWritable({
    actor,
    ref: from,
    config: fromPermission.config,
    record: fromPermission.record,
  })
  assertReadable({
    actor,
    ref: to,
    config: toPermission.config,
    record: toPermission.record,
  })
}

async function assertCanReadRelations({
  actor,
  from,
}: {
  actor: ChatGptActor
  from: ContentRef
}) {
  const permission = await readPermissionRecord({ ref: from })

  assertReadable({
    actor,
    ref: from,
    config: permission.config,
    record: permission.record,
  })
}

async function addScalarRelation({
  from,
  to,
  config,
}: {
  from: ContentRef
  to: ContentRef
  config: ScalarRelationConfig
}) {
  const { delegate } = getDelegate(from.resource)

  return delegate.update({
    where: { id: from.id },
    data: {
      [config.sourceField]: to.id,
    },
    select: buildSafeMinimalSelect(from.resource),
  })
}

async function removeScalarRelation({
  from,
  config,
}: {
  from: ContentRef
  config: ScalarRelationConfig
}) {
  const { delegate } = getDelegate(from.resource)

  return delegate.update({
    where: { id: from.id },
    data: {
      [config.sourceField]: null,
    },
    select: buildSafeMinimalSelect(from.resource),
  })
}

async function addManyToManyRelation({
  from,
  to,
  config,
}: {
  from: ContentRef
  to: ContentRef
  config: ManyToManyRelationConfig
}) {
  const { delegate } = getDelegate(from.resource)

  return delegate.update({
    where: { id: from.id },
    data: {
      [config.relationField]: {
        connect: {
          id: to.id,
        },
      },
    },
    select: buildSafeMinimalSelect(from.resource),
  })
}

async function removeManyToManyRelation({
  from,
  to,
  config,
}: {
  from: ContentRef
  to: ContentRef
  config: ManyToManyRelationConfig
}) {
  const { delegate } = getDelegate(from.resource)

  return delegate.update({
    where: { id: from.id },
    data: {
      [config.relationField]: {
        disconnect: {
          id: to.id,
        },
      },
    },
    select: buildSafeMinimalSelect(from.resource),
  })
}

async function listScalarRelation({
  from,
  config,
}: {
  from: ContentRef
  config: ScalarRelationConfig
}) {
  const { delegate } = getDelegate(from.resource)

  return delegate.findUnique({
    where: { id: from.id },
    select: {
      id: true,
      [config.sourceField]: true,
    },
  })
}

async function listManyToManyRelation({
  from,
  config,
  toResource,
}: {
  from: ContentRef
  config: ManyToManyRelationConfig
  toResource: ChatGptResource
}) {
  const { delegate } = getDelegate(from.resource)

  return delegate.findUnique({
    where: { id: from.id },
    select: {
      id: true,
      [config.relationField]: {
        select: buildSafeMinimalSelect(toResource),
      },
    },
  })
}

export async function addRelation({
  actor,
  from,
  to,
}: {
  actor: ChatGptActor
  from: ContentRef
  to: ContentRef
}): Promise<RelationServiceResponse<Record<string, unknown>>> {
  const config = getRelationConfig({
    fromResource: from.resource,
    toResource: to.resource,
  })

  await assertCanRelate({ actor, from, to })

  const data =
    config.mode === 'scalar'
      ? await addScalarRelation({ from, to, config })
      : await addManyToManyRelation({ from, to, config })

  return {
    success: true,
    operation: 'relation.add',
    data,
    message: `${from.resource} ${from.id} related to ${to.resource} ${to.id}.`,
  }
}

export async function removeRelation({
  actor,
  from,
  to,
}: {
  actor: ChatGptActor
  from: ContentRef
  to: ContentRef
}): Promise<RelationServiceResponse<Record<string, unknown>>> {
  const config = getRelationConfig({
    fromResource: from.resource,
    toResource: to.resource,
  })

  await assertCanRelate({ actor, from, to })

  const data =
    config.mode === 'scalar'
      ? await removeScalarRelation({ from, config })
      : await removeManyToManyRelation({ from, to, config })

  return {
    success: true,
    operation: 'relation.remove',
    data,
    message: `${from.resource} ${from.id} relation to ${to.resource} ${to.id} removed.`,
  }
}

export async function listRelations({
  actor,
  from,
  toResource,
}: {
  actor: ChatGptActor
  from: ContentRef
  toResource?: ChatGptResource
}): Promise<
  RelationServiceResponse<Record<string, unknown> | Record<string, unknown>[]>
> {
  await assertCanReadRelations({ actor, from })

  if (toResource) {
    const config = getRelationConfig({
      fromResource: from.resource,
      toResource,
    })
    const data =
      config.mode === 'scalar'
        ? await listScalarRelation({ from, config })
        : await listManyToManyRelation({ from, config, toResource })

    if (!data) {
      throw createError({
        statusCode: 404,
        statusMessage: `${from.resource} not found`,
      })
    }

    return {
      success: true,
      operation: 'relation.list',
      data,
    }
  }

  const supportedConfigs = relationConfigs.filter(
    (config) => config.fromResource === from.resource,
  )
  const data = await Promise.all(
    supportedConfigs.map(async (config) => ({
      resource: config.toResource,
      relation:
        config.mode === 'scalar'
          ? await listScalarRelation({ from, config })
          : await listManyToManyRelation({
              from,
              config,
              toResource: config.toResource,
            }),
    })),
  )

  return {
    success: true,
    operation: 'relation.list',
    data,
  }
}
