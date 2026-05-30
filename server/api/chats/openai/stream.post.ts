// /server/api/chats/openai/stream.post.ts
import {
  defineEventHandler,
  readBody,
  createError,
  setHeader,
  type H3Event,
} from 'h3'
import { validateApiKey } from '../../../utils/validateKey'
import { resolveServer, getServerEndpoint } from '../../../utils/serverResolver'
import { withTextMana } from '../../../utils/generationMana'
import type { Server } from '~/prisma/generated/prisma/client'

type OpenAiStreamBody = {
  prompt?: string
  system?: string
  messages?: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  model?: string
  temperature?: number
  maxTokens?: number
  n?: number
  serverId?: number | null
  serverName?: string | null
  chatId?: number | string | null
  userApiKey?: string | null
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<OpenAiStreamBody>(event)
    const { openaiApiKey } = useRuntimeConfig()

    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Authorization token is required or invalid.',
      })
    }

    const messages = body.messages?.length
      ? body.messages
      : [
          ...(body.system
            ? [{ role: 'system' as const, content: body.system }]
            : []),
          { role: 'user' as const, content: body.prompt ?? '' },
        ]

    const model = body.model || 'gpt-4o-mini'

    const server = await resolveServer({
      userId: user.id,
      serverId: body.serverId ?? null,
      serverName: body.serverName ?? null,
      capability: 'text',
    })

    const gate = await withTextMana(event, {
      server,
      model,
      maxTokens: body.maxTokens ?? null,
    })

    const payload = {
      model,
      messages,
      temperature: body.temperature ?? 0.7,
      max_tokens: body.maxTokens,
      n: body.n,
      stream: true,
    }

    const endpoint = getOpenAiCompatibleEndpoint(server)
    const apiKey = getOpenAiCompatibleApiKey({
      serverApiKey: server.apiKey,
      userApiKey: body.userApiKey,
      runtimeApiKey: openaiApiKey,
    })

    if (!apiKey) {
      throw createError({
        statusCode: 500,
        message: 'No OpenAI-compatible API key is configured.',
      })
    }

    console.log('[openai/stream] →', {
      model: payload.model,
      messages: payload.messages.length,
      serverId: server.id,
      serverTitle: server.title,
      chargedMana: gate.cost,
      free: gate.free,
    })

    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey.startsWith('Bearer ')
          ? apiKey
          : `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => '')

      throw createError({
        statusCode: upstream.status,
        message: `OpenAI stream failed: ${upstream.statusText}. ${errText}`,
      })
    }

    setHeader(event, 'Content-Type', 'text/event-stream')
    setHeader(event, 'Cache-Control', 'no-cache, no-transform')
    setHeader(event, 'Connection', 'keep-alive')
    setHeader(event, 'X-Accel-Buffering', 'no')

    return sendMeteredStream(event, upstream.body, async () => {
      const refId = body.chatId ? `chat:${body.chatId}` : `text:${Date.now()}`
      const { balance } = await gate.commit(refId)

      return {
        balance,
        charged: gate.cost,
        free: gate.free,
      }
    })
  } catch (error) {
    const statusCode =
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof error.statusCode === 'number'
        ? error.statusCode
        : 500

    const message = error instanceof Error ? error.message : 'Unknown error'

    console.error('[openai/stream] error:', message)

    throw createError({
      statusCode,
      message: `OpenAI stream error: ${message}`,
    })
  }
})

function getOpenAiCompatibleEndpoint(server: Server) {
  const endpoint = getServerEndpoint(server).trim()

  if (!endpoint) {
    return 'https://api.openai.com/v1/chat/completions'
  }

  if (endpoint.endsWith('/chat/completions')) {
    return endpoint
  }

  if (endpoint.endsWith('/v1')) {
    return `${endpoint}/chat/completions`
  }

  return endpoint
}

function normalizeChatCompletionsEndpoint(url: string) {
  const cleanUrl = url.trim().replace(/\/+$/, '')

  if (cleanUrl.endsWith('/chat/completions')) {
    return cleanUrl
  }

  if (cleanUrl.endsWith('/v1')) {
    return `${cleanUrl}/chat/completions`
  }

  return cleanUrl
}

function getOpenAiCompatibleApiKey(options: {
  serverApiKey?: string | null
  userApiKey?: string | null
  runtimeApiKey?: string | null
}) {
  return (
    options.userApiKey?.trim() ||
    options.serverApiKey?.trim() ||
    options.runtimeApiKey?.trim() ||
    ''
  )
}

function sendMeteredStream(
  event: H3Event,
  body: ReadableStream<Uint8Array>,
  onComplete: () => Promise<{
    balance: number
    charged: number
    free: boolean
  }>,
) {
  const reader = body.getReader()
  const res = event.node.res

  const pump = async () => {
    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        res.write(value)
      }

      const mana = await onComplete()

      res.write(
        `event: mana\ndata: ${JSON.stringify({
          mana,
        })}\n\n`,
      )
    } catch (err) {
      console.error('[stream pump] error:', err)

      res.write(
        `event: error\ndata: ${JSON.stringify({
          message:
            err instanceof Error ? err.message : 'Streaming response failed.',
        })}\n\n`,
      )
    } finally {
      res.end()
    }
  }

  pump()

  return new Promise(() => {})
}
