// server/api/botcafe/chat.ts
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    let { OPENAI_API_KEY } = useRuntimeConfig()

    // Check if user's key is provided in the request
    if (body.user_openai_key) {
      OPENAI_API_KEY = body.user_openai_key
    }

    const data = {
      model: body.model || 'gpt-4o-mini',
      messages: body.messages || [
        {
          role: 'user',
          content: 'write me a haiku about butterflies fighting malaria',
        },
      ],
      temperature: body.temperature,
      max_tokens: body.maxTokens,
      n: body.n,
      stream: body.stream || false,
    }
    const post = body.post || 'https://api.openai.com/v1/chat/completions'
    console.log('logging:', data)

    const response = await fetch(post, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Response:', response)
      throw createError({
        statusCode: response.status,
        statusMessage: `Error from OpenAI: ${response.statusText}. Details: ${JSON.stringify(errorData)}`,
      })
    }

    const responseData = await response.json()
    return responseData
  } catch (error) {
    let errorMessage = 'An error occurred while creating the channel.'

    if (error instanceof Error) {
      errorMessage += ` Details: ${error.message}`
    }

    throw createError({
      statusCode: 500,
      statusMessage: errorMessage,
    })
  }
})
