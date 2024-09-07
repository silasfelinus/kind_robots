// cypress/e2e/api/todos.cy.ts
/* eslint-disable @typescript-eslint/no-unused-expressions */

describe('Todo Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/todos'
  let todoId: number // Explicitly define todoId as number
  const uniqueTodoTask = `Complete Task ${Date.now()}` // Unique task for each test run
  const uniqueUserId = 1 // Assuming user ID is 1 for testing

  it('Create New Todo', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: [{
        content: uniqueTodoTask,
        notes: 'This is a test todo',
        isCompleted: false,
        task: 'Test Category',
        userId: uniqueUserId,
      }],
    }).then((response) => {
      expect(response.status).to.eq(200)
      // Access the first item in the `todos` array
      todoId = response.body.todos[0].id // Save the todo ID for use in later tests
    })
  })

  it('Get All Todos', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        Accept: 'application/json',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.todos)
        .to.be.an('array')
        .and.have.length.greaterThan(0) // Ensure there is at least 1 todo
    })
  })

  it('Get Specific Todo by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${todoId}`,
      headers: {
        Accept: 'application/json',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.todo).to.exist

      const todo = response.body.todo
      expect(todo.id).to.eq(todoId)
      expect(todo.content).to.eq(uniqueTodoTask)
      expect(todo.isCompleted).to.be.false
      expect(todo.userId).to.eq(uniqueUserId)
    })
  })

  it('Update a Todo', () => {
    cy.request({
      method: 'PATCH',
      url: baseUrl,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: {
        id: todoId,
        content: `${uniqueTodoTask} - Updated`,
        notes: 'Updated notes for this test todo',
        isCompleted: true,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.todo.content).to.eq(`${uniqueTodoTask} - Updated`)
      expect(response.body.todo.isCompleted).to.be.true
    })
  })

  it('Delete a Todo', () => {
    cy.request({
      method: 'DELETE',
      url: baseUrl,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: {
        id: todoId,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
    })
  })
})
