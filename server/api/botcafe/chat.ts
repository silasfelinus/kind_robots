// /server/api/botcafe/chat.ts
import { createError, defineEventHandler, readBody } from 'h3'
import type { Server } from '~/prisma/generated/prisma/client'
import { errorHandler } from '@/server/utils/error'
import { manaGate } from '@/server/utils/manaGate'
import { estimateTextCostUsd } from '@/server/utils/manaCost'
import { getServerEndpoint, resolveServer } from '@/server/utils/serverResolver'

type ChatRole = 'system' | 'user' | 'assistant'

type ChatMessage = {
  role: ChatRole
  content: string
}

type BotCafeBody = {
  model?: string
  messages?: ChatMessage[]
  temperature?: number
  maxTokens?: number
  max_tokens?: number
  stream?: boolean
  serverId?: number | null
  serverName?: string | null
  chatId?: number | null
  userApiKey?: string | null
}

type OpenAIChatResponse = {
  id?: string
  object?: string
  created?: number
  model?: string
  choices?: Array<{
    index?: number
    message?: {
      role?: string
      content?: string | null
    }
    finish_reason?: string | null
  }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
  error?: {
    message?: string
    type?: string
    code?: string
  }
}

function normalizeMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) return []

  return messages
    .filter((message): message is ChatMessage => {
      if (!message || typeof message !== 'object') return false

      const entry = message as Partial<ChatMessage>

      return (
        typeof entry.content === 'string' &&
        ['system', 'user', 'assistant'].includes(String(entry.role))
      )
    })
    .map((message) => ({
      role: message.role,
      content: message.content,
    }))
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<BotCafeBody>(event)
    const messages = normalizeMessages(body.messages)

    if (!messages.length) {
      throw createError({
        statusCode: 400,
        message: 'At least one chat message is required.',
      })
    }

    const model = body.model || process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini'
    const maxTokens = body.max_tokens ?? body.maxTokens ?? 2048

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

    const openAiPayload = {
      model,
      messages,
      temperature: body.temperature ?? 0.7,
      max_tokens: maxTokens,
      stream: false,
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey.startsWith('Bearer ')
          ? apiKey
          : `Bearer ${apiKey}`,
      },
      body: JSON.stringify(openAiPayload),
    })

    const raw = (await response.json()) as OpenAIChatResponse

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message:
          raw.error?.message ||
          `OpenAI request failed with status ${response.status}.`,
      })
    }

    const content = raw.choices?.[0]?.message?.content?.trim()

    if (!content) {
      throw createError({
        statusCode: 502,
        message: 'OpenAI returned no assistant content.',
      })
    }

    const { balance } = await gate.commit(`chat:${body.chatId ?? 'adhoc'}`)

    return {
      success: true,
      message: 'Bot response received.',
      data: {
        content,
        raw,
        serverId: server?.id ?? null,
        serverName: server?.title ?? 'OpenAI',
      },
      mana: {
        balance,
        charged: gate.cost,
        free: gate.free,
      },
    }
  } catch (error) {
    return errorHandler(error)
  }
})

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
