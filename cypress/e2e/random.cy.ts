// cypress/e2e/random.cy.ts

describe('RandomList Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/random'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  let randomListId: number | undefined
  const uniqueTitle = `Dreams-${Date.now()}`
  const userId: number = 9 // Example user ID

  // Create a new RandomList before running tests
  it('Create a New RandomList', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
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

  // Attempt to Update RandomList without authentication
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
      expect(response.status).to.eq(401) // Unauthorized without token
    })
  })

  // Attempt to Update RandomList with an invalid token
  it('Attempt to Update RandomList with Invalid Token (expect failure)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${randomListId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: { title: `Unauthorized Update` },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized with invalid token
    })
  })

  // Update RandomList with valid authentication
  it('Update RandomList with Authentication', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${randomListId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
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

  // Retrieve RandomList by ID
  it('Get RandomList by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${randomListId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.list.title).to.eq(`Updated-${uniqueTitle}`)
    })
  })

  // Retrieve RandomList by Title
  it('Get RandomList by Title', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/title/${uniqueTitle}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.list.title).to.eq(`Updated-${uniqueTitle}`)
    })
  })

  // Retrieve all RandomLists
  it('Get All RandomLists', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.randomLists)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  // Attempt to Delete RandomList without authentication
  it('Attempt to Delete RandomList without Authentication (expect failure)', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${randomListId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized without token
    })
  })

  // Attempt to Delete RandomList with invalid token
  it('Attempt to Delete RandomList with Invalid Token (expect failure)', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${randomListId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized with invalid token
    })
  })

  // Delete RandomList with valid authentication
  it('Delete RandomList with Authentication', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${randomListId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })

  // Cleanup: Ensure deletion if not removed during tests
  after(() => {
    if (randomListId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${randomListId}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(200)
      })
    }
  })
})
