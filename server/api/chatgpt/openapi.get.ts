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
        'Semantic action layer for creating Kind Robots content. Generated image assets should be uploaded with imageData so Kind Robots can create durable ArtImage records.',
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
          description:
            'Runs a semantic Kind Robots action. For ChatGPT-generated images, send imageData as raw base64 or a data URL such as data:image/webp;base64,... so the API can create ArtImage and Art records.',
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
                        'asset.uploadImage',
                        'collection.createArtCollection',
                        'world.createContentBundle',
                      ],
                    },
                    input: {
                      type: 'object',
                      additionalProperties: true,
                    },
                  },
                },
                examples: {
                  uploadGeneratedImage: {
                    value: {
                      action: 'asset.uploadImage',
                      input: {
                        label: 'scenario.hero',
                        role: 'scenarioHero',
                        imageData: 'data:image/webp;base64,...',
                        fileName: 'scenario-hero.webp',
                        fileType: 'image/webp',
                        prompt:
                          'bright saturated fantasy dreamhouse hero image, friendly magical architecture',
                        public: true,
                        mature: false,
                      },
                    },
                  },
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
                  createWorldContentBundle: {
                    value: {
                      action: 'world.createContentBundle',
                      input: {
                        title: 'Lantern Dreamhouse Bundle',
                        collection: {
                          name: 'Lantern Dreamhouse',
                          description:
                            'Scenario, characters, rewards, locations, and generated assets.',
                          public: true,
                          mature: false,
                        },
                        assets: [
                          {
                            label: 'scenario.hero',
                            role: 'scenarioHero',
                            imageData: 'data:image/webp;base64,...',
                            fileName: 'scenario-hero.webp',
                            fileType: 'image/webp',
                            prompt:
                              'bright saturated fantasy dreamhouse hero image',
                          },
                          {
                            label: 'character.mira',
                            role: 'characterPortrait',
                            imageData: 'data:image/webp;base64,...',
                            fileName: 'character-mira.webp',
                            fileType: 'image/webp',
                            prompt:
                              'friendly fantasy lantern keeper portrait, saturated colors',
                          },
                          {
                            label: 'dream.lantern.1',
                            role: 'dreamGallery',
                            imageData: 'data:image/webp;base64,...',
                            fileName: 'dream-lantern-1.webp',
                            fileType: 'image/webp',
                            prompt:
                              'glowing fantasy dreamhouse exterior, saturated colors',
                          },
                        ],
                        scenario: {
                          title: 'The Door That Forgot You',
                          description:
                            'A cozy surreal fantasy mystery about a door that no longer recognizes its own house.',
                          imageAsset: 'scenario.hero',
                          starterChoices: [
                            'Open the blinking door',
                            'Ask the moth for credentials',
                            'Follow the lantern smoke',
                            'Inspect the soft staircase',
                          ],
                        },
                        characters: [
                          {
                            name: 'Mira Lanternwick',
                            species: 'Dreamkin',
                            class: 'Lantern Keeper',
                            personality:
                              'Brave, nosy, kind, and dangerously overprepared.',
                            imageAsset: 'character.mira',
                          },
                        ],
                        rewards: [
                          {
                            label: 'Blacklace Key',
                            power:
                              'Unlocks doors that only exist during thunderstorms.',
                            imageAsset: 'reward.blacklace-key',
                          },
                        ],
                        dreams: [
                          {
                            title: 'Lantern Dreamhouse',
                            slug: 'lantern-dreamhouse',
                            description:
                              'A warm glowing location between waking and dreaming.',
                            vibe: 'Bright, friendly, eternal, warm, and playful.',
                            imageAssets: ['dream.lantern.1'],
                          },
                        ],
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
