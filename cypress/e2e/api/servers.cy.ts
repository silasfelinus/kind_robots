// /cypress/e2e/api/server.cy.ts
/// <reference types="cypress" />

interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  statusCode?: number
  user?: T
}

describe('Server API Full CRUD + Ownership Tests', () => {
  const API_BASE = Cypress.env('API_BASE') ?? 'https://kind-robots.vercel.app'
  const baseUrl = `${API_BASE}/api/server`

  const userA_apiKey = Cypress.env('USER_TOKEN')
  const userB_apiKey = Cypress.env('INTRUDER_TOKEN')
  const testUserId = 9

  let serverId: number

  const time = Date.now()
  const serverTitle = `Server-${time}`

  before(() => {
    expect(userA_apiKey, 'Cypress.env("USER_TOKEN")').to.be.a('string').and.not
      .be.empty
  })

  it('POST: User A creates a private ART server', () => {
    expect(userA_apiKey).to.be.a('string').and.not.be.empty

    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: serverTitle,
        label: 'Lola Test',
        description: 'Private test art server',
        serverType: 'ART',
        category: 'personal',
        baseUrl: 'https://lola.acrocatranch.com',
        endpointPath: '/sdapi/v1/txt2img',
        healthPath: '/sdapi/v1/progress',
        userId: testUserId,
        isPublic: false,
        isOfficial: false,
        isDefault: false,
        isActive: true,
        requiresApiKey: false,
        supportsTxt2Img: true,
        supportsImg2Img: true,
        supportsChat: false,
        supportsComfyWorkflow: false,
        supportsCheckpointOverride: true,
        supportsSampler: true,
        supportsNegativePrompt: true,
        supportsSeed: true,
        supportsSteps: true,
        designer: 'cypress',
        version: '1.0',
        notes: 'created by cypress',
        sortOrder: 1,
      },
    }).then((res) => {
      expect(res.status).to.eq(201)
      expect(res.body.success).to.be.true
      expect(res.body.data).to.be.an('object')
      expect(res.body.data.title).to.eq(serverTitle)
      expect(res.body.data.serverType).to.eq('ART')
      expect(res.body.data.baseUrl).to.eq('https://lola.acrocatranch.com')
      expect(res.body.data.endpointPath).to.eq('/sdapi/v1/txt2img')
      expect(res.body.data.userId).to.eq(testUserId)

      serverId = res.body.data.id

      expect(serverId).to.be.a('number')
    })
  })

  it('GET: User A fetches all visible servers and sees their private server', () => {
    expect(serverId).to.exist
    expect(userA_apiKey).to.be.a('string').and.not.be.empty

    cy.request<ApiResponse<any[]>>({
      method: 'GET',
      url: baseUrl,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data).to.be.an('array')

      const match = res.body.data?.find(
        (item: Record<string, unknown>) => item.id === serverId,
      )

      expect(match).to.not.be.undefined
      expect(match?.title).to.eq(serverTitle)
    })
  })

  it('GET: anonymous fetch does not include User A private server', () => {
    expect(serverId).to.exist

    cy.request<ApiResponse<any[]>>({
      method: 'GET',
      url: baseUrl,
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data).to.be.an('array')

      const match = res.body.data?.find(
        (item: Record<string, unknown>) => item.id === serverId,
      )

      expect(match).to.be.undefined
    })
  })

  it('GET: User A fetches server by ID', () => {
    expect(serverId).to.exist
    expect(userA_apiKey).to.be.a('string').and.not.be.empty

    cy.request<ApiResponse>({
      method: 'GET',
      url: `${baseUrl}/${serverId}`,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data.id).to.eq(serverId)
      expect(res.body.data.title).to.eq(serverTitle)
      expect(res.body.data.serverType).to.eq('ART')
      expect(res.body.data.userId).to.eq(testUserId)
    })
  })

  it('GET: User B cannot fetch User A private server by ID', function () {
    if (!userB_apiKey) this.skip()

    expect(serverId).to.exist

    cy.request<ApiResponse>({
      method: 'GET',
      url: `${baseUrl}/${serverId}`,
      headers: {
        Authorization: `Bearer ${userB_apiKey}`,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
      expect(res.body.success).to.be.false
      expect(res.body.message).to.include('permission')
    })
  })

  it('PATCH: User A updates their server', () => {
    expect(serverId).to.exist
    expect(userA_apiKey).to.be.a('string').and.not.be.empty

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${baseUrl}/${serverId}`,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        label: 'Lola Updated',
        description: 'Updated by owner',
        supportsImg2Img: false,
        notes: 'owner updated this server',
        sortOrder: 5,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data.id).to.eq(serverId)
      expect(res.body.data.label).to.eq('Lola Updated')
      expect(res.body.data.description).to.eq('Updated by owner')
      expect(res.body.data.supportsImg2Img).to.eq(false)
      expect(res.body.data.sortOrder).to.eq(5)
    })
  })

  it('PATCH: User B fails to update User A server', function () {
    if (!userB_apiKey) this.skip()

    expect(serverId).to.exist

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${baseUrl}/${serverId}`,
      headers: {
        Authorization: `Bearer ${userB_apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        label: 'Intruder Edit',
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
      expect(res.body.success).to.be.false
      expect(res.body.message).to.include('permission')
    })
  })

  it('PATCH: rejects invalid enum values', () => {
    expect(serverId).to.exist
    expect(userA_apiKey).to.be.a('string').and.not.be.empty

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${baseUrl}/${serverId}`,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        serverType: 'BANANA',
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400)
      expect(res.body.success).to.be.false
      expect(res.body.message).to.include('Invalid serverType')
    })
  })

  it('POST: rejects malformed URL', () => {
    expect(userA_apiKey).to.be.a('string').and.not.be.empty

    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: `Bad-Server-${time}`,
        serverType: 'ART',
        baseUrl: 'not-a-real-url',
        endpointPath: '/sdapi/v1/txt2img',
        userId: testUserId,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400)
      expect(res.body.success).to.be.false
      expect(res.body.message).to.include('Invalid baseUrl')
    })
  })

  it('POST: rejects missing auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        title: `Unauthorized-${time}`,
        serverType: 'ART',
        baseUrl: 'https://example.com',
        endpointPath: '/sdapi/v1/txt2img',
        userId: testUserId,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.be.false
    })
  })

  it('GET: invalid server ID returns 400', () => {
    expect(userA_apiKey).to.be.a('string').and.not.be.empty

    cy.request<ApiResponse>({
      method: 'GET',
      url: `${baseUrl}/banana`,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400)
      expect(res.body.success).to.be.false
      expect(res.body.message.toLowerCase()).to.include('invalid server id')
    })
  })

  it('GET: unknown server ID returns 404', () => {
    expect(userA_apiKey).to.be.a('string').and.not.be.empty

    cy.request<ApiResponse>({
      method: 'GET',
      url: `${baseUrl}/99999999`,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(404)
      expect(res.body.success).to.be.false
      expect(res.body.message).to.include('not found')
    })
  })

  it('GET: health endpoint responds for owner', () => {
    expect(serverId).to.exist
    expect(userA_apiKey).to.be.a('string').and.not.be.empty

    cy.request<ApiResponse>({
      method: 'GET',
      url: `${baseUrl}/health/${serverId}`,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect([200, 202, 502]).to.include(res.status)
      expect(res.body).to.have.property('success')
      expect(res.body).to.have.property('message')
      expect(res.body).to.have.property('data')
      expect(res.body.data.id).to.eq(serverId)
      expect(res.body.data).to.have.property('healthUrl')

      if (res.status === 202) {
        expect(res.body.success).to.eq(true)
        expect(res.body.statusCode).to.eq(202)
        expect(res.body.data.runLocation).to.eq('browser')
        expect(res.body.message).to.include('tested from the browser')
        expect(res.body.data).to.have.property('accessMode')
        expect(res.body.data).to.have.property('requiresClientSideCheck')
        expect(res.body.data).to.have.property('isPrivateNetwork')
        expect(res.body.data).to.have.property('allowBrowserRequests')

        return
      }

      expect(res.body.statusCode).to.eq(res.status)
      expect(res.body.data.runLocation).to.eq('server')
      expect(res.body.data).to.have.property('latencyMs')
      expect(res.body.data.latencyMs).to.be.a('number')
      expect(res.body.data).to.have.property('ok')
      expect(res.body.data).to.have.property('status')
      expect(res.body.data).to.have.property('statusText')

      if (res.status === 200) {
        expect(res.body.success).to.eq(true)
        expect(res.body.data.ok).to.eq(true)
      }

      if (res.status === 502) {
        expect(res.body.success).to.eq(false)
        expect(res.body.data.ok).to.eq(false)
      }
    })
  })

  it('GET: health endpoint blocked for non-owner on private server', function () {
    if (!userB_apiKey) this.skip()

    expect(serverId).to.exist

    cy.request<ApiResponse>({
      method: 'GET',
      url: `${baseUrl}/health/${serverId}`,
      headers: {
        Authorization: `Bearer ${userB_apiKey}`,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
      expect(res.body.success).to.be.false
      expect(res.body.message).to.include('permission')
    })
  })

  it('DELETE: User B fails to delete User A server', function () {
    if (!userB_apiKey) this.skip()

    expect(serverId).to.exist

    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${baseUrl}/${serverId}`,
      headers: {
        Authorization: `Bearer ${userB_apiKey}`,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
      expect(res.body.success).to.be.false
      expect(res.body.message.toLowerCase()).to.include('authorized')
    })
  })

  it('DELETE: User A deletes their server', () => {
    expect(serverId).to.exist
    expect(userA_apiKey).to.be.a('string').and.not.be.empty

    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${baseUrl}/${serverId}`,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.message.toLowerCase()).to.include('server')
      expect(res.body.message.toLowerCase()).to.include('deleted')
    })
  })

  it('GET: deleted server returns 404', () => {
    expect(serverId).to.exist
    expect(userA_apiKey).to.be.a('string').and.not.be.empty

    cy.request<ApiResponse>({
      method: 'GET',
      url: `${baseUrl}/${serverId}`,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(404)
      expect(res.body.success).to.be.false
    })
  })

  after(() => {
    if (!serverId || !userA_apiKey) return

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${serverId}`,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
      },
      failOnStatusCode: false,
    })
  })
})
