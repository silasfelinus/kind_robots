// cypress/e2e/artcollection.cy.js

describe('Art Collection API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/art/collection'
  const userToken = Cypress.env('USER_TOKEN')
  let collectionId: number
  let artId: number
  let existingArtIds: number[] = []
  let artIdToRemove: number

  before(() => {
    cy.request({
      method: 'POST',
      url: 'https://kind-robots.vercel.app/api/art',
      headers: {
        'Content-Type': 'application/json',
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
      expect(response.status).to.eq(200)
      artId = response.body.art?.id
      if (!artId) throw new Error('Failed to create art.')
    })
  })

  it('Create a New Art Collection', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        userId: 9,
        artIds: [artId],
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      collectionId = response.body.collection.id
      existingArtIds = response.body.collection.art.map((art: Art) => art.id)
    })
  })

  it('Get All Art Collections', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
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
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      existingArtIds = response.body.collection.art.map((art: Art) => art.id)
    })
  })

  it('Add a Different Art to Collection', () => {
    cy.request({
      method: 'POST',
      url: 'https://kind-robots.vercel.app/api/art',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        promptString: 'Another beautiful sunset',
        path: ' ',
        isPublic: true,
      },
    }).then((response) => {
      const newArtId = response.body.art?.id

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
    artIdToRemove = existingArtIds[0]

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
      const returnedArtIds = response.body.collection.art.map(
        (art: Art) => art.id,
      )
      expect(returnedArtIds).to.not.include(artIdToRemove)
      existingArtIds = returnedArtIds
    })
  })

  it('Delete Art Collection', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${collectionId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })

  after(() => {
    if (artId) {
      cy.request({
        method: 'DELETE',
        url: `https://kind-robots.vercel.app/api/art/${artId}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
      })
    }
  })
})
