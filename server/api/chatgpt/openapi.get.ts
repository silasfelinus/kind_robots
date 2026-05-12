// /server/api/chatgpt/openapi.get.ts
import { defineEventHandler, setHeader } from 'h3'

export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'application/json')

  return {
    openapi: '3.1.0',
    info: {
      title: 'Kind Robots ChatGPT Actions',
      version: '2.0.0',
      description:
        'Semantic action layer for creating and reading Kind Robots content.',
    },
    servers: [
      {
        url:
          process.env.PUBLIC_BASE_URL ||
          process.env.NUXT_PUBLIC_SITE_URL ||
          'https://kindrobots.org',
      },
    ],
    paths: {
      '/api/chatgpt': {
        post: {
          operationId: 'runKindRobotsAction',
          summary: 'Run a Kind Robots semantic action',
          security: [
            {
              bearerAuth: [],
            },
            {
              apiKeyAuth: [],
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['action', 'input'],
                  properties: {
                    action: {
                      type: 'string',
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
                      ],
                    },
                    input: {
                      type: 'object',
                      additionalProperties: true,
                    },
                  },
                },
                examples: {
                  createDreamLocation: {
                    value: {
                      action: 'dream.createLocation',
                      input: {
                        title: 'Lantern Dreamhouse',
                        slug: 'lantern-dreamhouse',
                        description:
                          'A cozy glowing home between waking and dreaming.',
                        vibe: 'Warm, friendly, magical, and a little impossible.',
                        imagePrompt:
                          'bright saturated fantasy dreamhouse, glowing lanterns, cozy magical architecture',
                        public: true,
                      },
                    },
                  },
                  listPublicDreams: {
                    value: {
                      action: 'dream.listPublic',
                      input: {
                        take: 12,
                      },
                    },
                  },
                  createArtPrompt: {
                    value: {
                      action: 'art.createPrompt',
                      input: {
                        prompt:
                          'rainbow butterfly sanctuary, bright saturated colors, friendly fantasy architecture',
                        negativePrompt: 'muddy colors, harsh realism',
                        public: true,
                      },
                    },
                  },
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
                        additionalProperties: true,
                      },
                    },
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
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
        },
      },
    },
  }
})