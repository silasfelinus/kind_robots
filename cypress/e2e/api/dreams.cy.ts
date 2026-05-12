// /cypress/e2e/api/dreams.cy.ts
/// <reference types="cypress" />

interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  statusCode?: number
}

type DreamAccessMode = 'OPEN' | 'CODE' | 'PRIVATE' | 'SOLO'

interface DreamResponse {
  id: number
  title: string
  slug?: string | null
  description?: string | null
  currentVibe: string
  currentPrompt?: string | null
  userId: number
  pitchId?: number | null
  artId?: number | null
  artImageId?: number | null
  textServerId?: number | null
  artServerId?: number | null
  artCollectionId?: number | null
  galleryId?: number | null
  scenarioId?: number | null
  accessMode: DreamAccessMode
  privacyCode?: string | null
  isPublic: boolean
  isMature: boolean
  isActive: boolean
  User?: any
  Pitch?: any
  Art?: any
  ArtImage?: any
  ArtCollection?: any
  Gallery?: any
  Scenario?: any
  Tags?: any[]
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
  sender: string
  recipient?: string | null
  content: string
  title?: string | null
  isPublic: boolean
  isFavorite: boolean
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
  isRead: boolean
  isMature: boolean
  dreamId?: number | null
  serverId?: number | null
}

function requireData<T>(body: ApiResponse<T>): T {
  expect(body.success).to.eq(true)
  expect(body.data, body.message || 'Expected response data').to.exist

  return body.data as T
}

function requireArrayData<T>(body: ApiResponse<T[]>): T[] {
  expect(body.success).to.eq(true)
  expect(body.data, body.message || 'Expected response array data').to.be.an(
    'array',
  )

  return body.data as T[]
}

