/* eslint-disable @typescript-eslint/no-unused-expressions */
// cypress/e2e/api/butterflies.cy.ts

describe('Butterfly API', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/butterflies'
  const recordsUrl = 'https://kind-robots.vercel.app/api/butterfly-records'

  const userToken = Cypress.env('USER_TOKEN')
  const adminToken = Cypress.env('ADMIN_TOKEN')
  const invalidToken = 'someInvalidTokenValue'

  const time = Date.now()
  const uniqueButterflyName = `Cypress Flicker ${time}`

  let butterflyId: number | undefined
  let recordId: number | undefined

  before(() => {
    expect(userToken, 'USER_TOKEN').to.be.a('string').and.not.be.empty
    expect(adminToken, 'ADMIN_TOKEN').to.be.a('string').and.not.be.empty
  })

  it('GET /butterflies — returns public list, no auth required', () => {
    cy.request(baseUrl).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('array')
    })
  })

  it('POST /butterflies — rejects missing auth', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        name: uniqueButterflyName,
        message: 'should not exist',
        wingTopColor: 'hsl(120,70%,50%)',
        wingBottomColor: 'hsl(300,70%,50%)',
        speed: 0.5,
        wingSpeed: 0.09,
        scale: 1,
        rarityNumber: 9999,
        isPublic: true,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('POST /butterflies — rejects invalid auth', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        name: uniqueButterflyName,
        message: 'should not exist',
        wingTopColor: 'hsl(120,70%,50%)',
        wingBottomColor: 'hsl(300,70%,50%)',
        speed: 0.5,
        wingSpeed: 0.09,
        scale: 1,
        rarityNumber: 9999,
        isPublic: true,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('POST /butterflies — rejects non-admin user', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        name: `Unauthorized Species ${time}`,
        message: 'should not exist',
        wingTopColor: 'hsl(0,50%,50%)',
        wingBottomColor: 'hsl(180,50%,50%)',
        speed: 0.5,
        wingSpeed: 0.08,
        scale: 1,
        rarityNumber: 9998,
        isPublic: true,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.be.false
    })
  })

  it('POST /butterflies — creates a butterfly with admin auth', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: {
        name: uniqueButterflyName,
        message: 'only appears in test environments',
        wingTopColor: 'hsl(120,70%,50%)',
        wingBottomColor: 'hsl(300,70%,50%)',
        speed: 0.5,
        wingSpeed: 0.09,
        scale: 1,
        rarityNumber: 9999,
        isPublic: true,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('object').that.is.not.empty
      expect(response.body.data.name).to.eq(uniqueButterflyName)

      butterflyId = response.body.data.id
    })
  })

  it('GET /butterflies/:id — fetches one butterfly', () => {
    expect(butterflyId).to.exist

    cy.request(`${baseUrl}/${butterflyId}`).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.id).to.eq(butterflyId)
      expect(response.body.data.name).to.eq(uniqueButterflyName)
    })
  })

  it('GET /butterflies/:id — returns 404 for nonexistent ID', () => {
    cy.request({
      url: `${baseUrl}/999999999`,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(404)
      expect(response.body.success).to.be.false
    })
  })

  it('PATCH /butterflies/:id — rejects non-admin user', () => {
    expect(butterflyId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${butterflyId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        message: 'unauthorized edit',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.success).to.be.false
    })
  })

  it('PATCH /butterflies/:id — updates butterfly with admin auth', () => {
    expect(butterflyId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${butterflyId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: {
        message: 'updated by cypress test',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.message).to.eq('updated by cypress test')
    })
  })

  it('POST /butterfly-records — rejects missing auth', () => {
    expect(butterflyId).to.exist

    cy.request({
      method: 'POST',
      url: recordsUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        butterflyId,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
    })
  })

  it('POST /butterfly-records — creates a catch record with user auth', () => {
    expect(butterflyId).to.exist

    cy.request({
      method: 'POST',
      url: recordsUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        butterflyId,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('object').that.is.not.empty

      recordId = response.body.data.id
    })
  })

  it('POST /butterfly-records — rejects duplicate catch', () => {
    expect(butterflyId).to.exist

    cy.request({
      method: 'POST',
      url: recordsUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        butterflyId,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(409)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('already caught')
    })
  })

  it('GET /butterfly-records — returns authenticated user collection', () => {
    expect(recordId).to.exist

    cy.request({
      method: 'GET',
      url: recordsUrl,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('array')

      const match = response.body.data.find(
        (record: any) => record.id === recordId,
      )
      expect(match).to.not.be.undefined
    })
  })

  it('GET /butterfly-records — allows public read', () => {
    cy.request({
      method: 'GET',
      url: recordsUrl,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('array')
    })
  })

  it('DELETE /butterfly-records/:id — deletes own catch record', () => {
    expect(recordId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${recordsUrl}/${recordId}`,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true

      recordId = undefined
    })
  })

  after(() => {
    if (recordId) {
      cy.request({
        method: 'DELETE',
        url: `${recordsUrl}/${recordId}`,
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        failOnStatusCode: false,
      })
    }

    if (butterflyId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${butterflyId}`,
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        failOnStatusCode: false,
      })
    }
  })
})
