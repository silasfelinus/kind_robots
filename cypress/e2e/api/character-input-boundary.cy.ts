import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
} from '../../support/api-auth'

type CharacterRow = {
  id: number
  name: string
  userId: number
}

type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T | null
  statusCode?: number
}

describe('Character mutation input boundary', () => {
  const stamp = Date.now()
  let apiBase = ''
  let adminToken = ''
  let ownerId: number | undefined
  let ownerToken = ''
  let otherId: number | undefined
  let characterId: number | undefined

  const charactersUrl = () => `${apiBase}/characters`
  const headers = () => bearerHeaders(ownerToken)

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        return createLoggedInTestUser({ fresh: true })
      })
      .then((owner) => {
        ownerId = owner.id
        ownerToken = owner.token
        return createLoggedInTestUser({ role: 'second' })
      })
      .then((other) => {
        otherId = other.id
      })
  })

  after(() => {
    if (characterId) {
      cy.request({
        method: 'DELETE',
        url: `${charactersUrl()}/${characterId}`,
        headers: headers(),
        failOnStatusCode: false,
      })
    }

    deleteTestUser(apiBase, adminToken, ownerId)
    deleteTestUser(apiBase, adminToken, otherId)
  })

  it('rejects unknown and malformed Character create fields', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: charactersUrl(),
      headers: headers(),
      body: {
        name: `Unknown Character Field ${stamp}`,
        createdBy: 'client',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('Unsupported Character fields')
    })

    cy.request<ApiResponse>({
      method: 'POST',
      url: charactersUrl(),
      headers: headers(),
      body: {
        name: `Invalid Character Rarity ${stamp}`,
        luck: 'IMPOSSIBLE',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('luck')
    })

    cy.request<ApiResponse>({
      method: 'POST',
      url: charactersUrl(),
      headers: headers(),
      body: {
        name: `Invalid Character Boolean ${stamp}`,
        isPublic: 'yes',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('isPublic')
    })

    cy.request<ApiResponse>({
      method: 'POST',
      url: charactersUrl(),
      headers: headers(),
      body: {
        name: `Invalid Character Level ${stamp}`,
        level: 0,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('level')
    })
  })

  it('rejects oversized and invalid Character relation arrays', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: charactersUrl(),
      headers: headers(),
      body: {
        name: `Oversized Character Relations ${stamp}`,
        rewardIds: Array.from({ length: 101 }, (_, index) => index + 1),
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('at most 100 entries')
    })

    cy.request<ApiResponse>({
      method: 'POST',
      url: charactersUrl(),
      headers: headers(),
      body: {
        name: `Invalid Character Relations ${stamp}`,
        dreamIds: [1, 0],
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('invalid ID at index 1')
    })
  })

  it('ignores legacy create ownership metadata and persists authentication', () => {
    expect(ownerId).to.be.a('number').and.greaterThan(0)
    expect(otherId).to.be.a('number').and.greaterThan(0)

    cy.request<ApiResponse<CharacterRow>>({
      method: 'POST',
      url: charactersUrl(),
      headers: headers(),
      body: {
        userId: otherId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        name: `Character Boundary Control ${stamp}`,
        honorific: 'adventurer',
        luck: 1,
        might: 'UNCOMMON',
        isPublic: false,
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.eq(true)
      expect(response.body.data?.userId).to.eq(ownerId)
      characterId = response.body.data?.id
      expect(characterId).to.be.a('number').and.greaterThan(0)
    })
  })

  it('rejects Character ownership and route identity changes on PATCH', () => {
    expect(characterId).to.be.a('number').and.greaterThan(0)
    expect(otherId).to.be.a('number').and.greaterThan(0)

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${charactersUrl()}/${characterId}`,
      headers: headers(),
      body: {
        userId: otherId,
        title: 'Spoofed owner update',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('Ownership is server-owned')
    })

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${charactersUrl()}/${characterId}`,
      headers: headers(),
      body: {
        id: (characterId ?? 0) + 1,
        title: 'Wrong route identity',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('must match the route')
    })
  })

  it('keeps Character batch imports strict, bounded, and lean', () => {
    expect(ownerId).to.be.a('number').and.greaterThan(0)

    cy.request<ApiResponse>({
      method: 'POST',
      url: `${charactersUrl()}/batch`,
      headers: headers(),
      body: [
        {
          name: `Batch Character Identity ${stamp}`,
          userId: ownerId,
        },
      ],
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('Unsupported Character fields')
    })

    cy.request<ApiResponse>({
      method: 'POST',
      url: `${charactersUrl()}/batch`,
      headers: headers(),
      body: Array.from({ length: 101 }, (_, index) => ({
        name: `Oversized Character Batch ${stamp}-${index}`,
      })),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('at most 100 entries')
    })
  })
})
