// /server/api/botcafe/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
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

type BotCafeProxyBody = {
  messages?: ChatMessage[]
  prompt?: string
  system?: string
  model?: string
  temperature?: number
  n?: number
  max_tokens?: number
  maxTokens?: number
  serverId?: number | null
  serverName?: string | null
  chatId?: number | string | null
  userApiKey?: string | null
}

type OpenAIChatResponse = {
  error?: {
    message?: string
  }
  choices?: Array<{
    message?: {
      content?: string | null
    }
  }>
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<BotCafeProxyBody>(event)
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

    const response = await fetch(endpoint, {
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
        n: body.n ?? 1,
        max_tokens: maxTokens,
      }),
    })

    const data = (await response.json()) as OpenAIChatResponse

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message:
          data.error?.message ||
          `OpenAI-compatible request failed with status ${response.status}.`,
      })
    }

    const { balance } = await gate.commit(
      body.chatId ? `chat:${body.chatId}` : `botcafe:${Date.now()}`,
    )

    return {
      success: true,
      data,
      mana: {
        balance,
        charged: gate.cost,
        free: gate.free,
      },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to process BotCafe request.',
    }
  }
})

function normalizeMessages(body: BotCafeProxyBody): ChatMessage[] {
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
