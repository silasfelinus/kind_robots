// server/api/botcafe/chat.ts
// server/api/botcafe/chat.ts
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  console.log('Request Body:', body)

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    if (event.res) {
      event.res.writeHead(500, { 'Content-Type': 'application/json' })
      event.res.end(JSON.stringify({ success: false, message: 'API key not found' }))
    }
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
    if (event.res) {
      event.res.writeHead(response.status, { 'Content-Type': 'application/json' })
      event.res.end(JSON.stringify({ success: false, message: response.statusText, details: errorData }))
    }
    return
  }

  // Set up SSE headers
  if (event.res) {
    event.res.setHeader('Content-Type', 'text/event-stream')
    event.res.setHeader('Cache-Control', 'no-cache')
    event.res.setHeader('Connection', 'keep-alive')
  }

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const events = chunk.split('\n\n').filter(Boolean)

      for (const event of events) {
        if (event.startsWith('data: ')) {
          const jsonData = event.replace('data: ', '').trim()
          if (jsonData === '[DONE]') {
            if (event.res) event.res.write(`data: [DONE]\n\n`)
            if (event.res) event.res.end()
            return
          }
          try {
            const parsedData = JSON.parse(jsonData)
            const content = parsedData.choices[0]?.delta?.content || ''
            console.log('Parsed Content Chunk:', content)

            // Send the chunk as SSE
            if (event.res) {
              event.res.write(`data: ${JSON.stringify(content)}\n\n`)
            }
          } catch (parseError) {
            console.warn('Failed to parse JSON data chunk:', jsonData)
          }
        }
      }
    }
  } catch (streamError) {
    console.error('Error during data streaming:', streamError)
    if (event.res) {
      event.res.end() // Ensure we close the response in case of an error
    }
  }
})
