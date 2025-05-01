describe('SmartIcon API Full CRUD + Ownership Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/icons'
  const userUrl = 'https://kind-robots.vercel.app/api/users'
  const globalApiKey = Cypress.env('API_KEY')

  let userA_id: number
  let userA_apiKey: string
  let userB_id: number
  let userB_apiKey: string
  let iconId: number

  const time = Date.now()
  const userA_name = `owner-${time}`
  const userB_name = `intruder-${time}`
  const iconTitle = `Icon-${time}`

  before(() => {
    // Create User A (owner)
    cy.request({
      method: 'POST',
      url: `${userUrl}/register`,
      headers: {
        'x-api-key': globalApiKey,
        'Content-Type': 'application/json',
      },
      body: {
        username: userA_name,
        email: `${userA_name}@test.com`,
        password: 'testtest12',
      },
    }).then((res) => {
      userA_id = res.body.user.id
      userA_apiKey = res.body.user.apiKey
    })

    // Create User B (unauthorized)
    cy.request({
      method: 'POST',
      url: `${userUrl}/register`,
      headers: {
        'x-api-key': globalApiKey,
        'Content-Type': 'application/json',
      },
      body: {
        username: userB_name,
        email: `${userB_name}@test.com`,
        password: 'testtest12',
      },
    }).then((res) => {
      userB_id = res.body.user.id
      userB_apiKey = res.body.user.apiKey
    })
  })

  it('POST: User A creates a SmartIcon', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: iconTitle,
        type: 'test',
        icon: 'magic-hat',
        label: 'Test Label',
        link: '/test-link',
        component: 'TestComponent',
        isPublic: true,
      },
    }).then((res) => {
      expect(res.status).to.eq(201)
      expect(res.body.success).to.be.true
      iconId = res.body.data.id
    })
  })

  it('GET: fetch all SmartIcons', () => {
    cy.request(`${baseUrl}`).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data).to.be.an('array')
      const match = res.body.data.find(
        (i: Record<string, any>) => i.id === iconId,
      )
      expect(match).to.not.be.undefined
    })
  })

  it('GET: fetch SmartIcon by ID', () => {
    cy.wrap(iconId).should('exist')
    cy.request(`${baseUrl}/${iconId}`).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data.id).to.eq(iconId)
    })
  })

  it('PATCH: User A updates their SmartIcon', () => {
    const updatedTitle = `Updated-${iconTitle}`

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${iconId}`,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: updatedTitle,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data.title).to.eq(updatedTitle)
    })
  })

  it('PATCH: User B fails to update SmartIcon (403)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${iconId}`,
      headers: {
        Authorization: `Bearer ${userB_apiKey}`,
        'Content-Type': 'application/json',
      },
      body: { title: 'Unauthorized change' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
      expect(res.body.success).to.be.false
      expect(res.body.message).to.include('You do not have permission')
    })
  })

  it('DELETE: User B fails to delete SmartIcon (403)', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${iconId}`,
      headers: {
        Authorization: `Bearer ${userB_apiKey}`,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(403)
      expect(res.body.success).to.be.false
      expect(res.body.message).to.include('not authorized')
    })
  })

  it('DELETE: User A deletes SmartIcon', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${iconId}`,
      headers: {
        Authorization: `Bearer ${userA_apiKey}`,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
    })
  })

  after(() => {
    const deleteUser = (id: number, apiKey: string) =>
      cy.request({
        method: 'DELETE',
        url: `${userUrl}/${id}`,
        headers: { Authorization: `Bearer ${apiKey}` },
      })

    deleteUser(userA_id, userA_apiKey)
    deleteUser(userB_id, userB_apiKey)
  })
})
