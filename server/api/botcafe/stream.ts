// server/api/botcafe/chat.ts

import axios from 'axios'

export default defineEventHandler(async (event) => {
  try {
    const { OPENAI_API_KEY } = useRuntimeConfig()
    const body = await readBody(event)
    const data = {
      model: body.model || 'gpt-3.5-turbo',
      messages: body.messages || [
        { role: 'user', content: 'write me a haiku about butterflies fighting malaria' }
      ],
      stream: true
    }
    const post = body.post || 'https://api.openai.com/v1/chat/completions'

    const config = {
      method: 'post',
      url: post,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      data,
      responseType: 'stream'
    }

    const response = await axios.post(post, data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      }
    })

    response.data.on('data', (chunk: any) => {
      // Parse SSE data here
      const chunkStr = chunk.toString()

      // Split by double newline to get event chunks
      const eventChunks = chunkStr.split('\n\n')

      for (const eventChunk of eventChunks) {
        // Split by single newline to get event lines
        const eventLines = eventChunk.split('\n')

        for (const eventLine of eventLines) {
          // Skip comments
          if (!eventLine.startsWith(':')) {
            // Split by colon to get field name and value
            const [field, value] = eventLine.split(':', 2)

            switch (field) {
              case 'data':
                // Do something with data here
                console.log('Data:', JSON.parse(value))
                break
              case 'event':
                // Do something with event type here
                console.log('Event:', value)
                break
              case 'id':
                // Do something with event ID here
                console.log('ID:', value)
                break
              default:
                // Unexpected field
                console.warn('Unexpected field:', field)
                break
            }
          }
        }
      }
    })
  } catch (error) {
    console.error(error)
  }
})
