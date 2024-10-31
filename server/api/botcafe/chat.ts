import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { OPENAI_API_KEY } = useRuntimeConfig()
  const apiKey = OPENAI_API_KEY

  if (apiKey) {
    console.log('we have a key')
  }

  const data = {
    model: body.model || 'gpt-4',
    messages: body.messages,
    temperature: body.temperature,
    max_tokens: body.maxTokens,
    stream: body.stream || false,
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`API Error: ${errorData.error.message}`)
  }

  if (data.stream) {
    // Handle streamed response
    const reader = response.body?.getReader()
    const decoder = new TextDecoder('utf-8')

    event.node.res.setHeader('Content-Type', 'text/event-stream')
    event.node.res.setHeader('Cache-Control', 'no-cache')
    event.node.res.setHeader('Connection', 'keep-alive')

    if (reader) {
      let buffer = '' // Buffer to accumulate chunks until a complete JSON object is ready

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Decode the incoming chunk
        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        // Process complete JSON chunks
        let boundary
        while ((boundary = buffer.indexOf('\n')) >= 0) {
          const jsonChunk = buffer.slice(0, boundary).trim()
          buffer = buffer.slice(boundary + 1)

          // Send each chunk as SSE to the frontend
          event.node.res.write(`data: ${jsonChunk}\n\n`)
        }
      }
      event.node.res.end()
    } else {
      throw new Error('Streaming not supported.')
    }
  } else {
    // For non-streamed response
    const jsonData = await response.json()
    return jsonData
  }
})
