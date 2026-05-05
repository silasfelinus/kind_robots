// cypress/e2e/api/reactions.cy.ts

describe('Reaction Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api'
  const invalidToken = 'someInvalidTokenValue'
  const userId = 9

  let userToken = ''
  let artId: number | undefined
  let reactionId: number | undefined

  before(() => {
    cy.env(['USER_TOKEN']).then((env) => {
      userToken = String(env.USER_TOKEN || '')
      expect(userToken, 'USER_TOKEN').to.be.a('string').and.not.be.empty
    })
  })

  it('Create a New Art Piece', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/art`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        promptString: 'surreal, A beautiful pancake sunrise over the mountains',
        steps: 10,
        path: ' ',
        seed: null,
        galleryId: null,
        promptId: null,
        pitchId: null,
        userId,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data).to.have.property('id')

      artId = response.body.data.id

      expect(artId).to.be.a('number')
    })
  })

  it('should not allow creating a reaction without an authorization token', () => {
    expect(artId).to.exist

    cy.request({
      method: 'POST',
      url: `${baseUrl}/reactions`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        userId,
        reactionType: 'LOVED',
        reactionCategory: 'ART',
        artId,
        comment: 'Love this pancake sunrise art!',
        rating: 5,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  it('should not allow creating a reaction with an invalid authorization token', () => {
    expect(artId).to.exist

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
        reactionCategory: 'ART',
        artId,
        comment: 'Love this pancake sunrise art!',
        rating: 5,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Create a New Art Reaction with Authentication', () => {
    expect(artId).to.exist

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
        reactionCategory: 'ART',
        artId,
        comment: 'Love this pancake sunrise art!',
        rating: 5,
        chatId: null,
        artImageId: null,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data).to.have.property('id')

      reactionId = response.body.data.id

      expect(reactionId).to.be.a('number')
    })
  })

  it('Edit the Art Reaction with Authentication', () => {
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
        reactionCategory: 'ART',
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
      expect(response.body.message).to.include('Invalid or expired token')
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
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Delete the Art Reaction with Authentication', () => {
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
      expect(response.body.data).to.be.an('array').and.to.have.length(0)
      expect(response.body.message).to.include(
        `Reaction with ID ${reactionId} successfully deleted`,
      )

      reactionId = undefined
    })
  })

  it('Delete the Created Art Piece with Authentication', () => {
    expect(artId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/art/${artId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body).to.have.property('message').that.is.a('string')

      artId = undefined
    })
  })
})
