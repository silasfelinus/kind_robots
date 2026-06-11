// /server/api/botcafe/chat.ts
import { createError, defineEventHandler, readBody } from 'h3'
import type { Server } from '~/prisma/generated/prisma/client'
import { errorHandler } from '@/server/utils/error'
import { manaGate } from '@/server/utils/manaGate'
import { estimateTextCostUsd } from '@/server/utils/manaCost'
import { resolveServer } from '@/server/utils/serverResolver'
import { createTextCompletion } from '@/server/utils/textServer'
import {
  ServerAccessMode,
  ServerAuthType,
  ServerStatus,
  ServerType,
} from '~/prisma/generated/prisma/client'

type ChatRole = 'system' | 'user' | 'assistant'

type ChatMessage = {
  role: ChatRole
  content: string
}

type BotCafeBody = {
  model?: string
  provider?: string
  serverType?: string | null
  messages?: ChatMessage[]
  temperature?: number
  maxTokens?: number
  max_tokens?: number
  stream?: boolean
  serverId?: number | null
  serverName?: string | null
  chatId?: number | null
  userApiKey?: string | null
  useOwnResource?: boolean
}

type TextResponsePayload = {
  choices?: Array<{
    message?: {
      content?: string | null
    }
  }>
  error?: {
    message?: string
  }
}

function cleanProviderKey(value?: string | null): string {
  return (
    value
      ?.trim()
      .replace(/^Bearer\s+/i, '')
      .trim() || ''
  )
}

function looksLikeOpenAiKey(value: string): boolean {
  return value.startsWith('sk-')
}

function looksLikeAnthropicKey(value: string): boolean {
  return value.startsWith('sk-ant-')
}

function getProviderApiKey(options: {
  server: Server
  userApiKey?: string | null
}): string {
  const userApiKey = cleanProviderKey(options.userApiKey)
  const serverApiKey = cleanProviderKey(options.server.apiKey)
  const runtimeOpenAiKey = cleanProviderKey(process.env.OPENAI_API_KEY)

  if (userApiKey) return userApiKey
  if (serverApiKey) return serverApiKey

  if (options.server.serverType === 'OPENAI') {
    return runtimeOpenAiKey
  }

  return ''
}

function assertProviderKeyMatchesServer(options: {
  server: Server
  apiKey: string
}) {
  const { server, apiKey } = options

  if (server.authType === 'NONE') return

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      message: `No provider API key configured for ${server.label || server.title}.`,
    })
  }

  if (server.serverType === 'OPENAI' && !looksLikeOpenAiKey(apiKey)) {
    throw createError({
      statusCode: 500,
      message:
        'OpenAI provider key is invalid. Expected an OpenAI key starting with "sk-". The app authorization key is probably being used as the provider key.',
    })
  }

  if (server.serverType === 'ANTHROPIC' && !looksLikeAnthropicKey(apiKey)) {
    throw createError({
      statusCode: 500,
      message:
        'Anthropic provider key is invalid. Expected an Anthropic key starting with "sk-ant-".',
    })
  }
}

function buildDefaultOpenAiServer(): Server {
  const now = new Date()

  return {
    id: 0,
    createdAt: now,
    updatedAt: now,
    title: 'OpenAI',
    label: 'OpenAI',
    description: 'Default hosted OpenAI text generation.',
    category: 'text',
    serverType: ServerType.OPENAI,
    accessMode: ServerAccessMode.BACKEND,
    authType: ServerAuthType.BEARER,
    baseUrl: 'https://api.openai.com/v1',
    endpointPath: '/chat/completions',
    healthPath: null,
    apiLink: null,
    apiKey: process.env.OPENAI_API_KEY ?? null,
    apiKeyName: 'Authorization',
    model: process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini',
    notes: null,
    designer: 'system',
    version: null,
    sortOrder: 0,
    userId: null,
    isPublic: false,
    isOfficial: true,
    isDefault: true,
    isActive: true,
    isEditable: false,
    isMature: false,
    lastCheckedAt: null,
    lastStatus: ServerStatus.UNKNOWN,
    artPrompt: null,
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

function getRuntimeApiKey(options: {
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
    const usesOwnResource = Boolean(body.useOwnResource || body.userApiKey)

    const gate = await manaGate(event, {
      kind: 'text',
      estCostUsd: estimateTextCostUsd({
        model,
        maxTokens,
      }),
      serverId: body.serverId ?? null,
      useOwnResource: usesOwnResource,
    })

    const selectedServer = await resolveOptionalTextServer({
      userId: gate.user.id,
      serverId: body.serverId ?? null,
      serverName: body.serverName ?? null,
    })

    const server = selectedServer ?? buildDefaultOpenAiServer()

    const apiKey = getProviderApiKey({
      server,
      userApiKey: body.userApiKey,
    })

    assertProviderKeyMatchesServer({
      server,
      apiKey,
    })

    if (!apiKey && !server) {
      throw createError({
        statusCode: 500,
        message: 'No text generation API key or text server is configured.',
      })
    }

    console.info('[botcafe/chat] text server', {
      authUserId: gate.user.id,
      selectedServerId: selectedServer?.id ?? null,
      serverId: server.id,
      serverTitle: server.title,
      serverType: server.serverType,
      serverCategory: server.category,
      serverAccessMode: server.accessMode,
      serverAuthType: server.authType,
      providerKeyPrefix: apiKey.slice(0, 6),
      providerKeyLength: apiKey.length,
      bodyHasUserApiKey: Boolean(body.userApiKey),
      manaFree: gate.free,
      manaCost: gate.cost,
    })

    const response = await createTextCompletion({
      server,
      apiKey,
      model,
      messages,
      temperature: body.temperature ?? 0.7,
      max_tokens: maxTokens,
      stream: false,
    })

    const raw = (await response.json()) as TextResponsePayload

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message:
          raw.error?.message ||
          `Text generation request failed with status ${response.status}.`,
      })
    }

    const content = raw.choices?.[0]?.message?.content?.trim()

    if (!content) {
      throw createError({
        statusCode: 502,
        message: 'Text generation returned no assistant content.',
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
