import { defineEventHandler, setHeader } from 'h3'
import { ChatGptResourceSchema } from '~/server/chatgpt/schemas/operationSchemas'

const OPERATION_NAMES = [
  'content.create',
  'content.get',
  'content.list',
  'content.update',
  'content.setActive',
  'image.upload',
  'image.get',
  'relation.add',
  'relation.remove',
  'relation.list',
  'meta.describe',
] as const

const operationDescriptions = {
  'content.create': 'Create a supported Kind Robots record.',
  'content.get': 'Get one supported Kind Robots record by numeric id.',
  'content.list': 'Search or list supported Kind Robots records.',
  'content.update': 'Update editable scalar fields on a supported record.',
  'content.setActive': 'Activate or deactivate a supported record without hard deletion.',
  'image.upload': 'Store supplied image data and optionally connect it to supported records.',
  'image.get': 'Read image metadata, path, or encoded image data.',
  'relation.add': 'Add a supported relation between two records.',
  'relation.remove': 'Remove a supported relation between two records.',
  'relation.list': 'List supported relations from one record.',
  'meta.describe': 'Describe the live machine-content API, actor, fields, filters, and capabilities.',
} satisfies Record<(typeof OPERATION_NAMES)[number], string>

function buildOperationDescription() {
  return OPERATION_NAMES.map(
    (operation) => `- ${operation}: ${operationDescriptions[operation]}`,
  ).join('\n')
}

export default defineEventHandler((event) => {
  setHeader(event, 'cache-control', 'public, max-age=300, s-maxage=300')

  return {
    openapi: '3.1.0',
    info: {
      title: 'Kind Robots Admin Action',
      version: '1.0.0',
      description:
        'Authenticated machine access to live Kind Robots content. Configure the GPT Action with the existing Kind Robots ADMIN_TOKEN as a Bearer API key. Never place that token in prompts or request bodies.',
    },
    servers: [
      {
        url: 'https://kindrobots.org',
        description: 'Kind Robots production',
      },
    ],
    paths: {
      '/api/chatgpt': {
        post: {
          operationId: 'executeKindRobotsOperation',
          summary: 'Execute a Kind Robots machine-content operation',
          description: [
            'Use this action for authenticated reads and deliberate writes against the live Kind Robots database.',
            'The server validates the operation-specific request shape, applies ownership/admin policy, and redacts credentials and private fields from generic responses.',
            'Prefer meta.describe before guessing model fields or filters. Use content.setActive instead of hard deletion.',
            '',
            'Supported operations:',
            buildOperationDescription(),
          ].join('\n'),
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/KindRobotsOperation' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Operation completed.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/KindRobotsResponse' },
                },
              },
            },
            '400': { description: 'Invalid operation or request shape.' },
            '401': { description: 'Missing, invalid, or expired credential.' },
            '403': { description: 'Authenticated actor lacks permission.' },
            '404': { description: 'Requested record was not found.' },
            '409': { description: 'The requested write conflicts with existing data.' },
            '422': { description: 'Request values do not match the live database schema.' },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'Kind Robots ADMIN_TOKEN',
          description:
            'Configure this in the GPT Action authentication UI. Do not send the token as an operation field.',
        },
      },
      schemas: {
        ContentRef: {
          type: 'object',
          additionalProperties: false,
          required: ['resource', 'id'],
          properties: {
            resource: {
              type: 'string',
              enum: ChatGptResourceSchema.options,
            },
            id: { type: 'integer', minimum: 1 },
          },
        },
        KindRobotsOperation: {
          type: 'object',
          additionalProperties: false,
          required: ['operation'],
          description:
            'Operation-specific fields are validated by the server. Call meta.describe to discover current writable fields and supported filters before mutating unfamiliar resources.',
          properties: {
            operation: {
              type: 'string',
              enum: OPERATION_NAMES,
              description: buildOperationDescription(),
            },
            resource: {
              type: 'string',
              enum: ChatGptResourceSchema.options,
              description:
                'Required by content operations and optionally used by relation operations through ContentRef.',
            },
            id: {
              type: 'integer',
              minimum: 1,
              description: 'Record id for content.get, content.update, content.setActive, or image.get.',
            },
            data: {
              type: 'object',
              additionalProperties: true,
              description: 'Create/update fields, or image upload fields for image.upload.',
            },
            filter: {
              type: 'object',
              additionalProperties: true,
              description:
                'content.list filters. Common controls include q, ids, isActive, isPublic, isMature, userId, limit, offset, page, orderBy, and orderDirection.',
            },
            isActive: {
              type: 'boolean',
              description: 'New active state for content.setActive.',
            },
            format: {
              type: 'string',
              enum: ['metadata', 'dataUrl', 'path'],
              description: 'Requested image.get representation.',
            },
            thumbnail: { type: 'boolean' },
            maxWidth: { type: 'integer', minimum: 1 },
            maxHeight: { type: 'integer', minimum: 1 },
            quality: { type: 'integer', minimum: 1, maximum: 100 },
            from: { $ref: '#/components/schemas/ContentRef' },
            to: { $ref: '#/components/schemas/ContentRef' },
            toResource: {
              type: 'string',
              enum: ChatGptResourceSchema.options,
            },
          },
        },
        KindRobotsResponse: {
          type: 'object',
          additionalProperties: true,
          required: ['success', 'operation'],
          properties: {
            success: { type: 'boolean' },
            operation: { type: 'string' },
            resource: { type: 'string' },
            data: {},
            message: { type: 'string' },
            meta: { type: 'object', additionalProperties: true },
          },
        },
      },
    },
  }
})
