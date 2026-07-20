import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
} from '../../support/api-auth'

/* eslint-disable @typescript-eslint/no-unused-expressions */

type RewardRow = {
  id: number
  userId: number | null
  name: string
  rarity: string
  rewardType: string
}

type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T | null
  reward?: T | null
  errors?: Array<{ index: number; message: string }>
  statusCode?: number
}

describe('Reward mutation input boundary', () => {
  const stamp = Date.now()

  let apiBase = ''
  let adminToken = ''
  let rewardsUrl = ''
  let charactersUrl = ''
  let ownerToken = ''
  let otherToken = ''
  let ownerId: number | undefined
  let otherId: number | undefined
  let rewardId: number | undefined
  let privateCharacterId: number | undefined

  const ownerHeaders = () => bearerHeaders(ownerToken)
  const otherHeaders = () => bearerHeaders(otherToken)

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        rewardsUrl = `${apiBase}/rewards`
        charactersUrl = `${apiBase}/characters`
        return createLoggedInTestUser({ fresh: true })
      })
      .then((owner) => {
        ownerToken = owner.token
        ownerId = owner.id
        return createLoggedInTestUser({ role: 'second' })
      })
      .then((other) => {
        otherToken = other.token
        otherId = other.id

        // The other user owns one private Character.
        return cy
          .request<ApiResponse<{ id: number }>>({
            method: 'POST',
            url: charactersUrl,
            headers: otherHeaders(),
            body: { name: `RewardPrivateChar-${stamp}`, isPublic: false },
          })
          .then((res) => {
            expect(res.status, JSON.stringify(res.body)).to.eq(201)
            privateCharacterId = res.body.data?.id
            expect(privateCharacterId).to.be.a('number')
          })
      })
  })

  after(() => {
    if (rewardId && ownerToken) {
      cy.request({
        method: 'DELETE',
        url: `${rewardsUrl}/${rewardId}`,
        headers: ownerHeaders(),
        failOnStatusCode: false,
      }).then(() => {
        rewardId = undefined
      })
    }

    if (privateCharacterId && otherToken) {
      cy.request({
        method: 'DELETE',
        url: `${charactersUrl}/${privateCharacterId}`,
        headers: otherHeaders(),
        failOnStatusCode: false,
      })
    }

    deleteTestUser(apiBase, adminToken, ownerId)
    deleteTestUser(apiBase, adminToken, otherId)
  })

  it('creates a Reward under the authenticated owner', () => {
    expect(ownerId).to.exist

    cy.request<ApiResponse<RewardRow>>({
      method: 'POST',
      url: rewardsUrl,
      headers: ownerHeaders(),
      body: {
        name: `BoundaryReward-${stamp}`,
        slug: `boundary-reward-${stamp}`,
        rewardType: 'ITEM',
        rarity: 'COMMON',
        isPublic: false,
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.eq(true)
      const reward = response.body.data || response.body.reward
      expect(reward?.userId).to.eq(ownerId)

      rewardId = reward?.id
      expect(rewardId).to.be.a('number')
    })
  })

  it('rejects unknown fields on singular Reward creation', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: rewardsUrl,
      headers: ownerHeaders(),
      body: {
        name: `UnknownFieldReward-${stamp}`,
        createdAt: new Date().toISOString(),
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Unsupported Reward fields')
    })
  })

  it('rejects oversized and invalid relation arrays on Reward creation', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: rewardsUrl,
      headers: ownerHeaders(),
      body: {
        name: `OversizedRelationReward-${stamp}`,
        characterIds: Array.from({ length: 101 }, (_, index) => index + 1),
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('at most 100 entries')
    })

    cy.request<ApiResponse>({
      method: 'POST',
      url: rewardsUrl,
      headers: ownerHeaders(),
      body: {
        name: `InvalidRelationReward-${stamp}`,
        characterIds: [1, 0],
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('invalid ID at index 1')
    })
  })

  it('rejects nonexistent relation targets on Reward creation', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: rewardsUrl,
      headers: ownerHeaders(),
      body: {
        name: `MissingRelationReward-${stamp}`,
        characterIds: [2000000001],
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(404)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Character relation not found')
    })
  })

  it('forbids attaching another user private Character on Reward creation', () => {
    expect(privateCharacterId).to.exist

    cy.request<ApiResponse>({
      method: 'POST',
      url: rewardsUrl,
      headers: ownerHeaders(),
      body: {
        name: `ForbiddenRelationReward-${stamp}`,
        characterIds: [privateCharacterId],
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('permission to attach')
    })
  })

  it('rejects unknown, mismatched ID, and invalid enum fields on Reward PATCH', () => {
    expect(rewardId).to.exist

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${rewardsUrl}/${rewardId}`,
      headers: ownerHeaders(),
      body: { createdAt: new Date().toISOString() },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('Unsupported Reward fields')
    })

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${rewardsUrl}/${rewardId}`,
      headers: ownerHeaders(),
      body: { id: (rewardId as number) + 1 },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('must match the route')
    })

    cy.request<ApiResponse>({
      method: 'PATCH',
      url: `${rewardsUrl}/${rewardId}`,
      headers: ownerHeaders(),
      body: { rarity: 'NOT_A_RARITY' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('must be a valid Rarity')
    })
  })

  it('applies the same strict boundary to Reward batches', () => {
    const oversized = Array.from({ length: 101 }, (_, index) => ({
      name: `BatchCapReward-${stamp}-${index}`,
    }))

    cy.request<ApiResponse>({
      method: 'POST',
      url: `${rewardsUrl}/batch`,
      headers: ownerHeaders(),
      body: oversized,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.message).to.include('at most 100 entries')
    })

    cy.request<ApiResponse>({
      method: 'POST',
      url: `${rewardsUrl}/batch`,
      headers: ownerHeaders(),
      body: [
        {
          name: `BatchUnknownFieldReward-${stamp}`,
          createdAt: new Date().toISOString(),
        },
      ],
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Unsupported Reward fields')
    })
  })
})
