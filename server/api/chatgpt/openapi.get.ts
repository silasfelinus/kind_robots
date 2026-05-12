// /server/api/chatgpt/openapi.get.ts
import { defineEventHandler, setHeader } from 'h3'

export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'application/json')

  return {
    openapi: '3.1.0',
    info: {
      title: 'Kind Robots Actions',
      version: '2.1.0',
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
              bearerAuth: [],
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
              enum: [
                'dream.createLocation',
                'dream.listPublic',
                'dream.getPublic',
                'dream.updateMine',
                'dream.deleteMine',
                'art.createPrompt',
                'art.listPublic',
                'art.getPublic',
                'character.create',
                'character.listPublic',
                'scenario.create',
                'scenario.listPublic',
                'gallery.listPublic',
                'bot.create',
                'bot.listPublic',
                'asset.uploadImage',
                'collection.createArtCollection',
                'world.createContentBundle',
              ],
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
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
        },
      },
    },
  }
})
