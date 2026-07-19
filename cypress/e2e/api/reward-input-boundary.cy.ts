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
  let ownerToken = ''
  let ownerId: number | undefined
  let rewardId: number | undefined

  const ownerHeaders = () => bearerHeaders(ownerToken)

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        rewardsUrl = `${apiBase}/rewards`
        return createLoggedInTestUser({ fresh: true })
      })
      .then((owner) => {
        ownerToken = owner.token
        ownerId = owner.id
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

    deleteTestUser(apiBase, adminToken, ownerId)
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
