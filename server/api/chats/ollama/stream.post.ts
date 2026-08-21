// /server/api/chats/ollama/stream.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import { getServerEndpoint, resolveServer } from '../../../utils/serverResolver'
import { manaGate } from '../../../utils/manaGate'
import { requireApiUser } from '../../../utils/authGuard'
import { estimateTextCostUsd } from '../../../utils/manaCost'
import { safeFetch } from '../../../utils/safeFetch'
import {
  buildChatRefId,
  buildTextServerAuthHeaders,
  getErrorStatusCode,
  sendMeteredStream,
  setStreamHeaders,
} from '../../../utils/textProviderService'

type OllamaStreamBody = {
  prompt?: string
  system?: string
  messages?: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  model?: string
  temperature?: number
  maxTokens?: number
  serverId?: number | null
  serverName?: string | null
  chatId?: number | string | null
  useOwnResource?: boolean
}

export default defineEventHandler(async (event) => {
  // text-generation/t-005 -- see generate/text.post.ts's identical comment.
  const abortController = new AbortController()
  event.node.req.on('close', () => abortController.abort())

  try {
    const body = await readBody<OllamaStreamBody>(event)
    const config = useRuntimeConfig()
    const auth = await requireApiUser(event)

    const model = body.model || 'llama3.2'
    const maxTokens = body.maxTokens ?? 1024

    const server = await resolveServer({
      userId: auth.user.id,
      serverId: body.serverId ?? null,
      serverName: body.serverName ?? null,
      capability: 'text',
    })

    const gate = await manaGate(event, {
      kind: 'text',
      estCostUsd: estimateTextCostUsd({
        model,
        maxTokens,
      }),
      serverId: server.id,
      useOwnResource: body.useOwnResource ?? true,
    })

    const resolvedEndpoint = getServerEndpoint(server)
    const fallbackBaseUrl = String(config.ollamaBaseUrl || '').trim()
    const baseUrl = resolvedEndpoint || fallbackBaseUrl
    // text-generation/t-005 -- `resolvedEndpoint` comes from a DB-stored
    // `Server.baseUrl`, settable by any authenticated user (see
    // networkSafety.ts's module doc), so loopback stays blocked for it.
    // `fallbackBaseUrl` is `config.ollamaBaseUrl`, an operator-set env var
    // (nuxt.config.ts defaults it to `http://localhost:11434`) -- not
    // attacker-influenced, so loopback is allowed only on this path.
    const usingOperatorFallback = !resolvedEndpoint

    if (!baseUrl) {
      throw createError({
        statusCode: 500,
        message: 'No Ollama endpoint is configured.',
      })
    }

    const messages = normalizeMessages(body)

    const payload = {
      model,
      messages,
      stream: true,
      options: {
        temperature: body.temperature ?? 0.7,
        num_predict: maxTokens,
      },
    }

    const endpoint = normalizeOllamaChatEndpoint(baseUrl)

    console.log('[ollama/stream] →', {
      endpoint,
      model: payload.model,
      messages: messages.length,
      authUserId: auth.user.id,
      serverId: server.id,
      serverTitle: server.title,
      chargedMana: gate.cost,
      free: gate.free,
    })

    const upstream = await safeFetch(
      endpoint,
      {
        method: 'POST',
        headers: buildTextServerAuthHeaders(server),
        body: JSON.stringify(payload),
      },
      { signal: abortController.signal, allowLoopback: usingOperatorFallback },
    )

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => '')

      throw createError({
        statusCode: upstream.status,
        message: `Ollama stream failed: ${upstream.statusText}. ${errText}`,
      })
    }

    setStreamHeaders(event, 'application/x-ndjson')

    return sendMeteredStream(
      event,
      upstream.body,
      'ollama',
      async () => {
        const { balance } = await gate.commit(
          buildChatRefId('ollama', body.chatId),
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

    console.error('[ollama/stream] error:', message)

    throw createError({
      statusCode,
      message: `Ollama stream error: ${message}`,
    })
  }
})

function normalizeMessages(body: OllamaStreamBody) {
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

function normalizeOllamaChatEndpoint(url: string): string {
  const cleanUrl = url.trim().replace(/\/+$/, '')

  if (cleanUrl.endsWith('/api/chat')) {
    return cleanUrl
  }

  return `${cleanUrl}/api/chat`
}
