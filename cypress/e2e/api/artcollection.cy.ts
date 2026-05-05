/* eslint-disable @typescript-eslint/no-unused-expressions */

type Art = {
  id: number
}

describe('Art Collection API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/art/collection'
  const artBaseUrl = 'https://kind-robots.vercel.app/api/art'
  const invalidToken = 'someInvalidTokenValue'

  let userToken = ''
  let collectionId: number
  let artId: number
  let existingArtIds: number[] = []
  let artIdToRemove: number
  let newArtId: number

  before(() => {
    cy.env(['USER_TOKEN']).then((env) => {
      userToken = String(env.USER_TOKEN || '')
      expect(userToken, 'USER_TOKEN').to.be.a('string').and.not.be.empty
    })

    cy.then(() => {
      cy.request({
        method: 'POST',
        url: artBaseUrl,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: {
          promptString:
            'surreal, A beautiful pancake sunrise over the mountains',
          steps: 10,
          path: ' ',
          seed: null,
          galleryId: null,
          promptId: null,
          pitchId: null,
          userId: 9,
        },
      }).then((response) => {
        expect(response.status).to.eq(201)
        expect(response.body.success).to.be.true
        expect(response.body.data).to.be.an('object').that.is.not.empty

        artId = response.body.data.id

        if (!artId) {
          throw new Error('Failed to create art.')
        }
      })
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

      collectionId = response.body.data.id
      existingArtIds = response.body.data.art.map((art: Art) => art.id)
    })
  })

  it('should not allow adding art to collection without an authorization token', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${collectionId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
      body: {
        artIds: [artId],
      },
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('Missing or invalid token')
    })
  })

  it('should not allow adding art to collection with an invalid authorization token', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${collectionId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
      body: {
        artIds: [artId],
      },
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Add a Different Art to Collection with Valid Token', () => {
    cy.request({
      method: 'POST',
      url: artBaseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        promptString: 'surreal, A magical castle in the clouds',
        steps: 15,
        path: ' ',
        seed: null,
        galleryId: null,
        promptId: null,
        pitchId: null,
        userId: 9,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('object').that.is.not.empty

      newArtId = response.body.data.id
      expect(newArtId).to.exist

      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${collectionId}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: {
          artIds: [...existingArtIds, newArtId],
        },
      }).then((patchResponse) => {
        expect(patchResponse.status).to.eq(200)
        expect(patchResponse.body.success).to.be.true

        const returnedArtIds = patchResponse.body.data.art.map(
          (art: Art) => art.id,
        )

        expect(returnedArtIds).to.include(newArtId)

        existingArtIds = returnedArtIds
      })
    })
  })

  it('Remove Art from Collection', () => {
    const firstArtId = existingArtIds[0]

    if (firstArtId === undefined) {
      throw new Error('No art ID available to remove.')
    }

    artIdToRemove = firstArtId

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${collectionId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        artIds: existingArtIds.filter((id) => id !== artIdToRemove),
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true

      const returnedArtIds = response.body.data.art.map((art: Art) => art.id)

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
      expect(response.body.message).to.include(
        `Collection with ID ${collectionId} deleted successfully`,
      )
    })
  })

  after(() => {
    cy.then(() => {
      const cleanupArtIds = [artId, newArtId].filter(Boolean)

      cleanupArtIds.forEach((id) => {
        cy.request({
          method: 'DELETE',
          url: `${artBaseUrl}/${id}`,
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.success).to.be.true
        })
      })
    })
  })
})
