describe('Art Collection API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/art/collection'
  const apiKey = Cypress.env('API_KEY')
  let collectionId: number // Store collection ID for further operations
  let artId: number // Use an existing art ID or create one in advance
  let existingArtIds: number[] = [] // To store the current artIds in the collection
  let artIdToRemove: number // To store the artId we want to remove later
  
  // Create a new ArtCollection before running tests
  before(() => {
    // Assuming there's an existing artId, or you can create one here
    cy.request({
      method: 'POST',
      url: 'https://kind-robots.vercel.app/api/art', // Create a new Art if necessary
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        promptString: 'Testing, A serene lake in the evening',
        path: " ",
        seed: null,
        steps: null,
        channelId: null,
        galleryId: null,
        promptId: null,
        pitchId: null,
        isPublic: true,
      },
      failOnStatusCode: false,
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
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.collection).to.be.an('object')
      collectionId = response.body.collection.id // Capture the collection ID
  
      cy.log('Captured collectionId:', collectionId)
  
      if (!collectionId) {
        throw new Error('Failed to create collection.')
      }

      // Store the existing art IDs
      existingArtIds = response.body.collection.art.map((art: { id: number }) => art.id)
    })
  })

  it('Get All Art Collections', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}`, // Fetch all collections
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
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(response.body.collection.art).to.be.an('array').and.not.empty

      // Update existingArtIds after fetching the collection
      existingArtIds = response.body.collection.art.map((art: { id: number }) => art.id)
    })
  })

  it('Add a Different Art to Collection', () => {
    // Create a new art entry to add to the collection
    cy.request({
      method: 'POST',
      url: 'https://kind-robots.vercel.app/api/art',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        promptString: 'Another beautiful sunset',
        path: " ",
        seed: null,
        steps: null,
        channelId: null,
        galleryId: null,
        promptId: null,
        pitchId: null,
        isPublic: true,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200)
      const newArtId = response.body.art?.id
  
      // Now add the new artId to the collection
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${collectionId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          artIds: [...existingArtIds, newArtId], // Add the new art to the existing ones
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.collection).to.have.property('art')
        expect(response.body.collection.art).to.be.an('array').that.includes(newArtId)
  
        // Update the existingArtIds with the newly added art
        existingArtIds = response.body.collection.art.map((art: { id: number }) => art.id)
      })
    })
  })

  it('Remove Art from Collection', () => {
    // Set an artId to remove
    artIdToRemove = existingArtIds[0] // Assume the first art ID to remove

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${collectionId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        artIds: existingArtIds.filter((id: number) => id !== artIdToRemove), // Remove the specified artId from the list
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.collection).to.have.property('art')
      expect(response.body.collection.art).to.not.include(artIdToRemove)
  
      // Update existingArtIds after removing
      existingArtIds = response.body.collection.art.map((art: { id: number }) => art.id)
    })
  })

  it('Delete Art Collection', () => {
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
