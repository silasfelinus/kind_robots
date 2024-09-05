describe('RandomList Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/random'
  const apiKey = Cypress.env('API_KEY')
  let randomListId: number // Explicitly define the type as number
  const uniqueTitle = `Dreams-${Date.now()}` // Generate a unique title using Date.now()
  const userId: number = 1 // Example user ID (assuming 1 is valid)

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
        userId: userId,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.newList).to.be.an('object') // Adjusted the key to match the response
      randomListId = response.body.newList.id
      cy.log('Created RandomList ID:', randomListId) // Use cy.log for consistency
    })
  })

  it('Get RandomList by ID', () => {
    if (randomListId) {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/${randomListId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.list.title).to.eq(uniqueTitle)
      })
    } else {
      throw new Error('randomListId is not defined')
    }
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
      expect(response.body.list.title).to.eq(uniqueTitle)
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

  it('Update a RandomList by ID', () => {
    if (randomListId) {
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
          userId: userId,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
      })
    } else {
      throw new Error('randomListId is not defined')
    }
  })

  it('Delete a RandomList by ID', () => {
    if (randomListId) {
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
    } else {
      throw new Error('randomListId is not defined')
    }
  })

  after(() => {
    if (randomListId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${randomListId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        cy.log('Reverted RandomList ID:', randomListId)
      })
    }
  })
})
