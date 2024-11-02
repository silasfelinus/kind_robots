describe('RandomList Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/random'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  let randomListId: number | undefined
  let uniqueTitle = `Dreams-${Date.now()}`
  const userId: number = 9 // Example user ID

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

  it('Attempt to Update RandomList without Authentication (expect failure)', () => {
    if (!randomListId) throw new Error('randomListId is undefined')
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${randomListId}`,
      headers: { 'Content-Type': 'application/json' },
      body: { title: `Unauthorized Update` },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  it('Attempt to Update RandomList with Invalid Token (expect failure)', () => {
    if (!randomListId) throw new Error('randomListId is undefined')
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
    })
  })

  it('Update RandomList with Authentication', () => {
    const newTitle = `Updated-${uniqueTitle}`
    if (!randomListId) throw new Error('randomListId is undefined')
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${randomListId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        title: newTitle,
        items: [
          `Updated-Dream-${Date.now()}-1`,
          `Updated-Dream-${Date.now()}-2`,
        ],
        userId,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.list.title).to.eq(newTitle)
      uniqueTitle = newTitle // Update for following tests
    })
  })

  it('Get RandomList by ID', () => {
    if (!randomListId) throw new Error('randomListId is undefined')
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${randomListId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.list.title).to.eq(uniqueTitle) // Use updated uniqueTitle
    })
  })

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
      expect(response.body.list.title).to.eq(uniqueTitle)
    })
  })

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

  it('Attempt to Delete RandomList without Authentication (expect failure)', () => {
    if (!randomListId) throw new Error('randomListId is undefined')
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${randomListId}`,
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  it('Attempt to Delete RandomList with Invalid Token (expect failure)', () => {
    if (!randomListId) throw new Error('randomListId is undefined')
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
    })
  })

  it('Delete RandomList with Authentication', () => {
    if (!randomListId) throw new Error('randomListId is undefined')
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
})
