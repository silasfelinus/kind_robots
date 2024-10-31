// cypress/e2e/artcollection.cy.js
/* eslint-disable @typescript-eslint/no-unused-expressions */

describe('Art Collection API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/art/collection'
  const apiKey = Cypress.env('API_KEY')
  let collectionId: number // Store collection ID for further operations
  let artId: number // Use an existing art ID or create one in advance
  let existingArtIds: number[] = [] // To store the current artIds in the collection
  let artIdToRemove: number // To store the artId we want to remove later

  // Create a new ArtCollection before running tests
  before(() => {
    cy.request({
      method: 'POST',
      url: 'https://kind-robots.vercel.app/api/art', // Create a new Art if necessary
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        promptString: 'Testing, A serene lake in the evening',
        path: ' ',
        seed: null,
        steps: null,
        channelId: null,
        galleryId: null,
        promptId: null,
        pitchId: null,
        isPublic: true,
        userId: 9,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      artId = response.body.art?.id

      if (!artId) {
        throw new Error('Failed to create art.')
      }
    })
  })

  it('Create a New Art Collection', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        userId: 1, // Replace with a valid userId
        artIds: [artId],
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.collection).to.be.an('object')
      collectionId = response.body.collection.id
      existingArtIds = response.body.collection.art.map((art: Art) => art.id)
    })
  })

  it('Get All Art Collections', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.collections).to.be.an('array')
    })
  })

  it('Get Art Collection by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${collectionId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.collection).to.be.an('object')
      existingArtIds = response.body.collection.art.map((art: Art) => art.id)
    })
  })

  it('Add a Different Art to Collection', () => {
    cy.request({
      method: 'POST',
      url: 'https://kind-robots.vercel.app/api/art',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        promptString: 'Another beautiful sunset',
        path: ' ',
        isPublic: true,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      const newArtId = response.body.art?.id

      // Attempt to update without API key (expect failure)
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${collectionId}`,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          artIds: [...existingArtIds, newArtId],
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(403) // Expect forbidden without API key
      })

      // Attempt to update with API key (expect success)
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${collectionId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          artIds: [...existingArtIds, newArtId],
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        const returnedArtIds = response.body.collection.art.map(
          (art: Art) => art.id,
        )
        expect(returnedArtIds).to.include(newArtId)
        existingArtIds = returnedArtIds
      })
    })
  })

  it('Remove Art from Collection', () => {
    expect(existingArtIds).to.be.an('array').and.not.empty
    artIdToRemove = existingArtIds[0]

    // Attempt to remove without API key (expect failure)
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${collectionId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        artIds: existingArtIds.filter((id) => id !== artIdToRemove),
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403) // Expect forbidden without API key
    })

    // Attempt to remove with API key (expect success)
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${collectionId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        artIds: existingArtIds.filter((id) => id !== artIdToRemove),
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      const returnedArtIds = response.body.collection.art.map(
        (art: Art) => art.id,
      )
      expect(returnedArtIds).to.not.include(artIdToRemove)
      existingArtIds = returnedArtIds
    })
  })

  it('Delete Art Collection', () => {
    // Attempt delete without API key (expect failure)
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${collectionId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403) // Expect forbidden without API key
    })

    // Attempt delete with API key (expect success)
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${collectionId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })

  // Clean up created art to ensure there's no leftover data
  after(() => {
    if (artId) {
      cy.request({
        method: 'DELETE',
        url: `https://kind-robots.vercel.app/api/art/${artId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
      })
    }
  })
})
