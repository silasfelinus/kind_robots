import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
} from '../../support/api-auth'

/* eslint-disable @typescript-eslint/no-unused-expressions */

type ResourceRow = {
  id: number
  name: string
  resourceType: string
  supportedServer: string
  description: string | null
}

type ResourceBatchData = {
  created: ResourceRow[]
  skipped: Array<{ name: string; reason: string }>
  failed: Array<{ name: string; message: string }>
}

type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T
  statusCode?: number
}

describe('Resource Management API Tests', () => {
  const invalidToken = 'someInvalidTokenValue'
  const stamp = Date.now()
  const uniqueResourceName = `Resource-${stamp}`
  const batchResourceName = `BatchResource-${stamp}`

  let apiBase = ''
  let adminToken = ''
  let baseUrl = ''
  let userToken = ''
  let userId: number | undefined
  let resourceId: number | undefined
  let batchResourceId: number | undefined

  const headers = () => bearerHeaders(userToken)
  const spoofedUserId = () => (userId ?? 0) + 1_000_000

  const expectLeanMutation = (resource: Record<string, unknown>) => {
    expect(resource).to.not.have.property('User')
    expect(resource).to.not.have.property('ArtImage')
    expect(resource).to.not.have.property('Servers')
    expect(resource).to.not.have.property('UsedInImages')
    expect(resource).to.not.have.property('Reactions')
  }

  const deleteResource = (id?: number) => {
    if (!id || !userToken) return

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${id}`,
      headers: headers(),
      failOnStatusCode: false,
    })
  }

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        baseUrl = `${apiBase}/resources`
        return createLoggedInTestUser({ fresh: true })
      })
      .then((auth) => {
        userToken = auth.token
        userId = auth.id
      })
  })

  after(() => {
    deleteResource(resourceId)
    deleteResource(batchResourceId)
    deleteTestUser(apiBase, adminToken, userId)
  })

  it('rejects Resource creation without authentication', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      body: {
        name: uniqueResourceName,
        resourceType: 'URL',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('rejects Resource creation with an invalid token', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: bearerHeaders(invalidToken),
      body: {
        name: uniqueResourceName,
        resourceType: 'URL',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('rejects Resource creation with spoofed ownership', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: headers(),
      body: {
        name: `Spoofed-${uniqueResourceName}`,
        resourceType: 'URL',
        supportedServer: 'GENERIC',
        userId: spoofedUserId(),
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Ownership is server-owned')
    })
  })

  it('creates one Resource with a lean mutation response', () => {
    cy.request<ApiResponse<ResourceRow>>({
      method: 'POST',
      url: baseUrl,
      headers: headers(),
      body: {
        name: uniqueResourceName,
        customLabel: 'Custom Label',
        customUrl: 'https://example.com/resource',
        description: 'A temporary Resource created by Cypress.',
        resourceType: 'URL',
        supportedServer: 'GENERIC',
        isMature: false,
        isPublic: false,
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.name).to.eq(uniqueResourceName)
      expect(response.body.data?.resourceType).to.eq('URL')
      expectLeanMutation(response.body.data as unknown as Record<string, unknown>)

      resourceId = response.body.data?.id
      expect(resourceId).to.be.a('number')
    })
  })

  it('returns 409 for duplicate single-resource creates', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: headers(),
      body: {
        name: uniqueResourceName,
        resourceType: 'URL',
        supportedServer: 'GENERIC',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(409)
      expect(response.body.success).to.eq(false)
      expect(response.body.data).to.eq(null)
      expect(response.body.message).to.include('already exists')
    })
  })

  it('rejects arrays on single-resource Resource POST', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: headers(),
      body: [
        {
          name: batchResourceName,
          resourceType: 'LORA',
        },
      ],
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('/api/resources/batch')
    })
  })

  it('rejects spoofed ownership in Resource batches', () => {
    cy.request<ApiResponse<ResourceBatchData>>({
      method: 'POST',
      url: `${baseUrl}/batch`,
      headers: headers(),
      body: [
        {
          name: `SpoofedBatch-${stamp}`,
          resourceType: 'LORA',
          supportedServer: 'SDXL',
          userId: spoofedUserId(),
        },
      ],
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.data?.created).to.have.length(0)
      expect(response.body.data?.failed).to.have.length(1)
      expect(response.body.data?.failed[0].message).to.include(
        'Ownership is server-owned',
      )
    })
  })

  it('uses the explicit batch route for created, skipped, and failed rows', () => {
    cy.request<ApiResponse<ResourceBatchData>>({
      method: 'POST',
      url: `${baseUrl}/batch`,
      headers: headers(),
      body: [
        {
          name: batchResourceName,
          resourceType: 'LORA',
          supportedServer: 'SDXL',
          description: 'A valid batch Resource.',
        },
        {
          name: uniqueResourceName,
          resourceType: 'URL',
          supportedServer: 'GENERIC',
        },
        {
          name: `InvalidResource-${stamp}`,
          resourceType: 'BANANA',
        },
      ],
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(207)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.created).to.have.length(1)
      expect(response.body.data?.skipped).to.have.length(1)
      expect(response.body.data?.failed).to.have.length(1)
      expect(response.body.data?.created[0].name).to.eq(batchResourceName)
      expect(response.body.data?.failed[0].message).to.include('resourceType')
      expectLeanMutation(
        response.body.data?.created[0] as unknown as Record<string, unknown>,
      )

      batchResourceId = response.body.data?.created[0].id
    })
  })

  it('rejects Resource ownership reassignment on update', () => {
    expect(resourceId).to.exist

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${baseUrl}/${resourceId}`,
      headers: headers(),
      body: {
        userId: spoofedUserId(),
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Ownership is server-owned')
    })
  })

  it('updates a Resource with a lean mutation response', () => {
    expect(resourceId).to.exist

    const updatedResourceName = `Updated-${uniqueResourceName}`

    cy.request<ApiResponse<ResourceRow>>({
      method: 'PATCH',
      url: `${baseUrl}/${resourceId}`,
      headers: headers(),
      body: {
        name: updatedResourceName,
        description: 'Updated Resource description.',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.name).to.eq(updatedResourceName)
      expectLeanMutation(response.body.data as unknown as Record<string, unknown>)
    })
  })

  it('retrieves the same scalar Resource by ID', () => {
    expect(resourceId).to.exist

    cy.request<ApiResponse<ResourceRow>>({
      method: 'GET',
      url: `${baseUrl}/${resourceId}`,
      headers: headers(),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.name).to.eq(`Updated-${uniqueResourceName}`)
    })
  })

  it('lists Resources', () => {
    cy.request<ApiResponse<ResourceRow[]>>({
      method: 'GET',
      url: baseUrl,
      headers: headers(),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data).to.be.an('array')
      expect(response.body.data?.some((row) => row.id === resourceId)).to.eq(true)
    })
  })

  it('rejects delete without authentication', () => {
    expect(resourceId).to.exist

    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${baseUrl}/${resourceId}`,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('deletes a Resource with authentication', () => {
    expect(resourceId).to.exist

    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${baseUrl}/${resourceId}`,
      headers: headers(),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.message).to.include(
        `Resource with ID ${resourceId} successfully deleted`,
      )
      resourceId = undefined
    })
  })
})
