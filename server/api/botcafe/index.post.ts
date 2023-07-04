import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const requiredFields = ['messages', 'post']

    const { OPENAI_API_KEY } = useRuntimeConfig()

    for (const field of requiredFields) {
      if (!body[field]) {
        throw new Error(`Missing data. Please make sure to provide ${field}.`)
      }
    }

    const response = await fetch(body.post, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: body.model || 'gpt-3.5-turbo',
        messages: body.messages,
        temperature: body.temperature || 1,
        n: body.n || 1,
        max_tokens: body.max_tokens || 500
      })
    })

    if (!response.ok) {
      throw new Error('Failed to post to botcafe')
    }

    const data = await response.json()

    return data
  } catch (error) {
    let errorMessage = 'An error occurred while creating the conversation.'

    // Check if error is an instance of Error
    if (error instanceof Error) {
      errorMessage += ` Details: ${error.message}`
    }

    throw createError({
      statusCode: 500,
      statusMessage: errorMessage
    })
  }
})
