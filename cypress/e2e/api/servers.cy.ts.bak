// /cypress/e2e/api/servers.cy.ts
/// <reference types="cypress" />

interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  statusCode?: number
  user?: T
}

type ServerType = 'A1111' | 'COMFY' | 'OPENAI' | 'ANTHROPIC' | 'CUSTOM'
type ServerAccessMode = 'BROWSER' | 'BACKEND' | 'TAILSCALE' | 'PUBLIC' | 'LOCAL'
type ServerAuthType = 'NONE' | 'BEARER' | 'HEADER' | 'QUERY' | 'API_KEY'
type ServerStatus = 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'UNKNOWN'

interface ServerRecord {
  id: number
  createdAt: string
  updatedAt: string
  title: string
  label?: string | null
  description?: string | null
  category?: string | null
  serverType: ServerType
  accessMode: ServerAccessMode
  authType: ServerAuthType
  baseUrl?: string | null
  endpointPath?: string | null
  healthPath?: string | null
  apiLink?: string | null
  apiKey?: string | null
  apiKeyName?: string | null
  model?: string | null
  notes?: string | null
  designer?: string | null
  version?: string | null
  sortOrder: number
  userId?: number | null
  isPublic: boolean
  isOfficial: boolean
  isDefault: boolean
  isActive: boolean
  isEditable: boolean
  isMature: boolean
  lastCheckedAt?: string | null
  lastStatus: ServerStatus
  artPrompt?: string | null
}

