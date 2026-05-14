// /server/chatgpt/services/metaService.ts
import type { ChatGptActor } from '../auth/resolveActor'
import {
  ChatGptImageFormatSchema,
  ChatGptResourceSchema,
} from '../schemas/operationSchemas'
import { CHATGPT_MODEL_REGISTRY } from '../registry/models'

type MetaDescribeResponse = {
  success: true
  operation: 'meta.describe'
  data: {
    name: string
    version: string
    description: string
    actor: {
      userId: number
      username: string
      role: ChatGptActor['role']
      source: ChatGptActor['source']
    }
    philosophy: {
      apiType: string
      does: string[]
      doesNot: string[]
    }
    authentication: {
      mode: string
      currentUserId: number
      notes: string[]
    }
    operations: {
      content: string[]
      image: string[]
      relation: string[]
      meta: string[]
    }
    resources: string[]
    implementedResources: string[]
    imageFormats: string[]
    defaults: {
      userId: number
      isPublic: boolean
      isMature: boolean
      isActive: boolean
      listLimit: number
      maxListLimit: number
    }
    requestShapes: Record<string, unknown>
    responseShape: {
      success: true
      operation: string
      data: unknown
      message?: string
      meta?: unknown
    }
    notes: string[]
  }
}

export function describeChatGptApi({
  actor,
}: {
  actor: ChatGptActor
}): MetaDescribeResponse {
  const resources = ChatGptResourceSchema.options
  const implementedResources = Object.keys(CHATGPT_MODEL_REGISTRY).sort()
  const imageFormats = ChatGptImageFormatSchema.options

  return {
    success: true,
    operation: 'meta.describe',
    data: {
      name: 'Kind Robots Content API',
      version: '1.0.0',
      description:
        'A content management API for creating, reading, listing, updating, deactivating, uploading, retrieving, and relating Kind Robots records.',
      actor: {
        userId: actor.userId,
        username: actor.username,
        role: actor.role,
        source: actor.source,
      },
      philosophy: {
        apiType: 'content-management',
        does: [
          'create content records',
          'read content records',
          'list and search content records',
          'update content records',
          'deactivate and restore records with isActive',
          'upload image data',
          'retrieve image metadata, paths, or data URLs',
          'relate existing records',
        ],
        doesNot: [
          'generate text',
          'generate images',
          'call ChatGPT',
          'run agents',
          'trigger ComfyUI',
          'orchestrate external generators',
          'hard delete records',
        ],
      },
      authentication: {
        mode: 'single-admin-user',
        currentUserId: 1,
        notes: [
          'The request auth token resolves to the current admin actor.',
          'Created records belong to userId 1.',
          'Auth resolution is centralized so multi-user support can be added later.',
        ],
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
      resources,
      implementedResources,
      imageFormats,
      defaults: {
        userId: 1,
        isPublic: true,
        isMature: false,
        isActive: true,
        listLimit: 20,
        maxListLimit: 100,
      },
      requestShapes: {
        contentCreate: {
          operation: 'content.create',
          resource: 'character',
          data: {
            name: 'Example Character',
            species: 'Human',
            class: 'Archivist',
            personality:
              'Curious, warm, and unsettlingly good at filing haunted paperwork.',
            isPublic: true,
            isMature: false,
            isActive: true,
          },
        },
        contentGet: {
          operation: 'content.get',
          resource: 'character',
          id: 1,
        },
        contentList: {
          operation: 'content.list',
          resource: 'character',
          filter: {
            isActive: true,
            limit: 20,
            offset: 0,
            q: 'archivist',
          },
        },
        contentUpdate: {
          operation: 'content.update',
          resource: 'character',
          id: 1,
          data: {
            personality: 'Updated personality text.',
          },
        },
        contentSetActive: {
          operation: 'content.setActive',
          resource: 'character',
          id: 1,
          isActive: false,
        },
        imageUpload: {
          operation: 'image.upload',
          data: {
            imageData: 'data:image/png;base64,...',
            fileName: 'example.png',
            fileType: 'png',
            promptString:
              'A velvet-jacketed temporal bartender in a cross-time space bar.',
            designer: 'Silas',
            tags: ['space bar', 'character portrait'],
            connectTo: [
              {
                resource: 'character',
                id: 1,
              },
            ],
            isPublic: true,
            isMature: false,
            isActive: true,
          },
        },
        imageGetMetadata: {
          operation: 'image.get',
          id: 1,
          format: 'metadata',
        },
        imageGetPath: {
          operation: 'image.get',
          id: 1,
          format: 'path',
        },
        imageGetDataUrl: {
          operation: 'image.get',
          id: 1,
          format: 'dataUrl',
        },
        relationAdd: {
          operation: 'relation.add',
          from: {
            resource: 'character',
            id: 1,
          },
          to: {
            resource: 'tag',
            id: 2,
          },
        },
        relationRemove: {
          operation: 'relation.remove',
          from: {
            resource: 'character',
            id: 1,
          },
          to: {
            resource: 'tag',
            id: 2,
          },
        },
        relationList: {
          operation: 'relation.list',
          from: {
            resource: 'character',
            id: 1,
          },
          toResource: 'tag',
        },
        metaDescribe: {
          operation: 'meta.describe',
        },
      },
      responseShape: {
        success: true,
        operation: 'content.create',
        data: {},
        message: 'Optional human-readable status message.',
        meta: {
          limit: 20,
          offset: 0,
          count: 1,
        },
      },
      notes: [
        'All fields for content.create and content.update must be inside the top-level data object.',
        'Records are never hard-deleted. Use content.setActive with isActive false to deactivate.',
        'Use content.setActive with isActive true to restore a deactivated record.',
        'Image upload stores existing image data only. It does not generate images.',
        'This API intentionally has no generator operations.',
      ],
    },
  }
}
