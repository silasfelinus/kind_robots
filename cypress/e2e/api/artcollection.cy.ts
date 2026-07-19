/* eslint-disable @typescript-eslint/no-unused-expressions */
import {
  bearerHeaders,
  createLoggedInTestUser,
  getApiEnv,
  jsonHeaders,
} from '../../support/api-auth'

type ArtImageTestRecord = {
  id: number
  imageData?: unknown
  thumbnailData?: unknown
  galleryId?: unknown
  resourceId?: unknown
  rewardId?: unknown
  characterId?: unknown
  botId?: unknown
  componentId?: unknown
  achievementId?: unknown
  chatId?: unknown
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
  let baseUrl = ''
  let artImageBaseUrl = ''
  let userJwt = ''
  let userId = 0
  let collectionId: number | undefined
  let artImageId: number | undefined
  let secondArtImageId: number | undefined
  let existingArtImageIds: number[] = []

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
        isPublic: false,
        isMature: false,
        isActive: true,
      },
      failOnStatusCode: false,
    })

  before(() => {
    getApiEnv().then((env) => {
      apiBase = env.apiBase
      baseUrl = `${apiBase}/art/collection`
      artImageBaseUrl = `${apiBase}/art/image`
    })

    createLoggedInTestUser().then((auth) => {
      userJwt = auth.token
      userId = auth.id
    })

    cy.then(() => {
      createArtImage(
        'pancake-sunrise-collection',
        'surreal, A beautiful pancake sunrise over the mountains',
      ).then((response) => {
        expect(response.status, JSON.stringify(response.body)).to.eq(201)
        expect(response.body.success).to.be.true
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

    for (const id of [artImageId, secondArtImageId]) {
      if (!id) continue
      cy.request({
        method: 'DELETE',
        url: `${artImageBaseUrl}/${id}`,
        headers: bearerHeaders(userJwt),
        failOnStatusCode: false,
      })
    }
  })

  it('creates a new ArtCollection', () => {
    expect(artImageId, 'fixture ArtImage id').to.be.a('number')

    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: bearerHeaders(userJwt),
      body: {
        label: `cypress-art-collection-${Date.now()}`,
        description: 'Cypress ArtCollection test fixture',
        artImageIds: [artImageId],
        isPublic: false,
        isMature: false,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.be.true

      collectionId = response.body.data.id
      existingArtImageIds = artImageIdsFrom(response.body.data)

      expect(collectionId).to.be.a('number')
      expect(existingArtImageIds).to.include(artImageId)
    })
  })

  it('rejects image changes without valid authentication', () => {
    expect(collectionId, 'collection id').to.be.a('number')

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${collectionId}`,
      headers: jsonHeaders(),
      body: { addArtImageIds: [artImageId] },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
    })

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${collectionId}`,
      headers: bearerHeaders(badJwt),
      body: { addArtImageIds: [artImageId] },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
    })
  })

  it('adds a different ArtImage with a valid token', () => {
    createArtImage(
      'magical-castle-collection',
      'surreal, A magical castle in the clouds',
    ).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.be.true

      secondArtImageId = response.body.data.id
      expect(secondArtImageId).to.be.a('number')

      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${collectionId}`,
        headers: bearerHeaders(userJwt),
        body: { addArtImageIds: [secondArtImageId] },
        failOnStatusCode: false,
      }).then((patchResponse) => {
        expect(patchResponse.status, JSON.stringify(patchResponse.body)).to.eq(200)
        expect(patchResponse.body.success).to.be.true

        existingArtImageIds = artImageIdsFrom(patchResponse.body.data)
        expect(existingArtImageIds).to.include(secondArtImageId)
      })
    })
  })

  it('removes an ArtImage from the collection', () => {
    const idToRemove = existingArtImageIds[0]
    expect(idToRemove, 'ArtImage ID available to remove').to.be.a('number')

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${collectionId}`,
      headers: bearerHeaders(userJwt),
      body: { removeArtImageIds: [idToRemove] },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.be.true

      existingArtImageIds = artImageIdsFrom(response.body.data)
      expect(existingArtImageIds).to.not.include(idToRemove)
    })
  })

  it('replaces all ArtImages in the collection', () => {
    expect(artImageId).to.be.a('number')
    expect(secondArtImageId).to.be.a('number')

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${collectionId}`,
      headers: bearerHeaders(userJwt),
      body: {
        artImageIds: [artImageId, secondArtImageId],
        mode: 'replace',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.be.true

      existingArtImageIds = artImageIdsFrom(response.body.data)
      expect(existingArtImageIds).to.include(artImageId)
      expect(existingArtImageIds).to.include(secondArtImageId)
    })
  })

  it('lists the focused test collection without loading the entire gallery', () => {
    expect(collectionId).to.be.a('number')

    cy.request({
      method: 'GET',
      url: `${baseUrl}?id=${collectionId}&userId=${userId}`,
      headers: jsonHeaders(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.have.length(1)

      const collection = response.body.data[0] as ArtCollectionTestRecord
      expect(collection.id).to.eq(collectionId)
      expect(artImageIdsFrom(collection)).to.include(artImageId)
    })
  })

  it('gets the collection by ID with lightweight ArtImages', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${collectionId}`,
      headers: jsonHeaders(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.id).to.eq(collectionId)
      expect(response.body.data.ArtImages).to.be.an('array')
      expect(artImageIdsFrom(response.body.data)).to.include(artImageId)

      const firstImage = response.body.data.ArtImages[0] as ArtImageTestRecord
      for (const excluded of [
        'imageData',
        'thumbnailData',
        'galleryId',
        'resourceId',
        'rewardId',
        'characterId',
        'botId',
        'componentId',
        'achievementId',
        'chatId',
      ]) {
        expect(firstImage).to.not.have.property(excluded)
      }
    })
  })

  it('rejects deletion without valid authentication', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${collectionId}`,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
    })

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${collectionId}`,
      headers: bearerHeaders(badJwt),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
    })
  })

  it('deletes the ArtCollection with a valid token', () => {
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
