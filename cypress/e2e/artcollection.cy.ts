 

describe('Art Collection API Tests', () => {
    const baseUrl = 'https://kind-robots.vercel.app/api/art/collection'
    const apiKey = Cypress.env('API_KEY')
    let collectionId: number // Store collection ID for further operations
    let artId: number // Use an existing art ID or create one in advance
  
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
          steps: 10,
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
      })
    })
  
    it('Add Art to Collection', () => {
      // Adding another artId to the collection
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${collectionId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          action: 'add',
          artId: artId,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.collection.art).to.be.an('array').that.includes(artId)
      })
    })
  
    it('Remove Art from Collection', () => {
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/${collectionId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: {
          action: 'remove',
          artId: artId,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.collection.art).to.not.include(artId)
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
  