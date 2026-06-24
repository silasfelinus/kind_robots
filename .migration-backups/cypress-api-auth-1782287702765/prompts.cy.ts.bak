// cypress/e2e/api/prompts.cy.ts

describe('Prompt Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/prompts'
  const invalidToken = 'someInvalidTokenValue'
  const uniquePrompt = `devil bunny ${Date.now()}`

  let userToken = ''
  let promptId: number | undefined

  before(() => {
    cy.env(['USER_TOKEN']).then((env) => {
      userToken = String(env.USER_TOKEN || '')
      expect(userToken, 'USER_TOKEN').to.be.a('string').and.not.be.empty
    })
  })

  it('should not allow creating a prompt without an authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        galleryId: 21,
        userId: 9,
        prompt: uniquePrompt,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('should not allow creating a prompt with an invalid authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        galleryId: 21,
        userId: 9,
        prompt: uniquePrompt,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Create a New Prompt with Valid Authentication', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        galleryId: 21,
        userId: 9,
        prompt: uniquePrompt,
        CreationSource: 'HUMAN',
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('success', true)

      promptId = response.body.data.id

      expect(promptId).to.be.a('number')
    })
  })

  it('Attempt to Update Prompt without Authentication (expect failure)', () => {
    expect(promptId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${promptId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        prompt: 'unauthorized bunny update',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Attempt to Update Prompt with Invalid Token (expect failure)', () => {
    expect(promptId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${promptId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        prompt: 'invalid token bunny update',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Update Prompt with Authentication', () => {
    expect(promptId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${promptId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        prompt: 'angel bunny',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data.prompt).to.eq('angel bunny')
    })
  })

  it('Get Prompt by ID', () => {
    expect(promptId).to.exist

    cy.request({
      method: 'GET',
      url: `${baseUrl}/${promptId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data.prompt).to.eq('angel bunny')
    })
  })

  it('Get All Prompts', () => {
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
      expect(response.body.data)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('Attempt to Delete Prompt without Authentication (expect failure)', () => {
    expect(promptId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${promptId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  it('Attempt to Delete Prompt with Invalid Token (expect failure)', () => {
    expect(promptId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${promptId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  it('Delete Prompt with Authentication', () => {
    expect(promptId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${promptId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.message).to.include(
        `Prompt with ID ${promptId} successfully deleted.`,
      )
    })
  })
})
