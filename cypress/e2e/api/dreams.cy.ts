// /cypress/e2e/api/dreams.cy.ts
/// <reference types="cypress" />

interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  statusCode?: number
}

describe('Dream API Full CRUD + Chat History Tests', () => {
  const API_BASE = Cypress.env('API_BASE') ?? 'https://kind-robots.vercel.app'
  const dreamsUrl = `${API_BASE}/api/dreams`

  const apiKey = Cypress.env('API_KEY')
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  const testUserId = 9

  let publicDreamId: number
  let privateDreamId: number
  let createdCollectionId: number | null = null
  let chatId: number

  const time = Date.now()
  const publicDreamTitle = `Dream-${time}`
  const privateDreamTitle = `Private-Dream-${time}`

  before(() => {
    expect(userToken, 'Cypress.env("USER_TOKEN")').to.be.a('string').and.not.be
      .empty
  })

  it('POST: rejects Dream creation without auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: dreamsUrl,
      headers: {
        'Content-Type': 'application/json',
      },
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

  it('POST: creates a public Dream with an ArtCollection', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: dreamsUrl,
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: publicDreamTitle,
        slug: `dream-${time}`,
        description: 'Cypress public dream test.',
        currentVibe:
          'A cozy neon greenhouse where robot philosophers trade jokes with butterflies.',
        currentPrompt:
          'cozy neon greenhouse, robot philosophers, butterflies, dreamy cinematic lighting',
        userId: testUserId,
        isPublic: true,
        isMature: false,
        isActive: true,
        createCollection: true,
      },
    }).then((res) => {
      expect(res.status).to.eq(201)
      expect(res.body.success).to.eq(true)
      expect(res.body.data).to.have.property('id')
      expect(res.body.data.title).to.eq(publicDreamTitle)
      expect(res.body.data.isPublic).to.eq(true)

      publicDreamId = res.body.data.id
      createdCollectionId = res.body.data.artCollectionId ?? null

      expect(publicDreamId).to.be.a('number')
      expect(createdCollectionId, 'created ArtCollection id').to.be.a('number')
    })
  })

  it('POST: creates a private Dream', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: dreamsUrl,
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: privateDreamTitle,
        slug: `private-dream-${time}`,
        description: 'Cypress private dream test.',
        currentVibe: 'A hidden robot speakeasy under a sleeping library.',
        currentPrompt:
          'hidden robot speakeasy, sleeping library, whimsical noir',
        userId: testUserId,
        isPublic: false,
        isMature: false,
        isActive: true,
      },
    }).then((res) => {
      expect(res.status).to.eq(201)
      expect(res.body.success).to.eq(true)
      expect(res.body.data).to.have.property('id')
      expect(res.body.data.isPublic).to.eq(false)

      privateDreamId = res.body.data.id
      expect(privateDreamId).to.be.a('number')
    })
  })

  it('POST: rejects Dream creation without title', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: dreamsUrl,
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
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
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
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

  it('GET: anonymous fetch sees public Dream', () => {
    cy.request<ApiResponse<any[]>>({
      method: 'GET',
      url: dreamsUrl,
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data).to.be.an('array')

      const match = res.body.data?.find((dream) => dream.id === publicDreamId)
      expect(match).to.not.eq(undefined)
    })
  })

  it('GET: anonymous fetch does not see private Dream in list', () => {
    cy.request<ApiResponse<any[]>>({
      method: 'GET',
      url: dreamsUrl,
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)

      const match = res.body.data?.find((dream) => dream.id === privateDreamId)
      expect(match).to.eq(undefined)
    })
  })

  it('GET: authenticated fetch sees public and private Dreams', () => {
    cy.request<ApiResponse<any[]>>({
      method: 'GET',
      url: dreamsUrl,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)

      const publicMatch = res.body.data?.find(
        (dream) => dream.id === publicDreamId,
      )
      const privateMatch = res.body.data?.find(
        (dream) => dream.id === privateDreamId,
      )

      expect(publicMatch).to.not.eq(undefined)
      expect(privateMatch).to.not.eq(undefined)
    })
  })

  it('GET: authenticated userOnly fetch returns created Dreams', () => {
    cy.request<ApiResponse<any[]>>({
      method: 'GET',
      url: `${dreamsUrl}?userOnly=true`,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)

      const publicMatch = res.body.data?.find(
        (dream) => dream.id === publicDreamId,
      )
      const privateMatch = res.body.data?.find(
        (dream) => dream.id === privateDreamId,
      )

      expect(publicMatch).to.not.eq(undefined)
      expect(privateMatch).to.not.eq(undefined)
    })
  })

  it('GET: fetch public Dream by ID anonymously', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${dreamsUrl}/${publicDreamId}`,
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data.id).to.eq(publicDreamId)
      expect(res.body.data.title).to.eq(publicDreamTitle)
    })
  })

  it('GET: fetch private Dream by ID with auth', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${dreamsUrl}/${privateDreamId}`,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data.id).to.eq(privateDreamId)
      expect(res.body.data.title).to.eq(privateDreamTitle)
      expect(res.body.data.isPublic).to.eq(false)
    })
  })

  it('GET: anonymous user cannot fetch private Dream by ID', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${dreamsUrl}/${privateDreamId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
      expect(res.body.success).to.eq(false)
    })
  })

  it('PATCH: updates public Dream', () => {
    const updatedTitle = `Updated-${publicDreamTitle}`

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${dreamsUrl}/${publicDreamId}`,
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: updatedTitle,
        description: 'Updated by Cypress.',
        currentVibe:
          'The greenhouse becomes a floating lantern market for tiny robot philosophers.',
        currentPrompt:
          'floating lantern market, tiny robot philosophers, dreamy greenhouse, luminous cozy fantasy',
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data.title).to.eq(updatedTitle)
      expect(res.body.data.currentVibe).to.include('floating lantern market')
    })
  })

  it('PATCH: rejects update without auth', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${dreamsUrl}/${publicDreamId}`,
      headers: {
        'Content-Type': 'application/json',
      },
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

  it('POST: adds a Dream chat entry', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${dreamsUrl}/${publicDreamId}/chats`,
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        type: 'Dream',
        content:
          'Add a silver fox made of moonlight and make the greenhouse warmer.',
        userId: testUserId,
        isPublic: true,
        isMature: false,
      },
    }).then((res) => {
      expect(res.status).to.eq(201)
      expect(res.body.success).to.eq(true)
      expect(res.body.data.id).to.be.a('number')
      expect(res.body.data.dreamId).to.eq(publicDreamId)
      expect(res.body.data.content).to.include('silver fox')

      chatId = res.body.data.id
    })
  })

  it('POST: adds a model response chat and updates Dream state', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${dreamsUrl}/${publicDreamId}/chats`,
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        type: 'BotResponse',
        sender: 'Dream',
        content:
          'The dream warms. A silver fox curls beneath the lanterns, scattering moonlit sparks.',
        botResponse:
          'The dream warms. A silver fox curls beneath the lanterns, scattering moonlit sparks.',
        userId: testUserId,
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
      expect(res.body.success).to.eq(true)
      expect(res.body.data.type).to.eq('BotResponse')
    })

    cy.request<ApiResponse>({
      method: 'GET',
      url: `${dreamsUrl}/${publicDreamId}`,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.data.currentVibe).to.include('moonlit fox')
      expect(res.body.data.currentPrompt).to.include('moonlit silver fox')
    })
  })

  it('POST: rejects Dream chat without auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: `${dreamsUrl}/${publicDreamId}/chats`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        content: 'This should fail.',
        userId: testUserId,
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
      url: `${dreamsUrl}/${publicDreamId}/chats`,
      headers: {
        Authorization: `Bearer ${invalidToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        content: 'This should fail too.',
        userId: testUserId,
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
      url: `${dreamsUrl}/${publicDreamId}/chats`,
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        type: 'Dream',
        userId: testUserId,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400)
      expect(res.body.success).to.eq(false)
      expect(res.body.message).to.include('content')
    })
  })

  it('GET: fetch Dream chat history', () => {
    cy.request<ApiResponse<any[]>>({
      method: 'GET',
      url: `${dreamsUrl}/${publicDreamId}/chats`,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data).to.be.an('array')

      const match = res.body.data?.find((chat) => chat.id === chatId)
      expect(match).to.not.eq(undefined)
    })
  })

  it('GET: fetch Dream chat history with limit', () => {
    cy.request<ApiResponse<any[]>>({
      method: 'GET',
      url: `${dreamsUrl}/${publicDreamId}/chats?limit=2`,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data, 'chat history data').to.exist
      expect(res.body.data ?? []).to.have.length.at.most(2)
    })
  })

  it('DELETE: rejects delete without auth', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${dreamsUrl}/${publicDreamId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('DELETE: rejects delete with invalid auth', () => {
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

  it('DELETE: hard deletes public Dream', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${dreamsUrl}/${publicDreamId}`,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data.id).to.eq(publicDreamId)
      expect(res.body.message).to.include('deleted successfully')
    })
  })

  it('GET: hard-deleted Dream returns 404', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${dreamsUrl}/${publicDreamId}`,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(404)
      expect(res.body.success).to.eq(false)
    })
  })

  it('GET: hard-deleted Dream chat history returns 404', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${dreamsUrl}/${publicDreamId}/chats`,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(404)
      expect(res.body.success).to.eq(false)
    })
  })

  it('DELETE: hard deletes private Dream cleanup', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${dreamsUrl}/${privateDreamId}`,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data.id).to.eq(privateDreamId)
    })
  })

  it('GET: hard-deleted private Dream returns 404', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${dreamsUrl}/${privateDreamId}`,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(404)
      expect(res.body.success).to.eq(false)
    })
  })
})
