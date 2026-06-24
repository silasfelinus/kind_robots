import { createLoggedInTestUser } from '../../support/api-auth'
// /cypress/e2e/api/dreams.cy.ts
/// <reference types="cypress" />

interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  statusCode?: number
}

type DreamType =
  | 'ART'
  | 'BRAINSTORM'
  | 'WEIRDLANDIA'
  | 'RANDOMLIST'
  | 'TITLE'
  | 'VIBE'
  | 'BOT'
  | 'INSPIRATION'
  | 'CHARACTER'
  | 'REWARD'
  | 'SCENARIO'
  | 'TEXT'
  | 'LOCATION'
  | 'PITCH'
  | 'GENRE'

type CreationSource = 'HUMAN' | 'AI' | 'HYBRID' | 'UPLOAD' | 'UNKNOWN'

interface DreamResponse {
  id: number
  createdAt?: string
  updatedAt?: string | null
  title: string
  slug?: string | null
  dreamType: DreamType
  description?: string | null
  pitch?: string | null
  flavorText?: string | null
  examples?: string | null
  artPrompt?: string | null
  imagePath?: string | null
  highlightImage?: string | null
  icon?: string | null
  designer?: string | null
  creationSource: CreationSource
  userId: number
  artImageId?: number | null
  artCollectionId?: number | null
  scenarioId?: number | null
  isPublic: boolean
  isMature: boolean
  isActive: boolean
  User?: any
  ArtImage?: any
  ArtCollection?: any
  Scenario?: any
  ArtImages?: any[]
  ArtCollections?: any[]
  Characters?: any[]
  Rewards?: any[]
  Chats?: any[]
  Reactions?: any[]
  _count?: {
    Chats?: number
    Reactions?: number
    Characters?: number
    Rewards?: number
  }
}

interface ChatResponse {
  id: number
  type: string
  sender?: string | null
  recipient?: string | null
  content: string
  title?: string | null
  isPublic: boolean
  isFavorite?: boolean
  previousEntryId?: number | null
  originId?: number | null
  userId?: number | null
  botId?: number | null
  recipientId?: number | null
  artImageId?: number | null
  promptId?: number | null
  botName?: string | null
  channel?: string | null
  botResponse?: string | null
  characterId?: number | null
  isRead?: boolean
  isMature: boolean
  dreamId?: number | null
  serverId?: number | null
  ArtImage?: any
  User?: any
}

function requireData<T>(body: ApiResponse<T>): T {
  expect(body.success, body.message || 'Expected success').to.eq(true)
  expect(body.data, body.message || 'Expected response data').to.exist

  return body.data as T
}

function requireArrayData<T>(body: ApiResponse<T[]>): T[] {
  expect(body.success, body.message || 'Expected success').to.eq(true)
  expect(body.data, body.message || 'Expected response array data').to.be.an(
    'array',
  )

  return body.data as T[]
}

let userId = 0

