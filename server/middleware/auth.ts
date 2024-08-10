import { defineEventHandler } from 'h3'

export default defineEventHandler((event: any) => {
  const req = event.node.req

  // req.headers is already a plain JavaScript object
  const headersObject = req.headers

  // Check if the route requires authentication
  if (event.context.route?.auth !== true) {
    console.log('Auth not set to true. Enjoy ')
    return
  }

  const secretKey = headersObject['x-api-key']

  // Validate the API key
  if (!secretKey) {
    console.log('Missing API key')
    // Redirect to login or throw an error
    // Your redirect logic here
    return { message: `Missing API Key` }
  }

  if (secretKey !== process.env.AUTH_SECRET) {
    console.log('Invalid API key')
    // Redirect to login or throw an error
    return { message: `Invalid API Key` }
  }
})
