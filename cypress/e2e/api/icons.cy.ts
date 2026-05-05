// cypress/e2e/api/icons.cy.ts

describe('SmartIcon API Full CRUD Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/icons'
  const invalidToken = 'someInvalidTokenValue'
  const testUserId = 9

  let userToken = ''
  let iconId: number | undefined

  const time = Date.now()
  const iconTitle = `Icon-${time}`

  before(() => {
    cy.env(['USER_TOKEN']).then((env) => {
      userToken = String(env.USER_TOKEN || '')
      expect(userToken, 'USER_TOKEN').to.be.a('string').and.not.be.empty
    })
  })

  it('POST: rejects SmartIcon creation without auth', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        title: `Unauthorized-${iconTitle}`,
        type: 'test',
        icon: 'magic-hat',
        label: 'Unauthorized Label',
        link: '/unauthorized-link',
        component: 'UnauthorizedComponent',
        userId: testUserId,
        isPublic: true,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.be.false
    })
  })

  it('POST: rejects SmartIcon creation with invalid auth', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        Authorization: `Bearer ${invalidToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: `Invalid-${iconTitle}`,
        type: 'test',
        icon: 'magic-hat',
        label: 'Invalid Label',
        link: '/invalid-link',
        component: 'InvalidComponent',
        userId: testUserId,
        isPublic: true,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.be.false
    })
  })

  it('POST: creates a SmartIcon with USER_TOKEN', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: iconTitle,
        type: 'test',
        icon: 'magic-hat',
        label: 'Test Label',
        link: '/test-link',
        component: 'TestComponent',
        userId: testUserId,
        isPublic: true,
      },
    }).then((res) => {
      expect(res.status).to.eq(201)
      expect(res.body.success).to.be.true
      expect(res.body.data).to.be.an('object').that.is.not.empty

      iconId = res.body.data.id

      expect(iconId).to.be.a('number')
      expect(res.body.data.title).to.eq(iconTitle)
    })
  })

  it('GET: fetches all SmartIcons', () => {
    expect(iconId).to.exist

    cy.request(baseUrl).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data).to.be.an('array')

      const match = res.body.data.find(
        (icon: Record<string, unknown>) => icon.id === iconId,
      )

      expect(match).to.not.be.undefined
    })
  })

  it('GET: fetches SmartIcon by ID', () => {
    expect(iconId).to.exist

    cy.request(`${baseUrl}/${iconId}`).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data.id).to.eq(iconId)
      expect(res.body.data.title).to.eq(iconTitle)
    })
  })

  it('PATCH: rejects SmartIcon update without auth', () => {
    expect(iconId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${iconId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        title: 'Unauthorized change',
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.be.false
    })
  })

  it('PATCH: rejects SmartIcon update with invalid auth', () => {
    expect(iconId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${iconId}`,
      headers: {
        Authorization: `Bearer ${invalidToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: 'Invalid token change',
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.be.false
    })
  })

  it('PATCH: updates SmartIcon with USER_TOKEN', () => {
    expect(iconId).to.exist

    const updatedTitle = `Updated-${iconTitle}`

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${iconId}`,
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        title: updatedTitle,
        label: 'Updated Label',
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
      expect(res.body.data.title).to.eq(updatedTitle)
      expect(res.body.data.label).to.eq('Updated Label')
    })
  })

  it('DELETE: rejects SmartIcon delete without auth', () => {
    expect(iconId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${iconId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.be.false
    })
  })

  it('DELETE: rejects SmartIcon delete with invalid auth', () => {
    expect(iconId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${iconId}`,
      headers: {
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401)
      expect(res.body.success).to.be.false
    })
  })

  it('DELETE: deletes SmartIcon with USER_TOKEN', () => {
    expect(iconId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${iconId}`,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true

      iconId = undefined
    })
  })
})
