import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
  jsonHeaders,
} from '../../support/api-auth'

type PromptRow = {
  id: number
  prompt: string
  userId: number
  botId: number | null
  artImageId: number | null
  creationSource: string
  isMature: boolean
  isPublic: boolean
  isActive: boolean
  artPrompt: string | null
  artStatus: string
  queuePosition: number | null
}

type ApiResponse<T = unknown> = {
  success: boolean
  data?: T | null
  message: string
  statusCode?: number
}

describe('Prompt Management API Tests', () => {
  const invalidToken = 'someInvalidTokenValue'
  const stamp = Date.now()
  const uniquePrompt = `devil bunny ${stamp}`

  let apiBase = ''
  let baseUrl = ''
  let adminToken = ''
  let ownerToken = ''
  let otherToken = ''
  let ownerId: number | undefined
  let otherId: number | undefined
  let promptId: number | undefined

  const ownerHeaders = () => bearerHeaders(ownerToken)
  const otherHeaders = () => bearerHeaders(otherToken)

  const expectPromptResource = (prompt: Record<string, unknown>) => {
    expect(prompt).to.have.property('id')
    expect(prompt).to.have.property('prompt')
    expect(prompt).to.have.property('userId')
    expect(prompt).to.not.have.property('User')
    expect(prompt).to.not.have.property('Bot')
    expect(prompt).to.not.have.property('ArtImage')
    expect(prompt).to.not.have.property('artIds')
  }

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        baseUrl = `${apiBase}/prompts`
        return createLoggedInTestUser()
      })
      .then((owner) => {
        ownerToken = owner.token
        ownerId = owner.id
        return createLoggedInTestUser({ role: 'second' })
      })
      .then((other) => {
        otherToken = other.token
        otherId = other.id
      })
  })

  after(() => {
    if (promptId && ownerToken) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${promptId}`,
        headers: ownerHeaders(),
        failOnStatusCode: false,
      }).then(() => {
        promptId = undefined
      })
    }

    deleteTestUser(apiBase, adminToken, ownerId)
    deleteTestUser(apiBase, adminToken, otherId)
  })

  it('rejects Prompt creation without authentication', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: jsonHeaders(),
      body: {
        userId: ownerId,
        prompt: uniquePrompt,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('rejects Prompt creation with an invalid token', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: baseUrl,
      headers: bearerHeaders(invalidToken),
      body: {
        userId: ownerId,
        prompt: uniquePrompt,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('creates a Prompt without returning related object graphs', () => {
    expect(ownerId).to.exist

    cy.request<ApiResponse<PromptRow>>({
      method: 'POST',
      url: baseUrl,
      headers: ownerHeaders(),
      body: {
        userId: ownerId,
        prompt: uniquePrompt,
        artPrompt: 'A sinister rabbit becoming unexpectedly wholesome.',
        creationSource: 'HUMAN',
        isPublic: false,
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.userId).to.eq(ownerId)
      expectPromptResource(
        response.body.data as unknown as Record<string, unknown>,
      )

      promptId = response.body.data?.id
      expect(promptId).to.be.a('number').and.greaterThan(0)
    })
  })

  it('rejects Prompt PATCH without authentication', () => {
    expect(promptId).to.exist

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${baseUrl}/${promptId}`,
      headers: jsonHeaders(),
      body: {
        prompt: 'unauthorized bunny update',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('rejects Prompt PATCH with an invalid token', () => {
    expect(promptId).to.exist

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${baseUrl}/${promptId}`,
      headers: bearerHeaders(invalidToken),
      body: {
        prompt: 'invalid token bunny update',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('prevents another user from updating the Prompt', () => {
    expect(promptId).to.exist

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${baseUrl}/${promptId}`,
      headers: otherHeaders(),
      body: {
        prompt: 'stolen bunny update',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
    })
  })

  it('rejects server-owned Prompt fields', () => {
    expect(promptId).to.exist
    expect(otherId).to.exist

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${baseUrl}/${promptId}`,
      headers: ownerHeaders(),
      body: {
        userId: otherId,
        queuePosition: 1,
        artStatus: 'COMPLETE',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Unsupported Prompt update fields')
    })
  })

  it('validates optional Prompt relation IDs', () => {
    expect(promptId).to.exist

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${baseUrl}/${promptId}`,
      headers: ownerHeaders(),
      body: {
        botId: 2147483647,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(404)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Bot ID not found')
    })
  })

  it('updates only user-editable Prompt fields', () => {
    expect(promptId).to.exist
    expect(ownerId).to.exist

    cy.request<ApiResponse<PromptRow>>({
      method: 'PATCH',
      url: `${baseUrl}/${promptId}`,
      headers: ownerHeaders(),
      body: {
        prompt: 'angel bunny',
        artPrompt: null,
        creationSource: 'HYBRID',
        isMature: false,
        isPublic: true,
        isActive: true,
        botId: null,
        artImageId: null,
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.prompt).to.eq('angel bunny')
      expect(response.body.data?.artPrompt).to.eq(null)
      expect(response.body.data?.creationSource).to.eq('HYBRID')
      expect(response.body.data?.isPublic).to.eq(true)
      expect(response.body.data?.userId).to.eq(ownerId)
      expect(response.body.data?.botId).to.eq(null)
      expect(response.body.data?.artImageId).to.eq(null)
      expectPromptResource(
        response.body.data as unknown as Record<string, unknown>,
      )
    })
  })

  it('rejects invalid Prompt field values', () => {
    expect(promptId).to.exist

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${baseUrl}/${promptId}`,
      headers: ownerHeaders(),
      body: {
        isPublic: 'absolutely',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('isPublic')
    })
  })

  it('gets the Prompt resource without fetching related art', () => {
    expect(promptId).to.exist

    cy.request<ApiResponse<PromptRow>>({
      method: 'GET',
      url: `${baseUrl}/${promptId}`,
      headers: ownerHeaders(),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.id).to.eq(promptId)
      expect(response.body.data?.prompt).to.eq('angel bunny')
      expectPromptResource(
        response.body.data as unknown as Record<string, unknown>,
      )
    })
  })

  it('lists Prompts', () => {
    cy.request<ApiResponse<PromptRow[]>>({
      method: 'GET',
      url: baseUrl,
      headers: ownerHeaders(),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data).to.be.an('array')
      expect(response.body.data?.some((prompt) => prompt.id === promptId)).to.eq(
        true,
      )
    })
  })

  it('rejects Prompt deletion without authentication', () => {
    expect(promptId).to.exist

    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${baseUrl}/${promptId}`,
      headers: jsonHeaders(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('deletes a Prompt with authentication', () => {
    expect(promptId).to.exist

    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${baseUrl}/${promptId}`,
      headers: ownerHeaders(),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.message).to.include(
        `Prompt with ID ${promptId} successfully deleted.`,
      )
      promptId = undefined
    })
  })
})
