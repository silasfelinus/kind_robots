// server/api/botcafe/chat.ts
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    console.log('Request Body:', body) // Log the request body for validation

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error('Missing OpenAI API Key')
      return {
        success: false,
        statusCode: 500,
        message: 'API key not found',
      }
    }

    const data = {
      model: body.model || 'gpt-4o-mini',
      messages: body.messages,
      temperature: body.temperature,
      max_tokens: body.maxTokens,
      n: body.n,
      stream: body.stream || false,
    }
    console.log('Payload Data:', data) // Log payload data before the API call

    const post = body.post || 'https://api.openai.com/v1/chat/completions'
    console.log('API Endpoint:', post) // Confirm the endpoint

    const response = await fetch(post, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('API Response Error:', {
        statusCode: response.status,
        statusText: response.statusText,
        details: errorData,
      })
      return {
        success: false,
        statusCode: response.status,
        message: response.statusText,
        details: errorData,
      }
    }

    const responseData = await response.json()
    console.log('Successful API Response:', responseData) // Log the successful response data
    return { success: true, data: responseData }

  } catch (error) {
    console.error('Unhandled Error:', error)
    return {
      success: false,
      statusCode: 500,
      message: 'Internal Server Error',
      details: error instanceof Error ? error.message : String(error),
    }
  }
})
