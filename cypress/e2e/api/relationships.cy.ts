// /cypress/e2e/api/relationships.cy.ts
/* eslint-disable @typescript-eslint/no-unused-expressions */

/// <reference types="cypress" />

type ApiResponse<T = any> = {
  success: boolean
  message?: string
  data?: T
  statusCode?: number
}

type CreatedRegistry = Record<string, number[]>

type EndpointKey =
  | 'artImage'
  | 'artCollection'
  | 'bot'
  | 'butterfly'
  | 'butterflyRecord'
  | 'character'
  | 'chat'
  | 'code'
  | 'component'
  | 'composition'
  | 'dream'
  | 'log'
  | 'milestone'
  | 'milestoneRecord'
  | 'pitch'
  | 'prompt'
  | 'reaction'
  | 'resource'
  | 'reward'
  | 'scenario'
  | 'server'
  | 'smartIcon'
  | 'theme'

const fallbackApiBase = 'https://kind-robots.vercel.app'
const invalidToken = 'definitely-not-a-real-token'
const testUserId = 9
const time = Date.now()

const normalRequestTimeout = 20000
const expectedFailureTimeout = 8000
const cleanupRequestTimeout = 12000

const endpointPaths: Record<EndpointKey, string> = {
  artImage: '/api/art/image',
  artCollection: '/api/art/collection',
  bot: '/api/bots',
  butterfly: '/api/butterflies',
  butterflyRecord: '/api/butterflies/records',
  character: '/api/characters',
  chat: '/api/chats',
  code: '/api/code',
  component: '/api/components',
  composition: '/api/compositions',
  dream: '/api/dreams',
  log: '/api/logs',
  milestone: '/api/milestones',
  milestoneRecord: '/api/milestones/records',
  pitch: '/api/pitches',
  prompt: '/api/prompts',
  reaction: '/api/reactions',
  resource: '/api/resources',
  reward: '/api/rewards',
  scenario: '/api/scenarios',
  server: '/api/server',
  smartIcon: '/api/icons',
  theme: '/api/themes',
}

const created: CreatedRegistry = {
  artImage: [],
  artCollection: [],
  bot: [],
  butterfly: [],
  butterflyRecord: [],
  character: [],
  chat: [],
  code: [],
  component: [],
  composition: [],
  dream: [],
  log: [],
  milestone: [],
  milestoneRecord: [],
  pitch: [],
  prompt: [],
  reaction: [],
  resource: [],
  reward: [],
  scenario: [],
  server: [],
  smartIcon: [],
  theme: [],
}

const ids: Record<string, number | undefined> = {}

const id = (key: string) => {
  const value = ids[key]

  expect(value, key).to.be.a('number')
  expect(value, key).to.be.greaterThan(0)

  return value as number
}

const mutableRelationGroups = {
  dreamCharacters: false,
  dreamRewards: false,
  scenarioCharacters: false,
  characterRewards: false,
  resourceServers: false,
  resourceLoraImages: false,
}

let apiBase = fallbackApiBase
let userToken = ''
let adminToken = ''

const urlFor = (key: EndpointKey, recordId?: number) => {
  const base = `${apiBase}${endpointPaths[key]}`
  return recordId ? `${base}/${recordId}` : base
}

const authHeaders = () => ({
  Authorization: `Bearer ${userToken}`,
  'Content-Type': 'application/json',
})

const adminHeaders = () => ({
  Authorization: `Bearer ${adminToken}`,
  'Content-Type': 'application/json',
})

const jsonHeaders = () => ({
  'Content-Type': 'application/json',
})

type ApiRequestOptions = {
  method: string
  url: string
  headers?: Record<string, string>
  body?: unknown
  timeout?: number
}

const apiRequest = <T = any>(options: ApiRequestOptions) => {
  return cy.request<ApiResponse<T>>({
    ...options,
    timeout: options.timeout ?? normalRequestTimeout,
    failOnStatusCode: false,
    retryOnStatusCodeFailure: false,
    retryOnNetworkFailure: false,
  } as Cypress.RequestOptions)
}

const expectedFailureRequest = (
  options: ApiRequestOptions,
  statusCodes: number[],
) => {
  return cy
    .request<ApiResponse>({
      ...options,
      timeout: options.timeout ?? expectedFailureTimeout,
      failOnStatusCode: false,
      retryOnStatusCodeFailure: false,
      retryOnNetworkFailure: false,
    } as Cypress.RequestOptions)
    .then((response) => {
      expectFailure(response, statusCodes)
      return response
    })
}

const cleanupRequest = <T = any>(options: ApiRequestOptions) => {
  return cy.request<ApiResponse<T>>({
    ...options,
    timeout: options.timeout ?? cleanupRequestTimeout,
    failOnStatusCode: false,
    retryOnStatusCodeFailure: false,
    retryOnNetworkFailure: false,
  } as Cypress.RequestOptions)
}

