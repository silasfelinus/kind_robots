// /server/api/botcafe/stream.ts
import {
  createError,
  defineEventHandler,
  readBody,
  setHeader,
  type H3Event,
} from 'h3'
import type { Server } from '~/prisma/generated/prisma/client'
import { errorHandler } from '../../utils/error'
import { manaGate } from '../../utils/manaGate'
import { estimateTextCostUsd } from '../../utils/manaCost'
import { getServerEndpoint, resolveServer } from '../../utils/serverResolver'

type ChatRole = 'system' | 'user' | 'assistant'

type ChatMessage = {
  role: ChatRole
  content: string
}

type BotCafeStreamBody = {
  messages?: ChatMessage[]
  prompt?: string
  system?: string
  model?: string
  temperature?: number
  maxTokens?: number
  max_tokens?: number
  n?: number
  serverId?: number | null
  serverName?: string | null
  chatId?: number | string | null
  userApiKey?: string | null
}

type StreamManaResult = {
  balance: number
  charged: number
  free: boolean
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<BotCafeStreamBody>(event)
    const model = body.model || process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini'
    const maxTokens = body.max_tokens ?? body.maxTokens ?? 500
    const messages = normalizeMessages(body)

    if (!messages.length) {
      throw createError({
        statusCode: 400,
        message: 'At least one message or prompt is required.',
      })
    }

    const gate = await manaGate(event, {
      kind: 'text',
      estCostUsd: estimateTextCostUsd({
        model,
        maxTokens,
      }),
      serverId: body.serverId ?? null,
    })

    const server = await resolveOptionalTextServer({
      userId: gate.user.id,
      serverId: body.serverId ?? null,
      serverName: body.serverName ?? null,
    })

    const endpoint = server
      ? getOpenAiCompatibleEndpoint(server)
      : 'https://api.openai.com/v1/chat/completions'

    const apiKey = getOpenAiCompatibleApiKey({
      userApiKey: body.userApiKey,
      serverApiKey: server?.apiKey,
      runtimeApiKey: process.env.OPENAI_API_KEY,
    })

    if (!apiKey) {
      throw createError({
        statusCode: 500,
        message: 'No OpenAI-compatible API key is configured.',
      })
    }

    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey.startsWith('Bearer ')
          ? apiKey
          : `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: body.temperature ?? 0.7,
        max_tokens: maxTokens,
        n: body.n ?? 1,
        stream: true,
      }),
    })

    if (!upstream.ok || !upstream.body) {
      const details = await upstream.text().catch(() => '')

      throw createError({
        statusCode: upstream.status,
        message: `OpenAI-compatible stream failed: ${upstream.statusText}. ${details}`,
      })
    }

    setHeader(event, 'Content-Type', 'text/event-stream')
    setHeader(event, 'Cache-Control', 'no-cache, no-transform')
    setHeader(event, 'Connection', 'keep-alive')
    setHeader(event, 'X-Accel-Buffering', 'no')

    return sendMeteredStream(event, upstream.body, async () => {
      const { balance } = await gate.commit(
        body.chatId ? `chat:${body.chatId}` : `botcafe-stream:${Date.now()}`,
      )

      return {
        balance,
        charged: gate.cost,
        free: gate.free,
      }
    })
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to stream BotCafe response.',
    }
  }
})

function normalizeMessages(body: BotCafeStreamBody): ChatMessage[] {
  if (Array.isArray(body.messages) && body.messages.length) {
    return body.messages.filter((message): message is ChatMessage => {
      return (
        Boolean(message) &&
        typeof message.content === 'string' &&
        ['system', 'user', 'assistant'].includes(message.role)
      )
    })
  }

  return [
    ...(body.system
      ? [{ role: 'system' as const, content: body.system }]
      : []),
    ...(body.prompt ? [{ role: 'user' as const, content: body.prompt }] : []),
  ]
}

async function resolveOptionalTextServer(input: {
  userId: number
  serverId?: number | null
  serverName?: string | null
}): Promise<Server | null> {
  if (!input.serverId && !input.serverName) return null

  return await resolveServer({
    userId: input.userId,
    serverId: input.serverId ?? null,
    serverName: input.serverName ?? null,
    capability: 'text',
  })
}

function getOpenAiCompatibleEndpoint(server: Server): string {
  const endpoint = getServerEndpoint(server).trim()

  if (!endpoint) return 'https://api.openai.com/v1/chat/completions'

  if (endpoint.endsWith('/chat/completions')) return endpoint
  if (endpoint.endsWith('/v1')) return `${endpoint}/chat/completions`

  return endpoint
}

function getOpenAiCompatibleApiKey(options: {
  userApiKey?: string | null
  serverApiKey?: string | null
  runtimeApiKey?: string | null
}): string {
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
      console.error('[botcafe stream pump] error:', err)

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
