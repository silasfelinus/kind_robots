//server/api/chats/anthropic/stream.post.ts

import { defineEventHandler, readBody, createError, setHeader } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { anthropicApiKey } = useRuntimeConfig()

    if (!anthropicApiKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'anthropicApiKey not configured',
      })
    }

    const messages = body.messages ?? [
      { role: 'user', content: body.prompt ?? '' },
    ]

    const payload: Record<string, unknown> = {
      model: body.model || 'claude-sonnet-4-6',
      messages,
      max_tokens: body.maxTokens ?? 4096,
      temperature: body.temperature,
      stream: true,
    }

    if (body.system) payload.system = body.system

    const endpoint = body.post || 'https://api.anthropic.com/v1/messages'

    console.log('[anthropic/stream] →', {
      model: payload.model,
      messages: messages.length,
    })

    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    })

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => '')
      throw createError({
        statusCode: upstream.status,
        statusMessage: `Anthropic stream failed: ${upstream.statusText}. ${errText}`,
      })
    }

    // Anthropic streams SSE with `event:` and `data:` lines. Our executor
    // only reads `data:` lines and filters by parsed.type === 'content_block_delta',
    // so passing the raw stream through works.
    setHeader(event, 'Content-Type', 'text/event-stream')
    setHeader(event, 'Cache-Control', 'no-cache, no-transform')
    setHeader(event, 'Connection', 'keep-alive')
    setHeader(event, 'X-Accel-Buffering', 'no')

    return sendStream(event, upstream.body)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[anthropic/stream] error:', message)
    throw createError({
      statusCode: 500,
      statusMessage: `Anthropic stream error: ${message}`,
    })
  }
})

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
  return new Promise(() => {})
}
