// /server/api/utils/auth.ts
export default defineEventHandler((event: any) => {
  console.log('auth check')

  // Convert HeadersList to a plain JavaScript object
  const headersObject = Object.fromEntries(event.headers.entries())

  // Check if the route requires authentication
  if (event.context.route?.auth !== true) {
    console.log('Auth was not set to true. We do not need to auth')
    return
  }

  const secretKey = headersObject['x-api-key']

  // Validate the API key
  if (!secretKey) {
    console.log('missing api key')
    throw new Error('Missing API key. Please provide a valid x-api-key in the headers.')
  }

  if (secretKey !== process.env.AUTH_SECRET) {
    console.log('invalid api key')
    throw new Error('Invalid API key. Please provide a valid x-api-key in the headers.')
  }
})
