import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'

export default defineEventHandler(async (event) => {
  try {
    // Validate API Key
    const { isValid } = await validateApiKey(event)
    if (!isValid) {
      event.node.res.statusCode = 401
      return { success: false, message: 'Invalid or expired token.' }
    }

    const body = await readBody(event)
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw createError({
        statusCode: 500,
        message:
          'Server API key is missing. Please provide a valid OpenAI API key.',
      })
    }

    // Pre-created content for the request
    const content = body.content

    // Construct the request data for OpenAI
    const pitchRequest = {
      model: body.model || 'gpt-4o-mini',
      messages: [{ role: 'user', content }],
      temperature: typeof body.temperature === 'number' ? body.temperature : 0.7,
      max_tokens: body.maxTokens || 150,
      n: body.n || 5,
      stream: body.stream || false,
    }

    const post = body.post || 'https://api.openai.com/v1/chat/completions'

    // Call the OpenAI API
    const response = await fetch(post, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(pitchRequest),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw createError({
        statusCode: response.status,
        message: `Error from OpenAI: ${response.statusText}. Details: ${JSON.stringify(errorData)}`,
      })
    }

    const responseData = await response.json()

    // Extract and parse the response data within the "|| ||" delimiters
    const rawContent = responseData.choices[0].message.content.trim()
    const data = rawContent.match(/\|\|(.*?)\|\|/)?.[1]

    if (data) {
      // Correct format: Split by '|' and trim each entry
      return {
        success: true,
        message: 'Examples generated successfully.',
        data,
      }
    } else {
      // Incorrect format: Return the raw content with a warning message
      return {
        success: false,
        message:
          'Unexpected response format. Please check the response content.',
        data: rawContent,
      }
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || 'Failed to generate pitches.',
      data: null,
    }
  }
})
