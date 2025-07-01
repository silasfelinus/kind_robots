// /server/api/prompt/stream.post.ts
import { defineEventHandler, readBody, sendStream, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const { OPENAI_API_KEY } = useRuntimeConfig()
  const body = await readBody(event)

  const prompt = body.prompt
  if (!prompt) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing prompt input.',
    })
  }

  const payload = {
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    stream: true,
    temperature: 0.8,
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok || !response.body) {
    let errorMsg = 'Unknown error'
    try {
      const err = await response.json()
      errorMsg = err.error?.message || response.statusText
    } catch (e) {
      errorMsg = response.statusText
    }

    throw createError({
      statusCode: response.status,
      statusMessage: `OpenAI Error: ${errorMsg}`,
    })
  }

  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        let boundary
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
          const chunk = buffer.slice(0, boundary).trim()
          buffer = buffer.slice(boundary + 2)

          if (!chunk || chunk === 'data: [DONE]') continue
          if (!chunk.startsWith('data:')) continue

          try {
            const json = JSON.parse(chunk.replace(/^data:\s*/, ''))
            controller.enqueue(`data: ${JSON.stringify(json)}\n\n`)
          } catch (err) {
            console.warn('Invalid stream chunk:', chunk)
          }
        }
      }

      controller.enqueue(`data: [DONE]\n\n`)
      controller.close()
    },
  })

  event.node.res.setHeader('Content-Type', 'text/event-stream')
  event.node.res.setHeader('Cache-Control', 'no-cache')
  event.node.res.setHeader('Connection', 'keep-alive')

  return sendStream(event, stream)
})
