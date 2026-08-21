// /server/api/chats/openai/stream.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import { getServerEndpoint } from '../../../utils/serverResolver'
import { manaGate } from '../../../utils/manaGate'
import { requireApiUser } from '../../../utils/authGuard'
import { estimateTextCostUsd } from '../../../utils/manaCost'
import { safeFetch } from '../../../utils/safeFetch'
import {
  assertProviderApiKey,
  buildChatRefId,
  buildCloudProviderAuthHeaders,
  getErrorStatusCode,
  getRuntimeOpenAiKey,
  resolveApiKeyPrecedence,
  resolveOptionalTextServer,
  sendMeteredStream,
  setStreamHeaders,
} from '../../../utils/textProviderService'
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

export default defineEventHandler(async (event) => {
  // text-generation/t-005 -- see generate/text.post.ts's identical comment.
  const abortController = new AbortController()
  event.node.req.on('close', () => abortController.abort())

  try {
    const body = await readBody<OpenAiStreamBody>(event)
    const config = useRuntimeConfig()
    const auth = await requireApiUser(event)

    const model = body.model || 'gpt-4o-mini'
    const maxTokens = body.maxTokens ?? 2048

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
        n: body.n,
      }),
      serverId: server?.id ?? body.serverId ?? null,
      useOwnResource: Boolean(body.useOwnResource || body.userApiKey),
    })

    const messages = normalizeMessages(body)
    const endpoint = getOpenAiCompatibleEndpoint(server)
    const apiKey = resolveApiKeyPrecedence({
      userApiKey: body.userApiKey,
      serverApiKey: server?.apiKey,
      runtimeApiKey: getRuntimeOpenAiKey(config),
    })

    assertProviderApiKey({
      apiKey,
      providerLabel: 'OpenAI',
      // Only the true OpenAI cloud path (no server, or an explicit OPENAI
      // server) has a guaranteed "sk-" key shape -- a CUSTOM/OpenAI-compatible
      // server's key convention is whatever that server issues.
      expectedPrefix:
        !server || server.serverType === 'OPENAI' ? 'sk-' : undefined,
    })

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
      authUserId: auth.user.id,
      serverId: server?.id ?? null,
      serverTitle: server?.title ?? 'System OpenAI',
      serverType: server?.serverType ?? 'OPENAI',
      chargedMana: gate.cost,
      free: gate.free,
      providerKeyPrefix: apiKey.slice(0, 6),
      providerKeyLength: apiKey.length,
      bodyHasUserApiKey: Boolean(body.userApiKey),
    })

    const upstream = await safeFetch(
      endpoint,
      {
        method: 'POST',
        headers: buildCloudProviderAuthHeaders('openai', apiKey),
        body: JSON.stringify(payload),
      },
      { signal: abortController.signal },
    )

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => '')

      throw createError({
        statusCode: upstream.status,
        message: `OpenAI stream failed: ${upstream.statusText}. ${errText}`,
      })
    }

    setStreamHeaders(event, 'text/event-stream')

    return sendMeteredStream(
      event,
      upstream.body,
      'openai',
      async () => {
        const { balance } = await gate.commit(
          buildChatRefId('openai', body.chatId),
        )

        return {
          balance,
          charged: gate.cost,
          free: gate.free,
        }
      },
      { abortController },
    )
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
