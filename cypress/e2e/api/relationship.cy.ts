// @ts-nocheck
/* eslint-disable */
// test-ignore

// /cypress/e2e/api/relationship.cy.ts
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

const endpointPaths: Record<EndpointKey, string> = {
  artImage: '/api/art/image',
  artCollection: '/api/art/collection',
  bot: '/api/bots',
  butterfly: '/api/butterflies',
  butterflyRecord: '/api/butterfly-records',
  character: '/api/characters',
  chat: '/api/chats',
  code: '/api/codes',
  component: '/api/components',
  composition: '/api/compositions',
  dream: '/api/dreams',
  log: '/api/logs',
  milestone: '/api/milestones',
  milestoneRecord: '/api/milestone-records',
  pitch: '/api/pitches',
  prompt: '/api/prompts',
  reaction: '/api/reactions',
  resource: '/api/resources',
  reward: '/api/rewards',
  scenario: '/api/scenarios',
  server: '/api/servers',
  smartIcon: '/api/smart-icons',
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

const ids: Record<string, number> = {}

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

const urlFor = (key: EndpointKey, id?: number) => {
  const base = `${apiBase}${endpointPaths[key]}`
  return id ? `${base}/${id}` : base
}

const authHeaders = () => ({
  Authorization: `Bearer ${userToken}`,
  'Content-Type': 'application/json',
})

const jsonHeaders = () => ({
  'Content-Type': 'application/json',
})

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

const listIds = (items: any[] | undefined) =>
  (items || []).map((item) => item.id)

const expectArrayIncludesId = (
  items: any[] | undefined,
  id: number,
  label: string,
) => {
  expect(items, label).to.be.an('array')
  expect(listIds(items), label).to.include(id)
}

const expectArrayExcludesId = (
  items: any[] | undefined,
  id: number,
  label: string,
) => {
  expect(items, label).to.be.an('array')
  expect(listIds(items), label).to.not.include(id)
}

const track = (key: EndpointKey, id: number) => {
  if (!created[key]) created[key] = []
  if (!created[key].includes(id)) created[key].push(id)
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
      const id = response.body.data?.id
      expectId(id, `${key}.id`)
      track(key, id)
      return response.body.data
    })
}

const patchRecord = (
  key: EndpointKey,
  id: number,
  body: Record<string, unknown>,
) => {
  return cy
    .request<ApiResponse>({
      method: 'PATCH',
      url: urlFor(key, id),
      headers: authHeaders(),
      body,
      failOnStatusCode: false,
    })
    .then((response) => {
      expectSuccess(response)
      return response.body.data
    })
}

const getRecord = (key: EndpointKey, id: number, authorized = false) => {
  return cy
    .request<ApiResponse>({
      method: 'GET',
      url: urlFor(key, id),
      headers: authorized ? authHeaders() : jsonHeaders(),
      failOnStatusCode: false,
    })
    .then((response) => {
      expectSuccess(response, [200])
      return response.body.data
    })
}

const deleteRecord = (key: EndpointKey, id: number) => {
  return cy.request<ApiResponse>({
    method: 'DELETE',
    url: urlFor(key, id),
    headers: authHeaders(),
    failOnStatusCode: false,
  })
}

const expectFieldEquals = (
  data: any,
  field: string,
  expected: number | string | boolean,
) => {
  expect(data, `record with ${field}`).to.be.an('object')
  expect(data[field], field).to.eq(expected)
}

