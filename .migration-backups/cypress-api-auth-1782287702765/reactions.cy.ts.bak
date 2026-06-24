// cypress/e2e/api/reactions.cy.ts

describe('Reaction Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api'
  const invalidToken = 'someInvalidTokenValue'
  const userId = 9

  let userToken = ''
  let artImageId: number | undefined
  let reactionId: number | undefined

  before(() => {
    cy.env(['USER_TOKEN']).then((env) => {
      userToken = String(env.USER_TOKEN || '')
      expect(userToken, 'USER_TOKEN').to.be.a('string').and.not.be.empty
    })
  })

  it('Create a New ArtImage Fixture', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/art/image`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        promptString: 'surreal, A beautiful pancake sunrise over the mountains',
        artPrompt: 'surreal, A beautiful pancake sunrise over the mountains',
        steps: 10,
        path: `/images/testing/reaction-fixture-${Date.now()}.webp`,
        imagePath: `/images/testing/reaction-fixture-${Date.now()}.webp`,
        fileType: 'webp',
        seed: -1,
        userId,
        isPublic: false,
        isMature: false,
        isActive: true,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data).to.have.property('id')

      artImageId = response.body.data.id

      expect(artImageId).to.be.a('number')
    })
  })

  it('should not allow creating a reaction without an authorization token', () => {
    expect(artImageId).to.exist

    cy.request({
      method: 'POST',
      url: `${baseUrl}/reactions`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        userId,
        reactionType: 'LOVED',
        reactionCategory: 'ART_IMAGE',
        artImageId,
        comment: 'Love this pancake sunrise art!',
        rating: 5,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token.')
    })
  })

  it('should not allow creating a reaction with an invalid authorization token', () => {
    expect(artImageId).to.exist

    cy.request({
      method: 'POST',
      url: `${baseUrl}/reactions`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        userId,
        reactionType: 'LOVED',
        reactionCategory: 'ART_IMAGE',
        artImageId,
        comment: 'Love this pancake sunrise art!',
        rating: 5,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.match(
        /authorization token|invalid or expired token/i,
      )
    })
  })

  it('Create a New ArtImage Reaction with Authentication', () => {
    expect(artImageId).to.exist

    cy.request({
      method: 'POST',
      url: `${baseUrl}/reactions`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        userId,
        reactionType: 'LOVED',
        reactionCategory: 'ART_IMAGE',
        artImageId,
        comment: 'Love this pancake sunrise art!',
        rating: 5,
        chatId: null,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data).to.have.property('id')
      expect(response.body.data.artImageId).to.eq(artImageId)

      reactionId = response.body.data.id

      expect(reactionId).to.be.a('number')
    })
  })

  it('Edit the ArtImage Reaction with Authentication', () => {
    expect(reactionId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        reactionType: 'CLAPPED',
        reactionCategory: 'ART_IMAGE',
        comment: 'Actually, clapping for this artwork!',
        rating: 4,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data).to.have.property('rating', 4)
      expect(response.body.data.comment).to.eq(
        'Actually, clapping for this artwork!',
      )
    })
  })

  it('Attempt to Delete Reaction without Authentication (expect failure)', () => {
    expect(reactionId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('message').and.to.be.a('string')
      expect(response.body.message).to.match(
        /authorization token|invalid or expired token/i,
      )
    })
  })

  it('Attempt to Delete Reaction with Invalid Token (expect failure)', () => {
    expect(reactionId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('message').and.to.be.a('string')
      expect(response.body.message).to.match(
        /authorization token|invalid or expired token/i,
      )
    })
  })

  it('Delete the ArtImage Reaction with Authentication', () => {
    expect(reactionId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.message).to.include(
        `Reaction with ID ${reactionId} successfully deleted`,
      )

      reactionId = undefined
    })
  })

  it('Delete the Created ArtImage Fixture with Authentication', () => {
    expect(artImageId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/art/image/${artImageId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect([200, 204, 404]).to.include(response.status)

      artImageId = undefined
    })
  })
})
