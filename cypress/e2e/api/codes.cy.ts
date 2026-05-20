// /cypress/e2e/api/codes.cy.ts

/* eslint-disable @typescript-eslint/no-unused-expressions */

/// <reference types="cypress" />

interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  count?: number
  statusCode?: number
}

interface CodeNode {
  id: string
  kind: string
  title: string
  x: number
  y: number
  values: Record<string, unknown>
}

interface CodeConnection {
  id: string
  fromNodeId: string
  fromPortId: string
  toNodeId: string
  toPortId: string
  type: string
}

interface CodeGraph {
  version: 1
  nodes: CodeNode[]
  connections: CodeConnection[]
  zoom: number
  panX: number
  panY: number
}

interface CodeRecord {
  id: number
  createdAt: string
  updatedAt: string | null
  userId: number
  title: string
  description: string | null
  icon: string | null
  graph: CodeGraph
  isPublic: boolean
  isOfficial: boolean
  isActive: boolean
}

describe('[Code] API Full CRUD + Auth Tests', () => {
  const modelName = 'code'
  const fallbackApiBase = 'https://kind-robots.vercel.app'
  const invalidToken = 'definitely-not-a-real-token'
  const testUserId = 9

  let apiBase = fallbackApiBase
  let baseUrl = `${fallbackApiBase}/api/${modelName}`
  let userToken = ''
  let itemId: number | null = null
  let privateItemId: number | null = null
  let batchIds: number[] = []
  let createdIds: number[] = []

  const time = Date.now()
  const itemTitle = `CODE-${time}`
  const privateTitle = `PRIVATE-CODE-${time}`

  function makeGraph(label = 'demo'): CodeGraph {
    return {
      version: 1,
      nodes: [
        {
          id: `node-text-${label}-${time}`,
          kind: 'text-input',
          title: 'Idea',
          x: 80,
          y: 160,
          values: {
            text: `A test blueprint idea ${label}`,
          },
        },
        {
          id: `node-openai-${label}-${time}`,
          kind: 'openai-text',
          title: 'Prompt Builder',
          x: 390,
          y: 120,
          values: {
            prompt: 'Improve this text into a polished image prompt.',
          },
        },
        {
          id: `node-sd-${label}-${time}`,
          kind: 'stable-diffusion',
          title: 'Image Modeler',
          x: 700,
          y: 160,
          values: {
            steps: 30,
            cfg: 3.5,
            seed: -1,
            saveOutput: true,
            useConnectedInput: true,
          },
        },
      ],
      connections: [
        {
          id: `connection-text-openai-${label}-${time}`,
          fromNodeId: `node-text-${label}-${time}`,
          fromPortId: 'text',
          toNodeId: `node-openai-${label}-${time}`,
          toPortId: 'text',
          type: 'text',
        },
        {
          id: `connection-openai-sd-${label}-${time}`,
          fromNodeId: `node-openai-${label}-${time}`,
          fromPortId: 'text',
          toNodeId: `node-sd-${label}-${time}`,
          toPortId: 'prompt',
          type: 'text',
        },
      ],
      zoom: 1,
      panX: 0,
      panY: 0,
    }
  }

  function authHeaders(token = userToken) {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }

  function rememberId(id: number | undefined | null) {
    if (typeof id !== 'number') return
    if (!createdIds.includes(id)) createdIds.push(id)
  }

  before(() => {
    cy.env(['API_BASE', 'USER_TOKEN']).then((env) => {
      apiBase = String(env.API_BASE || fallbackApiBase)
      baseUrl = `${apiBase}/api/${modelName}`
      userToken = String(env.USER_TOKEN || '')

      expect(userToken, 'cy.env("USER_TOKEN")').to.be.a('string').and.not.be
        .empty
    })
  })

  it('POST: rejects Code creation without auth', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        title: `Unauthorized-${itemTitle}`,
        description: 'This should not be created.',
        icon: 'kind-icon:warning',
        userId: testUserId,
        isPublic: true,
        graph: makeGraph('unauthorized'),
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
      headers: authHeaders(invalidToken),
      body: {
        title: `Invalid-${itemTitle}`,
        description: 'This should not be created.',
        icon: 'kind-icon:warning',
        userId: testUserId,
        isPublic: true,
        graph: makeGraph('invalid'),
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
        title: `Missing-Graph-${itemTitle}`,
        description: 'This should fail because graph is required.',
        icon: 'kind-icon:warning',
        isPublic: true,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400)
      expect(res.body.success).to.eq(false)
    })
  })

  it('POST: creates a public Code record with valid auth', () => {
    cy.request<ApiResponse<CodeRecord>>({
      method: 'POST',
      url: baseUrl,
      headers: authHeaders(),
      body: {
        title: itemTitle,
        description: 'Cypress-created public Code blueprint.',
        icon: 'kind-icon:blocks',
        userId: testUserId,
        isPublic: true,
        graph: makeGraph('public'),
      },
    }).then((res) => {
      expect(res.status).to.eq(201)
      expect(res.body.success).to.eq(true)
      expect(res.body.data).to.have.property('id')

      itemId = res.body.data?.id ?? null
      rememberId(itemId)

      expect(itemId).to.be.a('number')
      expect(res.body.data?.title).to.eq(itemTitle)
      expect(res.body.data?.isPublic).to.eq(true)
      expect(res.body.data?.graph).to.have.property('version', 1)
      expect(res.body.data?.graph.nodes).to.be.an('array').and.have.length(3)
      expect(res.body.data?.graph.connections)
        .to.be.an('array')
        .and.have.length(2)
    })
  })

  it('POST: creates a private Code record with valid auth', () => {
    cy.request<ApiResponse<CodeRecord>>({
      method: 'POST',
      url: baseUrl,
      headers: authHeaders(),
      body: {
        title: privateTitle,
        description: 'Cypress-created private Code blueprint.',
        icon: 'kind-icon:lock',
        userId: testUserId,
        isPublic: false,
        graph: makeGraph('private'),
      },
    }).then((res) => {
      expect(res.status).to.eq(201)
      expect(res.body.success).to.eq(true)
      expect(res.body.data).to.have.property('id')

      privateItemId = res.body.data?.id ?? null
      rememberId(privateItemId)

      expect(privateItemId).to.be.a('number')
      expect(res.body.data?.title).to.eq(privateTitle)
      expect(res.body.data?.isPublic).to.eq(false)
    })
  })

  it('POST: creates multiple Code records in a batch with valid auth', () => {
    cy.request<ApiResponse<CodeRecord[]>>({
      method: 'POST',
      url: baseUrl,
      headers: authHeaders(),
      body: [
        {
          title: `Batch-A-${itemTitle}`,
          description: 'Batch Code blueprint A.',
          icon: 'kind-icon:sparkles',
          isPublic: true,
          graph: makeGraph('batch-a'),
        },
        {
          title: `Batch-B-${itemTitle}`,
          description: 'Batch Code blueprint B.',
          icon: 'kind-icon:cube',
          isPublic: false,
          graph: makeGraph('batch-b'),
        },
      ],
    }).then((res) => {
      expect(res.status).to.eq(201)
      expect(res.body.success).to.eq(true)
      expect(res.body.data).to.be.an('array').and.have.length(2)

      batchIds = (res.body.data || []).map((item) => item.id)
      batchIds.forEach(rememberId)

      expect(batchIds.every((id) => typeof id === 'number')).to.eq(true)
    })
  })

  it('GET: fetches all public Code records without auth', () => {
    cy.request<ApiResponse<CodeRecord[]>>({
      method: 'GET',
      url: baseUrl,
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data).to.be.an('array')

      const publicMatch = res.body.data?.find((item) => item.id === itemId)
      const privateMatch = res.body.data?.find(
        (item) => item.id === privateItemId,
      )

      expect(publicMatch).to.not.eq(undefined)
      expect(privateMatch).to.eq(undefined)
    })
  })

  it('GET: fetches Code records visible to authenticated user', () => {
    cy.request<ApiResponse<CodeRecord[]>>({
      method: 'GET',
      url: baseUrl,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data).to.be.an('array')

      const publicMatch = res.body.data?.find((item) => item.id === itemId)
      const privateMatch = res.body.data?.find(
        (item) => item.id === privateItemId,
      )

      expect(publicMatch).to.not.eq(undefined)
      expect(privateMatch).to.not.eq(undefined)
    })
  })

  it('GET: fetches only my Code records with mineOnly=true', () => {
    cy.request<ApiResponse<CodeRecord[]>>({
      method: 'GET',
      url: `${baseUrl}?mineOnly=true`,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data).to.be.an('array')

      const publicMatch = res.body.data?.find((item) => item.id === itemId)
      const privateMatch = res.body.data?.find(
        (item) => item.id === privateItemId,
      )

      expect(publicMatch).to.not.eq(undefined)
      expect(privateMatch).to.not.eq(undefined)
    })
  })

  it('GET: fetches public Code by ID without auth', () => {
    cy.request<ApiResponse<CodeRecord>>({
      method: 'GET',
      url: `${baseUrl}/${itemId}`,
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data?.id).to.eq(itemId)
      expect(res.body.data?.graph.version).to.eq(1)
    })
  })

  it('GET: rejects private Code by ID without auth', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${baseUrl}/${privateItemId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
      expect(res.body.success).to.eq(false)
    })
  })

  it('GET: fetches private Code by ID as owner', () => {
    cy.request<ApiResponse<CodeRecord>>({
      method: 'GET',
      url: `${baseUrl}/${privateItemId}`,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data?.id).to.eq(privateItemId)
      expect(res.body.data?.title).to.eq(privateTitle)
    })
  })

  it('PATCH: rejects update without auth', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${baseUrl}/${itemId}`,
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
      url: `${baseUrl}/${itemId}`,
      headers: authHeaders(invalidToken),
      body: {
        title: 'Invalid Auth Edit',
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('PATCH: updates Code record with valid auth', () => {
    const newTitle = `Updated-${itemTitle}`
    const updatedGraph = makeGraph('updated')
    updatedGraph.zoom = 0.85

    cy.request<ApiResponse<CodeRecord>>({
      method: 'PATCH',
      url: `${baseUrl}/${itemId}`,
      headers: authHeaders(),
      body: {
        title: newTitle,
        description: 'Updated by Cypress.',
        icon: 'kind-icon:check',
        isPublic: true,
        graph: updatedGraph,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data?.id).to.eq(itemId)
      expect(res.body.data?.title).to.eq(newTitle)
      expect(res.body.data?.description).to.eq('Updated by Cypress.')
      expect(res.body.data?.icon).to.eq('kind-icon:check')
      expect(res.body.data?.graph.zoom).to.eq(0.85)
    })
  })

  it('PATCH: rejects invalid graph object', () => {
    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${baseUrl}/${itemId}`,
      headers: authHeaders(),
      body: {
        graph: 'not-a-valid-graph-object',
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400)
      expect(res.body.success).to.eq(false)
    })
  })

  it('DELETE: rejects delete without auth', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${baseUrl}/${itemId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('DELETE: rejects delete with invalid auth', () => {
    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${baseUrl}/${itemId}`,
      headers: {
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.eq(false)
    })
  })

  it('DELETE: soft deletes Code record with valid auth', () => {
    cy.request<ApiResponse<CodeRecord>>({
      method: 'DELETE',
      url: `${baseUrl}/${itemId}`,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data?.id).to.eq(itemId)
      expect(res.body.data?.isActive).to.eq(false)
    })
  })

  it('GET: soft-deleted Code record returns 404', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${baseUrl}/${itemId}`,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(404)
      expect(res.body.success).to.eq(false)
    })
  })

  after(() => {
    if (!userToken || !createdIds.length) return

    cy.wrap(createdIds).each((id) => {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${id}`,
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        failOnStatusCode: false,
      })
    })
  })
})
