import prisma from '../prisma'

export default defineEventHandler(async (event) => {
  try {
    if (event.req.method === 'GET') {
      const count = await prisma.user.count() // Count records in the database using Prisma client
      event.res.setHeader('Content-Type', 'application/json') // Set the response type as JSON
      event.res.statusCode = 200
      event.res.end(JSON.stringify({ count })) // Send the count back to the client as a JSON response
    } else {
      event.res.statusCode = 405 // Method Not Allowed
      event.res.end('Method Not Allowed')
    }
  } catch (error) {
    console.error('Failed to fetch user count:', error)
    event.res.setHeader('Content-Type', 'application/json')
    event.res.statusCode = 500
    event.res.end(JSON.stringify({ error: 'Failed to fetch user count' })) // Send the error message as a JSON response
  } finally {
    await prisma.$disconnect() // Ensure to disconnect from the database
  }
})
