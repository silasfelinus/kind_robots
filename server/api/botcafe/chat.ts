// server/api/botcafe/chat.ts
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  console.log('Request Body:', body)

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    event.node.res.statusCode = 500
    event.node.res.end(
      JSON.stringify({ success: false, message: 'API key not found' }),
    )
    return
  }

  const data = {
    model: body.model || 'gpt-4o-mini',
    messages: body.messages,
    temperature: body.temperature,
    max_tokens: body.maxTokens,
    n: body.n,
    stream: body.stream || true,
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json()
    event.node.res.statusCode = response.status
    event.node.res.end(
      JSON.stringify({
        success: false,
        message: response.statusText,
        details: errorData,
      }),
    )
    return
  }

  // Set up SSE headers
  event.node.res.setHeader('Content-Type', 'text/event-stream')
  event.node.res.setHeader('Cache-Control', 'no-cache')
  event.node.res.setHeader('Connection', 'keep-alive')

  const reader = response.body?.getReader()
  if (!reader) {
    event.node.res.statusCode = 500
    event.node.res.end(
      JSON.stringify({
        success: false,
        message: 'No readable stream from response',
      }),
    )
    return
  }

  const decoder = new TextDecoder()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const events = chunk.split('\n\n').filter(Boolean)

      for (const eventChunk of events) {
        if (eventChunk.startsWith('data: ')) {
          const jsonData = eventChunk.replace('data: ', '').trim()
          if (jsonData === '[DONE]') {
            event.node.res.write(`data: [DONE]\n\n`)
            event.node.res.end()
            return
          }
          try {
            const parsedData = JSON.parse(jsonData)
            const content = parsedData.choices[0]?.delta?.content || ''
            console.log('Parsed Content Chunk:', content)

            // Send the chunk as SSE
            event.node.res.write(`data: ${JSON.stringify(content)}\n\n`)
          } catch {
            console.warn('Failed to parse JSON data chunk:', jsonData)
          }
        }
      }
    }
  } catch (streamError) {
    console.error('Error during data streaming:', streamError)
    event.node.res.end() // Ensure we close the response in case of an error
  }
})
