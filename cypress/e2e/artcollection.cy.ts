 

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
            action: 'add',
            artId: newArtId, // Adding a new artId instead of the original one
          },
        }).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.collection.art).to.be.an('array').that.includes(newArtId)
        })
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
  