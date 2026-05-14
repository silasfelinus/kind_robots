// /server/chatgpt/services/relationService.ts
import { createError } from 'h3'
import { prisma } from '~/server/utils/prisma'
import type { ChatGptActor } from '../auth/resolveActor'
import type { ChatGptResource, ContentRef } from '../schemas/operationSchemas'

const CURRENT_ADMIN_USER_ID = 1

type RelationOperation = 'relation.add' | 'relation.remove' | 'relation.list'

type RelationServiceResponse<TData = unknown> = {
  success: true
  operation: RelationOperation
  data: TData
  message?: string
}

type PrismaDelegate = {
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

const resourceDelegateMap = {
  artImage: 'artImage',
  artCollection: 'artCollection',
  bot: 'bot',
  character: 'character',
  chat: 'chat',
  dream: 'dream',
  pitch: 'pitch',
  prompt: 'prompt',
  resource: 'resource',
  reward: 'reward',
  scenario: 'scenario',
  server: 'server',
  tag: 'tag',
  theme: 'theme',
  user: 'user',
} satisfies Record<ChatGptResource, string>

const ownerFieldByResource = {
  artImage: 'userId',
  artCollection: 'userId',
  bot: 'userId',
  character: 'userId',
  chat: 'userId',
  dream: 'userId',
  pitch: 'userId',
  prompt: 'userId',
  resource: 'userId',
  reward: 'userId',
  scenario: 'userId',
  server: 'userId',
  tag: 'userId',
  theme: 'userId',
  user: 'id',
} satisfies Record<ChatGptResource, string>

const activeFieldByResource = {
  artImage: 'isActive',
  artCollection: 'isActive',
  bot: 'isActive',
  character: 'isActive',
  chat: 'isActive',
  dream: 'isActive',
  pitch: 'isActive',
  prompt: 'isActive',
  resource: 'isActive',
  reward: 'isActive',
  scenario: 'isActive',
  server: 'isActive',
  tag: 'isActive',
  theme: 'isActive',
  user: 'isActive',
} satisfies Record<ChatGptResource, string>

const publicFieldByResource = {
  artImage: 'isPublic',
  artCollection: 'isPublic',
  bot: 'isPublic',
  character: 'isPublic',
  chat: 'isPublic',
  dream: 'isPublic',
  pitch: 'isPublic',
  prompt: 'isPublic',
  resource: 'isPublic',
  reward: 'isPublic',
  scenario: 'isPublic',
  server: 'isPublic',
  tag: 'isPublic',
  theme: 'isPublic',
  user: 'isPublic',
} satisfies Record<ChatGptResource, string>

const scalarRelationConfigs = [
  {
    mode: 'scalar',
    fromResource: 'artImage',
    toResource: 'artCollection',
    sourceField: 'galleryId',
  },
  {
    mode: 'scalar',
    fromResource: 'artImage',
    toResource: 'bot',
    sourceField: 'botId',
  },
  {
    mode: 'scalar',
    fromResource: 'artImage',
    toResource: 'character',
    sourceField: 'characterId',
  },
  {
    mode: 'scalar',
    fromResource: 'artImage',
    toResource: 'chat',
    sourceField: 'chatId',
  },
  {
    mode: 'scalar',
    fromResource: 'artImage',
    toResource: 'pitch',
    sourceField: 'pitchId',
  },
  {
    mode: 'scalar',
    fromResource: 'artImage',
    toResource: 'prompt',
    sourceField: 'promptId',
  },
  {
    mode: 'scalar',
    fromResource: 'artImage',
    toResource: 'resource',
    sourceField: 'resourceId',
  },
  {
    mode: 'scalar',
    fromResource: 'artImage',
    toResource: 'reward',
    sourceField: 'rewardId',
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
    toResource: 'pitch',
    sourceField: 'pitchId',
  },
  {
    mode: 'scalar',
    fromResource: 'dream',
    toResource: 'scenario',
    sourceField: 'scenarioId',
  },
  {
    mode: 'scalar',
    fromResource: 'dream',
    toResource: 'server',
    sourceField: 'artServerId',
  },
  {
    mode: 'scalar',
    fromResource: 'dream',
    toResource: 'user',
    sourceField: 'userId',
  },
  {
    mode: 'scalar',
    fromResource: 'pitch',
    toResource: 'artImage',
    sourceField: 'artImageId',
  },
  {
    mode: 'scalar',
    fromResource: 'pitch',
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
    toResource: 'pitch',
    sourceField: 'pitchId',
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
    fromResource: 'tag',
    toResource: 'artImage',
    sourceField: 'artImageId',
  },
  {
    mode: 'scalar',
    fromResource: 'tag',
    toResource: 'user',
    sourceField: 'userId',
  },
  {
    mode: 'scalar',
    fromResource: 'theme',
    toResource: 'user',
    sourceField: 'userId',
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
    fromResource: 'artImage',
    toResource: 'tag',
    relationField: 'Tags',
  },
  {
    mode: 'manyToMany',
    fromResource: 'character',
    toResource: 'dream',
    relationField: 'Dreams',
  },
  {
    mode: 'manyToMany',
    fromResource: 'character',
    toResource: 'reward',
    relationField: 'Rewards',
  },
  {
    mode: 'manyToMany',
    fromResource: 'character',
    toResource: 'scenario',
    relationField: 'Scenarios',
  },
  {
    mode: 'manyToMany',
    fromResource: 'dream',
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
    fromResource: 'dream',
    toResource: 'tag',
    relationField: 'Tags',
  },
  {
    mode: 'manyToMany',
    fromResource: 'pitch',
    toResource: 'tag',
    relationField: 'Tags',
  },
  {
    mode: 'manyToMany',
    fromResource: 'reward',
    toResource: 'character',
    relationField: 'Characters',
  },
  {
    mode: 'manyToMany',
    fromResource: 'reward',
    toResource: 'dream',
    relationField: 'Dreams',
  },
  {
    mode: 'manyToMany',
    fromResource: 'scenario',
    toResource: 'character',
    relationField: 'Characters',
  },
  {
    mode: 'manyToMany',
    fromResource: 'tag',
    toResource: 'artImage',
    relationField: 'ArtImages',
  },
  {
    mode: 'manyToMany',
    fromResource: 'tag',
    toResource: 'dream',
    relationField: 'Dreams',
  },
  {
    mode: 'manyToMany',
    fromResource: 'tag',
    toResource: 'pitch',
    relationField: 'Pitches',
  },
] satisfies ManyToManyRelationConfig[]

const relationConfigs = [
  ...scalarRelationConfigs,
  ...manyToManyRelationConfigs,
] satisfies RelationConfig[]

function getActorUserId(actor: ChatGptActor): number {
  return actor.userId || CURRENT_ADMIN_USER_ID
}

function isAdminActor(actor: ChatGptActor): boolean {
  return actor.role === 'admin' || actor.userId === CURRENT_ADMIN_USER_ID
}

function getDelegate(resource: ChatGptResource): PrismaDelegate {
  const delegateName = resourceDelegateMap[resource]
  const delegate = (
    prisma as unknown as Record<string, PrismaDelegate | undefined>
  )[delegateName]

  if (!delegate) {
    throw createError({
      statusCode: 500,
      statusMessage: `Prisma delegate not found for ${resource}: ${delegateName}`,
    })
  }

  return delegate
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
      statusMessage: `Relation not supported: ${fromResource} to ${toResource}`,
    })
  }

  return config
}

