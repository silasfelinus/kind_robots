// /server/chatgpt/services/schemaRelationService.ts
import { createError } from 'h3'
import { prisma } from '~/server/utils/prisma'
import type { ChatGptActor } from '../auth/resolveActor'
import type { ChatGptResource, ContentRef } from '../schemas/operationSchemas'
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
  sourceField: string
}

type ManyToManyRelationConfig = {
  mode: 'manyToMany'
  relationField: string
}

type RelationConfig = ScalarRelationConfig | ManyToManyRelationConfig

type RelationDefinition = {
  fromResource: ChatGptResource
  toResource: ChatGptResource
  config: RelationConfig
}

const relationDefinitions = [
  [
    'artImage',
    'resource',
    { mode: 'scalar', sourceField: 'checkpointResourceId' },
  ],
  ['artImage', 'server', { mode: 'scalar', sourceField: 'serverId' }],
  ['artImage', 'user', { mode: 'scalar', sourceField: 'userId' }],
  ['artCollection', 'user', { mode: 'scalar', sourceField: 'userId' }],
  ['bot', 'artImage', { mode: 'scalar', sourceField: 'artImageId' }],
  ['bot', 'server', { mode: 'scalar', sourceField: 'serverId' }],
  ['bot', 'user', { mode: 'scalar', sourceField: 'userId' }],
  ['character', 'artImage', { mode: 'scalar', sourceField: 'artImageId' }],
  ['character', 'user', { mode: 'scalar', sourceField: 'userId' }],
  ['chat', 'artImage', { mode: 'scalar', sourceField: 'artImageId' }],
  ['chat', 'bot', { mode: 'scalar', sourceField: 'botId' }],
  ['chat', 'character', { mode: 'scalar', sourceField: 'characterId' }],
  ['chat', 'dream', { mode: 'scalar', sourceField: 'dreamId' }],
  ['chat', 'project', { mode: 'scalar', sourceField: 'projectId' }],
  ['chat', 'prompt', { mode: 'scalar', sourceField: 'promptId' }],
  ['chat', 'server', { mode: 'scalar', sourceField: 'serverId' }],
  ['chat', 'user', { mode: 'scalar', sourceField: 'userId' }],
  [
    'dream',
    'artCollection',
    { mode: 'scalar', sourceField: 'artCollectionId' },
  ],
  ['dream', 'artImage', { mode: 'scalar', sourceField: 'artImageId' }],
  ['dream', 'bot', { mode: 'scalar', sourceField: 'narratorId' }],
  ['dream', 'user', { mode: 'scalar', sourceField: 'userId' }],
  [
    'facet',
    'artCollection',
    { mode: 'scalar', sourceField: 'artCollectionId' },
  ],
  ['facet', 'artImage', { mode: 'scalar', sourceField: 'artImageId' }],
  ['facet', 'user', { mode: 'scalar', sourceField: 'userId' }],
  [
    'project',
    'artCollection',
    { mode: 'scalar', sourceField: 'artCollectionId' },
  ],
  ['project', 'artImage', { mode: 'scalar', sourceField: 'artImageId' }],
  ['project', 'bot', { mode: 'scalar', sourceField: 'managerBotId' }],
  ['project', 'user', { mode: 'scalar', sourceField: 'userId' }],
  ['prompt', 'artImage', { mode: 'scalar', sourceField: 'artImageId' }],
  ['prompt', 'bot', { mode: 'scalar', sourceField: 'botId' }],
  ['prompt', 'server', { mode: 'scalar', sourceField: 'serverId' }],
  ['prompt', 'user', { mode: 'scalar', sourceField: 'userId' }],
  ['resource', 'artImage', { mode: 'scalar', sourceField: 'artImageId' }],
  ['resource', 'user', { mode: 'scalar', sourceField: 'userId' }],
  ['reward', 'artImage', { mode: 'scalar', sourceField: 'artImageId' }],
  ['reward', 'user', { mode: 'scalar', sourceField: 'userId' }],
  ['scenario', 'artImage', { mode: 'scalar', sourceField: 'artImageId' }],
  ['scenario', 'user', { mode: 'scalar', sourceField: 'userId' }],
  ['server', 'user', { mode: 'scalar', sourceField: 'userId' }],
  ['theme', 'user', { mode: 'scalar', sourceField: 'userId' }],
  ['user', 'artImage', { mode: 'scalar', sourceField: 'artImageId' }],
  [
    'artCollection',
    'artImage',
    { mode: 'manyToMany', relationField: 'ArtImages' },
  ],
  [
    'artImage',
    'artCollection',
    { mode: 'manyToMany', relationField: 'ArtCollections' },
  ],
  ['artCollection', 'dream', { mode: 'manyToMany', relationField: 'Dreams' }],
  ['artImage', 'dream', { mode: 'manyToMany', relationField: 'Dreams' }],
  ['bot', 'dream', { mode: 'manyToMany', relationField: 'Dreams' }],
  ['character', 'dream', { mode: 'manyToMany', relationField: 'Dreams' }],
  ['dream', 'character', { mode: 'manyToMany', relationField: 'Characters' }],
  ['character', 'reward', { mode: 'manyToMany', relationField: 'Rewards' }],
  ['reward', 'character', { mode: 'manyToMany', relationField: 'Characters' }],
  ['character', 'scenario', { mode: 'manyToMany', relationField: 'Scenarios' }],
  [
    'scenario',
    'character',
    { mode: 'manyToMany', relationField: 'Characters' },
  ],
  ['dream', 'reward', { mode: 'manyToMany', relationField: 'Rewards' }],
  ['reward', 'dream', { mode: 'manyToMany', relationField: 'Dreams' }],
  ['dream', 'scenario', { mode: 'manyToMany', relationField: 'Scenarios' }],
  ['scenario', 'dream', { mode: 'manyToMany', relationField: 'Dreams' }],
  ['resource', 'server', { mode: 'manyToMany', relationField: 'Servers' }],
  ['server', 'resource', { mode: 'manyToMany', relationField: 'Resources' }],
] as const satisfies readonly (readonly [
  ChatGptResource,
  ChatGptResource,
  RelationConfig,
])[]

