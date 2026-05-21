import { defineEventHandler, readBody, createError, setHeader } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const config = useRuntimeConfig()

    // Resolve Ollama URL. Priority: body.baseUrl > body.serverName lookup (TODO)
    // > runtimeConfig.OLLAMA_BASE_URL > localhost default.
    const baseUrl =
      body.baseUrl ||
      config.OLLAMA_BASE_URL ||
      'http://localhost:11434'

    const messages = body.messages ?? [
      ...(body.system ? [{ role: 'system', content: body.system }] : []),
      { role: 'user', content: body.prompt ?? '' },
    ]

    const payload = {
      model: body.model || 'llama3.2',
      messages,
      stream: true,
      options: {
        temperature: body.temperature,
        num_predict: body.maxTokens,
      },
    }

    const endpoint = `${baseUrl.replace(/\/$/, '')}/api/chat`

    console.log('[ollama/stream] →', {
      endpoint,
      model: payload.model,
      messages: messages.length,
    })

    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => '')
      throw createError({
        statusCode: upstream.status,
        statusMessage: `Ollama stream failed: ${upstream.statusText}. ${errText}`,
      })
    }

    // Ollama emits newline-delimited JSON, not SSE.
    setHeader(event, 'Content-Type', 'application/x-ndjson')
    setHeader(event, 'Cache-Control', 'no-cache, no-transform')
    setHeader(event, 'Connection', 'keep-alive')
    setHeader(event, 'X-Accel-Buffering', 'no')

    return sendStream(event, upstream.body)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[ollama/stream] error:', message)
    throw createError({
      statusCode: 500,
      statusMessage: `Ollama stream error: ${message}`,
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
