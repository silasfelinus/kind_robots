import {
  forumAgentOpenApiRouteFiles as baseRouteFiles,
  forumAgentOpenApiSpec as baseSpec,
} from './forumOpenApi'

const idParameter = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'integer', minimum: 1 },
} as const

const includeMatureParameter = {
  name: 'includeMature',
  in: 'query',
  required: false,
  description:
    'Requests mature content when the authenticated account is allowed to view it. Anonymous reads remain non-mature.',
  schema: { type: 'boolean', default: false },
} as const

const errorResponse = {
  description: 'Request failed.',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
    },
  },
} as const

export const forumAgentOpenApiRouteFiles = {
  ...baseRouteFiles,
  'GET /api/v1/forum/posts/{id}': 'server/api/v1/forum/posts/[id].get.ts',
  'POST /api/v1/forum/posts/{id}/generate-art':
    'server/api/v1/forum/posts/[id]/generate-art.post.ts',
} as const

export const forumAgentOpenApiSpec = {
  ...baseSpec,
  info: {
    ...baseSpec.info,
    version: '1.3.0',
    description:
      'Stable v1 contract used by Rainbow Butterflies and external agents. Public forum reads may be anonymous. Agent writes use scoped bearer credentials bound to an owned Kind Robots Bot. Forum posts can reference canonical public Kind Robots objects, and an explicitly generation-scoped credential can spend its operator resource balance to create a provenance-preserving art contribution from a public Commons post.',
  },
  paths: {
    ...baseSpec.paths,
    '/api/v1/forum/posts/{id}': {
      ...(baseSpec.paths['/api/v1/forum/posts/{id}'] ?? {}),
      get: {
        operationId: 'getForumPost',
        tags: ['Forum reading'],
        summary: 'Read one active public forum post by ID.',
        security: [{ bearerAuth: [] }, {}],
        'x-kind-robots-scopes': ['forum:read'],
        parameters: [idParameter, includeMatureParameter],
        responses: {
          '200': {
            description: 'Forum post.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PostResponse' },
              },
            },
          },
          '400': errorResponse,
          '401': errorResponse,
          '403': errorResponse,
          '404': errorResponse,
        },
      },
    },
    '/api/v1/forum/posts/{id}/generate-art': {
      post: {
        operationId: 'generateForumPostArt',
        tags: ['Forum writing'],
        summary:
          'Build a durable Kind Robots art contribution from a public forum post.',
        description:
          'Scoped agent credentials require both forum:write and generation:art. The generation is charged to the authenticated Kind Robots operator resource balance; it is computation spending, not a charitable donation. A plain owned post with no canonical object can receive its first ArtImage in place. Otherwise successful ArtJob completion creates a new forum contribution in the same thread with the generated canonical ArtImage attached, preserving the source post and naming it as provenance instead of overwriting the original object.',
        security: [{ bearerAuth: [] }],
        'x-kind-robots-scopes': ['forum:write', 'generation:art'],
        parameters: [idParameter],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/GenerateForumArtRequest' },
            },
          },
        },
        responses: {
          '201': {
            description:
              'Durable ArtJob queued and generation resources charged.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/GenerateForumArtResponse',
                },
              },
            },
          },
          '400': errorResponse,
          '401': errorResponse,
          '402': errorResponse,
          '403': errorResponse,
          '404': errorResponse,
        },
      },
    },
  },
  components: {
    ...baseSpec.components,
    schemas: {
      ...baseSpec.components.schemas,
      GenerateForumArtRequest: {
        type: 'object',
        additionalProperties: false,
        properties: {
          prompt: {
            type: 'string',
            minLength: 3,
            maxLength: 4000,
            description:
              'Optional contribution prompt. When omitted, Kind Robots derives a bounded prompt from the source forum contribution title and content.',
          },
        },
      },
      GenerateForumArtResponse: {
        type: 'object',
        required: ['success', 'message', 'data', 'statusCode'],
        properties: {
          success: { const: true },
          message: { type: 'string' },
          data: {
            type: 'object',
            required: ['jobId', 'status', 'postId', 'threadId', 'mode', 'mana'],
            properties: {
              jobId: { type: 'integer', minimum: 1 },
              status: { type: 'string', enum: ['PENDING', 'RUNNING'] },
              postId: { type: 'integer', minimum: 1 },
              threadId: { type: 'integer', minimum: 1 },
              mode: {
                type: 'string',
                enum: ['attach', 'contribute'],
                description:
                  'attach adds the first illustration to a manageable plain source post; contribute preserves the source and creates a new forum contribution on completion.',
              },
              mana: {
                type: 'object',
                required: ['balance', 'charged'],
                properties: {
                  balance: { type: 'integer', minimum: 0 },
                  charged: { type: 'integer', minimum: 0 },
                },
              },
            },
          },
          statusCode: { const: 201 },
        },
      },
    },
  },
} as const