const expectSuccess = (
  response: Cypress.Response<ApiResponse>,
  statusCodes = [200, 201],
) => {
  expect(statusCodes, JSON.stringify(response.body)).to.include(response.status)
  expect(response.body.success, JSON.stringify(response.body)).to.eq(true)
  expect(response.body.data, JSON.stringify(response.body)).to.exist
}

const expectFailure = (
  response: Cypress.Response<ApiResponse>,
  statusCodes: number[],
) => {
  expect(statusCodes, JSON.stringify(response.body)).to.include(response.status)
  expect(response.body.success, JSON.stringify(response.body)).to.eq(false)
}

const expectId = (value: unknown, label: string) => {
  expect(value, label).to.be.a('number')
  expect(value, label).to.be.greaterThan(0)
}

const expectStoredId = (key: string) => id(key)

const listIds = (items: any[] | undefined) =>
  (items || []).map((item) => item.id)

const expectArrayIncludesId = (
  items: any[] | undefined,
  targetId: number,
  label: string,
) => {
  expect(items, label).to.be.an('array')
  expect(listIds(items), label).to.include(targetId)
}

const expectArrayExcludesId = (
  items: any[] | undefined,
  targetId: number,
  label: string,
) => {
  expect(items, label).to.be.an('array')
  expect(listIds(items), label).to.not.include(targetId)
}

const track = (key: EndpointKey, recordId: number) => {
  if (!created[key]) created[key] = []
  if (!created[key].includes(recordId)) created[key].push(recordId)
}

const postRecord = (
  key: EndpointKey,
  body: Record<string, unknown>,
  headers: Record<string, string> = authHeaders(),
) => {
  return apiRequest({
    method: 'POST',
    url: urlFor(key),
    headers,
    body,
  }).then((response) => {
    expectSuccess(response)
    const createdId = response.body.data?.id
    expectId(createdId, `${key}.id`)
    track(key, createdId)
    return response.body.data
  })
}

const patchRecord = (
  key: EndpointKey,
  recordId: number,
  body: Record<string, unknown>,
) => {
  expectId(recordId, `${key}.patch.id`)

  return apiRequest({
    method: 'PATCH',
    url: urlFor(key, recordId),
    headers: authHeaders(),
    body,
  }).then((response) => {
    expectSuccess(response)
    return response.body.data
  })
}

const getRecord = (key: EndpointKey, recordId: number, authorized = false) => {
  expectId(recordId, `${key}.get.id`)

  return apiRequest({
    method: 'GET',
    url: urlFor(key, recordId),
    headers: authorized ? authHeaders() : jsonHeaders(),
  }).then((response) => {
    expectSuccess(response, [200])
    return response.body.data
  })
}

const deleteRecord = (
  key: EndpointKey,
  recordId: number,
  headers: Record<string, string> = authHeaders(),
) => {
  expectId(recordId, `${key}.delete.id`)

  return cleanupRequest({
    method: 'DELETE',
    url: urlFor(key, recordId),
    headers,
  })
}

const expectFieldEquals = (
  data: any,
  field: string,
  expected: number | string | boolean,
  label = 'record',
) => {
  expect(data, `${label} with ${field}`).to.be.an('object')
  expect(data[field], `${label}.${field}`).to.eq(expected)
}

const createReactionFor = (
  field: string,
  targetId: number,
  category: string,
) => {
  expectId(targetId, `reaction target ${field}`)

  return postRecord('reaction', {
    userId: testUserId,
    reactionType: 'LOVED',
    reactionCategory: category,
    rating: 5,
    comment: `cypress relationship reaction ${field} ${time}`,
    [field]: targetId,
  }).then((reaction) => {
    expectFieldEquals(reaction, field, targetId)
    return reaction
  })
}

