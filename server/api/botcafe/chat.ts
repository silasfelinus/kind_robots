// server/api/botcafe/chat.ts
import { defineEventHandler, readBody } from 'h3'
import type { AxiosError } from 'axios'
import axios from 'axios'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    let { OPENAI_API_KEY } = useRuntimeConfig()

    // Check if user's key is provided in the request
    if (body.user_openai_key) {
      OPENAI_API_KEY = body.user_openai_key
    }

    const data = {
      model: body.model || 'gpt-3.5-turbo',
      messages: body.messages || [{ role: 'user', content: 'write me a haiku about butterflies fighting malaria' }],
      temperature: body.temperature,
      max_tokens: body.maxTokens,
      n: body.n,
      stream: body.stream || false,
    }
    const post = body.post || 'https://api.openai.com/v1/chat/completions'
    console.log('logging:', data)

    const response = await axios.post(post, data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
    })

    return response.data
  }
  catch (error) {
    let errorMessage = 'An error occurred while creating the channel.'
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError
      errorMessage += ` Details: ${axiosError.message}`
      if (axiosError.response) {
        console.error('Response:', axiosError.response)
        errorMessage += ` Server responded with ${axiosError.response.status}: ${JSON.stringify(
          axiosError.response.data,
        )}`
      }
    }
    else if (error instanceof Error) {
      errorMessage += ` Details: ${error.message}`
    }

    throw createError({
      statusCode: 500,
      statusMessage: errorMessage,
    })
  }
})
