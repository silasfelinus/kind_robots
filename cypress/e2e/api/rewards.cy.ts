// /cypress/e2e/api/rewards.cy.ts

describe('Reward Management API Tests', () => {
  const baseUrl =
    Cypress.env('REWARDS_API_URL') ||
    'https://kind-robots.vercel.app/api/rewards'

  const invalidToken = 'someInvalidTokenValue'

  let userToken = ''
  let rewardId: number | undefined

  const uniqueSlug = `cypress-test-reward-${Date.now()}`
  const updatedSlug = `${uniqueSlug}-updated`

  const createPayload = {
    name: 'Cypress Test Reward',
    slug: uniqueSlug,
    description:
      'A test reward created by Cypress to verify the remodeled reward schema.',
    flavorText: 'The test knows what you did last deploy.',
    effect:
      'When played into a scene, confirm that the reward API accepts the remodeled fields.',
    icon: 'kind-icon:star',
    collection: 'Cypress Test Collection',
    rarity: 'COMMON',
    rewardType: 'ITEM',
    imagePath: null,
    artPrompt:
      'A cheerful magical test artifact glowing with frontend validation energy.',
    isMature: false,
    isPublic: true,
    isActive: true,
  }

  const updatePayload = {
    name: 'Updated Cypress Test Reward',
    slug: updatedSlug,
    description:
      'An updated reward created by Cypress to verify PATCH behavior.',
    flavorText: 'It changed, therefore it lives.',
    effect:
      'When played into a scene, confirm that PATCH updates remodeled reward fields correctly.',
    rarity: 'RARE',
    rewardType: 'MAGIC',
    collection: 'Updated Cypress Test Collection',
    icon: 'kind-icon:sparkles',
    artPrompt:
      'An updated magical test reward with rare sparkles and suspiciously good logs.',
  }

  before(() => {
    userToken = String(Cypress.env('USER_TOKEN') || '')
    expect(userToken, 'USER_TOKEN').to.be.a('string').and.not.be.empty
  })

  after(() => {
    if (!rewardId) return

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${rewardId}`,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
      failOnStatusCode: false,
      timeout: 60000,
    }).then(() => {
      rewardId = undefined
    })
  })

  it('should not allow creating a reward without an authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        ...createPayload,
        slug: `${uniqueSlug}-no-auth`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('should not allow creating a reward with an invalid authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        ...createPayload,
        slug: `${uniqueSlug}-invalid-auth`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('should not allow creating a reward without a name', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        ...createPayload,
        name: '',
        slug: `${uniqueSlug}-missing-name`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body).to.have.property('success', false)
      expect(response.body.message).to.include('Reward name is required')
    })
  })

  it('should not allow creating a reward for another user', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        ...createPayload,
        slug: `${uniqueSlug}-wrong-user`,
        userId: 999999,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body).to.have.property('success', false)
      expect(response.body.message).to.include(
        'User ID in the reward data does not match the authenticated user',
      )
    })
  })

  it('should create a new reward with authentication', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: createPayload,
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('success', true)
      expect(response.body).to.have.property('reward')
      expect(response.body.reward).to.be.an('object')

      expect(response.body.reward.name).to.eq(createPayload.name)
      expect(response.body.reward.slug).to.eq(createPayload.slug)
      expect(response.body.reward.description).to.eq(createPayload.description)
      expect(response.body.reward.flavorText).to.eq(createPayload.flavorText)
      expect(response.body.reward.effect).to.eq(createPayload.effect)
      expect(response.body.reward.icon).to.eq(createPayload.icon)
      expect(response.body.reward.collection).to.eq(createPayload.collection)
      expect(response.body.reward.rarity).to.eq(createPayload.rarity)
      expect(response.body.reward.rewardType).to.eq(createPayload.rewardType)
      expect(response.body.reward.artPrompt).to.eq(createPayload.artPrompt)
      expect(response.body.reward.isMature).to.eq(createPayload.isMature)
      expect(response.body.reward.isPublic).to.eq(createPayload.isPublic)
      expect(response.body.reward.isActive).to.eq(createPayload.isActive)

      rewardId = response.body.reward.id

      expect(rewardId).to.be.a('number')
    })
  })

  it('should not allow updating a reward without authentication', () => {
    expect(rewardId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${rewardId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        name: 'Unauthorized Update',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('should not allow updating a reward with an invalid token', () => {
    expect(rewardId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${rewardId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        name: 'Invalid Token Update Attempt',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('should not allow changing reward ownership during update', () => {
    expect(rewardId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${rewardId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        userId: 999999,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body).to.have.property('success', false)
      expect(response.body.message).to.include(
        'Reward ownership cannot be changed here',
      )
    })
  })

  it('should update a reward with authentication', () => {
    expect(rewardId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${rewardId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: updatePayload,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body).to.have.property('data')
      expect(response.body.data).to.be.an('object')

      expect(response.body.data.name).to.eq(updatePayload.name)
      expect(response.body.data.slug).to.eq(updatePayload.slug)
      expect(response.body.data.description).to.eq(updatePayload.description)
      expect(response.body.data.flavorText).to.eq(updatePayload.flavorText)
      expect(response.body.data.effect).to.eq(updatePayload.effect)
      expect(response.body.data.rarity).to.eq(updatePayload.rarity)
      expect(response.body.data.rewardType).to.eq(updatePayload.rewardType)
      expect(response.body.data.collection).to.eq(updatePayload.collection)
      expect(response.body.data.icon).to.eq(updatePayload.icon)
      expect(response.body.data.artPrompt).to.eq(updatePayload.artPrompt)
    })
  })

  it('should get reward by ID', () => {
    expect(rewardId).to.exist

    cy.request({
      method: 'GET',
      url: `${baseUrl}/${rewardId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body).to.have.property('reward')
      expect(response.body.reward).to.be.an('object')

      expect(response.body.reward.id).to.eq(rewardId)
      expect(response.body.reward.name).to.eq(updatePayload.name)
      expect(response.body.reward.slug).to.eq(updatePayload.slug)
      expect(response.body.reward.description).to.eq(updatePayload.description)
      expect(response.body.reward.flavorText).to.eq(updatePayload.flavorText)
      expect(response.body.reward.effect).to.eq(updatePayload.effect)
      expect(response.body.reward.rarity).to.eq(updatePayload.rarity)
      expect(response.body.reward.rewardType).to.eq(updatePayload.rewardType)
    })
  })

  it('should get all rewards', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data)
        .to.be.an('array')
        .and.have.length.greaterThan(0)

      const matchingReward = response.body.data.find(
        (reward: { id: number }) => reward.id === rewardId,
      )

      expect(matchingReward).to.be.an('object')
      expect(matchingReward.name).to.eq(updatePayload.name)
      expect(matchingReward.effect).to.eq(updatePayload.effect)
    })
  })

  it('should not allow deleting a reward without authentication', () => {
    expect(rewardId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${rewardId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
      expect(response.body.message).to.match(
        /Authorization token is required|Invalid or expired token/,
      )
    })
  })

  it('should not allow deleting a reward with an invalid token', () => {
    expect(rewardId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${rewardId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('should delete a reward with authentication', () => {
    expect(rewardId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${rewardId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      timeout: 60000,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.message).to.include(`Reward`)

      rewardId = undefined
    })
  })
})
