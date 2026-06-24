/* eslint-disable @typescript-eslint/no-unused-expressions */
// cypress/e2e/api/butterflies.cy.ts

describe('Butterfly API', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/butterflies'
  const recordsUrl = 'https://kind-robots.vercel.app/api/butterflies/records'

  const invalidToken = 'someInvalidTokenValue'
  const baseRarity = Math.floor(Math.random() * 1_000_000_000)

  const time = Date.now()
  const uniqueButterflyName = `Cypress-${Date.now()}-${Math.random()}`

  let userToken = ''
  let adminToken = ''
  let butterflyId: number | undefined
  let recordId: number | undefined

  before(() => {
    cy.env(['USER_TOKEN', 'ADMIN_TOKEN']).then((env) => {
      userToken = String(env.USER_TOKEN || '')
      adminToken = String(env.ADMIN_TOKEN || '')

      expect(userToken, 'USER_TOKEN').to.be.a('string').and.not.be.empty
      expect(adminToken, 'ADMIN_TOKEN').to.be.a('string').and.not.be.empty
    })
  })

  after(() => {
    // Clean up catch record if still present (e.g. delete test was skipped)
    if (recordId) {
      cy.request({
        method: 'DELETE',
        url: `${recordsUrl}/${recordId}`,
        headers: { Authorization: `Bearer ${userToken}` },
        failOnStatusCode: false,
      })
    }

    // Always clean up the butterfly created by this suite
    if (butterflyId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${butterflyId}`,
        headers: { Authorization: `Bearer ${adminToken}` },
        failOnStatusCode: false,
      }).then((res) => {
        expect([200, 404], `butterfly ${butterflyId} cleanup`).to.include(
          res.status,
        )
      })
    }
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
        rarityNumber: baseRarity + 1,
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
        rarityNumber: baseRarity + 2,
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
        rarityNumber: baseRarity + 3,
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
        rarityNumber: baseRarity + 4,
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

  it('POST /butterflies/records — handles missing auth without crashing', () => {
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
      expect(response.body).to.exist
    })
  })

  it('GET /butterflies/records — rejects missing auth', () => {
    cy.request({
      method: 'GET',
      url: recordsUrl,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
    })
  })

  it('POST /butterflies/records — creates or accepts a catch record with user auth', () => {
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
    })
      .then((postResponse) => {
        expect(postResponse.status).to.eq(201)
        expect(postResponse.body).to.exist

        cy.log(`POST body: ${JSON.stringify(postResponse.body)}`)

        return cy.request({
          method: 'GET',
          url: recordsUrl,
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        })
      })
      .then((getResponse) => {
        expect(getResponse.status).to.eq(200)

        cy.log(`GET body: ${JSON.stringify(getResponse.body)}`)

        const data = Array.isArray(getResponse.body.data)
          ? getResponse.body.data
          : Array.isArray(getResponse.body)
            ? getResponse.body
            : []

        const match = data.find((record: any) => {
          const idCandidates = [
            record.butterflyId,
            record.ButterflyId,
            record.butterflyID,
            record.ButterflyID,
            record.butterfly_id,
            record.Butterfly?.id,
            record.butterfly?.id,
            record.Butterfly?.ID,
            record.butterfly?.ID,
          ]

          return idCandidates.some(
            (id) => id !== undefined && Number(id) === Number(butterflyId),
          )
        })

        if (!match) {
          throw new Error(
            `No matching butterfly record found for butterflyId ${butterflyId}. Records: ${JSON.stringify(data)}`,
          )
        }

        recordId = match.id
        expect(recordId).to.exist
      })
  })

  it('POST /butterflies/records — handles duplicate catch without crashing', () => {
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
      expect(response.body).to.exist
    })
  })

  it('GET /butterflies/records — returns authenticated user collection', () => {
    cy.request({
      method: 'GET',
      url: recordsUrl,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)

      const data = Array.isArray(response.body.data)
        ? response.body.data
        : Array.isArray(response.body)
          ? response.body
          : []

      expect(data).to.be.an('array')
    })
  })

  it('DELETE /butterflies/records/:id — deletes own catch record', () => {
    if (!recordId) {
      cy.log(
        'No recordId returned by POST /butterfly-records, skipping delete assertion',
      )

      return
    }

    cy.request({
      method: 'DELETE',
      url: `${recordsUrl}/${recordId}`,
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect([200, 204, 404]).to.include(response.status)
      recordId = undefined
    })
  })
})
