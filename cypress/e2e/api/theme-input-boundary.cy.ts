import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
} from '../../support/api-auth'

/* eslint-disable @typescript-eslint/no-unused-expressions */

type ThemeRow = {
  id: number
  userId: number | null
  name: string
  colorScheme: string
  artPrompt: string | null
}

type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T | null
  statusCode?: number
}

describe('Theme mutation input boundary', () => {
  const stamp = Date.now()

  let apiBase = ''
  let adminToken = ''
  let themeBaseUrl = ''
  let ownerToken = ''
  let ownerId: number | undefined
  let otherId: number | undefined
  let themeId: number | undefined

  const ownerHeaders = () => bearerHeaders(ownerToken)

  const baseValues = {
    '--color-primary': '#3366ff',
    '--color-secondary': '#ff66aa',
  }

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        themeBaseUrl = `${apiBase}/themes`
        return createLoggedInTestUser()
      })
      .then((owner) => {
        ownerToken = owner.token
        ownerId = owner.id
        return createLoggedInTestUser({ role: 'second' })
      })
      .then((other) => {
        otherId = other.id
      })
  })

  after(() => {
    if (themeId && ownerToken) {
      cy.request({
        method: 'DELETE',
        url: `${themeBaseUrl}/${themeId}`,
        headers: ownerHeaders(),
        failOnStatusCode: false,
      }).then(() => {
        themeId = undefined
      })
    }

    deleteTestUser(apiBase, adminToken, ownerId)
    deleteTestUser(apiBase, adminToken, otherId)
  })

  it('creates a Theme under the authenticated owner', () => {
    expect(ownerId).to.exist

    cy.request<ApiResponse<ThemeRow>>({
      method: 'POST',
      url: themeBaseUrl,
      headers: ownerHeaders(),
      body: {
        name: `BoundaryTheme-${stamp}`,
        values: baseValues,
        isPublic: false,
        colorScheme: 'dark',
        artPrompt: 'a calm neon skyline',
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.userId).to.eq(ownerId)
      expect(response.body.data?.colorScheme).to.eq('dark')
      expect(response.body.data?.artPrompt).to.eq('a calm neon skyline')

      themeId = response.body.data?.id
      expect(themeId).to.be.a('number')
    })
  })

  it('rejects unknown and spoofed fields on singular Theme creation', () => {
    expect(otherId).to.exist

    cy.request<ApiResponse>({
      method: 'POST',
      url: themeBaseUrl,
      headers: ownerHeaders(),
      body: {
        name: `UnknownFieldTheme-${stamp}`,
        values: baseValues,
        createdAt: new Date().toISOString(),
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Unsupported Theme fields')
    })

    cy.request<ApiResponse>({
      method: 'POST',
      url: themeBaseUrl,
      headers: ownerHeaders(),
      body: {
        name: `SpoofedOwnerTheme-${stamp}`,
        values: baseValues,
        userId: otherId,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Ownership is server-owned')
    })
  })

  it('enforces the serialized values size limit on Theme creation', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: themeBaseUrl,
      headers: ownerHeaders(),
      body: {
        name: `OversizedValuesTheme-${stamp}`,
        values: { '--x': 'a'.repeat(50_001) },
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('serialized characters')
    })
  })

  it('rejects unknown, mismatched ID, and spoofed owner fields on Theme PATCH', () => {
    expect(themeId).to.exist
    expect(otherId).to.exist

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${themeBaseUrl}/${themeId}`,
      headers: ownerHeaders(),
      body: { createdAt: new Date().toISOString() },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('Unsupported Theme fields')
    })

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${themeBaseUrl}/${themeId}`,
      headers: ownerHeaders(),
      body: { id: (themeId as number) + 1 },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('must match the route')
    })

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${themeBaseUrl}/${themeId}`,
      headers: ownerHeaders(),
      body: { userId: otherId },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('Ownership is server-owned')
    })
  })

  it('applies the same strict boundary to Theme batches', () => {
    const oversized = Array.from({ length: 101 }, (_, index) => ({
      name: `BatchCapTheme-${stamp}-${index}`,
      values: baseValues,
    }))

    cy.request<ApiResponse>({
      method: 'POST',
      url: `${themeBaseUrl}/batch`,
      headers: ownerHeaders(),
      body: oversized,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('at most 100 entries')
    })

    cy.request<
      ApiResponse<{ failed: Array<{ name: string; message: string }> }>
    >({
      method: 'POST',
      url: `${themeBaseUrl}/batch`,
      headers: ownerHeaders(),
      body: [
        {
          name: `BatchUnknownFieldTheme-${stamp}`,
          values: baseValues,
          createdAt: new Date().toISOString(),
        },
      ],
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.data?.failed).to.have.length(1)
      expect(response.body.data?.failed?.[0]?.message).to.include(
        'Unsupported Theme fields',
      )
    })
  })
})