describe('Server API Full CRUD + Auth Tests', () => {
  const fallbackApiBase = 'https://kind-robots.vercel.app'
  const testUserId = 9
  const invalidToken = 'definitely-not-a-real-token'
  const time = Date.now()
  const serverTitle = `Server-${time}`
  const badServerTitle = `Bad-Server-${time}`

  let apiBase = fallbackApiBase
  let baseUrl = `${fallbackApiBase}/api/server`
  let userA_apiKey = ''
  let serverId: number | undefined
  let badServerId: number | undefined

  before(() => {
    cy.env(['API_BASE', 'USER_TOKEN']).then((env) => {
      apiBase = String(env.API_BASE || fallbackApiBase)
      baseUrl = `${apiBase}/api/server`
      userA_apiKey = String(env.USER_TOKEN || '')

      expect(userA_apiKey, 'cy.env("USER_TOKEN")').to.be.a('string').and.not.be
        .empty
    })
  })

  it('POST: User A creates a private A1111 server', () => {
    expect(userA_apiKey).to.be.a('string').and.not.be.empty

    cy.request<ApiResponse<ServerRecord>>({
      method: 'POST',
      url: baseUrl,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: serverTitle,
        label: 'Lola Test',
        description: 'Private test A1111 image server',
        category: 'personal',
        serverType: 'A1111',
        accessMode: 'BROWSER',
        authType: 'NONE',
        baseUrl: 'https://lola.acrocatranch.com',
        endpointPath: '/sdapi/v1/txt2img',
        healthPath: '/sdapi/v1/progress',
        apiLink: 'https://lola.acrocatranch.com/docs',
        apiKey: null,
        apiKeyName: null,
        model: 'stable-diffusion',
        userId: testUserId,
        isPublic: false,
        isOfficial: false,
        isDefault: false,
        isActive: true,
        isEditable: true,
        isMature: false,
        designer: 'cypress',
        version: '1.0',
        notes: 'created by cypress',
        sortOrder: 1,
        artPrompt:
          'A tiny robot testing a server endpoint with suspicious confidence.',
      },
    }).then((res) => {
      expect(res.status).to.eq(201)
      expect(res.body.success).to.be.true
      expect(res.body.data).to.be.an('object')

      const server = res.body.data as ServerRecord

      expect(server.title).to.eq(serverTitle)
      expect(server.label).to.eq('Lola Test')
      expect(server.description).to.eq('Private test A1111 image server')
      expect(server.category).to.eq('personal')
      expect(server.serverType).to.eq('A1111')
      expect(server.accessMode).to.eq('BROWSER')
      expect(server.authType).to.eq('NONE')
      expect(server.baseUrl).to.eq('https://lola.acrocatranch.com')
      expect(server.endpointPath).to.eq('/sdapi/v1/txt2img')
      expect(server.healthPath).to.eq('/sdapi/v1/progress')
      expect(server.apiLink).to.eq('https://lola.acrocatranch.com/docs')
      expect(server.model).to.eq('stable-diffusion')
      expect(server.userId).to.eq(testUserId)
      expect(server.isPublic).to.eq(false)
      expect(server.isOfficial).to.eq(false)
      expect(server.isDefault).to.eq(false)
      expect(server.isActive).to.eq(true)
      expect(server.isEditable).to.eq(true)
      expect(server.isMature).to.eq(false)
      expect(server.designer).to.eq('cypress')
      expect(server.version).to.eq('1.0')
      expect(server.notes).to.eq('created by cypress')
      expect(server.sortOrder).to.eq(1)
      expect(server.lastStatus).to.eq('UNKNOWN')
      expect(server.artPrompt).to.eq(
        'A tiny robot testing a server endpoint with suspicious confidence.',
      )

      serverId = server.id

      expect(serverId).to.be.a('number')
    })
  })

  it('GET: User A fetches all visible servers and sees their private server', () => {
    expect(serverId).to.exist
    expect(userA_apiKey).to.be.a('string').and.not.be.empty

    cy.request<ApiResponse<ServerRecord[]>>({
      method: 'GET',
      url: baseUrl,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data).to.be.an('array')

      const match = res.body.data?.find((item) => item.id === serverId)

      expect(match).to.not.be.undefined
      expect(match?.title).to.eq(serverTitle)
      expect(match?.serverType).to.eq('A1111')
      expect(match?.accessMode).to.eq('BROWSER')
      expect(match?.authType).to.eq('NONE')
    })
  })

  it('GET: anonymous fetch does not include User A private server', () => {
    expect(serverId).to.exist

    cy.request<ApiResponse<ServerRecord[]>>({
      method: 'GET',
      url: baseUrl,
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data).to.be.an('array')

      const match = res.body.data?.find((item) => item.id === serverId)

      expect(match).to.be.undefined
    })
  })

  it('GET: User A fetches server by ID', () => {
    expect(serverId).to.exist
    expect(userA_apiKey).to.be.a('string').and.not.be.empty

    cy.request<ApiResponse<ServerRecord>>({
      method: 'GET',
      url: `${baseUrl}/${serverId}`,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true

      const server = res.body.data as ServerRecord

      expect(server.id).to.eq(serverId)
      expect(server.title).to.eq(serverTitle)
      expect(server.serverType).to.eq('A1111')
      expect(server.accessMode).to.eq('BROWSER')
      expect(server.authType).to.eq('NONE')
      expect(server.userId).to.eq(testUserId)
    })
  })

  it('GET: rejects invalid token when fetching private server by ID', () => {
    expect(serverId).to.exist

    cy.request<ApiResponse>({
      method: 'GET',
      url: `${baseUrl}/${serverId}`,
      headers: {
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect([401, 403]).to.include(res.status)
      expect(res.body.success).to.be.false
    })
  })

  it('PATCH: User A updates their server', () => {
    expect(serverId).to.exist
    expect(userA_apiKey).to.be.a('string').and.not.be.empty

    cy.request<ApiResponse<ServerRecord>>({
      method: 'PATCH',
      url: `${baseUrl}/${serverId}`,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        label: 'Lola Updated',
        description: 'Updated by owner',
        accessMode: 'BACKEND',
        authType: 'BEARER',
        apiKeyName: 'Authorization',
        model: 'dreamshaper',
        notes: 'owner updated this server',
        sortOrder: 5,
        lastStatus: 'DEGRADED',
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true

      const server = res.body.data as ServerRecord

      expect(server.id).to.eq(serverId)
      expect(server.label).to.eq('Lola Updated')
      expect(server.description).to.eq('Updated by owner')
      expect(server.accessMode).to.eq('BACKEND')
      expect(server.authType).to.eq('BEARER')
      expect(server.apiKeyName).to.eq('Authorization')
      expect(server.model).to.eq('dreamshaper')
      expect(server.notes).to.eq('owner updated this server')
      expect(server.sortOrder).to.eq(5)
      expect(server.lastStatus).to.eq('DEGRADED')
    })
  })

  it('PATCH: rejects invalid token when updating server', () => {
    expect(serverId).to.exist

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${baseUrl}/${serverId}`,
      headers: {
        Authorization: `Bearer ${invalidToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        label: 'Intruder Edit',
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.be.false
    })
  })

  it('PATCH: rejects invalid serverType enum value', () => {
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
      expect([400, 422, 500]).to.include(res.status)
      expect(res.body.success).to.be.false
    })
  })

  it('PATCH: restores and confirms valid enum values', () => {
    expect(serverId).to.exist
    expect(userA_apiKey).to.be.a('string').and.not.be.empty

    cy.request<ApiResponse<ServerRecord>>({
      method: 'PATCH',
      url: `${baseUrl}/${serverId}`,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        serverType: 'A1111',
        accessMode: 'BROWSER',
        authType: 'NONE',
        lastStatus: 'UNKNOWN',
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true

      const server = res.body.data as ServerRecord

      expect(server.id).to.eq(serverId)
      expect(server.serverType).to.eq('A1111')
      expect(server.accessMode).to.eq('BROWSER')
      expect(server.authType).to.eq('NONE')
      expect(server.lastStatus).to.eq('UNKNOWN')
    })
  })

  it('POST: currently accepts malformed URL as raw server data', () => {
    expect(userA_apiKey).to.be.a('string').and.not.be.empty

    cy.request<ApiResponse<ServerRecord>>({
      method: 'POST',
      url: baseUrl,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: badServerTitle,
        serverType: 'A1111',
        accessMode: 'BROWSER',
        authType: 'NONE',
        baseUrl: 'not-a-real-url',
        endpointPath: '/sdapi/v1/txt2img',
        healthPath: '/sdapi/v1/progress',
        userId: testUserId,
        isPublic: false,
        isOfficial: false,
        isDefault: false,
        isActive: true,
        isEditable: true,
        isMature: false,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(201)
      expect(res.body.success).to.be.true

      const server = res.body.data as ServerRecord

      expect(server.title).to.eq(badServerTitle)
      expect(server.serverType).to.eq('A1111')
      expect(server.accessMode).to.eq('BROWSER')
      expect(server.authType).to.eq('NONE')
      expect(server.baseUrl).to.eq('not-a-real-url')

      badServerId = server.id

      expect(badServerId).to.be.a('number')

      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${badServerId}`,
        headers: {
          Authorization: `Bearer ${userA_apiKey}`,
        },
        failOnStatusCode: false,
      }).then(() => {
        badServerId = undefined
      })
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
        serverType: 'A1111',
        accessMode: 'BROWSER',
        authType: 'NONE',
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

  it('POST: rejects invalid token', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: {
        Authorization: `Bearer ${invalidToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: `Invalid-Token-${time}`,
        serverType: 'A1111',
        accessMode: 'BROWSER',
        authType: 'NONE',
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

  it('GET: health endpoint rejects invalid token', () => {
    expect(serverId).to.exist

    cy.request<ApiResponse>({
      method: 'GET',
      url: `${baseUrl}/health/${serverId}`,
      headers: {
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect([401, 403]).to.include(res.status)
      expect(res.body.success).to.be.false
    })
  })

  it('DELETE: rejects invalid token', () => {
    expect(serverId).to.exist

    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${baseUrl}/${serverId}`,
      headers: {
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.be.false
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
    if (badServerId && userA_apiKey) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${badServerId}`,
        headers: {
          Authorization: `Bearer ${userA_apiKey}`,
        },
        failOnStatusCode: false,
      })
    }

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
