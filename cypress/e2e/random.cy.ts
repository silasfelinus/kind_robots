describe('RandomList Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/random'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  let randomListId: number | undefined
  const userId: number = 9 // Example user ID

  // Capture initial timestamp for unique values
  const now = Date.now()
  let uniqueTitle = `Dreams-${now}`
  const initialItems = [`Dream-${now}-1`, `Dream-${now}-2`, `Dream-${now}-3`]

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
        items: initialItems,
        userId,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      randomListId = response.body.randomList.id
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
    const updatedItems = [`Updated-Dream-${now}-1`, `Updated-Dream-${now}-2`]
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
        items: updatedItems,
        userId,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.updatedList.title).to.eq(newTitle)
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
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.list.title).to.eq(uniqueTitle)
    })
  })

  it('Get RandomList by Title', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/title/${uniqueTitle}`,
      headers: {
        'Content-Type': 'application/json',
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
