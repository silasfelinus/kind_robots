// cypress/e2e/random.cy.ts

describe('RandomList Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/random'
  const apiKey = Cypress.env('API_KEY')
  let randomListId: number | undefined // Define with undefined for clarity
  const uniqueTitle = `Dreams-${Date.now()}`
  const userId: number = 9 // Example user ID

  it('Create a New RandomList', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        title: uniqueTitle,
        items: [
          `Dream-${Date.now()}-1`,
          `Dream-${Date.now()}-2`,
          `Dream-${Date.now()}-3`,
        ],
        userId,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      randomListId = response.body.newList.id
    })
  })

  it('Attempt to Update RandomList without Authentication (expect failure)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${randomListId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: { title: `Unauthorized Update` },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403) // Forbidden without API key
    })
  })

  it('Update RandomList with Authentication', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${randomListId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        title: `Updated-${uniqueTitle}`,
        items: [
          `Updated-Dream-${Date.now()}-1`,
          `Updated-Dream-${Date.now()}-2`,
        ],
        userId,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.list.title).to.eq(`Updated-${uniqueTitle}`)
    })
  })

  it('Get RandomList by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${randomListId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.list.title).to.eq(`Updated-${uniqueTitle}`)
    })
  })

  it('Get RandomList by Title', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/title/${uniqueTitle}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.list.title).to.eq(`Updated-${uniqueTitle}`)
    })
  })

  it('Get All RandomLists', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.randomLists)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('Attempt to Delete RandomList without Authentication (expect failure)', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${randomListId}`,
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403) // Forbidden without API key
    })
  })

  it('Delete RandomList with Authentication', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${randomListId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })

  // Cleanup: Ensure deletion if not removed
  after(() => {
    if (randomListId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${randomListId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(200)
      })
    }
  })
})
