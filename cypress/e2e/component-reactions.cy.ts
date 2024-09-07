/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('Todo Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/todos'
  let todoId: number | undefined // To store the created Todo ID

  it('Create New Todo', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: [{
        content: "Create admin page",
        notes: "Focus on permissions and roles",
        isCompleted: false,
        task: "Admin and Members Pages",
        userId: 1
      }],
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body[0]).to.be.an('object').that.is.not.empty
      todoId = response.body[0].id // Assuming response contains the created Todo
      cy.log('Created Todo ID:', todoId)
    })
  })

  it('Get All Todos', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.be.an('array').that.is.not.empty
    })
  })

  it('Get Specific Todo by ID', () => {
    if (todoId) {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/${todoId}`,
        headers: {
          'Content-Type': 'application/json',
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.be.an('object').that.includes({
          id: todoId,
          content: "Create admin page",
        })
      })
    } else {
      throw new Error('todoId is not defined. Cannot perform GET by ID request.')
    }
  })

  it('Update a Todo', () => {
    if (todoId) {
      cy.request({
        method: 'PUT',
        url: baseUrl,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          id: todoId,
          content: "Create admin page with advanced roles",
          notes: "Adjust for super admin permissions",
          isCompleted: true,
          task: "Admin and Members Pages",
          userId: 1
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.be.an('object').that.includes({
          id: todoId,
          content: "Create admin page with advanced roles",
          isCompleted: true,
        })
      })
    } else {
      throw new Error('todoId is not defined. Cannot perform PUT request.')
    }
  })

  it('Delete a Todo', () => {
    if (todoId) {
      cy.request({
        method: 'DELETE',
        url: baseUrl,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          id: todoId,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
      })
    } else {
      throw new Error('todoId is not defined. Cannot perform DELETE request.')
    }
  })
})
