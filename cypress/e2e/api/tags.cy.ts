// cypress/e2e/api/tags.cy.ts

type Tag = {
  artImageId: number | null
  createdAt: string
  flavorText: string | null
  id: number
  isMature: boolean
  isPublic: boolean
  label: string
  pitch: string | null
  title: string
  updatedAt: string
  userId: number | null
}

describe('Tag Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/tags'
  const invalidToken = 'someInvalidTokenValue'

  let userToken = ''
  let tagId: number

  before(() => {
    cy.env(['USER_TOKEN']).then((env) => {
      userToken = String(env.USER_TOKEN || '')
      expect(userToken, 'USER_TOKEN').to.be.a('string').and.not.be.empty
    })
  })

  it('Get All Tags', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data)
        .to.be.an('array')
        .and.have.length.greaterThan(0)

      response.body.data.forEach((tag: Tag) => {
        expect(tag).to.have.all.keys(
          'artImageId',
          'createdAt',
          'flavorText',
          'id',
          'isMature',
          'isPublic',
          'label',
          'pitch',
          'title',
          'updatedAt',
          'userId',
        )
      })
    })
  })

  it('Create New Tag with Authentication', () => {
    const uniqueTitle = `Title-${Date.now()}`

    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        label: 'Tag',
        title: uniqueTitle,
        userId: 9,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('success', true)
      expect(response.body).to.have.property('data').that.is.an('object')

      const createdTag = response.body.data

      expect(createdTag).to.include.all.keys(
        'id',
        'label',
        'title',
        'userId',
        'createdAt',
        'updatedAt',
      )

      tagId = createdTag.id

      expect(tagId).to.be.a('number')
    })
  })

  it('Attempt to Edit Tag without Authentication (expect failure)', () => {
    expect(tagId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${tagId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        label: 'art',
        title: 'Modern Art',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Attempt to Edit Tag with Invalid Token (expect failure)', () => {
    expect(tagId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${tagId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        label: 'art',
        title: 'Modern Art',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Edit Tag with Authentication', () => {
    expect(tagId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${tagId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        label: 'art',
        title: 'Modern Art',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body).to.have.property('data').that.is.an('object')

      const updatedTag = response.body.data

      expect(updatedTag).to.have.property('id', tagId)
      expect(updatedTag).to.have.property('label', 'art')
      expect(updatedTag).to.have.property('title', 'Modern Art')
    })
  })

  it('Attempt to Delete Tag without Authentication (expect failure)', () => {
    expect(tagId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${tagId}`,
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

  it('Attempt to Delete Tag with Invalid Token (expect failure)', () => {
    expect(tagId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${tagId}`,
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

  it('Delete Tag with Authentication', () => {
    expect(tagId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${tagId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.message).to.include(
        `Tag with ID ${tagId} successfully deleted`,
      )

      tagId = undefined as unknown as number
    })
  })
})
