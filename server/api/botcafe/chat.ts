import axios, { AxiosError } from 'axios'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { OPENAI_API_KEY } = useRuntimeConfig()

    const requiredFields = ['messages', 'model', 'temperature', 'n', 'maxTokens', 'post']
    for (const field of requiredFields) {
      if (!body[field]) {
        throw new Error(`Missing data. Please make sure to provide ${field}.`)
      }
    }

    const data = {
      model: body.model || 'gpt-3.5-turbo',
      messages: body.messages,
      temperature: body.temperature,
      max_tokens: body.maxTokens,
      n: body.n
    }

    const response = await axios.post('https://api.openai.com/v1/chat/completions', data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      }
    })

    return response.data.choices
  } catch (error) {
    let errorMessage = 'An error occurred while creating the channel.'
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError
      errorMessage += ` Details: ${axiosError.message}`
      if (axiosError.response) {
        console.error('Response:', axiosError.response)
        errorMessage += ` Server responded with ${axiosError.response.status}: ${JSON.stringify(
          axiosError.response.data
        )}`
      }
    } else if (error instanceof Error) {
      errorMessage += ` Details: ${error.message}`
    }

    throw createError({
      statusCode: 500,
      statusMessage: errorMessage
    })
  }
})
