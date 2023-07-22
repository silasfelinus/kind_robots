// /server/api/users/count.get.ts
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    if (event.node.req.method === 'GET') {
      const count = await prisma.user.count()
      event.node.res.setHeader('Content-Type', 'application/json')

      event.node.res.statusCode = 200
      event.node.res.end(JSON.stringify({ count }))
    } else {
      event.node.res.statusCode = 405
      event.node.res.end('Method Not Allowed')
    }
  } catch (error) {
    console.error('Failed to fetch user count:', error)
    event.node.res.setHeader('Content-Type', 'application/json')
    event.node.res.statusCode = 500
    event.node.res.end(JSON.stringify({ error: 'Failed to fetch user count' }))
  }
})
