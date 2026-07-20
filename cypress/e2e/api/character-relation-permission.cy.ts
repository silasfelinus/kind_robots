import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
} from '../../support/api-auth'

/* eslint-disable @typescript-eslint/no-unused-expressions */

type IdRow = { id: number }

type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T | null
  reward?: T | null
  statusCode?: number
}

describe('Character relation permission gate', () => {
  const stamp = Date.now()

  let apiBase = ''
  let adminToken = ''
  let charactersUrl = ''
  let rewardsUrl = ''
  let ownerToken = ''
  let otherToken = ''
  let ownerId: number | undefined
  let otherId: number | undefined
  let privateRewardId: number | undefined
  let publicRewardId: number | undefined
  let characterId: number | undefined

  const ownerHeaders = () => bearerHeaders(ownerToken)
  const otherHeaders = () => bearerHeaders(otherToken)

  const createReward = (isPublic: boolean, label: string) =>
    cy
      .request<ApiResponse<IdRow>>({
        method: 'POST',
        url: rewardsUrl,
        headers: otherHeaders(),
        body: { name: `CharRel${label}Reward-${stamp}`, isPublic },
      })
      .then((res) => {
        expect(res.status, JSON.stringify(res.body)).to.eq(201)
        const reward = res.body.data || res.body.reward
        expect(reward?.id).to.be.a('number')
        return reward!.id
      })

  before(() => {
    return getApiEnv()
      .then((env) => {
        apiBase = env.apiBase
        adminToken = env.adminToken
        charactersUrl = `${apiBase}/characters`
        rewardsUrl = `${apiBase}/rewards`
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
        return createReward(false, 'Private')
      })
      .then((id) => {
        privateRewardId = id
        return createReward(true, 'Public')
      })
      .then((id) => {
        publicRewardId = id
      })
  })

  after(() => {
    if (characterId && ownerToken) {
      cy.request({
        method: 'DELETE',
        url: `${charactersUrl}/${characterId}`,
        headers: ownerHeaders(),
        failOnStatusCode: false,
      })
    }

    for (const id of [privateRewardId, publicRewardId]) {
      if (id && otherToken) {
        cy.request({
          method: 'DELETE',
          url: `${rewardsUrl}/${id}`,
          headers: otherHeaders(),
          failOnStatusCode: false,
        })
      }
    }

    deleteTestUser(apiBase, adminToken, ownerId)
    deleteTestUser(apiBase, adminToken, otherId)
  })

  it('forbids attaching another user private Reward on Character creation', () => {
    expect(privateRewardId).to.exist

    cy.request<ApiResponse>({
      method: 'POST',
      url: charactersUrl,
      headers: ownerHeaders(),
      body: {
        name: `PrivateRelationChar-${stamp}`,
        rewardIds: [privateRewardId],
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('permission to attach')
    })
  })

  it('allows attaching a public Reward on Character creation', () => {
    expect(publicRewardId).to.exist

    cy.request<ApiResponse<IdRow>>({
      method: 'POST',
      url: charactersUrl,
      headers: ownerHeaders(),
      body: {
        name: `PublicRelationChar-${stamp}`,
        rewardIds: [publicRewardId],
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.eq(true)

      characterId = response.body.data?.id
      expect(characterId).to.be.a('number')
    })
  })
})
