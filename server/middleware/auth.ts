import { defineEventHandler } from 'h3'
import prisma from './../api/utils/prisma'

export default defineEventHandler(async (event: any) => {
  const req = event.node.req

  // req.headers is already a plain JavaScript object
  const headersObject = req.headers

  // Check if the route requires authentication
  if (event.context.route?.auth !== true) {
    console.log('Auth was not set to true. We do not need to auth')
    return
  }

  const secretKey = headersObject['x-api-key']

  // Validate the API key
  if (!secretKey) {
    console.log('Missing API key')
    // Redirect to login or throw an error
    // Your redirect logic here
    return
  }

  if (secretKey !== process.env.AUTH_SECRET) {
    console.log('Invalid API key')
    // Redirect to login or throw an error
    // Your redirect logic here
  }
})
