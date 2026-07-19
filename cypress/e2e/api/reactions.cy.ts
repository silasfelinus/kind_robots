import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
} from '../../support/api-auth'

/* eslint-disable @typescript-eslint/no-unused-expressions */

type ReactionRow = {
  id: number
  userId: number
  reactionType: string
  reactionCategory: string
  comment: string | null
  rating: number
  themeId: number | null
}

type ThemeRow = {
  id: number
  name: string
}

type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T | null
  statusCode?: number
}

describe('Reaction Management API Tests', () => {
  const invalidToken = 'someInvalidTokenValue'
  const stamp = Date.now()
  const themeName = `ReactionTheme-${stamp}`

  let apiBase = ''
  let adminToken = ''
  let reactionBaseUrl = ''
  let themeBaseUrl = ''
  let ownerToken = ''
  let otherToken = ''
  let ownerId: number | undefined
  let otherId: number | undefined
  let themeId: number | undefined
  let reactionId: number | undefined

  const ownerHeaders = () => bearerHeaders(ownerToken)
  const otherHeaders = () => bearerHeaders(otherToken)

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        reactionBaseUrl = `${apiBase}/reactions`
        themeBaseUrl = `${apiBase}/themes`
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
    if (reactionId && ownerToken) {
      cy.request({
        method: 'DELETE',
        url: `${reactionBaseUrl}/${reactionId}`,
        headers: ownerHeaders(),
        failOnStatusCode: false,
      }).then(() => {
        reactionId = undefined
      })
    }

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

  it('creates a lightweight Theme fixture', () => {
    cy.request<ApiResponse<ThemeRow>>({
      method: 'POST',
      url: themeBaseUrl,
      headers: ownerHeaders(),
      body: {
        name: themeName,
        values: {
          '--color-primary': '#3366ff',
          '--color-secondary': '#ff66aa',
        },
        isPublic: false,
        prefersDark: false,
        colorScheme: 'light',
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.name).to.eq(themeName)

      themeId = response.body.data?.id
      expect(themeId).to.be.a('number')
    })
  })

  it('rejects Reaction creation without authentication', () => {
    expect(themeId).to.exist

    cy.request<ApiResponse>({
      method: 'POST',
      url: reactionBaseUrl,
      body: {
        reactionType: 'LOVED',
        reactionCategory: 'THEME',
        themeId,
        rating: 5,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('rejects Reaction creation with an invalid token', () => {
    expect(themeId).to.exist

    cy.request<ApiResponse>({
      method: 'POST',
      url: reactionBaseUrl,
      headers: bearerHeaders(invalidToken),
      body: {
        reactionType: 'LOVED',
        reactionCategory: 'THEME',
        themeId,
        rating: 5,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('rejects spoofed Reaction ownership', () => {
    expect(themeId).to.exist
    expect(otherId).to.exist

    cy.request<ApiResponse>({
      method: 'POST',
      url: reactionBaseUrl,
      headers: ownerHeaders(),
      body: {
        userId: otherId,
        reactionType: 'LOVED',
        reactionCategory: 'THEME',
        themeId,
        rating: 5,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Ownership is server-owned')
    })
  })

  it('rejects unsupported Reaction create fields', () => {
    expect(themeId).to.exist

    cy.request<ApiResponse>({
      method: 'POST',
      url: reactionBaseUrl,
      headers: ownerHeaders(),
      body: {
        reactionType: 'LOVED',
        reactionCategory: 'THEME',
        themeId,
        rating: 5,
        createdAt: new Date().toISOString(),
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include(
        'Unsupported Reaction create fields',
      )
    })
  })

  it('creates a Reaction under the authenticated owner', () => {
    expect(themeId).to.exist
    expect(ownerId).to.exist

    cy.request<ApiResponse<ReactionRow>>({
      method: 'POST',
      url: reactionBaseUrl,
      headers: ownerHeaders(),
      body: {
        userId: ownerId,
        reactionType: 'LOVED',
        reactionCategory: 'THEME',
        themeId,
        comment: 'A temporary Reaction fixture.',
        rating: 5,
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.userId).to.eq(ownerId)
      expect(response.body.data?.reactionCategory).to.eq('THEME')
      expect(response.body.data?.themeId).to.eq(themeId)

      reactionId = response.body.data?.id
      expect(reactionId).to.be.a('number')
    })
  })

  it('accepts a genuinely partial Reaction PATCH', () => {
    expect(reactionId).to.exist

    cy.request<ApiResponse<ReactionRow>>({
      method: 'PATCH',
      url: `${reactionBaseUrl}/${reactionId}`,
      headers: ownerHeaders(),
      body: {
        comment: 'Updated without resending category or target.',
        rating: 4,
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.comment).to.eq(
        'Updated without resending category or target.',
      )
      expect(response.body.data?.rating).to.eq(4)
      expect(response.body.data?.reactionCategory).to.eq('THEME')
      expect(response.body.data?.themeId).to.eq(themeId)
    })
  })

  it('rejects ownership, category, and target mutation attempts', () => {
    expect(reactionId).to.exist
    expect(otherId).to.exist

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${reactionBaseUrl}/${reactionId}`,
      headers: ownerHeaders(),
      body: {
        userId: otherId,
        reactionCategory: 'MESSAGE',
        themeId: null,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('immutable')
    })
  })

  it('rejects invalid Reaction PATCH values', () => {
    expect(reactionId).to.exist

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${reactionBaseUrl}/${reactionId}`,
      headers: ownerHeaders(),
      body: {
        rating: 9001,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('0 to 5')
    })
  })

  it('prevents another user from updating the Reaction', () => {
    expect(reactionId).to.exist

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${reactionBaseUrl}/${reactionId}`,
      headers: otherHeaders(),
      body: {
        reactionType: 'BOOED',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
    })
  })

  it('updates only the Reaction type', () => {
    expect(reactionId).to.exist

    cy.request<ApiResponse<ReactionRow>>({
      method: 'PATCH',
      url: `${reactionBaseUrl}/${reactionId}`,
      headers: ownerHeaders(),
      body: {
        reactionType: 'CLAPPED',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.reactionType).to.eq('CLAPPED')
      expect(response.body.data?.themeId).to.eq(themeId)
    })
  })

  it('prevents another user from deleting the Reaction', () => {
    expect(reactionId).to.exist

    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${reactionBaseUrl}/${reactionId}`,
      headers: otherHeaders(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
      expect(response.body.data).to.eq(null)
    })
  })

  it('deletes the Reaction with a normalized response', () => {
    expect(reactionId).to.exist

    cy.request<ApiResponse>({
      method: 'DELETE',
      url: `${reactionBaseUrl}/${reactionId}`,
      headers: ownerHeaders(),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.eq(true)
      expect(response.body.data).to.eq(null)
      expect(response.body.message).to.include(
        `Reaction with ID ${reactionId} successfully deleted`,
      )

      reactionId = undefined
    })
  })
})
