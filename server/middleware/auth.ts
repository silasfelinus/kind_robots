import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const req = event.node.req

  // req.headers is already a plain JavaScript object
  const headersObject = req.headers as Record<string, string | undefined>

  // Check if the route requires authentication
  if (event.context.route?.auth !== true) {
    console.log('Auth not set to true. Enjoy ')
    return
  }

  const secretKey = headersObject['x-api-key']

  // Validate the API key
  if (!secretKey) {
    console.log('Missing API key')
    return {
      success: false,
      message: 'Missing API Key',
    }
  }

  if (secretKey !== process.env.AUTH_SECRET) {
    console.log('Invalid API key')
    return {
      success: false,
      message: 'Invalid API Key',
    }
  }

  // If the API key is valid, continue with the request
  return {
    success: true,
  }
})
