// /server/api/chats/openai/stream.post.ts
import {
  createError,
  defineEventHandler,
  readBody,
  setHeader,
  type H3Event,
} from 'h3'
import { getServerEndpoint, resolveServer } from '../../../utils/serverResolver'
import { manaGate } from '../../../utils/manaGate'
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
  useOwnResource?: boolean
}

type StreamManaResult = {
  balance: number
  charged: number
  free: boolean
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<OpenAiStreamBody>(event)
    const config = useRuntimeConfig()

    const model = body.model || 'gpt-4o-mini'
    const maxTokens = body.maxTokens ?? 2048

    const server = await resolveOptionalServer({
      event,
      serverId: body.serverId ?? null,
      serverName: body.serverName ?? null,
    })

    const gate = await manaGate(event, {
      kind: 'text',
      estCostUsd: estimateOpenAiTextCostUsd({
        model,
        maxTokens,
      }),
      serverId: server?.id ?? body.serverId ?? null,
      useOwnResource: Boolean(body.useOwnResource || body.userApiKey),
    })

    const messages = normalizeMessages(body)
    const endpoint = getOpenAiCompatibleEndpoint(server)
    const apiKey = getOpenAiCompatibleApiKey({
      serverApiKey: server?.apiKey,
      userApiKey: body.userApiKey,
      runtimeApiKey: getRuntimeOpenAiKey(config),
    })

    assertOpenAiApiKey(apiKey)

    const payload = {
      model,
      messages,
      temperature: body.temperature ?? 0.7,
      max_tokens: maxTokens,
      n: body.n,
      stream: true,
    }

    console.log('[openai/stream] →', {
      endpoint,
      model: payload.model,
      messages: payload.messages.length,
      serverId: server?.id ?? null,
      serverTitle: server?.title ?? 'System OpenAI',
      chargedMana: gate.cost,
      free: gate.free,
      providerKeyPrefix: apiKey.slice(0, 6),
      providerKeyLength: apiKey.length,
      bodyHasUserApiKey: Boolean(body.userApiKey),
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

    setStreamHeaders(event, 'text/event-stream')

    return sendMeteredStream(event, upstream.body, async () => {
      const refId = body.chatId ? `chat:${body.chatId}` : `openai:${Date.now()}`
      const { balance } = await gate.commit(refId)

      return {
        balance,
        charged: gate.cost,
        free: gate.free,
      }
    })
  } catch (error) {
    const statusCode = getErrorStatusCode(error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    console.error('[openai/stream] error:', message)

    throw createError({
      statusCode,
      message: `OpenAI stream error: ${message}`,
    })
  }
})

function normalizeMessages(body: OpenAiStreamBody) {
  if (body.messages?.length) {
    return body.messages
  }

  return [
    ...(body.system ? [{ role: 'system' as const, content: body.system }] : []),
    {
      role: 'user' as const,
      content: body.prompt ?? '',
    },
  ]
}

async function resolveOptionalServer(input: {
  event: H3Event
  serverId?: number | null
  serverName?: string | null
}): Promise<Server | null> {
  if (!input.serverId && !input.serverName) {
    return null
  }

  const gate = await manaGate(input.event, {
    kind: 'free',
    serverId: input.serverId ?? null,
    useOwnResource: true,
  })

  return await resolveServer({
    userId: gate.user.id,
    serverId: input.serverId ?? null,
    serverName: input.serverName ?? null,
    capability: 'text',
  })
}

function getRuntimeOpenAiKey(config: ReturnType<typeof useRuntimeConfig>) {
  return String(config.openaiApiKey || process.env.OPENAI_API_KEY || '').trim()
}

function getOpenAiCompatibleEndpoint(server: Server | null) {
  if (!server) {
    return 'https://api.openai.com/v1/chat/completions'
  }

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

function cleanProviderKey(value?: string | null) {
  return value?.trim().replace(/^Bearer\s+/i, '').trim() || ''
}

function getOpenAiCompatibleApiKey(options: {
  serverApiKey?: string | null
  userApiKey?: string | null
  runtimeApiKey?: string | null
}) {
  return (
    cleanProviderKey(options.userApiKey) ||
    cleanProviderKey(options.serverApiKey) ||
    cleanProviderKey(options.runtimeApiKey)
  )
}

function assertOpenAiApiKey(apiKey: string) {
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      message: 'No OpenAI-compatible API key is configured.',
    })
  }

  if (!apiKey.startsWith('sk-')) {
    throw createError({
      statusCode: 500,
      message:
        'OpenAI provider key is invalid. Expected an OpenAI key starting with "sk-". The app authorization key is probably being used as the provider key.',
    })
  }
}

function setStreamHeaders(event: H3Event, contentType: string) {
  setHeader(event, 'Content-Type', contentType)
  setHeader(event, 'Cache-Control', 'no-cache, no-transform')
  setHeader(event, 'Connection', 'keep-alive')
  setHeader(event, 'X-Accel-Buffering', 'no')
}

function sendMeteredStream(
  event: H3Event,
  body: ReadableStream<Uint8Array>,
  onComplete: () => Promise<StreamManaResult>,
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
      console.error('[openai stream pump] error:', err)

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

function estimateOpenAiTextCostUsd(input: {
  model: string
  maxTokens: number
}): number {
  const model = input.model.toLowerCase()
  const maxTokens = Math.max(1, input.maxTokens)

  if (model.includes('gpt-4o-mini')) {
    return (maxTokens / 1_000_