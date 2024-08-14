import { defineEventHandler, readBody } from 'h3'
import { useRuntimeConfig, createError } from '#imports'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { OPENAI_API_KEY } = useRuntimeConfig()

    const data = {
      model: body.model || 'gpt-3.5-turbo',
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

    if (data.stream) {
      // Handle streaming response
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
        throw createError({
          statusCode: response.status,
          statusMessage: `Error from OpenAI: ${response.statusText}. Details: ${JSON.stringify(errorData)}`,
        })
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder('utf-8')
      let responseData = ''

      if (reader) {
        let done = false
        while (!done) {
          const { done: streamDone, value } = await reader.read()
          done = streamDone
          if (value) {
            const chunk = decoder.decode(value, { stream: true })
            console.log('Received chunk:', chunk) // Log each chunk as it arrives
            responseData += chunk
          }
        }
      }

      return JSON.parse(responseData)
    } else {
      // Handle non-streaming response
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
        throw createError({
          statusCode: response.status,
          statusMessage: `Error from OpenAI: ${response.statusText}. Details: ${JSON.stringify(errorData)}`,
        })
      }

      return await response.json()
    }
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
