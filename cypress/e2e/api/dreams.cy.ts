/// <reference types="cypress" />

import {
  adminHeaders,
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
  invalidBearerHeaders,
  jsonHeaders,
  type TestUserAuth,
} from '../../support/api-auth'

interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  count?: number
  statusCode?: number
}

type DreamType =
  | 'ART'
  | 'BRAINSTORM'
  | 'CHARACTER'
  | 'PROJECT'
  | 'REWARD'
  | 'SCENARIO'
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
}

interface ChatResponse {
  id: number
  type: string
  sender?: string | null
  recipient?: string | null
  content: string
  title?: string | null
  isPublic: boolean
  userId?: number | null
  dreamId?: number | null
  channel?: string | null
  botResponse?: string | null
  isMature: boolean
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

describe('Dream API tests', () => {
  let apiBase = ''
  let adminToken = ''
  let user: TestUserAuth | undefined
  let publicDreamId = 0
  let privateDreamId = 0
  let brainstormDreamId = 0
  let chatId = 0

  const time = Date.now()
  const publicDreamTitle = `Cypress Lantern Greenhouse ${time}`
  const privateDreamTitle = `Cypress Hidden Dreamhouse ${time}`
  const brainstormDreamTitle = `Cypress Brainstorm Dream ${time}`

  const dreamsUrl = () => `${apiBase}/dreams`
  const chatsUrl = () => `${apiBase}/chats`

  const authHeaders = () => {
    expect(user).to.exist
    return bearerHeaders(user!.token)
  }

  const hardDeleteDream = (dreamId: number) => {
    if (!dreamId || !user) return

    cy.request<ApiResponse<DreamResponse>>({
      method: 'DELETE',
      url: `${dreamsUrl()}/${dreamId}`,
      headers: authHeaders(),
      failOnStatusCode: false,
    })
  }

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

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken

        return createLoggedInTestUser({ fresh: true })
      })
      .then((auth) => {
        user = auth
      })
  })

  after(() => {
    hardDeleteDream(publicDreamId)
    hardDeleteDream(privateDreamId)
    hardDeleteDream(brainstormDreamId)

    deleteTestUser(apiBase, adminToken, user?.id)
  })

  it('POST: rejects Dream creation without auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: dreamsUrl(),
      headers: jsonHeaders(),
      body: {
        title: `Unauthorized Dream ${time}`,
        description: 'This should fail.',
        pitch: 'This should fail.',
        userId: user?.id,
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
      url: dreamsUrl(),
      headers: invalidBearerHeaders(),
      body: {
        title: `Invalid Token Dream ${time}`,
        description: 'This should fail too.',
        pitch: 'This should fail too.',
        userId: user?.id,
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
      url: dreamsUrl(),
      headers: authHeaders(),
      body: {
        description: 'No title, no dream.',
        pitch: 'No title, no dream.',
        userId: user?.id,
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
      url: dreamsUrl(),
      headers: authHeaders(),
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
        userId: user?.id,
        isPublic: true,
        isMature: false,
      },
    }).then((res) => {
      expect(res.status, JSON.stringify(res.body)).to.eq(201)

      const dream = requireData(res.body)

      expectDreamShape(dream)
      expect(dream.title).to.eq(publicDreamTitle)
      expect(dream.dreamType).to.eq('LOCATION')
      expect(dream.creationSource).to.eq('HUMAN')
      expect(dream.isPublic).to.eq(true)

      publicDreamId = dream.id
      expect(publicDreamId).to.be.a('number')
    })
  })

  it('POST: creates a private PITCH Dream', () => {
    cy.request<ApiResponse<DreamResponse>>({
      method: 'POST',
      url: dreamsUrl(),
      headers: authHeaders(),
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
        userId: user?.id,
        isPublic: false,
        isMature: false,
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
      url: dreamsUrl(),
      headers: authHeaders(),
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
        userId: user?.id,
        isPublic: false,
        isMature: false,
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

  it('GET: anonymous atlas fetch sees public Dreams only', () => {
    cy.request<ApiResponse<DreamResponse[]>>({
      method: 'GET',
      url: dreamsUrl(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dreams = requireArrayData(res.body)
      const publicMatch = dreams.find((dream) => dream.id === publicDreamId)
      const privateMatch = dreams.find((dream) => dream.id === privateDreamId)
      const brainstormMatch = dreams.find(
        (dream) => dream.id === brainstormDreamId,
      )

      expect(publicMatch).to.not.eq(undefined)
      expect(privateMatch).to.eq(undefined)
      expect(brainstormMatch).to.eq(undefined)
    })
  })

  it('GET: authenticated userOnly atlas fetch returns owned Dreams', () => {
    cy.request<ApiResponse<DreamResponse[]>>({
      method: 'GET',
      url: `${dreamsUrl()}?userOnly=true`,
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

  it('GET: fetch public Dream by ID anonymously', () => {
    cy.request<ApiResponse<DreamResponse>>({
      method: 'GET',
      url: `${dreamsUrl()}/${publicDreamId}`,
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
      url: `${dreamsUrl()}/${privateDreamId}`,
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
      url: `${dreamsUrl()}/${privateDreamId}`,
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
      url: `${dreamsUrl()}/${publicDreamId}`,
      headers: authHeaders(),
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

  it('POST: adds a Dream room chat entry', () => {
    cy.request<ApiResponse<ChatResponse>>({
      method: 'POST',
      url: chatsUrl(),
      headers: authHeaders(),
      body: {
        type: 'Dream',
        sender: 'Cypress Dreamer',
        title: 'Cypress first arrival',
        content:
          'Add a silver fox made of moonlight and make the greenhouse warmer.',
        userId: user?.id,
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

  it('GET: fetch Dream chat history through /api/chats query', () => {
    cy.request<ApiResponse<ChatResponse[]>>({
      method: 'GET',
      url: `${chatsUrl()}?dreamId=${publicDreamId}`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const chats = requireArrayData(res.body)
      const match = chats.find((chat) => chat.id === chatId)

      expect(match).to.not.eq(undefined)
    })
  })

  it('DELETE: rejects delete without auth', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${dreamsUrl()}/${publicDreamId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('DELETE: rejects delete with invalid auth', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${dreamsUrl()}/${publicDreamId}`,
      headers: invalidBearerHeaders(),
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('DELETE: hard deletes public Dream by default', () => {
    cy.request<ApiResponse<DreamResponse>>({
      method: 'DELETE',
      url: `${dreamsUrl()}/${publicDreamId}`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dream = requireData(res.body)

      expect(dream.id).to.eq(publicDreamId)
      expect(res.body.message).to.match(/deleted/i)
    })
  })

  it('GET: hard-deleted public Dream returns 404', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${dreamsUrl()}/${publicDreamId}`,
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
      url: `${dreamsUrl()}/${privateDreamId}`,
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
      url: `${dreamsUrl()}/${brainstormDreamId}`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)

      const dream = requireData(res.body)

      expect(dream.id).to.eq(brainstormDreamId)
    })
  })
})