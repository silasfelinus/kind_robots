describe('Component Reactions API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api'
  const invalidToken = 'someInvalidTokenValue'
  const userId = 9

  let userToken = ''
  let componentId: number | undefined
  let reactionId: number | undefined

  const createdComponents: number[] = []
  const createdReactions: number[] = []

  const assertDefined = <T>(value: T | undefined, name: string): T => {
    if (value === undefined) {
      throw new Error(`${name} is undefined. Test setup failed.`)
    }

    return value
  }

  before(() => {
    cy.env(['USER_TOKEN']).then((env) => {
      userToken = String(env.USER_TOKEN || '')
      expect(userToken, 'USER_TOKEN').to.be.a('string').and.not.be.empty
    })

    cy.then(() => {
      cy.request({
        method: 'POST',
        url: `${baseUrl}/components`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: {
          folderName: 'test-folder',
          componentName: `TestComponent_${Date.now()}`,
          isWorking: true,
          underConstruction: false,
          isBroken: false,
          title: 'Test Component',
        },
      }).then((response) => {
        expect(response.status).to.eq(201)
        expect(response.body).to.have.property('success', true)

        componentId = response.body.data.id

        expect(componentId).to.be.a('number')

        createdComponents.push(assertDefined(componentId, 'componentId'))
      })
    })
  })

  it('should not allow creating a component reaction without an authorization token', () => {
    expect(componentId).to.exist

    cy.request({
      method: 'POST',
      url: `${baseUrl}/reactions`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        userId,
        reactionType: 'CLAPPED',
        reactionCategory: 'COMPONENT',
        componentId,
        comment: 'Great job on this component!',
        rating: 4,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  it('should not allow creating a component reaction with an invalid authorization token', () => {
    expect(componentId).to.exist

    cy.request({
      method: 'POST',
      url: `${baseUrl}/reactions`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        userId,
        reactionType: 'CLAPPED',
        reactionCategory: 'COMPONENT',
        componentId,
        comment: 'Great job on this component!',
        rating: 4,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Create a New Component Reaction with Valid Authentication', () => {
    expect(componentId).to.exist

    cy.request({
      method: 'POST',
      url: `${baseUrl}/reactions`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        userId,
        reactionType: 'CLAPPED',
        reactionCategory: 'COMPONENT',
        componentId,
        comment: 'Great job on this component!',
        rating: 4,
        chatId: null,
        artImageId: null,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('success', true)

      reactionId = response.body.data.id

      expect(reactionId).to.be.a('number')

      createdReactions.push(assertDefined(reactionId, 'reactionId'))
    })
  })

  it("Get a Component's Reactions", () => {
    expect(componentId).to.exist

    cy.request({
      method: 'GET',
      url: `${baseUrl}/reactions/component/${componentId}`,
      headers: {
        Accept: 'application/json',
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

  it('Get Reaction by ID', () => {
    expect(reactionId).to.exist

    cy.request({
      method: 'GET',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)

      const reaction = response.body.data

      expect(reaction.id).to.eq(reactionId)
      expect(reaction.componentId).to.eq(componentId)
      expect(reaction.userId).to.eq(userId)
      expect(reaction.comment).to.eq('Great job on this component!')
      expect(reaction.rating).to.eq(4)
    })
  })

  it('Update an Existing Component Reaction with Valid and Invalid Authentication', () => {
    expect(reactionId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        reactionType: 'BOOED',
        comment: 'Actually, I have second thoughts...',
        rating: 2,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
    })

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        reactionType: 'BOOED',
        comment: 'Actually, I have second thoughts...',
        rating: 2,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
    })

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        reactionType: 'BOOED',
        reactionCategory: 'COMPONENT',
        comment: 'Actually, I have second thoughts...',
        rating: 2,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data.reactionType).to.eq('BOOED')
      expect(response.body.data.comment).to.eq(
        'Actually, I have second thoughts...',
      )
      expect(response.body.data.rating).to.eq(2)
    })
  })

  it('Delete a Component Reaction with Valid and Invalid Authentication', () => {
    expect(reactionId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        Accept: 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
    })

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('success', false)
    })

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.message).to.include(
        `Reaction with ID ${reactionId} successfully deleted.`,
      )

      reactionId = undefined
      createdReactions.length = 0
    })
  })

  after(() => {
    cy.then(() => {
      createdReactions.forEach((id) => {
        cy.request({
          method: 'DELETE',
          url: `${baseUrl}/reactions/${id}`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userToken}`,
          },
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.be.oneOf([200, 404])
        })
      })

      createdComponents.forEach((id) => {
        cy.request({
          method: 'DELETE',
          url: `${baseUrl}/components/${id}`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userToken}`,
          },
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.be.oneOf([200, 404])
        })
      })
    })
  })
})