function buildRecordSelect(resource: ChatGptResource): Record<string, boolean> {
  return {
    id: true,
    [ownerFieldByResource[resource]]: true,
    [activeFieldByResource[resource]]: true,
    [publicFieldByResource[resource]]: true,
  }
}

function buildSafeMinimalSelect(
  resource: ChatGptResource,
): Record<string, boolean> {
  return {
    id: true,
    [activeFieldByResource[resource]]: true,
    [publicFieldByResource[resource]]: true,
  }
}

async function readRecord({
  resource,
  id,
}: ContentRef): Promise<Record<string, unknown>> {
  const delegate = getDelegate(resource)

  const record = await delegate.findUnique({
    where: { id },
    select: buildRecordSelect(resource),
  })

  if (!record) {
    throw createError({
      statusCode: 404,
      statusMessage: `${resource} not found`,
    })
  }

  return record
}

function assertReadableRecord({
  actor,
  resource,
  record,
}: {
  actor: ChatGptActor
  resource: ChatGptResource
  record: Record<string, unknown>
}) {
  if (isAdminActor(actor)) return

  const ownerField = ownerFieldByResource[resource]
  const publicField = publicFieldByResource[resource]

  if (record[ownerField] === getActorUserId(actor)) return
  if (record[publicField] === true) return

  throw createError({
    statusCode: 403,
    statusMessage: `You cannot read this ${resource}`,
  })
}

function assertWritableRecord({
  actor,
  resource,
  record,
}: {
  actor: ChatGptActor
  resource: ChatGptResource
  record: Record<string, unknown>
}) {
  if (isAdminActor(actor)) return

  const ownerField = ownerFieldByResource[resource]

  if (record[ownerField] === getActorUserId(actor)) return

  throw createError({
    statusCode: 403,
    statusMessage: `You cannot modify this ${resource}`,
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
  const [fromRecord, toRecord] = await Promise.all([
    readRecord(from),
    readRecord(to),
  ])

  assertWritableRecord({
    actor,
    resource: from.resource,
    record: fromRecord,
  })

  assertReadableRecord({
    actor,
    resource: to.resource,
    record: toRecord,
  })
}

async function assertCanReadRelations({
  actor,
  from,
}: {
  actor: ChatGptActor
  from: ContentRef
}) {
  const record = await readRecord(from)

  assertReadableRecord({
    actor,
    resource: from.resource,
    record,
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
  const delegate = getDelegate(from.resource)

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
  const delegate = getDelegate(from.resource)

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
  const delegate = getDelegate(from.resource)

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
  const delegate = getDelegate(from.resource)

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
  const delegate = getDelegate(from.resource)

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
  const delegate = getDelegate(from.resource)

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

  await assertCanRelate({
    actor,
    from,
    to,
  })

  const data =
    config.mode === 'scalar'
      ? await addScalarRelation({
          from,
          to,
          config,
        })
      : await addManyToManyRelation({
          from,
          to,
          config,
        })

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

  await assertCanRelate({
    actor,
    from,
    to,
  })

  const data =
    config.mode === 'scalar'
      ? await removeScalarRelation({
          from,
          config,
        })
      : await removeManyToManyRelation({
          from,
          to,
          config,
        })

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
  await assertCanReadRelations({
    actor,
    from,
  })

  if (toResource) {
    const config = getRelationConfig({
      fromResource: from.resource,
      toResource,
    })

    const data =
      config.mode === 'scalar'
        ? await listScalarRelation({
            from,
            config,
          })
        : await listManyToManyRelation({
            from,
            config,
            toResource,
          })

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
    supportedConfigs.map(async (config) => {
      const relation =
        config.mode === 'scalar'
          ? await listScalarRelation({
              from,
              config,
            })
          : await listManyToManyRelation({
              from,
              config,
              toResource: config.toResource,
            })

      return {
        resource: config.toResource,
        relation,
      }
    }),
  )

  return {
    success: true,
    operation: 'relation.list',
    data,
  }
}
