// /server/api/chats/anthropic/stream.post.ts
import {
  createError,
  defineEventHandler,
  readBody,
  setHeader,
  type H3Event,
} from 'h3'
import { getServerEndpoint, resolveServer } from '../../../utils/serverResolver'
import { manaGate } from '../../../utils/manaGate'
import { requireApiUser } from '../../../utils/authGuard'
import type { Server } from '~/prisma/generated/prisma/client'

type AnthropicStreamBody = {
  prompt?: string
  system?: string
  messages?: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  model?: string
  temperature?: number
  maxTokens?: number
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
    const body = await readBody<AnthropicStreamBody>(event)
    const config = useRuntimeConfig()
    const auth = await requireApiUser(event)

    const model = body.model || 'claude-sonnet-4-6'
    const maxTokens = body.maxTokens ?? 4096

    const server = await resolveOptionalServer({
      userId: auth.user.id,
      serverId: body.serverId ?? null,
      serverName: body.serverName ?? null,
    })

    const gate = await manaGate(event, {
      kind: 'text',
      estCostUsd: estimateAnthropicTextCostUsd({
        model,
        maxTokens,
      }),
      serverId: server?.id ?? body.serverId ?? null,
      useOwnResource: Boolean(body.useOwnResource || body.userApiKey),
    })

    const messages = normalizeMessages(body)
    const endpoint = getAnthropicEndpoint(server)
    const apiKey = getAnthropicApiKey({
      serverApiKey: server?.apiKey,
      userApiKey: body.userApiKey,
      runtimeApiKey: getRuntimeAnthropicKey(config),
    })

    assertAnthropicApiKey(apiKey)

    const payload: Record<string, unknown> = {
      model,
      messages,
      max_tokens: maxTokens,
      temperature: body.temperature ?? 0.7,
      stream: true,
    }

    if (body.system) {
      payload.system = body.system
    }

    console.log('[anthropic/stream] →', {
      endpoint,
      model: payload.model,
      messages: messages.length,
      authUserId: auth.user.id,
      serverId: server?.id ?? null,
      serverTitle: server?.title ?? 'System Anthropic',
      serverType: server?.serverType ?? 'ANTHROPIC',
      chargedMana: gate.cost,
      free: gate.free,
      providerKeyPrefix: apiKey.slice(0, 8),
      providerKeyLength: apiKey.length,
      bodyHasUserApiKey: Boolean(body.userApiKey),
    })

    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    })

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => '')

      throw createError({
        statusCode: upstream.status,
        message: `Anthropic stream failed: ${upstream.statusText}. ${errText}`,
      })
    }

    setStreamHeaders(event, 'text/event-stream')

    return sendMeteredStream(event, upstream.body, async () => {
      const refId = body.chatId
        ? `chat:${body.chatId}`
        : `anthropic:${Date.now()}`

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

    console.error('[anthropic/stream] error:', message)

    throw createError({
      statusCode,
      message: `Anthropic stream error: ${message}`,
    })
  }
})

function normalizeMessages(body: AnthropicStreamBody) {
  if (body.messages?.length) {
    return body.messages
  }

  return [
    {
      role: 'user' as const,
      content: body.prompt ?? '',
    },
  ]
}

async function resolveOptionalServer(input: {
  userId: number
  serverId?: number | null
  serverName?: string | null
}): Promise<Server | null> {
  if (!input.serverId && !input.serverName) {
    return null
  }

  return await resolveServer({
    userId: input.userId,
    serverId: input.serverId ?? null,
    serverName: input.serverName ?? null,
    capability: 'text',
  })
}

function getRuntimeAnthropicKey(config: ReturnType<typeof useRuntimeConfig>) {
  return String(
    config.anthropicApiKey ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.CLAUDE_API_KEY ||
      '',
  ).trim()
}

function getAnthropicEndpoint(server: Server | null) {
  if (!server) {
    return 'https://api.anthropic.com/v1/messages'
  }

  const endpoint = getServerEndpoint(server).trim()

  if (!endpoint) {
    return 'https://api.anthropic.com/v1/messages'
  }

  if (endpoint.endsWith('/messages')) {
    return endpoint
  }

  if (endpoint.endsWith('/v1')) {
    return `${endpoint}/messages`
  }

  return endpoint
}

function cleanProviderKey(value?: string | null) {
  return value?.trim().replace(/^Bearer\s+/i, '').trim() || ''
}

function getAnthropicApiKey(options: {
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

function assertAnthropicApiKey(apiKey: string) {
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      message: 'No Anthropic API key is configured.',
    })
  }

  if (!apiKey.startsWith('sk-ant-')) {
    throw createError({
      statusCode: 500,
      message:
        'Anthropic provider key is invalid. Expected an Anthropic key starting with "sk-ant-". The app authorization key is probably being used as the provider key.',
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
      console.error('[anthropic stream pump] error:', err)

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

function estimateAnthropicTextCostUsd(input: {
  model: string
  maxTokens: number
}): number {
  const model = input.model.toLowerCase()
  const maxTokens = Math.max(1, input.maxTokens)

  if (model.includes('opus')) {
    return (maxTokens / 1_000_000) * 75
  }

  if (model.includes('sonnet')) {
    return (maxTokens / 1_000_000) * 15
  }

  if (model.includes('haiku')) {
    return (maxTokens / 1_000_000) * 4
  }

  return (maxTokens / 1_000_000) * 15
}

function getErrorStatusCode(error: unknown) {
  return typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
    ? error.statusCode
    : 500
}