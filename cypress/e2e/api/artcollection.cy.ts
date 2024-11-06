/* eslint-disable @typescript-eslint/no-unused-expressions */
// cypress/e2e/artcollection.cy.js

describe('Art Collection API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/art/collection'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  let collectionId: number
  let artId: number
  let existingArtIds: number[] = []
  let artIdToRemove: number
  let newArtId: number

  before(() => {
    // Create a new Art before testing collections
    cy.request({
      method: 'POST',
      url: 'https://kind-robots.vercel.app/api/art',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        promptString: 'surreal, A beautiful pancake sunrise over the mountains',
        steps: 10,
        path: ' ',
        seed: null,
        channelId: null,
        galleryId: null,
        promptId: null,
        pitchId: null,
        userId: 9,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data.art).to.be.an('object').that.is.not.empty

      artId = response.body.data.art.id
      if (!artId) throw new Error('Failed to create art.')
    })
  })

  it('Create a New Art Collection', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        userId: 9,
        artIds: [artId],
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body.success).to.be.true
      collectionId = response.body.data.collection.id
      existingArtIds = response.body.data.collection.art.map(
        (art: Art) => art.id,
      )
    })
  })

  it('should not allow adding art to collection without an authorization token', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${collectionId}`,
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
      body: { artIds: [artId] },
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  it('should not allow adding art to collection with an invalid authorization token', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${collectionId}`,
      headers: {
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
      body: { artIds: [artId] },
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Add a Different Art to Collection with Valid Token', () => {
    cy.request({
      method: 'POST',
      url: 'https://kind-robots.vercel.app/api/art',
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        promptString: 'surreal, A magical castle in the clouds',
        steps: 15,
        path: ' ',
        seed: null,
        channelId: null,
        galleryId: null,
        promptId: null,
        pitchId: null,
        userId: 9,
      },
    }).then((response) => {
      newArtId = response.body.data.art.id
      expect(newArtId).to.exist
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${collectionId}`,
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        body: {
          artIds: [...existingArtIds, newArtId],
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.success).to.be.true
        const returnedArtIds = response.body.data.collection.art.map(
          (art: Art) => art.id,
        )
        expect(returnedArtIds).to.include(newArtId)
        existingArtIds = returnedArtIds
      })
    })
  })

  it('Remove Art from Collection', () => {
    artIdToRemove = existingArtIds[0]
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${collectionId}`,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        artIds: existingArtIds.filter((id) => id !== artIdToRemove),
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      const returnedArtIds = response.body.data.collection.art.map(
        (art: Art) => art.id,
      )
      expect(returnedArtIds).to.not.include(artIdToRemove)
      existingArtIds = returnedArtIds
    })
  })

  it('should not allow deleting a collection without an authorization token', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${collectionId}`,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  it('should not allow deleting a collection with an invalid authorization token', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${collectionId}`,
      headers: {
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Delete Art Collection with Valid Token', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${collectionId}`,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.message).to.include(
        `Art entry with ID ${collectionId} deleted successfully`,
      )
    })
  })

  after(() => {
    // Cleanup created art entries
    ;[artId, newArtId].forEach((id) => {
      if (id) {
        cy.request({
          method: 'DELETE',
          url: `https://kind-robots.vercel.app/api/art/${id}`,
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.success).to.be.true
        })
      }
    })
  })
})
