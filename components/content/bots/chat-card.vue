import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const apiKey = process.env.OPENAI_API_KEY
  const data = {
    model: body.model || 'gpt-4o-mini',
    messages: body.messages,
    temperature: body.temperature,
    max_tokens: body.maxTokens,
    n: body.n,
    stream: body.stream || false,
  }
  const post = body.post || 'https://api.openai.com/v1/chat/completions'

  try {
    const response = await fetch(post, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`, // Confirm API Key is attached
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Failed API Call with error:', errorData)
      return {
        success: false,
        statusCode: response.status,
        message: response.statusText,
        details: errorData,
      }
    }

    const responseData = await response.json()
    return { success: true, data: responseData }
  } catch (error) {
    console.error('Server Error:', error)
    return {
      success: false,
      statusCode: 500,
      message: 'Internal Server Error',
      details: error instanceof Error ? error.message : String(error),
    }
  }
})
