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

interface CodeRecord {
  id: number
  userId: number
  title: string
  description: string | null
  icon: string | null
  graph: Record<string, unknown>
  isPublic: boolean
  isOfficial: boolean
  isActive: boolean
}

describe('[Code] API hard-delete contract', () => {
  let apiBase = ''
  let adminToken = ''
  let baseUrl = ''
  let user: TestUserAuth | undefined
  let publicCodeId = 0
  let privateCodeId = 0
  let deletedCodeId = 0

  const time = Date.now()
  const publicTitle = `CODE-${time}`
  const privateTitle = `PRIVATE-CODE-${time}`

  const graph = (label: string) => ({
    version: 1,
    nodes: [
      {
        id: `node-${label}-${time}`,
        kind: 'text-input',
        title: 'Idea',
        x: 80,
        y: 160,
        values: {
          text: `A test blueprint idea ${label}`,
        },
      },
    ],
    connections: [],
    zoom: 1,
    panX: 0,
    panY: 0,
  })

  const authHeaders = () => {
    expect(user).to.exist
    return bearerHeaders(user!.token)
  }

  const rememberForCleanup = (id: number | undefined | null) => {
    if (typeof id === 'number' && !deletedCodeId) deletedCodeId = id
  }

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        baseUrl = `${apiBase}/code`

        return createLoggedInTestUser({ fresh: true })
      })
      .then((auth) => {
        user = auth
      })
  })

  after(() => {
    ;[publicCodeId, privateCodeId, deletedCodeId].forEach((id) => {
      if (!id || !adminToken) return

      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${id}`,
        headers: adminHeaders(adminToken),
        failOnStatusCode: false,
      })
    })

    deleteTestUser(apiBase, adminToken, user?.id)
  })

  it('POST: rejects Code creation without auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: jsonHeaders(),
      body: {
        title: `Unauthorized-${publicTitle}`,
        description: 'This should not be created.',
        icon: 'kind-icon:warning',
        userId: user?.id,
        isPublic: true,
        graph: graph('unauthorized'),
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('POST: rejects Code creation with invalid auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: invalidBearerHeaders(),
      body: {
        title: `Invalid-${publicTitle}`,
        description: 'This should not be created.',
        icon: 'kind-icon:warning',
        userId: user?.id,
        isPublic: true,
        graph: graph('invalid'),
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('POST: rejects Code creation with missing graph', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: authHeaders(),
      body: {
        title: `Missing-Graph-${publicTitle}`,
        description: 'This should fail because graph is required.',
        icon: 'kind-icon:warning',
        userId: user?.id,
        isPublic: true,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400)
      expect(res.body.success).to.eq(false)
    })
  })

  it('POST: creates public and private Code records with valid auth', () => {
    cy.request<ApiResponse<CodeRecord>>({
      method: 'POST',
      url: baseUrl,
      headers: authHeaders(),
      body: {
        title: publicTitle,
        description: 'Cypress-created public Code blueprint.',
        icon: 'kind-icon:blocks',
        userId: user?.id,
        isPublic: true,
        graph: graph('public'),
      },
    }).then((res) => {
      expect(res.status).to.eq(201)
      expect(res.body.success).to.eq(true)
      expect(res.body.data?.id).to.be.a('number')
      expect(res.body.data?.title).to.eq(publicTitle)
      expect(res.body.data?.isPublic).to.eq(true)

      publicCodeId = res.body.data!.id
      rememberForCleanup(publicCodeId)
    })

    cy.request<ApiResponse<CodeRecord>>({
      method: 'POST',
      url: baseUrl,
      headers: authHeaders(),
      body: {
        title: privateTitle,
        description: 'Cypress-created private Code blueprint.',
        icon: 'kind-icon:lock',
        userId: user?.id,
        isPublic: false,
        graph: graph('private'),
      },
    }).then((res) => {
      expect(res.status).to.eq(201)
      expect(res.body.success).to.eq(true)
      expect(res.body.data?.id).to.be.a('number')
      expect(res.body.data?.title).to.eq(privateTitle)
      expect(res.body.data?.isPublic).to.eq(false)

      privateCodeId = res.body.data!.id
    })
  })

  it('GET: anonymous users see public but not private Code records', () => {
    cy.request<ApiResponse<CodeRecord[]>>({
      method: 'GET',
      url: baseUrl,
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)

      const records = res.body.data || []
      expect(records.some((item) => item.id === publicCodeId)).to.eq(true)
      expect(records.some((item) => item.id === privateCodeId)).to.eq(false)
    })
  })

  it('GET: owner sees private Code by ID', () => {
    cy.request<ApiResponse<CodeRecord>>({
      method: 'GET',
      url: `${baseUrl}/${privateCodeId}`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data?.id).to.eq(privateCodeId)
      expect(res.body.data?.title).to.eq(privateTitle)
    })
  })

  it('GET: anonymous user cannot fetch private Code by ID', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${baseUrl}/${privateCodeId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
      expect(res.body.success).to.eq(false)
    })
  })

  it('PATCH: updates supported Code fields', () => {
    const newTitle = `Updated-${publicTitle}`

    cy.request<ApiResponse<CodeRecord>>({
      method: 'PATCH',
      url: `${baseUrl}/${publicCodeId}`,
      headers: authHeaders(),
      body: {
        title: newTitle,
        description: 'Updated by Cypress.',
        icon: 'kind-icon:check',
        isPublic: true,
        graph: graph('updated'),
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data?.id).to.eq(publicCodeId)
      expect(res.body.data?.title).to.eq(newTitle)
      expect(res.body.data?.description).to.eq('Updated by Cypress.')
      expect(res.body.data?.icon).to.eq('kind-icon:check')
    })
  })

  it('PATCH: rejects isActive as an unsupported Code update flag', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${baseUrl}/${publicCodeId}`,
      headers: authHeaders(),
      body: {
        isActive: false,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400)
      expect(res.body.success).to.eq(false)
      expect(res.body.message).to.match(/supported Code fields/i)
    })
  })

  it('DELETE: rejects delete without auth', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${baseUrl}/${publicCodeId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('DELETE: rejects delete with invalid auth', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${baseUrl}/${publicCodeId}`,
      headers: invalidBearerHeaders(),
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('DELETE: hard deletes Code record with valid auth', () => {
    cy.request<ApiResponse<CodeRecord>>({
      method: 'DELETE',
      url: `${baseUrl}/${publicCodeId}`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data?.id).to.eq(publicCodeId)
    })
  })

  it('GET: hard-deleted Code record returns 404', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${baseUrl}/${publicCodeId}`,
      headers: authHeaders(),
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(404)
      expect(res.body.success).to.eq(false)
    })
  })
})