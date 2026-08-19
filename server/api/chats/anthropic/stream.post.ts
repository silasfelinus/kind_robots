// /server/api/chats/anthropic/stream.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import { getServerEndpoint } from '../../../utils/serverResolver'
import { manaGate } from '../../../utils/manaGate'
import { requireApiUser } from '../../../utils/authGuard'
import { estimateTextCostUsd } from '../../../utils/manaCost'
import {
  assertProviderApiKey,
  buildChatRefId,
  buildCloudProviderAuthHeaders,
  getErrorStatusCode,
  getRuntimeAnthropicKey,
  resolveApiKeyPrecedence,
  resolveOptionalTextServer,
  sendMeteredStream,
  setStreamHeaders,
} from '../../../utils/textProviderService'
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

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<AnthropicStreamBody>(event)
    const config = useRuntimeConfig()
    const auth = await requireApiUser(event)

    const model = body.model || 'claude-sonnet-4-6'
    const maxTokens = body.maxTokens ?? 4096

    const server = await resolveOptionalTextServer({
      userId: auth.user.id,
      serverId: body.serverId ?? null,
      serverName: body.serverName ?? null,
    })

    const gate = await manaGate(event, {
      kind: 'text',
      estCostUsd: estimateTextCostUsd({
        model,
        maxTokens,
      }),
      serverId: server?.id ?? body.serverId ?? null,
      useOwnResource: Boolean(body.useOwnResource || body.userApiKey),
    })

    const messages = normalizeMessages(body)
    const endpoint = getAnthropicEndpoint(server)
    const apiKey = resolveApiKeyPrecedence({
      userApiKey: body.userApiKey,
      serverApiKey: server?.apiKey,
      runtimeApiKey: getRuntimeAnthropicKey(config),
    })

    assertProviderApiKey({
      apiKey,
      providerLabel: 'Anthropic',
      expectedPrefix: 'sk-ant-',
    })

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
      headers: buildCloudProviderAuthHeaders('anthropic', apiKey),
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

    return sendMeteredStream(event, upstream.body, 'anthropic', async () => {
      const { balance } = await gate.commit(
        buildChatRefId('anthropic', body.chatId),
      )

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