const relationMap = new Map<string, RelationDefinition>(
  relationDefinitions.map(([fromResource, toResource, config]) => [
    `${fromResource}:${toResource}`,
    {
      fromResource,
      toResource,
      config,
    },
  ]),
)

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

function getRelationDefinition({
  fromResource,
  toResource,
}: {
  fromResource: ChatGptResource
  toResource: ChatGptResource
}): RelationDefinition {
  const definition = relationMap.get(`${fromResource}:${toResource}`)

  if (!definition) {
    throw createError({
      statusCode: 400,
      statusMessage: `Relation not supported: ${fromResource} -> ${toResource}`,
    })
  }

  if (
    definition.config.mode === 'scalar' &&
    !getScalarFields(fromResource).has(definition.config.sourceField)
  ) {
    throw createError({
      statusCode: 500,
      statusMessage: `Configured relation field does not exist: ${fromResource}.${definition.config.sourceField}`,
    })
  }

  return definition
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

  for (const field of [
    config.ownerField,
    config.publicField,
    config.activeField,
  ]) {
    if (field && scalarFields.has(field)) select[field] = true
  }

  return select
}

async function readPermissionRecord(ref: ContentRef): Promise<{
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
    readPermissionRecord(from),
    readPermissionRecord(to),
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
  const permission = await readPermissionRecord(from)

  assertReadable({
    actor,
    ref: from,
    config: permission.config,
    record: permission.record,
  })
}

async function mutateRelation({
  from,
  to,
  definition,
  action,
}: {
  from: ContentRef
  to: ContentRef
  definition: RelationDefinition
  action: 'add' | 'remove'
}) {
  const { delegate } = getDelegate(from.resource)
  const config = definition.config
  const data =
    config.mode === 'scalar'
      ? {
          [config.sourceField]: action === 'add' ? to.id : null,
        }
      : {
          [config.relationField]: {
            [action === 'add' ? 'connect' : 'disconnect']: {
              id: to.id,
            },
          },
        }

  return delegate.update({
    where: { id: from.id },
    data,
    select: buildSafeMinimalSelect(from.resource),
  })
}

async function readRelation({
  from,
  definition,
}: {
  from: ContentRef
  definition: RelationDefinition
}) {
  const { delegate } = getDelegate(from.resource)
  const config = definition.config

  return delegate.findUnique({
    where: { id: from.id },
    select:
      config.mode === 'scalar'
        ? {
            id: true,
            [config.sourceField]: true,
          }
        : {
            id: true,
            [config.relationField]: {
              select: buildSafeMinimalSelect(definition.toResource),
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
  const definition = getRelationDefinition({
    fromResource: from.resource,
    toResource: to.resource,
  })

  await assertCanRelate({ actor, from, to })
  const data = await mutateRelation({
    from,
    to,
    definition,
    action: 'add',
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
  const definition = getRelationDefinition({
    fromResource: from.resource,
    toResource: to.resource,
  })

  await assertCanRelate({ actor, from, to })
  const data = await mutateRelation({
    from,
    to,
    definition,
    action: 'remove',
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
  await assertCanReadRelations({ actor, from })

  if (toResource) {
    const definition = getRelationDefinition({
      fromResource: from.resource,
      toResource,
    })
    const data = await readRelation({ from, definition })

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

  const definitions = [...relationMap.values()].filter(
    (definition) => definition.fromResource === from.resource,
  )
  const data = await Promise.all(
    definitions.map(async (definition) => ({
      resource: definition.toResource,
      relation: await readRelation({ from, definition }),
    })),
  )

  return {
    success: true,
    operation: 'relation.list',
    data,
  }
}
