// /server/chatgpt/services/currentMetaService.ts
import { prisma } from '~/server/utils/prisma'
import type { ChatGptActor } from '../auth/resolveActor'
import {
  CURRENT_MODEL_REGISTRY,
  type CurrentModelConfig,
} from '../registry/currentModels'
import { ChatGptImageFormatSchema } from '../schemas/operationSchemas'

type PrismaDelegate = {
  fields?: Record<string, unknown>
}

const PROTECTED_FIELDS = new Set(['id', 'createdAt', 'updatedAt'])

function getResourceDescription(
  resource: string,
  rawConfig: CurrentModelConfig,
) {
  const delegate = (
    prisma as unknown as Record<string, PrismaDelegate | undefined>
  )[rawConfig.prisma]
  const hiddenFields = new Set([
    ...(rawConfig.hiddenFields ?? []),
    ...(rawConfig.listHiddenFields ?? []),
  ])
  const scalarFields = Object.keys(delegate?.fields ?? {}).sort()
  const readableFields = scalarFields.filter((field) => !hiddenFields.has(field))
  const writableFields = scalarFields.filter(
    (field) => !hiddenFields.has(field) && !PROTECTED_FIELDS.has(field),
  )

  return {
    resource,
    prismaModel: rawConfig.prisma,
    ownerField: rawConfig.ownerField,
    activeField: rawConfig.activeField,
    publicField: rawConfig.publicField,
    adminOnly: rawConfig.adminOnly ?? false,
    readableFields,
    writableFields,
    searchableFields: rawConfig.searchableFields ?? [],
    filterFields: rawConfig.filterFields ?? [],
    defaultOrderBy: rawConfig.defaultOrderBy,
  }
}

export function describeChatGptApi({
  actor,
}: {
  actor: ChatGptActor
}) {
  const resourceDescriptions = Object.entries(CURRENT_MODEL_REGISTRY)
    .map(([resource, config]) =>
      getResourceDescription(resource, config as CurrentModelConfig),
    )
    .sort((a, b) => a.resource.localeCompare(b.resource))

  return {
    success: true as const,
    operation: 'meta.describe' as const,
    data: {
      name: 'Kind Robots Machine Content API',
      version: '2.0.0',
      description:
        'A runtime content API for authenticated tools, agents, scripts, and app integrations to work with the live Kind Robots database.',
      actor: {
        userId: actor.userId,
        username: actor.username,
        role: actor.role,
        source: actor.source,
      },
      architecture: {
        github:
          'GitHub access manages source code, branches, commits, pull requests, and deployment inputs.',
        runtimeApi:
          'This endpoint manages live application records and remains useful even when the caller can edit the repository.',
        schemaStrategy:
          'Scalar field discovery comes from the generated Prisma client at runtime. The registry only stores policy, search, filtering, ordering, and redaction rules.',
      },
      authentication: {
        mode: 'machine-user',
        acceptedCredentials: ['session JWT', 'user API key', 'beta admin token'],
        ownership:
          'Created records belong to the authenticated user unless an admin explicitly supplies another supported owner id.',
      },
      operations: {
        content: [
          'content.create',
          'content.get',
          'content.list',
          'content.update',
          'content.setActive',
        ],
        image: ['image.upload', 'image.get'],
        relation: ['relation.add', 'relation.remove', 'relation.list'],
        meta: ['meta.describe'],
      },
      imageFormats: ChatGptImageFormatSchema.options,
      resources: resourceDescriptions,
      defaults: {
        isPublic: true,
        isMature: false,
        isActive: true,
        listLimit: 20,
        maxListLimit: 100,
      },
      requestExamples: {
        createProject: {
          operation: 'content.create',
          resource: 'project',
          data: {
            title: 'Example Project',
            description: 'A project created through the machine content API.',
            status: 'BRAINSTORM',
            priority: 'NORMAL',
          },
        },
        listDreams: {
          operation: 'content.list',
          resource: 'dream',
          filter: {
            q: 'space bar',
            isActive: true,
            limit: 20,
            orderBy: 'updatedAt',
            orderDirection: 'desc',
          },
        },
        updateFacet: {
          operation: 'content.update',
          resource: 'facet',
          id: 1,
          data: {
            description: 'Updated reusable creative direction.',
          },
        },
        connectCharacterToDream: {
          operation: 'relation.add',
          from: {
            resource: 'character',
            id: 1,
          },
          to: {
            resource: 'dream',
            id: 2,
          },
        },
        deactivateRecord: {
          operation: 'content.setActive',
          resource: 'project',
          id: 1,
          isActive: false,
        },
        describeApi: {
          operation: 'meta.describe',
        },
      },
      notes: [
        'All create and update fields belong inside the top-level data object.',
        'Unknown scalar fields are rejected before Prisma is called.',
        'Use content.setActive instead of hard deletion.',
        'Generic content responses redact image blobs, credentials, authentication secrets, and private user fields.',
        'Image upload stores supplied image data; it does not generate images.',
      ],
    },
  }
}