describe('Dream API location model tests', () => {
  const API_BASE =
    (Cypress.config('baseUrl') as string) ?? 'https://kind-robots.vercel.app'

  const dreamsUrl = `${API_BASE}/api/dreams`

  const invalidToken = 'someInvalidTokenValue'
  const testUserId = 9

  let userToken = ''

  let openDreamId = 0
  let privateDreamId = 0
  let codeDreamId = 0
  let createdCollectionId: number | null = null
  let chatId = 0
  let botResponseChatId = 0

  const time = Date.now()
  const originalCode = `lantern-${time}`
  const updatedCode = `${originalCode}-updated`

  const openDreamTitle = `Cypress Lantern Greenhouse ${time}`
  const privateDreamTitle = `Cypress Hidden Dreamhouse ${time}`
  const codeDreamTitle = `Cypress Code Dreamhouse ${time}`

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

  const dreamChatsUrl = (dreamId: number, query = '') => {
    const params = new URLSearchParams(query)

    if (!params.has('dreamId')) {
      params.set('dreamId', String(dreamId))
    }

    return `${dreamsUrl}/chats?${params.toString()}`
  }

  const dreamChatsPathUrl = (dreamId: number, query = '') => {
    const suffix = query ? `?${query}` : ''

    return `${dreamsUrl}/chats/${dreamId}${suffix}`
  }

  const expectDreamLocationShape = (dream: DreamResponse) => {
    expect(dream.id).to.be.a('number')
    expect(dream.title).to.be.a('string').and.not.be.empty
    expect(dream.currentVibe).to.be.a('string').and.not.be.empty
    expect(dream).to.have.property('accessMode')
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
    cy.env(['USER_TOKEN']).then((env) => {
      userToken = String(env.USER_TOKEN || '')
      expect(userToken, 'USER_TOKEN').to.be.a('string').and.not.be.empty
    })
  })

  after(() => {
    hardDeleteDream(openDreamId)
    hardDeleteDream(privateDreamId)
    hardDeleteDream(codeDreamId)
  })

  it('POST: rejects Dream creation without auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: dreamsUrl,
      headers: jsonHeaders(),
      body: {
        title: `Unauthorized Dream ${time}`,
        currentVibe: 'This should fail.',
        userId: testUserId,
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
        currentVibe: 'This should fail too.',
        userId: testUserId,
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
        currentVibe: 'No title, no dream.',
        userId: testUserId,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400)
      expect(res.body.success).to.eq(false)
      expect(res.body.message).to.include('title')
    })
  })

  it('POST: rejects Dream creation without currentVibe', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: dreamsUrl,
      headers: jsonAuthHeaders(),
      body: {
        title: `No Vibe Dream ${time}`,
        userId: testUserId,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400)
      expect(res.body.success).to.eq(false)
      expect(res.body.message).to.include('currentVibe')
    })
  })

  it('POST: creates an OPEN public Dream location with an ArtCollection', () => {
    cy.request<ApiResponse<DreamResponse>>({
      method: 'POST',
      url: dreamsUrl,
      headers: jsonAuthHeaders(),
      body: {
        title: openDreamTitle,
        slug: `cypress-lantern-greenhouse-${time}`,
        description:
          'A Cypress-created Dream location for testing the Dream atlas.',
        currentVibe:
          'A bright lantern greenhouse where robot philosophers trade jokes with hyperactive butterflies.',
        currentPrompt:
          'bright lantern greenhouse, robot philosophers, hyperactive butterflies, cozy surreal fantasy, cinematic lighting',
        userId: testUserId,
        accessMode: 'OPEN',
        isPublic: true,
        isMature: false,
        isActive: true,
        createCollection: true,
      },
    }).then((res) => {
      expect(res.status).to.eq(201)

      const dream = requireData(res.body)

      expectDreamLocationShape(dream)
      expect(dream.title).to.eq(openDreamTitle)
      expect(dream.accessMode).to.eq('OPEN')
      expect(dream.isPublic).to.eq(true)

      openDreamId = dream.id
      createdCollectionId = dream.artCollectionId ?? null

      expect(openDreamId).to.be.a('number')
      expect(createdCollectionId, 'created ArtCollection id').to.be.a('number')
    })
  })

  it('POST: creates a PRIVATE Dream location', () => {
    cy.request<ApiResponse<DreamResponse>>({
      method: 'POST',
      url: dreamsUrl,
      headers: jsonAuthHeaders(),
      body: {
        title: privateDreamTitle,
        slug: `cypress-private-dreamhouse-${time}`,
        description:
          'A private Cypress-created Dream location for ownership testing.',
        currentVibe:
          'A hidden robot speakeasy under a library of sleeping stars.',
        currentPrompt:
          'hidden robot speakeasy, sleeping stars, library basement, whimsical noir',
        userId: testUserId,
        accessMode: 'PRIVATE',
        isPublic: false,
        isMature: false,
        isActive: true,
      },
    }).then((res) => {
      expect(res.status).to.eq(201)

      const dream = requireData(res.body)

      expectDreamLocationShape(dream)
      expect(dream.title).to.eq(privateDreamTitle)
      expect(dream.accessMode).to.eq('PRIVATE')
      expect(dream.isPublic).to.eq(false)

      privateDreamId = dream.id

      expect(privateDreamId).to.be.a('number')
    })
  })

  it('POST: creates a CODE Dream location', () => {
    cy.request<ApiResponse<DreamResponse>>({
      method: 'POST',
      url: dreamsUrl,
      headers: jsonAuthHeaders(),
      body: {
        title: codeDreamTitle,
        slug: `cypress-code-dreamhouse-${time}`,
        description:
          'A Cypress-created Dream location protected by a privacy code.',
        currentVibe:
          'A coded lantern parlor where secret doors only open when the phrase is charming enough.',
        currentPrompt:
          'coded lantern parlor, secret doors, glowing privacy sigils, cozy mystery fantasy',
        userId: testUserId,
        accessMode: 'CODE',
        privacyCode: originalCode,
        isPublic: false,
        isMature: false,
        isActive: true,
      },
    }).then((res) => {
      expect(res.status).to.eq(201)

      const dream = requireData(res.body)

      expectDreamLocationShape(dream)
      expect(dream.title).to.eq(codeDreamTitle)
      expect(dream.accessMode).to.eq('CODE')
      expect(dream.isPublic).to.eq(false)

      codeDreamId = dream.id

      expect(codeDreamId).to.be.a('number')
    })
  })

  it('GET: anonymous atlas fetch sees OPEN public Dream', () => {
    cy.request<ApiResponse<DreamResponse[]>>({
      method: 'GET',
      url: dreamsUrl,
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dreams = requireArrayData(res.body)
      const match = dreams.find((dream) => dream.id === openDreamId)

      expect(match).to.not.eq(undefined)
      expect(match?.accessMode).to.eq('OPEN')
    })
  })

  it('GET: anonymous atlas fetch does not show PRIVATE or CODE Dreams', () => {
    cy.request<ApiResponse<DreamResponse[]>>({
      method: 'GET',
      url: dreamsUrl,
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dreams = requireArrayData(res.body)
      const privateMatch = dreams.find((dream) => dream.id === privateDreamId)
      const codeMatch = dreams.find((dream) => dream.id === codeDreamId)

      expect(privateMatch).to.eq(undefined)
      expect(codeMatch).to.eq(undefined)
    })
  })

  it('GET: authenticated atlas fetch sees owned OPEN, PRIVATE, and CODE Dreams', () => {
    cy.request<ApiResponse<DreamResponse[]>>({
      method: 'GET',
      url: dreamsUrl,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dreams = requireArrayData(res.body)
      const openMatch = dreams.find((dream) => dream.id === openDreamId)
      const privateMatch = dreams.find((dream) => dream.id === privateDreamId)
      const codeMatch = dreams.find((dream) => dream.id === codeDreamId)

      expect(openMatch).to.not.eq(undefined)
      expect(privateMatch).to.not.eq(undefined)
      expect(codeMatch).to.not.eq(undefined)
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
      const openMatch = dreams.find((dream) => dream.id === openDreamId)
      const privateMatch = dreams.find((dream) => dream.id === privateDreamId)
      const codeMatch = dreams.find((dream) => dream.id === codeDreamId)

      expect(openMatch).to.not.eq(undefined)
      expect(privateMatch).to.not.eq(undefined)
      expect(codeMatch).to.not.eq(undefined)
    })
  })

  it('GET: atlas can filter by ArtCollection', () => {
    expect(createdCollectionId, 'created ArtCollection id').to.be.a('number')

    cy.request<ApiResponse<DreamResponse[]>>({
      method: 'GET',
      url: `${dreamsUrl}?artCollectionId=${createdCollectionId}`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dreams = requireArrayData(res.body)
      const match = dreams.find((dream) => dream.id === openDreamId)

      expect(match).to.not.eq(undefined)
      expect(match?.artCollectionId).to.eq(createdCollectionId)
    })
  })

  it('GET: atlas can search by title text', () => {
    cy.request<ApiResponse<DreamResponse[]>>({
      method: 'GET',
      url: `${dreamsUrl}?search=${encodeURIComponent(openDreamTitle)}`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dreams = requireArrayData(res.body)
      const match = dreams.find((dream) => dream.id === openDreamId)

      expect(match).to.not.eq(undefined)
    })
  })

  it('GET: fetch OPEN public Dream by ID anonymously', () => {
    cy.request<ApiResponse<DreamResponse>>({
      method: 'GET',
      url: `${dreamsUrl}/${openDreamId}`,
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dream = requireData(res.body)

      expectDreamLocationShape(dream)
      expect(dream.id).to.eq(openDreamId)
      expect(dream.title).to.eq(openDreamTitle)
      expect(dream.accessMode).to.eq('OPEN')
    })
  })

  it('GET: fetch PRIVATE Dream by ID with auth', () => {
    cy.request<ApiResponse<DreamResponse>>({
      method: 'GET',
      url: `${dreamsUrl}/${privateDreamId}`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dream = requireData(res.body)

      expectDreamLocationShape(dream)
      expect(dream.id).to.eq(privateDreamId)
      expect(dream.title).to.eq(privateDreamTitle)
      expect(dream.accessMode).to.eq('PRIVATE')
      expect(dream.isPublic).to.eq(false)
    })
  })

  it('GET: anonymous user cannot fetch PRIVATE Dream by ID', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${dreamsUrl}/${privateDreamId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
      expect(res.body.success).to.eq(false)
    })
  })

  it('GET: anonymous user cannot fetch CODE Dream by ID without code', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${dreamsUrl}/${codeDreamId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect([401, 403]).to.include(res.status)
      expect(res.body.success).to.eq(false)
    })
  })

  it('GET: anonymous user cannot fetch CODE Dream by ID with wrong code', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${dreamsUrl}/${codeDreamId}?privacyCode=wrong-${originalCode}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
      expect(res.body.success).to.eq(false)
    })
  })

  it('GET: anonymous user can fetch CODE Dream by ID with correct code', () => {
    cy.request<ApiResponse<DreamResponse>>({
      method: 'GET',
      url: `${dreamsUrl}/${codeDreamId}?privacyCode=${encodeURIComponent(
        originalCode,
      )}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dream = requireData(res.body)

      expectDreamLocationShape(dream)
      expect(dream.id).to.eq(codeDreamId)
      expect(dream.accessMode).to.eq('CODE')
    })
  })

  it('PATCH: updates OPEN Dream location state', () => {
    const updatedTitle = `Updated ${openDreamTitle}`

    cy.request<ApiResponse<DreamResponse>>({
      method: 'PATCH',
      url: `${dreamsUrl}/${openDreamId}`,
      headers: jsonAuthHeaders(),
      body: {
        title: updatedTitle,
        description: 'Updated by Cypress as a reusable Dream location.',
        currentVibe:
          'The greenhouse becomes a floating lantern market for tiny robot philosophers.',
        currentPrompt:
          'floating lantern market, tiny robot philosophers, dreamy greenhouse, luminous cozy fantasy',
        accessMode: 'OPEN',
        updateNote: 'Cypress reshaped the Dream location.',
      },
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dream = requireData(res.body)

      expect(dream.title).to.eq(updatedTitle)
      expect(dream.currentVibe).to.include('floating lantern market')
      expect(dream.currentPrompt).to.include('tiny robot philosophers')
    })
  })

  it('PATCH: updates CODE Dream privacy code', () => {
    cy.request<ApiResponse<DreamResponse>>({
      method: 'PATCH',
      url: `${dreamsUrl}/${codeDreamId}`,
      headers: jsonAuthHeaders(),
      body: {
        accessMode: 'CODE',
        privacyCode: updatedCode,
        updateNote: 'Cypress rotated the Dream privacy code.',
      },
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dream = requireData(res.body)

      expect(dream.accessMode).to.eq('CODE')
    })

    cy.request<ApiResponse<DreamResponse>>({
      method: 'GET',
      url: `${dreamsUrl}/${codeDreamId}?privacyCode=${encodeURIComponent(
        updatedCode,
      )}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dream = requireData(res.body)

      expect(dream.id).to.eq(codeDreamId)
    })
  })

  it('PATCH: rejects update without auth', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${dreamsUrl}/${openDreamId}`,
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
      url: `${dreamsUrl}/${openDreamId}`,
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
      url: `${dreamsUrl}/${openDreamId}`,
      headers: jsonAuthHeaders(),
      body: {
        title: '   ',
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400)
      expect(res.body.success).to.eq(false)
      expect(res.body.message).to.include('title')
    })
  })

  it('PATCH: rejects empty currentVibe', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${dreamsUrl}/${openDreamId}`,
      headers: jsonAuthHeaders(),
      body: {
        currentVibe: '   ',
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400)
      expect(res.body.success).to.eq(false)
      expect(res.body.message).to.include('currentVibe')
    })
  })

  it('POST: adds a Dream room chat entry', () => {
    cy.request<ApiResponse<ChatResponse>>({
      method: 'POST',
      url: dreamChatsUrl(openDreamId),
      headers: jsonAuthHeaders(),
      body: {
        type: 'Dream',
        title: 'Cypress first arrival',
        content:
          'Add a silver fox made of moonlight and make the greenhouse warmer.',
        userId: testUserId,
        dreamId: openDreamId,
        isPublic: true,
        isMature: false,
      },
    }).then((res) => {
      expect(res.status).to.eq(201)

      const chat = requireData(res.body)

      expect(chat.id).to.be.a('number')
      expect(chat.dreamId).to.eq(openDreamId)
      expect(chat.content).to.include('silver fox')
      expect(chat.channel).to.eq(`dream-${openDreamId}`)

      chatId = chat.id
    })
  })

  it('POST: adds a model response chat and updates Dream state', () => {
    cy.request<ApiResponse<ChatResponse>>({
      method: 'POST',
      url: dreamChatsUrl(openDreamId),
      headers: jsonAuthHeaders(),
      body: {
        type: 'BotResponse',
        sender: 'Dream',
        title: 'Cypress room response',
        content:
          'The dream warms. A silver fox curls beneath the lanterns, scattering moonlit sparks.',
        botResponse:
          'The dream warms. A silver fox curls beneath the lanterns, scattering moonlit sparks.',
        userId: testUserId,
        dreamId: openDreamId,
        updateDream: true,
        currentVibe:
          'A warm floating greenhouse market where a moonlit fox guides tiny robot philosophers.',
        currentPrompt:
          'warm floating greenhouse market, moonlit silver fox, tiny robot philosophers, cozy surreal fantasy',
        isPublic: true,
        isMature: false,
      },
    }).then((res) => {
      expect(res.status).to.eq(201)

      const chat = requireData(res.body)

      expect(chat.id).to.be.a('number')
      expect(chat.type).to.eq('BotResponse')
      expect(chat.botResponse).to.include('silver fox')

      botResponseChatId = chat.id
    })

    cy.request<ApiResponse<DreamResponse>>({
      method: 'GET',
      url: `${dreamsUrl}/${openDreamId}`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dream = requireData(res.body)

      expect(dream.currentVibe).to.include('moonlit fox')
      expect(dream.currentPrompt).to.include('moonlit silver fox')
    })
  })

  it('POST: rejects Dream chat without auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: dreamChatsUrl(openDreamId),
      headers: jsonHeaders(),
      body: {
        content: 'This should fail.',
        userId: testUserId,
        dreamId: openDreamId,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('POST: rejects Dream chat with invalid auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: dreamChatsUrl(openDreamId),
      headers: {
        Authorization: `Bearer ${invalidToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        content: 'This should fail too.',
        userId: testUserId,
        dreamId: openDreamId,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('POST: rejects Dream chat without content', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: dreamChatsUrl(openDreamId),
      headers: jsonAuthHeaders(),
      body: {
        type: 'Dream',
        userId: testUserId,
        dreamId: openDreamId,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400)
      expect(res.body.success).to.eq(false)
      expect(res.body.message).to.include('content')
    })
  })

  it('POST: allows owner to mutate private Dream through chat', () => {
    cy.request<ApiResponse<ChatResponse>>({
      method: 'POST',
      url: dreamChatsUrl(privateDreamId),
      headers: jsonAuthHeaders(),
      body: {
        type: 'Dream',
        content: 'This owner-authenticated request is allowed to chat.',
        dreamId: privateDreamId,
        updateDream: true,
        currentVibe: 'Owner reshaped private Dream through chat.',
        isPublic: false,
        isMature: false,
      },
    }).then((res) => {
      expect(res.status).to.eq(201)

      const chat = requireData(res.body)

      expect(chat.dreamId).to.eq(privateDreamId)
      expect(chat.content).to.include('owner-authenticated')
    })
  })

  it('GET: fetch Dream chat history through query route', () => {
    cy.request<ApiResponse<ChatResponse[]>>({
      method: 'GET',
      url: dreamChatsUrl(openDreamId),
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

  it('GET: fetch Dream chat history through path route', () => {
    cy.request<ApiResponse<ChatResponse[]>>({
      method: 'GET',
      url: dreamChatsPathUrl(openDreamId),
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
      url: dreamChatsUrl(openDreamId, 'limit=2'),
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
      url: dreamChatsUrl(openDreamId, `afterId=${chatId}`),
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
      url: dreamChatsUrl(openDreamId, 'type=BotResponse'),
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
      expect(res.status).to.eq(403)
      expect(res.body.success).to.eq(false)
    })
  })

  it('DELETE: rejects archive without auth', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${dreamsUrl}/${openDreamId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('DELETE: rejects archive with invalid auth', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${dreamsUrl}/${openDreamId}`,
      headers: {
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('DELETE: archives OPEN Dream by default', () => {
    cy.request<ApiResponse<DreamResponse>>({
      method: 'DELETE',
      url: `${dreamsUrl}/${openDreamId}`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dream = requireData(res.body)

      expect(dream.id).to.eq(openDreamId)
      expect(dream.isActive).to.eq(false)
      expect(res.body.message).to.include('archived')
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
      const match = dreams.find((dream) => dream.id === openDreamId)

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
      const match = dreams.find((dream) => dream.id === openDreamId)

      expect(match).to.not.eq(undefined)
      expect(match?.isActive).to.eq(false)
    })
  })

  it('POST: archived Dream owner chat behavior is stable', () => {
    cy.request<ApiResponse<ChatResponse>>({
      method: 'POST',
      url: dreamChatsUrl(openDreamId),
      headers: jsonAuthHeaders(),
      body: {
        type: 'Dream',
        content:
          'Owner can still leave an archival note after closing the Dream location.',
        dreamId: openDreamId,
        isPublic: true,
        isMature: false,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect([201, 403]).to.include(res.status)

      if (res.status === 201) {
        const chat = requireData(res.body)
        expect(chat.dreamId).to.eq(openDreamId)
      } else {
        expect(res.body.success).to.eq(false)
      }
    })
  })

  it('DELETE: hard deletes archived OPEN Dream cleanup', () => {
    cy.request<ApiResponse<DreamResponse>>({
      method: 'DELETE',
      url: `${dreamsUrl}/${openDreamId}?hard=true`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dream = requireData(res.body)

      expect(dream.id).to.eq(openDreamId)
      expect(res.body.message).to.include('permanently deleted')
    })
  })

  it('GET: hard-deleted OPEN Dream returns 404', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${dreamsUrl}/${openDreamId}`,
      headers: authHeaders(),
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(404)
      expect(res.body.success).to.eq(false)
    })
  })

  it('GET: hard-deleted OPEN Dream chat history returns 404', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: dreamChatsUrl(openDreamId),
      headers: authHeaders(),
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(404)
      expect(res.body.success).to.eq(false)
    })
  })

  it('DELETE: hard deletes PRIVATE Dream cleanup', () => {
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

  it('DELETE: hard deletes CODE Dream cleanup', () => {
    cy.request<ApiResponse<DreamResponse>>({
      method: 'DELETE',
      url: `${dreamsUrl}/${codeDreamId}?hard=true`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dream = requireData(res.body)

      expect(dream.id).to.eq(codeDreamId)
    })
  })

  it('GET: hard-deleted PRIVATE Dream returns 404', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${dreamsUrl}/${privateDreamId}`,
      headers: authHeaders(),
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(404)
      expect(res.body.success).to.eq(false)
    })
  })

  it('GET: hard-deleted CODE Dream returns 404', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${dreamsUrl}/${codeDreamId}`,
      headers: authHeaders(),
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(404)
      expect(res.body.success).to.eq(false)
    })
  })
})
