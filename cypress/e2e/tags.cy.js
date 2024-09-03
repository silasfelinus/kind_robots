// cypress/e2e/api/tags.cy.js
/* eslint-disable no-undef */

describe('Tag Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/tags'
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
      expect(response.body.tags)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('Create New Tag', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: [
        {
          label: 'tag',
          title: 'Abstract Art',
        },
      ],
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body).to.have.property('newTags').that.is.an('array').that
        .is.not.empty

      // Store the created tag's ID in the outer scope variable
      const createdTag = response.body.newTags[0]
      tagId = createdTag.id

      // Additional assertions
      expect(createdTag).to.have.property('label', 'Tag')
      expect(createdTag).to.have.property('title', 'Abstract Art')
      expect(tagId).to.be.a('number')

      // Log the created tag ID for debugging
      console.log('Created Tag ID:', tagId)
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
      expect(response.body).to.have.property('success', true)
      expect(response.body).to.have.property('tag')

      const updatedTag = response.body.tag

      // Check that the tag was updated correctly
      expect(updatedTag).to.have.property('id', tagId)
      expect(updatedTag).to.have.property('label', 'art')
      expect(updatedTag).to.have.property('title', 'Modern Art')
      expect(updatedTag).to.have.property('updatedAt').that.is.a('string') // Ensure updatedAt is a string (datetime)
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
})
