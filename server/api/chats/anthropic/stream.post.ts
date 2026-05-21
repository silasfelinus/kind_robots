import { defineEventHandler, readBody, createError, setHeader } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { OPENAI_API_KEY } = useRuntimeConfig()

    if (!OPENAI_API_KEY) {
      throw createError({
        statusCode: 500,
        statusMessage: 'OPENAI_API_KEY not configured',
      })
    }

    const messages = body.messages ?? [
      ...(body.system ? [{ role: 'system', content: body.system }] : []),
      { role: 'user', content: body.prompt ?? '' },
    ]

    const payload = {
      model: body.model || 'gpt-4o-mini',
      messages,
      temperature: body.temperature ?? 0.7,
      max_tokens: body.maxTokens,
      n: body.n,
      stream: true,
    }

    const endpoint = body.post || 'https://api.openai.com/v1/chat/completions'

    console.log('[openai/stream] →', {
      model: payload.model,
      messages: payload.messages.length,
    })

    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => '')
      throw createError({
        statusCode: upstream.status,
        statusMessage: `OpenAI stream failed: ${upstream.statusText}. ${errText}`,
      })
    }

    // Pipe SSE straight through to the client. The executor parses each
    // `data: {...}` line and pulls choices[0].delta.content.
    setHeader(event, 'Content-Type', 'text/event-stream')
    setHeader(event, 'Cache-Control', 'no-cache, no-transform')
    setHeader(event, 'Connection', 'keep-alive')
    setHeader(event, 'X-Accel-Buffering', 'no') // disable nginx buffering

    return sendStream(event, upstream.body)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[openai/stream] error:', message)
    throw createError({
      statusCode: 500,
      statusMessage: `OpenAI stream error: ${message}`,
    })
  }
})

/**
 * Pipe a Web ReadableStream to the h3 response.
 * h3's sendStream wants a Node stream, so we adapt.
 */
function sendStream(event: any, body: ReadableStream<Uint8Array>) {
  const reader = body.getReader()
  const res = event.node.res

  const pump = async () => {
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(value)
      }
    } catch (err) {
      console.error('[stream pump] error:', err)
    } finally {
      res.end()
    }
  }

  pump()
  // Return a never-resolving promise so h3 doesn't end the response early.
  // The pump() above is what actually ends it.
  return new Promise(() => {})
}