const createReactionFor = (
  field: string,
  targetId: number,
  category: string,
) => {
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
    cy.env(['API_BASE', 'USER_TOKEN']).then((env) => {
      apiBase = String(env.API_BASE || fallbackApiBase)
      userToken = String(env.USER_TOKEN || '')

      expect(userToken, 'cy.env("USER_TOKEN")').to.be.a('string').and.not.be
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
      }).then((artImage) => {
        ids.artImageA = artImage.id
        expectFieldEquals(artImage, 'userId', testUserId)
      })

      postRecord('artImage', {
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
      }).then((artImage) => {
        ids.artImageB = artImage.id
        expectFieldEquals(artImage, 'userId', testUserId)
      })
    })

    it('creates Resource and Server fixtures', () => {
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
      }).then((server) => {
        ids.server = server.id
        expectFieldEquals(server, 'userId', testUserId)
      })

      postRecord('resource', {
        name: `cypress-relationship-resource-${time}`,
        customLabel: `Cypress Relationship Resource ${time}`,
        description: 'Cypress relationship checkpoint fixture',
        resourceType: 'CHECKPOINT',
        supportedServer: 'SDXL',
        userId: testUserId,
        artImageId: ids.artImageA,
        isPublic: false,
        isActive: true,
      }).then((resource) => {
        ids.resource = resource.id
        expectFieldEquals(resource, 'userId', testUserId)
        expectFieldEquals(resource, 'artImageId', ids.artImageA)
      })
    })

    it('connects ArtImage to checkpoint Resource and generator Server', () => {
      patchRecord('artImage', ids.artImageA, {
        checkpointResourceId: ids.resource,
        serverId: ids.server,
      }).then((artImage) => {
        expectFieldEquals(artImage, 'checkpointResourceId', ids.resource)
        expectFieldEquals(artImage, 'serverId', ids.server)
      })
    })

    it('creates ArtCollection fixture', () => {
      postRecord('artCollection', {
        label: `cypress-relationship-collection-${time}`,
        description: 'Cypress relationship ArtCollection fixture',
        userId: testUserId,
        artImageIds: [ids.artImageA],
        isPublic: false,
        isMature: false,
      }).then((collection) => {
        ids.artCollection = collection.id
        expectFieldEquals(collection, 'userId', testUserId)
        expectArrayIncludesId(
          collection.ArtImages,
          ids.artImageA,
          'ArtCollection.ArtImages',
        )
      })
    })

    it('creates primary model fixtures with direct relations', () => {
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
        serverId: ids.server,
        artImageId: ids.artImageA,
        isPublic: false,
        canDelete: true,
        isActive: true,
      }).then((bot) => {
        ids.bot = bot.id
        expectFieldEquals(bot, 'userId', testUserId)
        expectFieldEquals(bot, 'serverId', ids.server)
        expectFieldEquals(bot, 'artImageId', ids.artImageA)
      })

      postRecord('character', {
        name: `Cypress Character ${time}`,
        species: 'Test Goblin',
        class: 'Relationship Wrangler',
        backstory: 'Born in a Cypress fixture and immediately suspicious.',
        userId: testUserId,
        artImageId: ids.artImageA,
        isPublic: false,
        isActive: true,
      }).then((character) => {
        ids.character = character.id
        expectFieldEquals(character, 'userId', testUserId)
        expectFieldEquals(character, 'artImageId', ids.artImageA)
      })

      postRecord('pitch', {
        title: `Cypress Pitch ${time}`,
        pitch: `A relationship test pitch ${time}`,
        designer: 'cypress',
        userId: testUserId,
        artImageId: ids.artImageA,
        isPublic: false,
        isActive: true,
      }).then((pitch) => {
        ids.pitch = pitch.id
        expectFieldEquals(pitch, 'userId', testUserId)
        expectFieldEquals(pitch, 'artImageId', ids.artImageA)
      })

      postRecord('prompt', {
        prompt: `A relationship test prompt ${time}`,
        userId: testUserId,
        artImageId: ids.artImageA,
        botId: ids.bot,
        pitchId: ids.pitch,
        isPublic: false,
        isActive: true,
      }).then((prompt) => {
        ids.prompt = prompt.id
        expectFieldEquals(prompt, 'userId', testUserId)
        expectFieldEquals(prompt, 'artImageId', ids.artImageA)
        expectFieldEquals(prompt, 'botId', ids.bot)
        expectFieldEquals(prompt, 'pitchId', ids.pitch)
      })

      postRecord('reward', {
        label: `Cypress Reward ${time}`,
        text: 'A reward for surviving relationship tests.',
        power: 'Can detect missing include statements at ten paces.',
        collection: 'cypress',
        rarity: 'COMMON',
        rewardType: 'ITEM',
        userId: testUserId,
        artImageId: ids.artImageA,
        isPublic: false,
        isActive: true,
      }).then((reward) => {
        ids.reward = reward.id
        expectFieldEquals(reward, 'userId', testUserId)
        expectFieldEquals(reward, 'artImageId', ids.artImageA)
      })

      postRecord('scenario', {
        title: `Cypress Scenario ${time}`,
        description: 'A scenario designed to test model relationships.',
        intros:
          'The party enters the API layer. Something smells like nullable foreign keys.',
        userId: testUserId,
        artImageId: ids.artImageA,
        isPublic: false,
        isActive: true,
      }).then((scenario) => {
        ids.scenario = scenario.id
        expectFieldEquals(scenario, 'userId', testUserId)
        expectFieldEquals(scenario, 'artImageId', ids.artImageA)
      })

      postRecord('dream', {
        title: `Cypress Dream ${time}`,
        slug: `cypress-dream-${time}`,
        description: 'A dream/location for relationship tests.',
        userId: testUserId,
        pitchId: ids.pitch,
        artImageId: ids.artImageA,
        artCollectionId: ids.artCollection,
        scenarioId: ids.scenario,
        isPublic: false,
        isActive: true,
        accessMode: 'PRIVATE',
      }).then((dream) => {
        ids.dream = dream.id
        expectFieldEquals(dream, 'userId', testUserId)
        expectFieldEquals(dream, 'pitchId', ids.pitch)
        expectFieldEquals(dream, 'artImageId', ids.artImageA)
        expectFieldEquals(dream, 'artCollectionId', ids.artCollection)
        expectFieldEquals(dream, 'scenarioId', ids.scenario)
      })
    })

    it('creates secondary model fixtures with direct relations', () => {
      postRecord('chat', {
        type: 'Dream',
        sender: `cypress-${time}`,
        recipient: 'relationship-suite',
        content: 'Testing every haunted hallway in the relation graph.',
        title: `Cypress Chat ${time}`,
        userId: testUserId,
        botId: ids.bot,
        artImageId: ids.artImageA,
        promptId: ids.prompt,
        characterId: ids.character,
        serverId: ids.server,
        dreamId: ids.dream,
        isPublic: false,
        isActive: true,
      }).then((chat) => {
        ids.chat = chat.id
        expectFieldEquals(chat, 'userId', testUserId)
        expectFieldEquals(chat, 'botId', ids.bot)
        expectFieldEquals(chat, 'artImageId', ids.artImageA)
        expectFieldEquals(chat, 'promptId', ids.prompt)
        expectFieldEquals(chat, 'characterId', ids.character)
        expectFieldEquals(chat, 'serverId', ids.server)
        expectFieldEquals(chat, 'dreamId', ids.dream)
      })

      postRecord('component', {
        folderName: `cypress-relationship-folder-${time}`,
        componentName: `cypress-relationship-component-${time}`,
        title: `Cypress Component ${time}`,
        notes: 'Relationship component fixture',
        artImageId: ids.artImageA,
        isWorking: true,
        underConstruction: false,
        isBroken: false,
      }).then((component) => {
        ids.component = component.id
        expectFieldEquals(component, 'artImageId', ids.artImageA)
      })

      postRecord('composition', {
        title: `Cypress Composition ${time}`,
        description: 'A composition tying multiple models together.',
        label: `cypress-composition-${time}`,
        mode: 'both',
        userId: testUserId,
        artImageId: ids.artImageB,
        characterId: ids.character,
        dreamId: ids.dream,
        scenarioId: ids.scenario,
        pitchId: ids.pitch,
        rewardId: ids.reward,
        isPublic: false,
        isActive: true,
      }).then((composition) => {
        ids.composition = composition.id
        expectFieldEquals(composition, 'userId', testUserId)
        expectFieldEquals(composition, 'artImageId', ids.artImageB)
        expectFieldEquals(composition, 'characterId', ids.character)
        expectFieldEquals(composition, 'dreamId', ids.dream)
        expectFieldEquals(composition, 'scenarioId', ids.scenario)
        expectFieldEquals(composition, 'pitchId', ids.pitch)
        expectFieldEquals(composition, 'rewardId', ids.reward)
      })
    })

    it('creates ownership-only fixtures', () => {
      postRecord('butterfly', {
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
      }).then((butterfly) => {
        ids.butterfly = butterfly.id
        expectFieldEquals(butterfly, 'userId', testUserId)
      })

      postRecord('butterflyRecord', {
        userId: testUserId,
        butterflyId: ids.butterfly,
      }).then((record) => {
        ids.butterflyRecord = record.id
        expectFieldEquals(record, 'userId', testUserId)
        expectFieldEquals(record, 'butterflyId', ids.butterfly)
      })

      postRecord('code', {
        userId: testUserId,
        title: `Cypress Code ${time}`,
        description: 'Relationship code fixture',
        icon: 'kind-icon:code',
        graph: { nodes: [], edges: [], source: 'cypress' },
        isPublic: false,
        isOfficial: false,
        isActive: true,
      }).then((code) => {
        ids.code = code.id
        expectFieldEquals(code, 'userId', testUserId)
      })

      postRecord('log', {
        message: `Cypress relationship log ${time}`,
        timestamp: new Date().toISOString(),
        username: `cypress-${time}`,
        userId: testUserId,
      }).then((log) => {
        ids.log = log.id
        expectFieldEquals(log, 'userId', testUserId)
      })

      postRecord('milestone', {
        label: `cypress-milestone-${time}`,
        message: 'Cypress relationship milestone fixture',
        icon: 'kind-icon:jellybean',
        karma: 1,
        isActive: true,
        isRepeatable: true,
        artImageId: ids.artImageA,
      }).then((milestone) => {
        ids.milestone = milestone.id
        expectFieldEquals(milestone, 'artImageId', ids.artImageA)
      })

      postRecord('milestoneRecord', {
        username: `cypress-${time}`,
        milestoneId: ids.milestone,
        userId: testUserId,
        isConfirmed: false,
      }).then((record) => {
        ids.milestoneRecord = record.id
        expectFieldEquals(record, 'milestoneId', ids.milestone)
        expectFieldEquals(record, 'userId', testUserId)
      })

      postRecord('smartIcon', {
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
      }).then((smartIcon) => {
        ids.smartIcon = smartIcon.id
        expectFieldEquals(smartIcon, 'userId', testUserId)
      })

      postRecord('theme', {
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
      }).then((theme) => {
        ids.theme = theme.id
        expectFieldEquals(theme, 'userId', testUserId)
      })
    })
  })

  describe('ArtCollection relationship contract', () => {
    it('adds, removes, and replaces ArtImages', () => {
      patchRecord('artCollection', ids.artCollection, {
        addArtImageIds: [ids.artImageB],
      }).then((collection) => {
        expectArrayIncludesId(
          collection.ArtImages,
          ids.artImageB,
          'ArtCollection.ArtImages after add',
        )
      })

      patchRecord('artCollection', ids.artCollection, {
        removeArtImageIds: [ids.artImageA],
      }).then((collection) => {
        expectArrayExcludesId(
          collection.ArtImages,
          ids.artImageA,
          'ArtCollection.ArtImages after remove',
        )
      })

      patchRecord('artCollection', ids.artCollection, {
        artImageIds: [ids.artImageA, ids.artImageB],
        mode: 'replace',
      }).then((collection) => {
        expectArrayIncludesId(
          collection.ArtImages,
          ids.artImageA,
          'ArtCollection.ArtImages after replace',
        )
        expectArrayIncludesId(
          collection.ArtImages,
          ids.artImageB,
          'ArtCollection.ArtImages after replace',
        )
      })
    })

    it('returns lightweight nested ArtImages', () => {
      getRecord('artCollection', ids.artCollection).then((collection) => {
        expectArrayIncludesId(
          collection.ArtImages,
          ids.artImageA,
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
      patchRecord('dream', ids.dream, {
        characterIds: [ids.character],
      }).then((dream) => {
        mutableRelationGroups.dreamCharacters = true
        expectArrayIncludesId(
          dream.Characters,
          ids.character,
          'Dream.Characters',
        )
      })
    })

    it('connects Dream to Reward', () => {
      patchRecord('dream', ids.dream, {
        rewardIds: [ids.reward],
      }).then((dream) => {
        mutableRelationGroups.dreamRewards = true
        expectArrayIncludesId(dream.Rewards, ids.reward, 'Dream.Rewards')
      })
    })

    it('connects Scenario to Character', () => {
      patchRecord('scenario', ids.scenario, {
        characterIds: [ids.character],
      }).then((scenario) => {
        mutableRelationGroups.scenarioCharacters = true
        expectArrayIncludesId(
          scenario.Characters,
          ids.character,
          'Scenario.Characters',
        )
      })
    })

    it('connects Character to Reward', () => {
      patchRecord('character', ids.character, {
        rewardIds: [ids.reward],
      }).then((character) => {
        mutableRelationGroups.characterRewards = true
        expectArrayIncludesId(
          character.Rewards,
          ids.reward,
          'Character.Rewards',
        )
      })
    })

    it('connects Resource to Server', () => {
      patchRecord('resource', ids.resource, {
        serverIds: [ids.server],
      }).then((resource) => {
        mutableRelationGroups.resourceServers = true
        expectArrayIncludesId(resource.Servers, ids.server, 'Resource.Servers')
      })
    })
  })

  describe('Primary direct relationship verification', () => {
    it('verifies ArtImage direct relations', () => {
      getRecord('artImage', ids.artImageA, true).then((artImage) => {
        expectFieldEquals(artImage, 'userId', testUserId)
        expectFieldEquals(artImage, 'checkpointResourceId', ids.resource)
        expectFieldEquals(artImage, 'serverId', ids.server)
      })
    })

    it('connects Resource to ArtImage via LoRA (UsedInImages)', () => {
      patchRecord('resource', ids.resource, {
        connectLoraImageIds: [ids.artImageA],
      }).then((resource) => {
        mutableRelationGroups.resourceLoraImages = true
        expectArrayIncludesId(
          resource.UsedInImages,
          ids.artImageA,
          'Resource.UsedInImages',
        )
      })
    })

    it('disconnects Resource from ArtImage via LoRA (UsedInImages)', () => {
      cy.wrap(null).then(() => {
        if (!mutableRelationGroups.resourceLoraImages) return
      })
      patchRecord('resource', ids.resource, {
        disconnectLoraImageIds: [ids.artImageA],
      }).then((resource) => {
        expectArrayExcludesId(
          resource.UsedInImages,
          ids.artImageA,
          'Resource.UsedInImages after disconnect',
        )
      })
    })

    it('verifies Bot direct relations', () => {
      getRecord('bot', ids.bot, true).then((bot) => {
        expectFieldEquals(bot, 'userId', testUserId)
        expectFieldEquals(bot, 'artImageId', ids.artImageA)
        expectFieldEquals(bot, 'serverId', ids.server)
      })
    })

    it('verifies Chat direct relations', () => {
      getRecord('chat', ids.chat, true).then((chat) => {
        expectFieldEquals(chat, 'userId', testUserId)
        expectFieldEquals(chat, 'artImageId', ids.artImageA)
        expectFieldEquals(chat, 'botId', ids.bot)
        expectFieldEquals(chat, 'characterId', ids.character)
        expectFieldEquals(chat, 'dreamId', ids.dream)
        expectFieldEquals(chat, 'promptId', ids.prompt)
        expectFieldEquals(chat, 'serverId', ids.server)
      })
    })

    it('verifies Composition direct relations', () => {
      getRecord('composition', ids.composition, true).then((composition) => {
        expectFieldEquals(composition, 'userId', testUserId)
        expectFieldEquals(composition, 'artImageId', ids.artImageB)
        expectFieldEquals(composition, 'characterId', ids.character)
        expectFieldEquals(composition, 'dreamId', ids.dream)
        expectFieldEquals(composition, 'scenarioId', ids.scenario)
        expectFieldEquals(composition, 'pitchId', ids.pitch)
        expectFieldEquals(composition, 'rewardId', ids.reward)
      })
    })

    it('verifies Dream direct relations', () => {
      getRecord('dream', ids.dream, true).then((dream) => {
        expectFieldEquals(dream, 'userId', testUserId)
        expectFieldEquals(dream, 'artCollectionId', ids.artCollection)
        expectFieldEquals(dream, 'artImageId', ids.artImageA)
        expectFieldEquals(dream, 'pitchId', ids.pitch)
        expectFieldEquals(dream, 'scenarioId', ids.scenario)
      })
    })
  })

  describe('Reaction target relationship contract', () => {
    it('connects Reaction to ArtCollection', () => {
      createReactionFor('artCollectionId', ids.artCollection, 'ART_COLLECTION')
    })

    it('connects Reaction to ArtImage', () => {
      createReactionFor('artImageId', ids.artImageA, 'ART_IMAGE')
    })

    it('connects Reaction to Bot', () => {
      createReactionFor('botId', ids.bot, 'BOT')
    })

    it('connects Reaction to Butterfly', () => {
      createReactionFor('butterflyId', ids.butterfly, 'BUTTERFLY')
    })

    it('connects Reaction to Character', () => {
      createReactionFor('characterId', ids.character, 'CHARACTER')
    })

    it('connects Reaction to Chat', () => {
      createReactionFor('chatId', ids.chat, 'CHAT_EXCHANGE')
    })

    it('connects Reaction to Component', () => {
      createReactionFor('componentId', ids.component, 'COMPONENT')
    })

    it('connects Reaction to Composition', () => {
      createReactionFor('compositionId', ids.composition, 'COMPOSITION')
    })

    it('connects Reaction to Dream', () => {
      createReactionFor('dreamId', ids.dream, 'DREAM')
    })

    it('connects Reaction to Pitch', () => {
      createReactionFor('pitchId', ids.pitch, 'PITCH')
    })

    it('connects Reaction to Prompt', () => {
      createReactionFor('promptId', ids.prompt, 'PROMPT')
    })

    it('connects Reaction to Resource', () => {
      createReactionFor('resourceId', ids.resource, 'RESOURCE')
    })

    it('connects Reaction to Reward', () => {
      createReactionFor('rewardId', ids.reward, 'REWARD')
    })

    it('connects Reaction to Scenario', () => {
      createReactionFor('scenarioId', ids.scenario, 'SCENARIO')
    })

    it('connects Reaction to Theme', () => {
      createReactionFor('themeId', ids.theme, 'THEME')
    })
  })

  describe('Negative relationship behavior', () => {
    it('rejects ArtCollection relation mutation without auth', () => {
      cy.request<ApiResponse>({
        method: 'PATCH',
        url: urlFor('artCollection', ids.artCollection),
        headers: jsonHeaders(),
        body: {
          addArtImageIds: [ids.artImageA],
        },
        failOnStatusCode: false,
      }).then((response) => {
        expectFailure(response, [401])
      })
    })

    it('rejects ArtCollection relation mutation with invalid auth', () => {
      cy.request<ApiResponse>({
        method: 'PATCH',
        url: urlFor('artCollection', ids.artCollection),
        headers: {
          Authorization: `Bearer ${invalidToken}`,
          'Content-Type': 'application/json',
        },
        body: {
          addArtImageIds: [ids.artImageA],
        },
        failOnStatusCode: false,
      }).then((response) => {
        expectFailure(response, [401])
      })
    })

    it('rejects adding nonexistent ArtImage to ArtCollection', () => {
      cy.request<ApiResponse>({
        method: 'PATCH',
        url: urlFor('artCollection', ids.artCollection),
        headers: authHeaders(),
        body: {
          addArtImageIds: [999999999],
        },
        failOnStatusCode: false,
      }).then((response) => {
        expectFailure(response, [400, 404, 409])
      })
    })

    it('rejects Reaction with invalid target id', () => {
      cy.request<ApiResponse>({
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
        failOnStatusCode: false,
      }).then((response) => {
        expectFailure(response, [400, 404, 409])
      })
    })

    it('rejects Reaction without a target', () => {
      cy.request<ApiResponse>({
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
        failOnStatusCode: false,
      }).then((response) => {
        expectFailure(response, [400, 422])
      })
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
          (id) => typeof id === 'number' && Number.isInteger(id) && id > 0,
        )

        uniqueIds.forEach((id) => {
          deleteRecord(key, id).then((response) => {
            if (response.status !== 404) {
              expect(
                [200, 202, 204],
                `${key} ${id} cleanup ${JSON.stringify(response.body)}`,
              ).to.include(response.status)
              if (
                response.body &&
                Object.prototype.hasOwnProperty.call(response.body, 'success')
              ) {
                expect(response.body.success, `${key} ${id} cleanup`).to.eq(
                  true,
                )
              }
            }
          })
        })
      })
    })
  })
})
