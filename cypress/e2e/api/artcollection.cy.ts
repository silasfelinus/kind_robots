/* eslint-disable @typescript-eslint/no-unused-expressions */

type ArtImageTestRecord = {
  id: number
}

describe('ArtCollection API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/art/collection'
  const artImageBaseUrl = 'https://kind-robots.vercel.app/api/art/image'
  const invalidToken = 'someInvalidTokenValue'

  let userToken = ''
  let collectionId: number
  let artImageId: number
  let existingArtImageIds: number[] = []
  let artImageIdToRemove: number
  let newArtImageId: number

  before(() => {
    cy.env(['USER_TOKEN']).then((env) => {
      userToken = String(env.USER_TOKEN || '')
      expect(userToken, 'USER_TOKEN').to.be.a('string').and.not.be.empty
    })

    cy.then(() => {
      cy.request({
        method: 'POST',
        url: artImageBaseUrl,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: {
          promptString:
            'surreal, A beautiful pancake sunrise over the mountains',
          artPrompt: 'surreal, A beautiful pancake sunrise over the mountains',
          steps: 10,
          path: '/images/test/pancake-sunrise-collection.webp',
          imagePath: '/images/test/pancake-sunrise-collection.webp',
          fileName: 'pancake-sunrise-collection.webp',
          fileType: 'webp',
          seed: null,
          userId: 9,
          isPublic: false,
          isMature: false,
          isActive: true,
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.log('Create ArtImage response:', JSON.stringify(response.body))

        expect(response.status).to.eq(201)
        expect(response.body.success).to.be.true
        expect(response.body.data).to.be.an('object').that.is.not.empty

        artImageId = response.body.data.id

        if (!artImageId) {
          throw new Error('Failed to create ArtImage.')
        }
      })
    })
  })

  it('Create a New ArtCollection', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        label: `cypress-art-collection-${Date.now()}`,
        description: 'Cypress ArtCollection test fixture',
        userId: 9,
        artImageIds: [artImageId],
        isPublic: false,
        isMature: false,
      },
      failOnStatusCode: false,
    }).then((response) => {
      cy.log('Create ArtCollection response:', JSON.stringify(response.body))

      expect(response.status).to.eq(201)
      expect(response.body.success).to.be.true

      collectionId = response.body.data.id
      existingArtImageIds = response.body.data.ArtImages.map(
        (image: ArtImageTestRecord) => image.id,
      )

      expect(collectionId).to.be.a('number')
      expect(existingArtImageIds).to.include(artImageId)
    })
  })

  it('should not allow adding ArtImages to collection without an authorization token', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${collectionId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
      body: {
        addArtImageIds: [artImageId],
      },
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('token')
    })
  })

  it('should not allow adding ArtImages to collection with an invalid authorization token', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${collectionId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
      body: {
        addArtImageIds: [artImageId],
      },
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('token')
    })
  })

  it('Add a Different ArtImage to Collection with Valid Token', () => {
    cy.request({
      method: 'POST',
      url: artImageBaseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        promptString: 'surreal, A magical castle in the clouds',
        artPrompt: 'surreal, A magical castle in the clouds',
        steps: 15,
        path: '/images/test/magical-castle-collection.webp',
        imagePath: '/images/test/magical-castle-collection.webp',
        fileName: 'magical-castle-collection.webp',
        fileType: 'webp',
        seed: null,
        userId: 9,
        isPublic: false,
        isMature: false,
        isActive: true,
      },
      failOnStatusCode: false,
    }).then((response) => {
      cy.log('Create second ArtImage response:', JSON.stringify(response.body))

      expect(response.status).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('object').that.is.not.empty

      newArtImageId = response.body.data.id
      expect(newArtImageId).to.exist

      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${collectionId}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: {
          addArtImageIds: [newArtImageId],
        },
        failOnStatusCode: false,
      }).then((patchResponse) => {
        cy.log('Patch add response:', JSON.stringify(patchResponse.body))

        expect(patchResponse.status).to.eq(200)
        expect(patchResponse.body.success).to.be.true

        const returnedArtImageIds = patchResponse.body.data.ArtImages.map(
          (image: ArtImageTestRecord) => image.id,
        )

        expect(returnedArtImageIds).to.include(newArtImageId)

        existingArtImageIds = returnedArtImageIds
      })
    })
  })

  it('Remove ArtImage from Collection', () => {
    const firstArtImageId = existingArtImageIds[0]

    if (firstArtImageId === undefined) {
      throw new Error('No ArtImage ID available to remove.')
    }

    artImageIdToRemove = firstArtImageId

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${collectionId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        removeArtImageIds: [artImageIdToRemove],
      },
      failOnStatusCode: false,
    }).then((response) => {
      cy.log('Patch remove response:', JSON.stringify(response.body))

      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true

      const returnedArtImageIds = response.body.data.ArtImages.map(
        (image: ArtImageTestRecord) => image.id,
      )

      expect(returnedArtImageIds).to.not.include(artImageIdToRemove)

      existingArtImageIds = returnedArtImageIds
    })
  })

  it('Replace ArtImages in Collection', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${collectionId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        artImageIds: [artImageId, newArtImageId].filter(Boolean),
        mode: 'replace',
      },
      failOnStatusCode: false,
    }).then((response) => {
      cy.log('Patch replace response:', JSON.stringify(response.body))

      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true

      const returnedArtImageIds = response.body.data.ArtImages.map(
        (image: ArtImageTestRecord) => image.id,
      )

      expect(returnedArtImageIds).to.include(artImageId)
      expect(returnedArtImageIds).to.include(newArtImageId)

      existingArtImageIds = returnedArtImageIds
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
      expect(response.body.message).to.match(/authorization/i)
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
      expect(response.body.message).to.include('token')
    })
  })

  it('Delete ArtCollection with Valid Token', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${collectionId}`,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.message).to.include(String(collectionId))
    })
  })

  after(() => {
    cy.then(() => {
      const cleanupArtImageIds = [artImageId, newArtImageId].filter(
        (id): id is number =>
          typeof id === 'number' && Number.isInteger(id) && id > 0,
      )

      cleanupArtImageIds.forEach((id) => {
        cy.request({
          method: 'DELETE',
          url: `${artImageBaseUrl}/${id}`,
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
          failOnStatusCode: false,
        }).then((response) => {
          if (response.status !== 404) {
            expect(response.status, JSON.stringify(response.body)).to.eq(200)
            expect(response.body.success).to.be.true
          }
        })
      })
    })
  })
})
