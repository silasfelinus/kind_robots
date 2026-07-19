/// <reference types="cypress" />

import { createLoggedInTestUser } from '../../support/api-auth'

type ApiResponse<T = any> = {
  success: boolean
  message?: string
  data?: T
  statusCode?: number
}

type EndpointKey =
  | 'artImage'
  | 'artCollection'
  | 'bot'
  | 'character'
  | 'chat'
  | 'dream'
  | 'prompt'
  | 'resource'
  | 'reward'
  | 'scenario'
  | 'server'

type CreatedIds = Partial<Record<EndpointKey, number>>

const fallbackApiBase = 'https://kind-robots.vercel.app'
const time = Date.now()

const endpointPaths: Record<EndpointKey, string> = {
  artImage: '/api/art/image',
  artCollection: '/api/art/collection',
  bot: '/api/bots',
  character: '/api/characters',
  chat: '/api/chats',
  dream: '/api/dreams',
  prompt: '/api/prompts',
  resource: '/api/resources',
  reward: '/api/rewards',
  scenario: '/api/scenarios',
  server: '/api/server',
}

const cleanupOrder: EndpointKey[] = [
  'chat',
  'dream',
  'prompt',
  'character',
  'bot',
  'reward',
  'scenario',
  'artCollection',
  'resource',
  'artImage',
  'server',
]

let apiBase = fallbackApiBase
let userToken = ''
let userId = 0
let apiKey = ''
const ids: CreatedIds = {}

const urlFor = (key: EndpointKey, recordId?: number) => {
  const base = `${apiBase}${endpointPaths[key]}`
  return recordId ? `${base}/${recordId}` : base
}

const authHeaders = () => ({
  Authorization: `Bearer ${userToken}`,
  'Content-Type': 'application/json',
})

const cleanupHeaders = () => ({
  ...authHeaders(),
  ...(apiKey ? { 'x-api-key': apiKey } : {}),
})

const expectSuccess = (
  response: Cypress.Response<ApiResponse>,
  statusCodes = [200, 201],
) => {
  expect(statusCodes, JSON.stringify(response.body)).to.include(response.status)
  expect(response.body.success, JSON.stringify(response.body)).to.eq(true)
  expect(response.body.data, JSON.stringify(response.body)).to.exist
}

const expectId = (value: unknown, label: string) => {
  expect(value, label).to.be.a('number')
  expect(value, label).to.be.greaterThan(0)
}

const id = (key: EndpointKey) => {
  const value = ids[key]
  expectId(value, key)
  return value as number
}

const postRecord = (key: EndpointKey, body: Record<string, unknown>) => {
  return cy
    .request<ApiResponse>({
      method: 'POST',
      url: urlFor(key),
      headers: authHeaders(),
      body,
      failOnStatusCode: false,
    })
    .then((response) => {
      expectSuccess(response)
      const data = response.body.data as Record<string, unknown>
      expectId(data.id, `${key}.id`)
      ids[key] = data.id as number
      return data
    })
}

const patchRecord = (
  key: EndpointKey,
  recordId: number,
  body: Record<string, unknown>,
) => {
  return cy
    .request<ApiResponse>({
      method: 'PATCH',
      url: urlFor(key, recordId),
      headers: cleanupHeaders(),
      body,
      failOnStatusCode: false,
    })
    .then((response) => {
      expectSuccess(response)
      return response.body.data as Record<string, unknown>
    })
}

const cleanupRecord = (key: EndpointKey) => {
  const recordId = ids[key]
  if (!recordId) return

  cy.request({
    method: 'DELETE',
    url: urlFor(key, recordId),
    headers: cleanupHeaders(),
    failOnStatusCode: false,
  }).then(() => {
    ids[key] = undefined
  })
}

