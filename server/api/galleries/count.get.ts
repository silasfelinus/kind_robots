import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    if (event.node.req.method === 'GET') {
      const count = await prisma.gallery.count() // Count records in the database using Prisma client
      event.node.res.setHeader('Content-Type', 'application/json') // Set the response type as JSON
      event.node.res.statusCode = 200
      event.node.res.end(JSON.stringify({ count })) // Send the count back to the client as a JSON response
    } else {
      event.node.res.statusCode = 405 // Method Not Allowed
      event.node.res.end('Method Not Allowed')
    }
  } catch (error) {
    console.error('Failed to fetch gallery count:', error)
    event.node.res.setHeader('Content-Type', 'application/json')
    event.node.res.statusCode = 500
    event.node.res.end(JSON.stringify({ error: 'Failed to fetch gallery count' })) // Send the error message as a JSON response
  } finally {
    await prisma.$disconnect() // Ensure to disconnect from the database
  }
})
