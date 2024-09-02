// cypress/e2e/api/tags.cy.js
/* eslint-disable no-undef */

describe('Tag Management API Tests', () => {
  const baseUrl = 'http://kindrobots.org/api/tags'
  let tagId // Store tag ID for further operations

  it('Get All Tags', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.be.an('array').and.have.length.greaterThan(0)
    })
  })

  it('Create New Tag', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        label: 'art',
        title: 'Abstract Art',
      },
    }).then((response) => {
      console.log(response)
      expect(response.status).to.eq(201)
      tagId = response.body.id // Assuming the API returns the created tag's ID
    })
  })

  it('Edit an Existing Tag', () => {
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
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.title).to.eq('Modern Art')
    })
  })

  it('Delete a Tag', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${tagId}`,
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })

  it('Seed Tags', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: [
        { label: 'art', title: 'Liked' },
        { label: 'art', title: 'Disliked' },
      ],
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.be.an('array').and.have.lengthOf(2)
    })
  })
})