describe('Dream API tests', () => {

  // Auth migration: fresh disposable JWT user
  before(() => {
    return createLoggedInTestUser().then((auth) => {
      userToken = auth.token
      userId = auth.id
    })
  })

  const API_BASE =
    (Cypress.config('baseUrl') as string) ?? 'https://kind-robots.vercel.app'

  const dreamsUrl = `${API_BASE}/api/dreams`

  const invalidToken = 'someInvalidTokenValue'
    let userToken = ''

  let publicDreamId = 0
  let privateDreamId = 0
  let brainstormDreamId = 0
  let chatId = 0
  let botResponseChatId = 0

  const time = Date.now()
  const publicDreamTitle = `Cypress Lantern Greenhouse ${time}`
  const privateDreamTitle = `Cypress Hidden Dreamhouse ${time}`
  const brainstormDreamTitle = `Cypress Brainstorm Dream ${time}`

  const authHeaders = () => ({
    Authorization: `Bearer ${userToken}`,
  })

  const jsonAuthHeaders = () => ({
    Authorization: `Bearer ${userToken}`,
    'Content-Type': 'application/json',
  })

  const jsonHeaders = () => ({
    'Content-Type': 'application/json',
  })

  const chatsUrl = `${API_BASE}/api/chats`

  const dreamChatCreateUrl = () => chatsUrl

  const dreamChatsUrl = (dreamId: number, query = '') => {
    const params = new URLSearchParams(query)

    if (!params.has('dreamId')) {
      params.set('dreamId', String(dreamId))
    }

    return `${chatsUrl}?${params.toString()}`
  }

  // Kept as an alias so older assertions can still describe a "path" case
  // without recreating the old Dream-scoped chat route. Dream chat history belongs to /api/chats.
  const dreamChatsPathUrl = (dreamId: number, query = '') =>
    dreamChatsUrl(dreamId, query)

  const expectDreamShape = (dream: DreamResponse) => {
    expect(dream.id).to.be.a('number')
    expect(dream.title).to.be.a('string').and.not.be.empty
    expect(dream.dreamType).to.be.a('string').and.not.be.empty
    expect(dream).to.have.property('description')
    expect(dream).to.have.property('pitch')
    expect(dream).to.have.property('creationSource')
    expect(dream).to.have.property('isPublic')
    expect(dream).to.have.property('isMature')
    expect(dream).to.have.property('isActive')
  }

  const hardDeleteDream = (dreamId: number) => {
    if (!dreamId || !userToken) return

    cy.request<ApiResponse<DreamResponse>>({
      method: 'DELETE',
      url: `${dreamsUrl}/${dreamId}?hard=true`,
      headers: authHeaders(),
      failOnStatusCode: false,
    })
  }

  before(() => {
    cy.wrap(null).then(() => {
          })
  })

  after(() => {
    hardDeleteDream(publicDreamId)
    hardDeleteDream(privateDreamId)
    hardDeleteDream(brainstormDreamId)
  })
  before(() => {
    return createLoggedInTestUser().then((auth) => {
    userToken = auth.token
      userId = auth.id
    })
  })





  it('POST: rejects Dream creation without auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: dreamsUrl,
      headers: jsonHeaders(),
      body: {
        title: `Unauthorized Dream ${time}`,
        description: 'This should fail.',
        pitch: 'This should fail.',
        userId: userId,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('POST: rejects Dream creation with invalid auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: dreamsUrl,
      headers: {
        Authorization: `Bearer ${invalidToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: `Invalid Token Dream ${time}`,
        description: 'This should fail too.',
        pitch: 'This should fail too.',
        userId: userId,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('POST: rejects Dream creation without title', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: dreamsUrl,
      headers: jsonAuthHeaders(),
      body: {
        description: 'No title, no dream.',
        pitch: 'No title, no dream.',
        userId: userId,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400)
      expect(res.body.success).to.eq(false)
      expect(res.body.message).to.match(/title/i)
    })
  })

  it('POST: creates a public LOCATION Dream', () => {
    cy.request<ApiResponse<DreamResponse>>({
      method: 'POST',
      url: dreamsUrl,
      headers: jsonAuthHeaders(),
      body: {
        title: publicDreamTitle,
        slug: `cypress-lantern-greenhouse-${time}`,
        dreamType: 'LOCATION',
        description:
          'A Cypress-created Dream location for testing the Dream atlas.',
        pitch:
          'A bright lantern greenhouse where robot philosophers trade jokes with hyperactive butterflies.',
        flavorText: 'Warm glass, brass lanterns, and suspiciously wise moths.',
        examples: 'robot philosophers|hyperactive butterflies|lantern vines',
        artPrompt:
          'bright lantern greenhouse, robot philosophers, hyperactive butterflies, cozy surreal fantasy, cinematic lighting',
        creationSource: 'HUMAN',
        userId: userId,
        isPublic: true,
        isMature: false,
        isActive: true,
      },
    }).then((res) => {
      expect(res.status, JSON.stringify(res.body)).to.eq(201)

      const dream = requireData(res.body)

      expectDreamShape(dream)
      expect(dream.title).to.eq(publicDreamTitle)
      expect(dream.dreamType).to.eq('LOCATION')
      expect(dream.pitch).to.include('lantern greenhouse')
      expect(dream.artPrompt).to.include('robot philosophers')
      expect(dream.creationSource).to.eq('HUMAN')
      expect(dream.isPublic).to.eq(true)

      publicDreamId = dream.id
      expect(publicDreamId).to.be.a('number')
    })
  })

  it('POST: creates a private PITCH Dream', () => {
    cy.request<ApiResponse<DreamResponse>>({
      method: 'POST',
      url: dreamsUrl,
      headers: jsonAuthHeaders(),
      body: {
        title: privateDreamTitle,
        slug: `cypress-private-dreamhouse-${time}`,
        dreamType: 'PITCH',
        description:
          'A private Cypress-created Dream pitch for ownership testing.',
        pitch: 'A hidden robot speakeasy under a library of sleeping stars.',
        artPrompt:
          'hidden robot speakeasy, sleeping stars, library basement, whimsical noir',
        creationSource: 'HUMAN',
        userId: userId,
        isPublic: false,
        isMature: false,
        isActive: true,
      },
    }).then((res) => {
      expect(res.status, JSON.stringify(res.body)).to.eq(201)

      const dream = requireData(res.body)

      expectDreamShape(dream)
      expect(dream.title).to.eq(privateDreamTitle)
      expect(dream.dreamType).to.eq('PITCH')
      expect(dream.isPublic).to.eq(false)

      privateDreamId = dream.id
      expect(privateDreamId).to.be.a('number')
    })
  })

  it('POST: creates a BRAINSTORM Dream', () => {
    cy.request<ApiResponse<DreamResponse>>({
      method: 'POST',
      url: dreamsUrl,
      headers: jsonAuthHeaders(),
      body: {
        title: brainstormDreamTitle,
        slug: `cypress-brainstorm-dream-${time}`,
        dreamType: 'BRAINSTORM',
        description:
          'A Cypress-created brainstorm container for generated dream riffs.',
        pitch:
          'Generate riffs on a town where every mirror shows a different genre.',
        examples:
          'haunted western mirror|romantic comedy mirror|boss fight mirror',
        artPrompt:
          'a surreal town square full of glowing mirrors, multidimensional genre portals',
        creationSource: 'AI',
        userId: userId,
        isPublic: false,
        isMature: false,
        isActive: true,
      },
    }).then((res) => {
      expect(res.status, JSON.stringify(res.body)).to.eq(201)

      const dream = requireData(res.body)

      expectDreamShape(dream)
      expect(dream.title).to.eq(brainstormDreamTitle)
      expect(dream.dreamType).to.eq('BRAINSTORM')
      expect(dream.creationSource).to.eq('AI')

      brainstormDreamId = dream.id
      expect(brainstormDreamId).to.be.a('number')
    })
  })

  it('GET: anonymous atlas fetch sees public Dreams', () => {
    cy.request<ApiResponse<DreamResponse[]>>({
      method: 'GET',
      url: dreamsUrl,
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dreams = requireArrayData(res.body)
      const match = dreams.find((dream) => dream.id === publicDreamId)

      expect(match).to.not.eq(undefined)
      expect(match?.isPublic).to.eq(true)
    })
  })

  it('GET: anonymous atlas fetch does not show private Dreams', () => {
    cy.request<ApiResponse<DreamResponse[]>>({
      method: 'GET',
      url: dreamsUrl,
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dreams = requireArrayData(res.body)
      const privateMatch = dreams.find((dream) => dream.id === privateDreamId)
      const brainstormMatch = dreams.find(
        (dream) => dream.id === brainstormDreamId,
      )

      expect(privateMatch).to.eq(undefined)
      expect(brainstormMatch).to.eq(undefined)
    })
  })

  it('GET: authenticated atlas fetch sees owned public and private Dreams', () => {
    cy.request<ApiResponse<DreamResponse[]>>({
      method: 'GET',
      url: dreamsUrl,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dreams = requireArrayData(res.body)
      const publicMatch = dreams.find((dream) => dream.id === publicDreamId)
      const privateMatch = dreams.find((dream) => dream.id === privateDreamId)
      const brainstormMatch = dreams.find(
        (dream) => dream.id === brainstormDreamId,
      )

      expect(publicMatch).to.not.eq(undefined)
      expect(privateMatch).to.not.eq(undefined)
      expect(brainstormMatch).to.not.eq(undefined)
    })
  })

  it('GET: authenticated userOnly atlas fetch returns owned Dreams', () => {
    cy.request<ApiResponse<DreamResponse[]>>({
      method: 'GET',
      url: `${dreamsUrl}?userOnly=true`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dreams = requireArrayData(res.body)
      const ids = dreams.map((dream) => dream.id)

      expect(ids).to.include(publicDreamId)
      expect(ids).to.include(privateDreamId)
      expect(ids).to.include(brainstormDreamId)
    })
  })

  it('GET: atlas can search by title text', () => {
    cy.request<ApiResponse<DreamResponse[]>>({
      method: 'GET',
      url: `${dreamsUrl}?search=${encodeURIComponent(publicDreamTitle)}`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dreams = requireArrayData(res.body)
      const match = dreams.find((dream) => dream.id === publicDreamId)

      expect(match).to.not.eq(undefined)
    })
  })

  it('GET: fetch public Dream by ID anonymously', () => {
    cy.request<ApiResponse<DreamResponse>>({
      method: 'GET',
      url: `${dreamsUrl}/${publicDreamId}`,
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dream = requireData(res.body)

      expectDreamShape(dream)
      expect(dream.id).to.eq(publicDreamId)
      expect(dream.title).to.eq(publicDreamTitle)
      expect(dream.dreamType).to.eq('LOCATION')
    })
  })

  it('GET: fetch private Dream by ID with auth', () => {
    cy.request<ApiResponse<DreamResponse>>({
      method: 'GET',
      url: `${dreamsUrl}/${privateDreamId}`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dream = requireData(res.body)

      expectDreamShape(dream)
      expect(dream.id).to.eq(privateDreamId)
      expect(dream.title).to.eq(privateDreamTitle)
      expect(dream.isPublic).to.eq(false)
    })
  })

  it('GET: anonymous user cannot fetch private Dream by ID', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${dreamsUrl}/${privateDreamId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect([401, 403]).to.include(res.status)
      expect(res.body.success).to.eq(false)
    })
  })

  it('PATCH: updates public Dream fields', () => {
    const updatedTitle = `Updated ${publicDreamTitle}`

    cy.request<ApiResponse<DreamResponse>>({
      method: 'PATCH',
      url: `${dreamsUrl}/${publicDreamId}`,
      headers: jsonAuthHeaders(),
      body: {
        title: updatedTitle,
        description: 'Updated by Cypress as a reusable Dream location.',
        pitch:
          'The greenhouse becomes a floating lantern market for tiny robot philosophers.',
        artPrompt:
          'floating lantern market, tiny robot philosophers, dreamy greenhouse, luminous cozy fantasy',
        dreamType: 'LOCATION',
        creationSource: 'HYBRID',
      },
    }).then((res) => {
      expect(res.status, JSON.stringify(res.body)).to.eq(200)

      const dream = requireData(res.body)

      expect(dream.title).to.eq(updatedTitle)
      expect(dream.pitch).to.include('floating lantern market')
      expect(dream.artPrompt).to.include('tiny robot philosophers')
      expect(dream.creationSource).to.eq('HYBRID')
    })
  })

  it('PATCH: rejects update without auth', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${dreamsUrl}/${publicDreamId}`,
      headers: jsonHeaders(),
      body: {
        title: 'No Auth Edit',
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('PATCH: rejects update with invalid auth', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${dreamsUrl}/${publicDreamId}`,
      headers: {
        Authorization: `Bearer ${invalidToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: 'Invalid Auth Edit',
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('PATCH: rejects empty title', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${dreamsUrl}/${publicDreamId}`,
      headers: jsonAuthHeaders(),
      body: {
        title: '   ',
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400)
      expect(res.body.success).to.eq(false)
      expect(res.body.message).to.match(/title/i)
    })
  })

  it('POST: adds a Dream room chat entry', () => {
    cy.request<ApiResponse<ChatResponse>>({
      method: 'POST',
      url: dreamChatCreateUrl(),
      headers: jsonAuthHeaders(),
      body: {
        type: 'Dream',
        sender: 'Cypress Dreamer',
        title: 'Cypress first arrival',
        content:
          'Add a silver fox made of moonlight and make the greenhouse warmer.',
        userId: userId,
        dreamId: publicDreamId,
        channel: `dream-${publicDreamId}`,
        isPublic: true,
        isMature: false,
      },
    }).then((res) => {
      expect([200, 201]).to.include(res.status)

      const chat = requireData(res.body)

      expect(chat.id).to.be.a('number')
      expect(chat.dreamId).to.eq(publicDreamId)
      expect(chat.content).to.include('silver fox')
      expect(chat.channel).to.eq(`dream-${publicDreamId}`)

      chatId = chat.id
    })
  })

  it('POST: adds a model response chat and updates Dream concept fields', () => {
    cy.request<ApiResponse<ChatResponse>>({
      method: 'POST',
      url: dreamChatCreateUrl(),
      headers: jsonAuthHeaders(),
      body: {
        type: 'BotResponse',
        sender: 'Dream',
        title: 'Cypress room response',
        content:
          'The dream warms. A silver fox curls beneath the lanterns, scattering moonlit sparks.',
        botResponse:
          'The dream warms. A silver fox curls beneath the lanterns, scattering moonlit sparks.',
        userId: userId,
        dreamId: publicDreamId,
        channel: `dream-${publicDreamId}`,
        updateDream: true,
        description:
          'A warm floating greenhouse market where a moonlit fox guides tiny robot philosophers.',
        pitch:
          'A warm floating greenhouse market where a moonlit fox guides tiny robot philosophers.',
        artPrompt:
          'warm floating greenhouse market, moonlit silver fox, tiny robot philosophers, cozy surreal fantasy',
        isPublic: true,
        isMature: false,
      },
    }).then((res) => {
      expect([200, 201]).to.include(res.status)

      const chat = requireData(res.body)

      expect(chat.id).to.be.a('number')
      expect(chat.type).to.eq('BotResponse')
      expect(chat.dreamId).to.eq(publicDreamId)
      expect(chat.botResponse).to.include('silver fox')

      botResponseChatId = chat.id
    })

    cy.request<ApiResponse<DreamResponse>>({
      method: 'PATCH',
      url: `${dreamsUrl}/${publicDreamId}`,
      headers: jsonAuthHeaders(),
      body: {
        description:
          'A warm floating greenhouse market where a moonlit fox guides tiny robot philosophers.',
        pitch:
          'A warm floating greenhouse market where a moonlit fox guides tiny robot philosophers.',
        artPrompt:
          'warm floating greenhouse market, moonlit silver fox, tiny robot philosophers, cozy surreal fantasy',
        updateNote: 'Cypress bot response updated the Dream concept fields.',
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      requireData(res.body)
    })

    cy.request<ApiResponse<DreamResponse>>({
      method: 'GET',
      url: `${dreamsUrl}/${publicDreamId}`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dream = requireData(res.body)

      expect(dream.description || dream.pitch || '').to.include('moonlit fox')
      expect(dream.artPrompt || '').to.include('moonlit silver fox')
    })
  })

  it('POST: rejects Dream chat without auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: dreamChatCreateUrl(),
      headers: jsonHeaders(),
      body: {
        content: 'This should fail.',
        userId: userId,
        dreamId: publicDreamId,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect([200, 401]).to.include(res.status)
      expect(res.body.success).to.eq(false)
    })
  })

  it('POST: rejects Dream chat with invalid auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: dreamChatCreateUrl(),
      headers: {
        Authorization: `Bearer ${invalidToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        content: 'This should fail too.',
        userId: userId,
        dreamId: publicDreamId,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect([200, 401]).to.include(res.status)
      expect(res.body.success).to.eq(false)
    })
  })

  it('POST: rejects Dream chat without content', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: dreamChatCreateUrl(),
      headers: jsonAuthHeaders(),
      body: {
        type: 'Dream',
        sender: 'Cypress Dreamer',
        userId: userId,
        dreamId: publicDreamId,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect([200, 400]).to.include(res.status)
      expect(res.body.success).to.eq(false)
      expect(res.body.message).to.match(/content/i)
    })
  })

  it('POST: allows owner to chat in a private Dream', () => {
    cy.request<ApiResponse<ChatResponse>>({
      method: 'POST',
      url: dreamChatCreateUrl(),
      headers: jsonAuthHeaders(),
      body: {
        type: 'Dream',
        sender: 'Cypress Dreamer',
        content: 'This owner-authenticated request is allowed to chat.',
        dreamId: privateDreamId,
        channel: `dream-${privateDreamId}`,
        updateDream: true,
        description: 'Owner reshaped private Dream through chat.',
        pitch: 'Owner reshaped private Dream through chat.',
        isPublic: false,
        isMature: false,
      },
    }).then((res) => {
      expect([200, 201]).to.include(res.status)

      const chat = requireData(res.body)

      expect(chat.dreamId).to.eq(privateDreamId)
      expect(chat.content).to.include('owner-authenticated')
    })
  })

  it('GET: fetch Dream chat history through /api/chats query', () => {
    cy.request<ApiResponse<ChatResponse[]>>({
      method: 'GET',
      url: dreamChatsUrl(publicDreamId),
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const chats = requireArrayData(res.body)
      const firstMatch = chats.find((chat) => chat.id === chatId)
      const responseMatch = chats.find((chat) => chat.id === botResponseChatId)

      expect(firstMatch).to.not.eq(undefined)
      expect(responseMatch).to.not.eq(undefined)
    })
  })

  it('GET: fetch Dream chat history through /api/chats query alias', () => {
    cy.request<ApiResponse<ChatResponse[]>>({
      method: 'GET',
      url: dreamChatsPathUrl(publicDreamId),
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const chats = requireArrayData(res.body)
      const match = chats.find((chat) => chat.id === chatId)

      expect(match).to.not.eq(undefined)
    })
  })

  it('GET: fetch Dream chat history with limit', () => {
    cy.request<ApiResponse<ChatResponse[]>>({
      method: 'GET',
      url: dreamChatsUrl(publicDreamId, 'limit=2'),
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const chats = requireArrayData(res.body)

      expect(chats).to.have.length.at.most(2)
    })
  })

  it('GET: fetch Dream chat history after a known chat id', () => {
    cy.request<ApiResponse<ChatResponse[]>>({
      method: 'GET',
      url: dreamChatsUrl(publicDreamId, `afterId=${chatId}`),
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const chats = requireArrayData(res.body)
      const oldChat = chats.find((chat) => chat.id === chatId)

      expect(oldChat).to.eq(undefined)
    })
  })

  it('GET: fetch Dream chat history by type', () => {
    cy.request<ApiResponse<ChatResponse[]>>({
      method: 'GET',
      url: dreamChatsUrl(publicDreamId, 'type=BotResponse'),
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const chats = requireArrayData(res.body)
      const allBotResponses = chats.every((chat) => chat.type === 'BotResponse')

      expect(allBotResponses).to.eq(true)
    })
  })

  it('GET: anonymous user cannot fetch private Dream chat history', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: dreamChatsUrl(privateDreamId),
      failOnStatusCode: false,
    }).then((res) => {
      expect([401, 403]).to.include(res.status)
      expect(res.body.success).to.eq(false)
    })
  })

  it('DELETE: rejects archive without auth', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${dreamsUrl}/${publicDreamId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('DELETE: rejects archive with invalid auth', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${dreamsUrl}/${publicDreamId}`,
      headers: {
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('DELETE: archives public Dream by default', () => {
    cy.request<ApiResponse<DreamResponse>>({
      method: 'DELETE',
      url: `${dreamsUrl}/${publicDreamId}`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dream = requireData(res.body)

      expect(dream.id).to.eq(publicDreamId)
      expect(dream.isActive).to.eq(false)
      expect(res.body.message).to.match(/archived/i)
    })
  })

  it('GET: archived Dream is hidden from normal atlas results', () => {
    cy.request<ApiResponse<DreamResponse[]>>({
      method: 'GET',
      url: dreamsUrl,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dreams = requireArrayData(res.body)
      const match = dreams.find((dream) => dream.id === publicDreamId)

      expect(match).to.eq(undefined)
    })
  })

  it('GET: archived Dream appears when showInactive is true', () => {
    cy.request<ApiResponse<DreamResponse[]>>({
      method: 'GET',
      url: `${dreamsUrl}?showInactive=true`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dreams = requireArrayData(res.body)
      const match = dreams.find((dream) => dream.id === publicDreamId)

      expect(match).to.not.eq(undefined)
      expect(match?.isActive).to.eq(false)
    })
  })

  it('POST: archived Dream owner chat behavior is stable', () => {
    cy.request<ApiResponse<ChatResponse>>({
      method: 'POST',
      url: dreamChatCreateUrl(),
      headers: jsonAuthHeaders(),
      body: {
        type: 'Dream',
        sender: 'Cypress Dreamer',
        content:
          'Owner can still leave an archival note after closing the Dream.',
        dreamId: publicDreamId,
        channel: `dream-${publicDreamId}`,
        isPublic: true,
        isMature: false,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect([200, 201, 403]).to.include(res.status)

      if ([200, 201].includes(res.status)) {
        const chat = requireData(res.body)
        expect(chat.dreamId).to.eq(publicDreamId)
      } else {
        expect(res.body.success).to.eq(false)
      }
    })
  })

  it('DELETE: hard deletes archived public Dream cleanup', () => {
    cy.request<ApiResponse<DreamResponse>>({
      method: 'DELETE',
      url: `${dreamsUrl}/${publicDreamId}?hard=true`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dream = requireData(res.body)

      expect(dream.id).to.eq(publicDreamId)
      expect(res.body.message).to.match(/permanently deleted/i)
    })
  })

  it('GET: hard-deleted public Dream returns 404', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${dreamsUrl}/${publicDreamId}`,
      headers: authHeaders(),
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(404)
      expect(res.body.success).to.eq(false)
    })
  })

  it('DELETE: hard deletes private Dream cleanup', () => {
    cy.request<ApiResponse<DreamResponse>>({
      method: 'DELETE',
      url: `${dreamsUrl}/${privateDreamId}?hard=true`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dream = requireData(res.body)

      expect(dream.id).to.eq(privateDreamId)
    })
  })

  it('DELETE: hard deletes brainstorm Dream cleanup', () => {
    cy.request<ApiResponse<DreamResponse>>({
      method: 'DELETE',
      url: `${dreamsUrl}/${brainstormDreamId}?hard=true`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dream = requireData(res.body)

      expect(dream.id).to.eq(brainstormDreamId)
    })
  })
})
