// cypress/e2e/random-list.cy.ts

describe('RandomList Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/random'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  let randomListId: number | undefined
  const userId = 9 // Example user ID for tests

  const now = Date.now()
  let uniqueTitle = `Dreams-${now}`
  const initialItems = [`Dream-${now}-1`, `Dream-${now}-2`, `Dream-${now}-3`]

  // Step 1: Attempt to create a random list with various authentication cases

  it('should not allow creating a RandomList without an authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        title: uniqueTitle,
        items: initialItems,
        userId,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  it('should not allow creating a RandomList with an invalid authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        title: uniqueTitle,
        items: initialItems,
        userId,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Create a New RandomList with Valid Authentication', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        title: uniqueTitle,
        items: initialItems,
        userId,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('success', true)
      randomListId = response.body.data?.randomList.id
    })
  })

  // Step 2: Attempt to update random list without authentication
  it('Attempt to Update RandomList without Authentication (expect failure)', () => {
    cy.wrap(randomListId).should('exist')
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${randomListId}`,
      headers: { 'Content-Type': 'application/json' },
      body: { title: `Unauthorized Update` },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  // Step 3: Attempt to update random list with invalid token
  it('Attempt to Update RandomList with Invalid Token (expect failure)', () => {
    cy.wrap(randomListId).should('exist')
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
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  // Step 4: Update random list with valid authentication
  it('Update RandomList with Authentication', () => {
    const newTitle = `Updated-${uniqueTitle}`
    const updatedItems = [`Updated-Dream-${now}-1`, `Updated-Dream-${now}-2`]
    cy.wrap(randomListId).should('exist')
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${randomListId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        title: newTitle,
        items: updatedItems,
        userId,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data.updatedList.title).to.eq(newTitle)
      uniqueTitle = newTitle // Update for following tests
    })
  })

  // Step 5: Retrieve random list by ID
  it('Get RandomList by ID', () => {
    cy.wrap(randomListId).should('exist')
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${randomListId}`,
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data.list.title).to.eq(uniqueTitle)
    })
  })

  // Step 6: Retrieve random list by title
  it('Get RandomList by Title', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/title/${uniqueTitle}`,
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data.list.title).to.eq(uniqueTitle)
    })
  })

  // Step 7: Retrieve all random lists
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
      expect(response.body).to.have.property('success', true)
      expect(response.body.data.randomLists)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  // Step 8: Attempt to delete random list without authentication
  it('Attempt to Delete RandomList without Authentication (expect failure)', () => {
    cy.wrap(randomListId).should('exist')
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${randomListId}`,
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  // Step 9: Attempt to delete random list with invalid token
  it('Attempt to Delete RandomList with Invalid Token (expect failure)', () => {
    cy.wrap(randomListId).should('exist')
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${randomListId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  // Step 10: Delete random list with valid authentication
  it('Delete RandomList with Authentication', () => {
    cy.wrap(randomListId).should('exist')
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${randomListId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data.message).to.include(
        `RandomList with ID ${randomListId} successfully deleted.`,
      )
    })
  })
})
