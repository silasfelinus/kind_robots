// /server/api/chatgpt/openapi.get.ts
import { defineEventHandler, setHeader } from 'h3'
import { ACTION_NAMES } from './utils/contracts'

export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'application/json')

  return {
    openapi: '3.1.0',
    info: {
      title: 'Kind Robots Actions',
      version: '2.1.2',
      description:
        'Create and manage Kind Robots content through a semantic action endpoint.',
    },
    servers: [
      {
        url: process.env.APP_URL || 'https://kind-robots.vercel.app',
      },
    ],
    paths: {
      '/api/chatgpt': {
        post: {
          operationId: 'runKindRobotsAction',
          summary: 'Run a Kind Robots action',
          description:
            'Runs a semantic action for Kind Robots. Use imageData for generated image uploads.',
          security: [
            {
              kindRobotsUserToken: [],
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/KindRobotsActionRequest',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Action result',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/KindRobotsActionResponse',
                  },
                },
              },
            },
            '400': {
              description: 'Invalid action or input',
            },
            '401': {
              description: 'Missing or invalid authentication',
            },
            '403': {
              description: 'Forbidden',
            },
            '500': {
              description: 'Server error',
            },
          },
        },
      },
    },
    components: {
      schemas: {
        KindRobotsActionRequest: {
          type: 'object',
          required: ['action', 'input'],
          properties: {
            action: {
              type: 'string',
              description: 'The Kind Robots action to run.',
              enum: ACTION_NAMES,
            },
            input: {
              type: 'object',
              description:
                'Action-specific input. For generated images, include imageData as raw base64 or a data URL.',
              properties: {},
              additionalProperties: true,
            },
          },
        },
        KindRobotsActionResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            action: {
              type: 'string',
            },
            data: {
              type: 'object',
              properties: {},
              additionalProperties: true,
            },
            message: {
              type: 'string',
            },
            statusCode: {
              type: 'number',
            },
          },
        },
      },
      securitySchemes: {
        kindRobotsUserToken: {
          type: 'apiKey',
          in: 'header',
          name: 'x-kindrobots-user-token',
        },
      },
    },
  }
})
