// server/middleware/openai.ts
import { defineEventHandler, getHeader, setHeader, sendError, createError } from 'h3'

export default defineEventHandler((event) => {
  const { OPENAI_API_KEY } = useRuntimeConfig()

  // Only process requests going to OpenAI's API
  const targetUrl = event.req.url || ''
  if (!targetUrl.startsWith('https://api.openai.com')) {
    return // Exit middleware if it's not an OpenAI request
  }

  if (!OPENAI_API_KEY) {
    // Send an error if API key is missing in environment variables
    return sendError(
      event,
      createError({
        statusCode: 401,
        statusMessage: 'OpenAI API Key is missing in environment variables.'
      })
    )
  }

  // Check for an existing Authorization header
  const currentAuthHeader = getHeader(event, 'Authorization')
  if (!currentAuthHeader) {
    // Set the Authorization header with the OpenAI API key
    setHeader(event, 'Authorization', `Bearer ${OPENAI_API_KEY}`)
    console.log('OpenAI API key added to the Authorization header.')
  }
})