describe('Relationship API Tests', () => {
  before(() => {
    cy.env(['API_BASE', 'USER_TOKEN', 'ADMIN_TOKEN']).then((env) => {
      apiBase = String(env.API_BASE || fallbackApiBase)
      userToken = String(env.USER_TOKEN || '')
      adminToken = String(env.ADMIN_TOKEN || '')

      expect(userToken, 'cy.env("USER_TOKEN")').to.be.a('string').and.not.be
        .empty
      expect(adminToken, 'cy.env("ADMIN_TOKEN")').to.be.a('string').and.not.be
        .empty
    })
  })

  describe('Fixture setup', () => {
    it('creates core ArtImage fixtures', () => {
      postRecord('artImage', {
        promptString: `relationship test image A ${time}`,
        artPrompt: `relationship test image A ${time}`,
        path: `/images/test/relationship-a-${time}.webp`,
        imagePath: `/images/test/relationship-a-${time}.webp`,
        fileName: `relationship-a-${time}.webp`,
        fileType: 'webp',
        userId: testUserId,
        seed: null,
        steps: 10,
        isPublic: false,
        isMature: false,
        isActive: true,
      })
        .then((artImage) => {
          ids.artImageA = artImage.id
          expectFieldEquals(artImage, 'userId', testUserId)

          return postRecord('artImage', {
            promptString: `relationship test image B ${time}`,
            artPrompt: `relationship test image B ${time}`,
            path: `/images/test/relationship-b-${time}.webp`,
            imagePath: `/images/test/relationship-b-${time}.webp`,
            fileName: `relationship-b-${time}.webp`,
            fileType: 'webp',
            userId: testUserId,
            seed: null,
            steps: 10,
            isPublic: false,
            isMature: false,
            isActive: true,
          })
        })
        .then((artImage) => {
          ids.artImageB = artImage.id
          expectFieldEquals(artImage, 'userId', testUserId)
        })
    })

    it('creates Resource and Server fixtures', () => {
      expectStoredId('artImageA')

      postRecord('server', {
        title: `Cypress Relationship Server ${time}`,
        label: `cypress-relationship-server-${time}`,
        description: 'Cypress relationship server fixture',
        serverType: 'ART',
        baseUrl: `https://example.com/cypress-server-${time}`,
        userId: testUserId,
        isPublic: false,
        isOfficial: false,
        isDefault: false,
        isActive: true,
        isEditable: true,
        supportsTxt2Img: true,
      })
        .then((server) => {
          ids.server = server.id
          expectFieldEquals(server, 'userId', testUserId)

          return postRecord('resource', {
            name: `cypress-relationship-resource-${time}`,
            customLabel: `Cypress Relationship Resource ${time}`,
            description: 'Cypress relationship checkpoint fixture',
            resourceType: 'CHECKPOINT',
            supportedServer: 'SDXL',
            userId: testUserId,
            artImageId: id('artImageA'),
            isPublic: false,
            isActive: true,
          })
        })
        .then((resource) => {
          ids.resource = resource.id
          expectFieldEquals(resource, 'userId', testUserId)
          expectFieldEquals(resource, 'artImageId', id('artImageA'))
        })
    })

    it('connects ArtImage to checkpoint Resource and generator Server', () => {
      expectStoredId('artImageA')
      expectStoredId('resource')
      expectStoredId('server')

      patchRecord('artImage', id('artImageA'), {
        checkpointResourceId: id('resource'),
        serverId: id('server'),
      }).then((artImage) => {
        expectFieldEquals(artImage, 'checkpointResourceId', id('resource'))
        expectFieldEquals(artImage, 'serverId', id('server'))
      })
    })

    it('creates ArtCollection fixture', () => {
      expectStoredId('artImageA')

      postRecord('artCollection', {
        label: `cypress-relationship-collection-${time}`,
        description: 'Cypress relationship ArtCollection fixture',
        userId: testUserId,
        artImageIds: [id('artImageA')],
        isPublic: false,
        isMature: false,
      }).then((collection) => {
        ids.artCollection = collection.id
        expectFieldEquals(collection, 'userId', testUserId)
        expectArrayIncludesId(
          collection.ArtImages,
          id('artImageA'),
          'ArtCollection.ArtImages',
        )
      })
    })

    it('creates primary model fixtures with direct relations', () => {
      expectStoredId('artImageA')
      expectStoredId('artCollection')
      expectStoredId('resource')
      expectStoredId('server')

      postRecord('bot', {
        BotType: 'PROMPTBOT',
        name: `cypress-bot-${time}`,
        subtitle: 'Relationship bot',
        description: 'Cypress relationship bot fixture',
        botIntro: 'I am here to test relationships.',
        userIntro: 'Test user says hello.',
        prompt: 'Respond as a relationship test bot.',
        designer: 'cypress',
        userId: testUserId,
        serverId: id('server'),
        artImageId: id('artImageA'),
        isPublic: false,
        canDelete: true,
        isActive: true,
      })
        .then((bot) => {
          ids.bot = bot.id
          expectFieldEquals(bot, 'userId', testUserId, 'bot')
          expectFieldEquals(bot, 'serverId', id('server'), 'bot')
          expectFieldEquals(bot, 'artImageId', id('artImageA'), 'bot')

          return postRecord('character', {
            name: `Cypress Character ${time}`,
            species: 'Test Goblin',
            class: 'Relationship Wrangler',
            backstory: 'Born in a Cypress fixture and immediately suspicious.',
            userId: testUserId,
            artImageId: id('artImageA'),
            isPublic: false,
            isActive: true,
          })
        })
        .then((character) => {
          ids.character = character.id
          expectFieldEquals(character, 'userId', testUserId, 'character')
          expectFieldEquals(
            character,
            'artImageId',
            id('artImageA'),
            'character',
          )
          return postRecord('pitch', {
            title: `Cypress Pitch ${time}`,
            pitch: `A relationship test pitch ${time}`,
            designer: 'cypress',
            userId: testUserId,
            artImageId: id('artImageA'),
            isPublic: false,
            isActive: true,
          })
        })
        .then((pitch) => {
          ids.pitch = pitch.id
          expectFieldEquals(pitch, 'userId', testUserId, 'pitch')
          expectFieldEquals(pitch, 'artImageId', id('artImageA'), 'pitch')

          return postRecord('prompt', {
            prompt: `A relationship test prompt ${time}`,
            userId: testUserId,
            artImageId: id('artImageA'),
            botId: id('bot'),
            pitchId: id('pitch'),
            isPublic: false,
            isActive: true,
          })
        })
        .then((prompt) => {
          ids.prompt = prompt.id
          expectFieldEquals(prompt, 'userId', testUserId, 'prompt')
          expectFieldEquals(prompt, 'artImageId', id('artImageA'), 'prompt')
          expectFieldEquals(prompt, 'botId', id('bot'), 'prompt')
          expectFieldEquals(prompt, 'pitchId', id('pitch'), 'prompt')

          return postRecord('dream', {
            title: `Cypress Dream ${time}`,
            slug: `cypress-dream-${time}`,
            description: 'A dream/location for relationship tests.',
            currentVibe: 'cypress relationship test chamber',
            userId: testUserId,
            pitchId: id('pitch'),
            artImageId: id('artImageA'),
            artCollectionId: id('artCollection'),
            scenarioId: id('scenario'),
            isPublic: false,
            isActive: true,
            accessMode: 'PRIVATE',
          })
        })
        .then((reward) => {
          ids.reward = reward.id
          expectFieldEquals(reward, 'userId', testUserId, 'reward')
          expectFieldEquals(reward, 'artImageId', id('artImageA'), 'reward')

          return postRecord('scenario', {
            title: `Cypress Scenario ${time}`,
            description: 'A scenario designed to test model relationships.',
            intros:
              'The party enters the API layer. Something smells like nullable foreign keys.',
            userId: testUserId,
            artImageId: id('artImageA'),
            isPublic: false,
            isActive: true,
          })
        })
        .then((scenario) => {
          ids.scenario = scenario.id
          expectFieldEquals(scenario, 'userId', testUserId, 'scenario')
          expectFieldEquals(scenario, 'artImageId', id('artImageA'), 'scenario')

          return postRecord('dream', {
            title: `Cypress Dream ${time}`,
            slug: `cypress-dream-${time}`,
            description: 'A dream/location for relationship tests.',
            currentVibe: 'cypress relationship test chamber',
            userId: testUserId,
            pitchId: id('pitch'),
            artImageId: id('artImageA'),
            artCollectionId: id('artCollection'),
            scenarioId: id('scenario'),
            isPublic: false,
            isActive: true,
            accessMode: 'PRIVATE',
          })
        })
        .then((dream) => {
          ids.dream = dream.id
          expectFieldEquals(dream, 'userId', testUserId, 'dream')
          expectFieldEquals(dream, 'pitchId', id('pitch'), 'dream')
          expectFieldEquals(dream, 'artImageId', id('artImageA'), 'dream')
          expectFieldEquals(
            dream,
            'artCollectionId',
            id('artCollection'),
            'dream',
          )
          expectFieldEquals(dream, 'scenarioId', id('scenario'), 'dream')
        })
    })

    it('creates secondary model fixtures with direct relations', () => {
      expectStoredId('artImageA')
      expectStoredId('artImageB')
      expectStoredId('bot')
      expectStoredId('character')
      expectStoredId('dream')
      expectStoredId('pitch')
      expectStoredId('prompt')
      expectStoredId('reward')
      expectStoredId('scenario')
      expectStoredId('server')

      postRecord('chat', {
        type: 'Dream',
        sender: `cypress-${time}`,
        recipient: 'relationship-suite',
        content: 'Testing every haunted hallway in the relation graph.',
        title: `Cypress Chat ${time}`,
        userId: testUserId,
        botId: id('bot'),
        artImageId: id('artImageA'),
        promptId: id('prompt'),
        characterId: id('character'),
        serverId: id('server'),
        dreamId: id('dream'),
        isPublic: false,
        isActive: true,
      })
        .then((chat) => {
          ids.chat = chat.id
          expectFieldEquals(chat, 'userId', testUserId)
          expectFieldEquals(chat, 'botId', id('bot'))
          expectFieldEquals(chat, 'artImageId', id('artImageA'))
          expectFieldEquals(chat, 'promptId', id('prompt'))
          expectFieldEquals(chat, 'characterId', id('character'))
          expectFieldEquals(chat, 'serverId', id('server'))
          expectFieldEquals(chat, 'dreamId', id('dream'))

          return postRecord('component', {
            folderName: `cypress-relationship-folder-${time}`,
            componentName: `cypress-relationship-component-${time}`,
            title: `Cypress Component ${time}`,
            notes: 'Relationship component fixture',
            artImageId: id('artImageA'),
            isWorking: true,
            underConstruction: false,
            isBroken: false,
          })
        })
        .then((component) => {
          ids.component = component.id
          expectFieldEquals(component, 'artImageId', id('artImageA'))

          return postRecord('composition', {
            title: `Cypress Composition ${time}`,
            description: 'A composition tying multiple models together.',
            label: `cypress-composition-${time}`,
            mode: 'both',
            userId: testUserId,
            artImageId: id('artImageB'),
            characterId: id('character'),
            dreamId: id('dream'),
            scenarioId: id('scenario'),
            pitchId: id('pitch'),
            rewardId: id('reward'),
            isPublic: false,
            isActive: true,
          })
        })
        .then((composition) => {
          ids.composition = composition.id
          expectFieldEquals(composition, 'userId', testUserId)
          expectFieldEquals(composition, 'artImageId', id('artImageB'))
          expectFieldEquals(composition, 'characterId', id('character'))
          expectFieldEquals(composition, 'dreamId', id('dream'))
          expectFieldEquals(composition, 'scenarioId', id('scenario'))
          expectFieldEquals(composition, 'pitchId', id('pitch'))
          expectFieldEquals(composition, 'rewardId', id('reward'))
        })
    })

    it('creates ownership-only fixtures', () => {
      expectStoredId('artImageA')

      postRecord(
        'butterfly',
        {
          name: `cypress-butterfly-${time}`,
          message: 'Fluttering through relation tests.',
          wingTopColor: '#ff00ff',
          wingBottomColor: '#00ffff',
          speed: 1.5,
          wingSpeed: 2.5,
          scale: 1,
          rarityNumber: Number(String(time).slice(-8)),
          designer: 'cypress',
          userId: testUserId,
          isPublic: false,
        },
        adminHeaders(),
      )
        .then((butterfly) => {
          ids.butterfly = butterfly.id
          expectFieldEquals(butterfly, 'userId', 1, 'butterfly')

          return postRecord('butterflyRecord', {
            userId: testUserId,
            butterflyId: id('butterfly'),
          })
        })
        .then((record) => {
          ids.butterflyRecord = record.id
          expectFieldEquals(record, 'userId', testUserId)
          expectFieldEquals(record, 'butterflyId', id('butterfly'))

          return postRecord('code', {
            userId: testUserId,
            title: `Cypress Code ${time}`,
            description: 'Relationship code fixture',
            icon: 'kind-icon:code',
            graph: { nodes: [], edges: [], source: 'cypress' },
            isPublic: false,
            isOfficial: false,
            isActive: true,
          })
        })
        .then((code) => {
          ids.code = code.id
          expectFieldEquals(code, 'userId', testUserId)

          return postRecord('log', {
            message: `Cypress relationship log ${time}`,
            timestamp: new Date().toISOString(),
            username: `cypress-${time}`,
            userId: testUserId,
          })
        })
        .then((log) => {
          ids.log = log.id
          expectFieldEquals(log, 'userId', testUserId)

          return apiRequest({
            method: 'POST',
            url: urlFor('milestone'),
            headers: authHeaders(),
            body: [
              {
                label: `cypress-milestone-${time}`,
                message: 'Cypress relationship milestone fixture',
                triggerCode: `cypress-relationship-${time}`,
                icon: 'kind-icon:jellybean',
                karma: 1,
                isActive: true,
                isRepeatable: true,
                artImageId: id('artImageA'),
              },
            ],
          }).then((response) => {
            expectSuccess(response)
            const milestone = Array.isArray(response.body.data)
              ? response.body.data[0]
              : response.body.data

            expectId(milestone?.id, 'milestone.id')
            track('milestone', milestone.id)
            return milestone
          })
        })
        .then((milestone) => {
          ids.milestone = milestone.id
          expectFieldEquals(milestone, 'artImageId', id('artImageA'))

          return postRecord('milestoneRecord', {
            username: `cypress-${time}`,
            milestoneId: id('milestone'),
            userId: testUserId,
            isConfirmed: false,
          })
        })
        .then((record) => {
          ids.milestoneRecord = record.id
          expectFieldEquals(record, 'milestoneId', id('milestone'))
          expectFieldEquals(record, 'userId', testUserId)

          return postRecord('smartIcon', {
            title: `Cypress SmartIcon ${time}`,
            type: 'nav',
            designer: 'cypress',
            userId: testUserId,
            icon: 'kind-icon:test-tube',
            label: 'Relationship Test',
            link: '/cypress-relationship-test',
            isPublic: false,
            category: 'model',
            isMature: false,
          })
        })
        .then((smartIcon) => {
          ids.smartIcon = smartIcon.id
          expectFieldEquals(smartIcon, 'userId', testUserId)

          return postRecord('theme', {
            name: `cypress-theme-${time}`,
            values: JSON.stringify({
              primary: '#ff00ff',
              secondary: '#00ffff',
              accent: '#ffff00',
            }),
            userId: testUserId,
            isPublic: false,
            tagline: 'Relationship theme fixture',
            colorScheme: 'light',
            prefersDark: false,
            isActive: true,
          })
        })
        .then((theme) => {
          ids.theme = theme.id
          expectFieldEquals(theme, 'userId', testUserId)
        })
    })

    describe('ArtCollection relationship contract', () => {
      it('adds, removes, and replaces ArtImages', () => {
        expectStoredId('artCollection')
        expectStoredId('artImageA')
        expectStoredId('artImageB')

        patchRecord('artCollection', id('artCollection'), {
          addArtImageIds: [id('artImageB')],
        })
          .then((collection) => {
            expectArrayIncludesId(
              collection.ArtImages,
              id('artImageB'),
              'ArtCollection.ArtImages after add',
            )

            return patchRecord('artCollection', id('artCollection'), {
              removeArtImageIds: [id('artImageA')],
            })
          })
          .then((collection) => {
            expectArrayExcludesId(
              collection.ArtImages,
              id('artImageA'),
              'ArtCollection.ArtImages after remove',
            )

            return patchRecord('artCollection', id('artCollection'), {
              artImageIds: [id('artImageA'), id('artImageB')],
              mode: 'replace',
            })
          })
          .then((collection) => {
            expectArrayIncludesId(
              collection.ArtImages,
              id('artImageA'),
              'ArtCollection.ArtImages after replace',
            )
            expectArrayIncludesId(
              collection.ArtImages,
              id('artImageB'),
              'ArtCollection.ArtImages after replace',
            )
          })
      })

      it('returns lightweight nested ArtImages', () => {
        expectStoredId('artCollection')
        expectStoredId('artImageA')

        getRecord('artCollection', id('artCollection')).then((collection) => {
          expectArrayIncludesId(
            collection.ArtImages,
            id('artImageA'),
            'ArtCollection.ArtImages',
          )

          const firstImage = collection.ArtImages[0]

          expect(firstImage).to.not.have.property('imageData')
          expect(firstImage).to.not.have.property('thumbnailData')
          expect(firstImage).to.not.have.property('galleryId')
          expect(firstImage).to.not.have.property('pitchId')
          expect(firstImage).to.not.have.property('promptId')
          expect(firstImage).to.not.have.property('resourceId')
          expect(firstImage).to.not.have.property('rewardId')
          expect(firstImage).to.not.have.property('characterId')
          expect(firstImage).to.not.have.property('botId')
          expect(firstImage).to.not.have.property('componentId')
          expect(firstImage).to.not.have.property('milestoneId')
          expect(firstImage).to.not.have.property('chatId')
        })
      })
    })

    describe('Many-to-many relationship contract', () => {
      it('connects Dream to Character', () => {
        expectStoredId('dream')
        expectStoredId('character')

        patchRecord('dream', id('dream'), {
          characterIds: [id('character')],
        }).then((dream) => {
          mutableRelationGroups.dreamCharacters = true
          expectArrayIncludesId(
            dream.Characters,
            id('character'),
            'Dream.Characters',
          )
        })
      })

      it('connects Dream to Reward', () => {
        expectStoredId('dream')
        expectStoredId('reward')

        patchRecord('dream', id('dream'), {
          rewardIds: [id('reward')],
        }).then((dream) => {
          mutableRelationGroups.dreamRewards = true
          expectArrayIncludesId(dream.Rewards, id('reward'), 'Dream.Rewards')
        })
      })

      it('connects Scenario to Character', () => {
        expectStoredId('scenario')
        expectStoredId('character')

        patchRecord('scenario', id('scenario'), {
          characterIds: [id('character')],
        }).then((scenario) => {
          mutableRelationGroups.scenarioCharacters = true
          expectArrayIncludesId(
            scenario.Characters,
            id('character'),
            'Scenario.Characters',
          )
        })
      })

      it('connects Character to Reward', () => {
        expectStoredId('character')
        expectStoredId('reward')

        patchRecord('character', id('character'), {
          rewardIds: [id('reward')],
        }).then((character) => {
          mutableRelationGroups.characterRewards = true
          expectArrayIncludesId(
            character.Rewards,
            id('reward'),
            'Character.Rewards',
          )
        })
      })

      it('connects Resource to Server', () => {
        expectStoredId('resource')
        expectStoredId('server')

        patchRecord('resource', id('resource'), {
          connectServerIds: [id('server')],
        }).then((resource) => {
          mutableRelationGroups.resourceServers = true
          expectArrayIncludesId(
            resource.Servers,
            id('server'),
            'Resource.Servers',
          )
        })
      })
    })

    describe('Primary direct relationship verification', () => {
      it('verifies ArtImage direct relations', () => {
        expectStoredId('artImageA')
        expectStoredId('resource')
        expectStoredId('server')

        getRecord('artImage', id('artImageA'), true).then((artImage) => {
          expectFieldEquals(artImage, 'userId', testUserId)
          expectFieldEquals(artImage, 'checkpointResourceId', id('resource'))
          expectFieldEquals(artImage, 'serverId', id('server'))
        })
      })

      it('connects Resource to ArtImage via LoRA (UsedInImages)', () => {
        expectStoredId('resource')
        expectStoredId('artImageA')

        patchRecord('resource', id('resource'), {
          connectLoraImageIds: [id('artImageA')],
        }).then((resource) => {
          mutableRelationGroups.resourceLoraImages = true
          expectArrayIncludesId(
            resource.UsedInImages,
            id('artImageA'),
            'Resource.UsedInImages',
          )
        })
      })

      it('disconnects Resource from ArtImage via LoRA (UsedInImages)', () => {
        expectStoredId('resource')
        expectStoredId('artImageA')

        cy.then(() => {
          if (!mutableRelationGroups.resourceLoraImages) {
            return
          }

          return patchRecord('resource', id('resource'), {
            disconnectLoraImageIds: [id('artImageA')],
          }).then((resource) => {
            expectArrayExcludesId(
              resource.UsedInImages,
              id('artImageA'),
              'Resource.UsedInImages after disconnect',
            )
          })
        })
      })

      it('verifies Bot direct relations', () => {
        expectStoredId('bot')
        expectStoredId('artImageA')
        expectStoredId('server')

        getRecord('bot', id('bot'), true).then((bot) => {
          expectFieldEquals(bot, 'userId', testUserId)
          expectFieldEquals(bot, 'artImageId', id('artImageA'))
          expectFieldEquals(bot, 'serverId', id('server'))
        })
      })

      it('verifies Chat direct relations', () => {
        expectStoredId('chat')
        expectStoredId('artImageA')
        expectStoredId('bot')
        expectStoredId('character')
        expectStoredId('dream')
        expectStoredId('prompt')
        expectStoredId('server')

        getRecord('chat', id('chat'), true).then((chat) => {
          expectFieldEquals(chat, 'userId', testUserId)
          expectFieldEquals(chat, 'artImageId', id('artImageA'))
          expectFieldEquals(chat, 'botId', id('bot'))
          expectFieldEquals(chat, 'characterId', id('character'))
          expectFieldEquals(chat, 'dreamId', id('dream'))
          expectFieldEquals(chat, 'promptId', id('prompt'))
          expectFieldEquals(chat, 'serverId', id('server'))
        })
      })

      it('verifies Composition direct relations', () => {
        expectStoredId('composition')
        expectStoredId('artImageB')
        expectStoredId('character')
        expectStoredId('dream')
        expectStoredId('scenario')
        expectStoredId('pitch')
        expectStoredId('reward')

        getRecord('composition', id('composition'), true).then(
          (composition) => {
            expectFieldEquals(composition, 'userId', testUserId)
            expectFieldEquals(composition, 'artImageId', id('artImageB'))
            expectFieldEquals(composition, 'characterId', id('character'))
            expectFieldEquals(composition, 'dreamId', id('dream'))
            expectFieldEquals(composition, 'scenarioId', id('scenario'))
            expectFieldEquals(composition, 'pitchId', id('pitch'))
            expectFieldEquals(composition, 'rewardId', id('reward'))
          },
        )
      })

      it('verifies Dream direct relations', () => {
        expectStoredId('dream')
        expectStoredId('artCollection')
        expectStoredId('artImageA')
        expectStoredId('pitch')
        expectStoredId('scenario')

        getRecord('dream', id('dream'), true).then((dream) => {
          expectFieldEquals(dream, 'userId', testUserId)
          expectFieldEquals(dream, 'artCollectionId', id('artCollection'))
          expectFieldEquals(dream, 'artImageId', id('artImageA'))
          expectFieldEquals(dream, 'pitchId', id('pitch'))
          expectFieldEquals(dream, 'scenarioId', id('scenario'))
        })
      })
    })

    describe('Reaction target relationship contract', () => {
      it('connects Reaction to ArtCollection', () => {
        expectStoredId('artCollection')
        createReactionFor(
          'artCollectionId',
          id('artCollection'),
          'ART_COLLECTION',
        )
      })

      it('connects Reaction to ArtImage', () => {
        expectStoredId('artImageA')
        createReactionFor('artImageId', id('artImageA'), 'ART_IMAGE')
      })

      it('connects Reaction to Bot', () => {
        expectStoredId('bot')
        createReactionFor('botId', id('bot'), 'BOT')
      })

      it('connects Reaction to Butterfly', () => {
        expectStoredId('butterfly')
        createReactionFor('butterflyId', id('butterfly'), 'BUTTERFLY')
      })

      it('connects Reaction to Character', () => {
        expectStoredId('character')
        createReactionFor('characterId', id('character'), 'CHARACTER')
      })

      it('connects Reaction to Chat', () => {
        expectStoredId('chat')
        createReactionFor('chatId', id('chat'), 'CHAT_EXCHANGE')
      })

      it('connects Reaction to Component', () => {
        expectStoredId('component')
        createReactionFor('componentId', id('component'), 'COMPONENT')
      })

      it('connects Reaction to Composition', () => {
        expectStoredId('composition')
        createReactionFor('compositionId', id('composition'), 'COMPOSITION')
      })

      it('connects Reaction to Dream', () => {
        expectStoredId('dream')
        createReactionFor('dreamId', id('dream'), 'DREAM')
      })

      it('connects Reaction to Pitch', () => {
        expectStoredId('pitch')
        createReactionFor('pitchId', id('pitch'), 'PITCH')
      })

      it('connects Reaction to Prompt', () => {
        expectStoredId('prompt')
        createReactionFor('promptId', id('prompt'), 'PROMPT')
      })

      it('connects Reaction to Resource', () => {
        expectStoredId('resource')
        createReactionFor('resourceId', id('resource'), 'RESOURCE')
      })

      it('connects Reaction to Reward', () => {
        expectStoredId('reward')
        createReactionFor('rewardId', id('reward'), 'REWARD')
      })

      it('connects Reaction to Scenario', () => {
        expectStoredId('scenario')
        createReactionFor('scenarioId', id('scenario'), 'SCENARIO')
      })

      it('connects Reaction to Theme', () => {
        expectStoredId('theme')
        createReactionFor('themeId', id('theme'), 'THEME')
      })
    })

    describe('Negative relationship behavior', () => {
      it('rejects ArtCollection relation mutation without auth', () => {
        expectStoredId('artCollection')
        expectStoredId('artImageA')

        expectedFailureRequest(
          {
            method: 'PATCH',
            url: urlFor('artCollection', id('artCollection')),
            headers: jsonHeaders(),
            body: {
              addArtImageIds: [id('artImageA')],
            },
          },
          [401],
        )
      })

      it('rejects ArtCollection relation mutation with invalid auth', () => {
        expectStoredId('artCollection')
        expectStoredId('artImageA')

        expectedFailureRequest(
          {
            method: 'PATCH',
            url: urlFor('artCollection', id('artCollection')),
            headers: {
              Authorization: `Bearer ${invalidToken}`,
              'Content-Type': 'application/json',
            },
            body: {
              addArtImageIds: [id('artImageA')],
            },
          },
          [401],
        )
      })

      it('rejects adding nonexistent ArtImage to ArtCollection', () => {
        expectStoredId('artCollection')

        expectedFailureRequest(
          {
            method: 'PATCH',
            url: urlFor('artCollection', id('artCollection')),
            headers: authHeaders(),
            body: {
              addArtImageIds: [999999999],
            },
          },
          [400, 404, 409],
        )
      })

      it('rejects Reaction with invalid target id', () => {
        expectedFailureRequest(
          {
            method: 'POST',
            url: urlFor('reaction'),
            headers: authHeaders(),
            body: {
              userId: testUserId,
              reactionType: 'LOVED',
              reactionCategory: 'ART_IMAGE',
              rating: 5,
              artImageId: 999999999,
            },
          },
          [400, 404, 409],
        )
      })

      it('rejects Reaction without a target', () => {
        expectedFailureRequest(
          {
            method: 'POST',
            url: urlFor('reaction'),
            headers: authHeaders(),
            body: {
              userId: testUserId,
              reactionType: 'LOVED',
              reactionCategory: 'ART_IMAGE',
              rating: 5,
              comment: `targetless reaction should fail ${time}`,
            },
          },
          [400, 422],
        )
      })
    })

    describe('Cleanup', () => {
      it('deletes all relationship fixtures in dependency order', () => {
        const cleanupOrder: EndpointKey[] = [
          'reaction',
          'chat',
          'composition',
          'milestoneRecord',
          'milestone',
          'butterflyRecord',
          'butterfly',
          'dream',
          'scenario',
          'reward',
          'character',
          'prompt',
          'pitch',
          'bot',
          'component',
          'resource',
          'server',
          'theme',
          'smartIcon',
          'code',
          'log',
          'artCollection',
          'artImage',
        ]

        cleanupOrder.forEach((key) => {
          const uniqueIds = Array.from(new Set(created[key] || [])).filter(
            (recordId) =>
              typeof recordId === 'number' &&
              Number.isInteger(recordId) &&
              recordId > 0,
          )

          uniqueIds.forEach((recordId) => {
            const headers = key === 'butterfly' ? adminHeaders() : authHeaders()

            deleteRecord(key, recordId, headers).then((response) => {
              if (response.status !== 404) {
                expect(
                  [200, 202, 204],
                  `${key} ${recordId} cleanup ${JSON.stringify(response.body)}`,
                ).to.include(response.status)

                if (
                  response.body &&
                  Object.prototype.hasOwnProperty.call(response.body, 'success')
                ) {
                  expect(
                    response.body.success,
                    `${key} ${recordId} cleanup`,
                  ).to.eq(true)
                }
              }
            })
          })
        })
      })
    })
  })
})
