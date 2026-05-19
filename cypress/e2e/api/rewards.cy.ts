// cypress/e2e/api/rewards.cy.ts

describe('Reward Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/rewards'
  const invalidToken = 'someInvalidTokenValue'

  let userToken = ''
  let rewardId: number | undefined

  before(() => {
    cy.env(['USER_TOKEN']).then((env) => {
      userToken = String(env.USER_TOKEN || '')
      expect(userToken, 'USER_TOKEN').to.be.a('string').and.not.be.empty
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
        icon: 'kind-icon:star',
        text: 'Test Reward Text',
        power: 'Test Power',
        collection: 'Test Collection',
        rarity: 'COMMON',
        rewardType: 'ITEM',
        label: 'Testertons special Label',
        userId: 9,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token.')
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
        icon: 'kind-icon:star',
        text: 'Test Reward Text',
        power: 'Test Power',
        collection: 'Test Collection',
        rarity: 'COMMON',
        rewardType: 'ITEM',
        label: 'Test Label',
        userId: 9,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Create a New Reward with Authentication', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        icon: 'kind-icon:star',
        text: 'Test Reward Text',
        power: 'Test Power',
        collection: 'Test Collection',
        rarity: 'COMMON',
        rewardType: 'ITEM',
        label: 'Test Label',
        userId: 9,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('success', true)
      expect(response.body.reward).to.be.an('object')
      expect(response.body.reward.label).to.eq('Test Label')

      rewardId = response.body.reward.id

      expect(rewardId).to.be.a('number')
    })
  })

  it('Attempt to Update Reward without Authentication (expect failure)', () => {
    expect(rewardId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${rewardId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        text: 'Unauthorized Update',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Attempt to Update Reward with Invalid Token (expect failure)', () => {
    expect(rewardId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${rewardId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        text: 'Invalid Token Update Attempt',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Update Reward with Authentication', () => {
    expect(rewardId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${rewardId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        text: 'Updated Test Reward Text',
        rarity: 'RARE',
        label: 'Updated Test Label',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data).to.be.an('object')
      expect(response.body.data.label).to.eq('Updated Test Label')
      expect(response.body.data.text).to.eq('Updated Test Reward Text')
      expect(response.body.data.rarity).to.eq('RARE')
    })
  })

  it('Get Reward by ID', () => {
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
      expect(response.body.reward).to.be.an('object')
      expect(response.body.reward.text).to.eq('Updated Test Reward Text')
    })
  })

  it('Get All Rewards', () => {
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
    })
  })

  it('Attempt to Delete Reward without Authentication (expect failure)', () => {
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
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  it('Attempt to Delete Reward with Invalid Token (expect failure)', () => {
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
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Delete Reward with Authentication', () => {
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
      expect(response.body.message).to.include(
        `Reward with ID ${rewardId} successfully deleted`,
      )

      rewardId = undefined
    })
  })
})
