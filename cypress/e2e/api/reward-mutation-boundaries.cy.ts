/// <reference types="cypress" />

import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
  type TestUserAuth,
} from '../../support/api-auth'

interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  reward?: T
}

interface RewardResponse {
  id: number
  name: string
  slug?: string | null
}

const expectLeanReward = (reward: Record<string, unknown>) => {
  expect(reward).to.not.have.property('ArtImage')
  expect(reward).to.not.have.property('Characters')
  expect(reward).to.not.have.property('Dreams')
  expect(reward).to.not.have.property('Reactions')
  expect(reward).to.not.have.property('User')
}

describe('Reward mutation boundaries', () => {
  let apiBase = ''
  let adminToken = ''
  let user: TestUserAuth | undefined
  let rewardId = 0
  let batchRewardId = 0

  const time = Date.now()
  const rewardsUrl = () => `${apiBase}/rewards`
  const authHeaders = () => bearerHeaders(user!.token)

  const deleteReward = (id: number) => {
    if (!id || !user) return

    cy.request({
      method: 'DELETE',
      url: `${rewardsUrl()}/${id}`,
      headers: authHeaders(),
      failOnStatusCode: false,
    })
  }

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        return createLoggedInTestUser({ fresh: true })
      })
      .then((auth) => {
        user = auth
      })
  })

  after(() => {
    deleteReward(rewardId)
    deleteReward(batchRewardId)
    deleteTestUser(apiBase, adminToken, user?.id)
  })

  it('returns a lean create response', () => {
    cy.request<ApiResponse<RewardResponse>>({
      method: 'POST',
      url: rewardsUrl(),
      headers: authHeaders(),
      body: {
        name: `Cypress Thin Reward ${time}`,
        slug: `cypress-thin-reward-${time}`,
        description: 'A reward used to verify mutation response boundaries.',
        rewardType: 'ITEM',
        rarity: 'COMMON',
        isPublic: false,
      },
    }).then((res) => {
      expect(res.status, JSON.stringify(res.body)).to.eq(201)
      expect(res.body.success).to.eq(true)
      const reward = res.body.data || res.body.reward
      expect(reward).to.exist
      expectLeanReward(reward as unknown as Record<string, unknown>)
      rewardId = reward!.id
    })
  })

  it('returns a lean update response', () => {
    cy.request<ApiResponse<RewardResponse>>({
      method: 'PATCH',
      url: `${rewardsUrl()}/${rewardId}`,
      headers: authHeaders(),
      body: {
        description: 'Updated without returning the relationship graph.',
        rarity: 'RARE',
      },
    }).then((res) => {
      expect(res.status, JSON.stringify(res.body)).to.eq(200)
      expect(res.body.success).to.eq(true)
      expect(res.body.data?.id).to.eq(rewardId)
      expectLeanReward(res.body.data as unknown as Record<string, unknown>)
    })
  })

  it('keeps relationship detail on the GET route', () => {
    cy.request<ApiResponse<RewardResponse>>({
      method: 'GET',
      url: `${rewardsUrl()}/${rewardId}`,
      headers: authHeaders(),
    }).then((res) => {
      expect(res.status).to.eq(200)
      const reward = res.body.reward || res.body.data
      expect(reward).to.have.property('Characters')
      expect(reward).to.have.property('Dreams')
      expect(reward).to.have.property('Reactions')
      expect(reward).to.have.property('User')
    })
  })

  it('returns lean rows for batch creation', () => {
    cy.request<ApiResponse<RewardResponse[]>>({
      method: 'POST',
      url: `${rewardsUrl()}/batch`,
      headers: authHeaders(),
      body: [
        {
          name: `Cypress Thin Batch Reward ${time}`,
          slug: `cypress-thin-batch-reward-${time}`,
          rewardType: 'MAGIC',
          rarity: 'UNCOMMON',
          isPublic: false,
        },
      ],
    }).then((res) => {
      expect(res.status, JSON.stringify(res.body)).to.eq(201)
      expect(res.body.success).to.eq(true)
      expect(res.body.data).to.be.an('array').with.length(1)
      const reward = res.body.data![0]!
      expectLeanReward(reward as unknown as Record<string, unknown>)
      batchRewardId = reward.id
    })
  })
})
