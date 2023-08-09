import axios, { AxiosError } from 'axios'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { OPENAI_API_KEY } = useRuntimeConfig()

    const data = {
      model: body.model || 'gpt-3.5-turbo',
      messages: body.messages || [
        { role: 'user', content: 'write me a haiku about butterflies fighting malaria' }
      ],
      temperature: body.temperature,
      max_tokens: body.maxTokens,
      n: body.n,
      stream: body.stream || false
    }
    const post = body.post || 'https://api.openai.com/v1/chat/completions'
    console.log('logging:', data)

    if (data.stream) {
      const responseStream = await axios.post(post, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`
        },
        responseType: 'stream'
      })

      let responseData = ''
      responseStream.data.on('data', (chunk: any) => {
        console.log('Received chunk:', chunk.toString()) // Log each chunk as it arrives
        responseData += chunk
      })

      return new Promise((resolve, reject) => {
        responseStream.data.on('end', () => {
          resolve(JSON.parse(responseData))
        })
        responseStream.data.on('error', (err: any) => {
          reject(err)
        })
      })
    } else {
      const response = await axios.post(post, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`
        }
      })

      return response.data
    }
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
