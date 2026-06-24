/* eslint-disable @typescript-eslint/no-unused-expressions */
import {
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
  jsonHeaders,
} from '../../support/api-auth'

type ArtImageTestRecord = {
  id: number
}

type ArtCollectionTestRecord = {
  id: number
  ArtImages?: ArtImageTestRecord[]
}

const artImageIdsFrom = (collection: ArtCollectionTestRecord): number[] =>
  (collection.ArtImages ?? []).map((image) => image.id)

describe('ArtCollection API Tests', () => {
  const badJwt = 'definitely-not-valid'

  let apiBase = ''
  let setupAuth = ''
  let baseUrl = ''
  let artImageBaseUrl = ''
  let userJwt = ''
  let createdUserId: number | undefined
  let collectionId: number | undefined
  let artImageId: number | undefined
  let existingArtImageIds: number[] = []
  let artImageIdToRemove: number | undefined
  let newArtImageId: number | undefined

  const createArtImage = (label: string, prompt: string) =>
    cy.request({
      method: 'POST',
      url: artImageBaseUrl,
      headers: bearerHeaders(userJwt),
      body: {
        promptString: prompt,
        artPrompt: prompt,
        steps: 10,
        path: `/images/test/${label}.webp`,
        imagePath: `/images/test/${label}.webp`,
        fileName: `${label}.webp`,
        fileType: 'webp',
        seed: null,
        userId: createdUserId,
        isPublic: false,
        isMature: false,
        isActive: true,
      },
      failOnStatusCode: false,
    })

  before(() => {
    getApiEnv().then((env) => {
      apiBase = env.apiBase
      setupAuth = env.adminToken
      baseUrl = `${apiBase}/art/collection`
      artImageBaseUrl = `${apiBase}/art/image`
    })

    createLoggedInTestUser().then((auth) => {
      userJwt = auth.token
      createdUserId = auth.id
    })

    cy.then(() => {
      createArtImage(
        'pancake-sunrise-collection',
        'surreal, A beautiful pancake sunrise over the mountains',
      ).then((response) => {
        cy.log('Create ArtImage response:', JSON.stringify(response.body))

        expect(response.status, JSON.stringify(response.body)).to.eq(201)
        expect(response.body.success).to.be.true
        expect(response.body.data).to.be.an('object').that.is.not.empty

        artImageId = response.body.data.id
        expect(artImageId, 'created ArtImage id').to.be.a('number')
      })
    })
  })

  after(() => {
    if (collectionId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${collectionId}`,
        headers: bearerHeaders(userJwt),
        failOnStatusCode: false,
      })
    }

    const cleanupArtImageIds = [artImageId, newArtImageId].filter(
      (id): id is number =>
        typeof id === 'number' && Number.isInteger(id) && id > 0,
    )

    cleanupArtImageIds.forEach((id) => {
      cy.request({
        method: 'DELETE',
        url: `${artImageBaseUrl}/${id}`,
        headers: bearerHeaders(userJwt),
        failOnStatusCode: false,
      })
    })

    deleteTestUser(apiBase, setupAuth, createdUserId)
  })

  it('Create a New ArtCollection', () => {
    expect(artImageId, 'fixture ArtImage id').to.be.a('number')

    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: bearerHeaders(userJwt),
      body: {
        label: `cypress-art-collection-${Date.now()}`,
        description: 'Cypress ArtCollection test fixture',
        userId: createdUserId,
        artImageIds: [artImageId],
        isPublic: false,
        isMature: false,
      },
      failOnStatusCode: false,
    }).then((response) => {
      cy.log('Create ArtCollection response:', JSON.stringify(response.body))

      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.be.true

      collectionId = response.body.data.id
      existingArtImageIds = artImageIdsFrom(response.body.data)

      expect(collectionId).to.be.a('number')
      expect(existingArtImageIds).to.include(artImageId)
    })
  })

  it('should not allow adding ArtImages to collection without an authorization token', () => {
    expect(collectionId, 'collection id').to.be.a('number')

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${collectionId}`,
      headers: jsonHeaders(),
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
    expect(collectionId, 'collection id').to.be.a('number')

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${collectionId}`,
      headers: bearerHeaders(badJwt),
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
    expect(collectionId, 'collection id').to.be.a('number')

    createArtImage(
      'magical-castle-collection',
      'surreal, A magical castle in the clouds',
    ).then((response) => {
      cy.log('Create second ArtImage response:', JSON.stringify(response.body))

      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('object').that.is.not.empty

      newArtImageId = response.body.data.id
      expect(newArtImageId).to.be.a('number')

      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${collectionId}`,
        headers: bearerHeaders(userJwt),
        body: {
          addArtImageIds: [newArtImageId],
        },
        failOnStatusCode: false,
      }).then((patchResponse) => {
        cy.log('Patch add response:', JSON.stringify(patchResponse.body))

        expect(patchResponse.status, JSON.stringify(patchResponse.body)).to.eq(200)
        expect(patchResponse.body.success).to.be.true

        const returnedArtImageIds = artImageIdsFrom(patchResponse.body.data)

        expect(returnedArtImageIds).to.include(newArtImageId)

        existingArtImageIds = returnedArtImageIds
      })
    })
  })

  it('Remove ArtImage from Collection', () => {
    const firstArtImageId = existingArtImageIds[0]

    expect(firstArtImageId, 'ArtImage ID available to remove').to.be.a('number')
    artImageIdToRemove = firstArtImageId

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${collectionId}`,
      headers: bearerHeaders(userJwt),
      body: {
        removeArtImageIds: [artImageIdToRemove],
      },
      failOnStatusCode: false,
    }).then((response) => {
      cy.log('Patch remove response:', JSON.stringify(response.body))

      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.be.true

      const returnedArtImageIds = artImageIdsFrom(response.body.data)

      expect(returnedArtImageIds).to.not.include(artImageIdToRemove)

      existingArtImageIds = returnedArtImageIds
    })
  })

  it('Replace ArtImages in Collection', () => {
    expect(collectionId, 'collection id').to.be.a('number')
    expect(artImageId, 'first ArtImage id').to.be.a('number')
    expect(newArtImageId, 'second ArtImage id').to.be.a('number')

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${collectionId}`,
      headers: bearerHeaders(userJwt),
      body: {
        artImageIds: [artImageId, newArtImageId].filter(Boolean),
        mode: 'replace',
      },
      failOnStatusCode: false,
    }).then((response) => {
      cy.log('Patch replace response:', JSON.stringify(response.body))

      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.be.true

      const returnedArtImageIds = artImageIdsFrom(response.body.data)

      expect(returnedArtImageIds).to.include(artImageId)
      expect(returnedArtImageIds).to.include(newArtImageId)

      existingArtImageIds = returnedArtImageIds
    })
  })

  it('Get All ArtCollections', () => {
    expect(collectionId, 'collection id').to.be.a('number')

    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: jsonHeaders(),
      failOnStatusCode: false,
    }).then((response) => {
      cy.log('Get all ArtCollections response:', JSON.stringify(response.body))

      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('array')

      const matchingCollection = response.body.data.find(
        (collection: { id: number }) => collection.id === collectionId,
      )

      expect(matchingCollection).to.exist
      expect(matchingCollection.ArtImages).to.be.an('array')

      const returnedArtImageIds = artImageIdsFrom(matchingCollection)

      expect(returnedArtImageIds).to.include(artImageId)
    })
  })

  it('Get ArtCollection by ID', () => {
    expect(collectionId, 'collection id').to.be.a('number')

    cy.request({
      method: 'GET',
      url: `${baseUrl}/${collectionId}`,
      headers: jsonHeaders(),
      failOnStatusCode: false,
    }).then((response) => {
      cy.log('Get ArtCollection by ID response:', JSON.stringify(response.body))

      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('object')
      expect(response.body.data.id).to.eq(collectionId)
      expect(response.body.data.ArtImages).to.be.an('array')

      const returnedArtImageIds = artImageIdsFrom(response.body.data)

      expect(returnedArtImageIds).to.include(artImageId)
    })
  })

  it('Get ArtCollection by ID returns lightweight ArtImages only', () => {
    expect(collectionId, 'collection id').to.be.a('number')

    cy.request({
      method: 'GET',
      url: `${baseUrl}/${collectionId}`,
      headers: jsonHeaders(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.be.true

      const firstImage = response.body.data.ArtImages[0]

      expect(firstImage).to.not.have.property('imageData')
      expect(firstImage).to.not.have.property('thumbnailData')
      expect(firstImage).to.not.have.property('galleryId')
      expect(firstImage).to.not.have.property('resourceId')
      expect(firstImage).to.not.have.property('rewardId')
      expect(firstImage).to.not.have.property('characterId')
      expect(firstImage).to.not.have.property('botId')
      expect(firstImage).to.not.have.property('componentId')
      expect(firstImage).to.not.have.property('milestoneId')
      expect(firstImage).to.not.have.property('chatId')
    })
  })

  it('should not allow deleting a collection without an authorization token', () => {
    expect(collectionId, 'collection id').to.be.a('number')

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${collectionId}`,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.match(/authorization|token/i)
    })
  })

  it('should not allow deleting a collection with an invalid authorization token', () => {
    expect(collectionId, 'collection id').to.be.a('number')

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${collectionId}`,
      headers: bearerHeaders(badJwt),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('token')
    })
  })

  it('Delete ArtCollection with Valid Token', () => {
    expect(collectionId, 'collection id').to.be.a('number')

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${collectionId}`,
      headers: bearerHeaders(userJwt),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.message).to.include(String(collectionId))
      collectionId = undefined
    })
  })
})