describe('Relationship API Tests', () => {
  before(() => {
    return createLoggedInTestUser().then((auth) => {
      userToken = auth.token
      userId = auth.id
    })
  })

  before(() => {
    cy.env(['API_BASE', 'API_KEY', 'BETA_ADMIN_TOKEN']).then((env) => {
      apiBase = String(env.API_BASE || fallbackApiBase).replace(/\/+$/, '')
      apiKey = String(env.BETA_ADMIN_TOKEN || env.API_KEY || '')
    })
  })

  after(() => {
    if (ids.artImage) {
      cy.request({
        method: 'PATCH',
        url: urlFor('artImage', ids.artImage),
        headers: cleanupHeaders(),
        body: {
          checkpointResourceId: null,
          serverId: null,
        },
        failOnStatusCode: false,
      })
    }

    cleanupOrder.forEach(cleanupRecord)
  })

  it('creates linked art, model, and chat records', () => {
    postRecord('artImage', {
      promptString: `relationship test image ${time}`,
      artPrompt: `relationship test image ${time}`,
      path: `/images/test/relationship-${time}.webp`,
      imagePath: `/images/test/relationship-${time}.webp`,
      fileName: `relationship-${time}.webp`,
      fileType: 'webp',
      seed: null,
      steps: 10,
      isPublic: false,
      isMature: false,
      isActive: true,
    })
      .then(() =>
        postRecord('server', {
          title: `Cypress Relationship Server ${time}`,
          label: `cypress-relationship-server-${time}`,
          description: 'Cypress relationship server fixture',
          serverType: 'COMFY',
          baseUrl: `https://example.com/cypress-server-${time}`,
          userId,
          isPublic: false,
          isOfficial: false,
          isDefault: false,
          isActive: true,
          isEditable: true,
          supportsTxt2Img: true,
        }),
      )
      .then(() =>
        postRecord('resource', {
          name: `cypress-relationship-resource-${time}`,
          customLabel: `Cypress Relationship Resource ${time}`,
          description: 'Cypress relationship checkpoint fixture',
          resourceType: 'CHECKPOINT',
          supportedServer: 'COMFY',
          userId,
          artImageId: id('artImage'),
          isPublic: false,
          isActive: true,
        }),
      )
      .then(() =>
        patchRecord('artImage', id('artImage'), {
          checkpointResourceId: id('resource'),
          serverId: id('server'),
        }),
      )
      .then((artImage) => {
        expect(artImage.checkpointResourceId).to.eq(id('resource'))
        expect(artImage.serverId).to.eq(id('server'))
      })
      .then(() =>
        postRecord('artCollection', {
          label: `cypress-relationship-collection-${time}`,
          description: 'Cypress relationship ArtCollection fixture',
          userId,
          artImageIds: [id('artImage')],
          isPublic: false,
          isMature: false,
        }),
      )
      .then(() =>
        postRecord('bot', {
          botType: 'PROMPTBOT',
          name: `cypress-bot-${time}`,
          subtitle: 'Relationship bot',
          description: 'Cypress relationship bot fixture',
          botIntro: 'I am here to test relationships.',
          userIntro: 'Test user says hello.',
          prompt: 'Respond as a relationship test bot.',
          designer: 'cypress',
          userId,
          serverId: id('server'),
          artImageId: id('artImage'),
          isPublic: false,
          canDelete: true,
          isActive: true,
        }),
      )
      .then(() =>
        postRecord('character', {
          name: `Cypress Character ${time}`,
          species: 'Test Goblin',
          class: 'Relationship Wrangler',
          backstory: 'Born in a Cypress fixture and immediately suspicious.',
          userId,
          artImageId: id('artImage'),
          isPublic: false,
          isActive: true,
        }),
      )
      .then(() =>
        postRecord('prompt', {
          prompt: `A relationship test prompt ${time}`,
          userId,
          artImageId: id('artImage'),
          botId: id('bot'),
          isPublic: false,
          isActive: true,
        }),
      )
      .then(() =>
        postRecord('scenario', {
          title: `Cypress Scenario ${time}`,
          description: 'A scenario designed to test model relationships.',
          intros: 'The party enters the API layer.',
          userId,
          artImageId: id('artImage'),
          isPublic: false,
          isActive: true,
        }),
      )
      .then(() =>
        postRecord('reward', {
          name: `Cypress Reward ${time}`,
          description: 'A reward for surviving relationship tests.',
          effect: 'Can detect missing include statements.',
          flavorText: 'A tiny bell rings whenever a relation include is missing.',
          collection: 'cypress',
          rarity: 'COMMON',
          rewardType: 'ITEM',
          userId,
          artImageId: id('artImage'),
          isPublic: false,
          isActive: true,
        }),
      )
      .then(() =>
        postRecord('dream', {
          title: `Cypress Dream ${time}`,
          slug: `cypress-dream-${time}`,
          dreamType: 'LOCATION',
          description: 'A location for relationship tests.',
          pitch: 'cypress relationship test chamber',
          artPrompt: 'cypress relationship test chamber, glowing relation graph',
          userId,
          artImageId: id('artImage'),
          artCollectionId: id('artCollection'),
          scenarioId: id('scenario'),
          isPublic: false,
          isActive: true,
        }),
      )
      .then(() =>
        postRecord('chat', {
          type: 'Dream',
          sender: `cypress-${time}`,
          recipient: 'relationship-suite',
          content: 'Testing linked API records.',
          title: `Cypress Chat ${time}`,
          userId,
          botId: id('bot'),
          artImageId: id('artImage'),
          promptId: id('prompt'),
          characterId: id('character'),
          serverId: id('server'),
          dreamId: id('dream'),
          isPublic: false,
          isActive: true,
        }),
      )
      .then((chat) => {
        expect(chat.botId).to.eq(id('bot'))
        expect(chat.artImageId).to.eq(id('artImage'))
        expect(chat.promptId).to.eq(id('prompt'))
        expect(chat.characterId).to.eq(id('character'))
        expect(chat.serverId).to.eq(id('server'))
        expect(chat.dreamId).to.eq(id('dream'))
      })
  })
})
