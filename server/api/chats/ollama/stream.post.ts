// /server/api/chats/ollama/stream.post.ts
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

type StreamManaResult = {
  balance: number
  charged: number
  free: boolean
}

export default defineEventHandler(async (event) => {
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
      estCostUsd: estimateOllamaTextCostUsd({
        model,
        maxTokens,
      }),
      serverId: server.id,
      useOwnResource: body.useOwnResource ?? true,
    })

    const resolvedEndpoint = getServerEndpoint(server)
    const fallbackBaseUrl = String(config.ollamaBaseUrl || '').trim()
    const baseUrl = resolvedEndpoint || fallbackBaseUrl

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

    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: buildServerHeaders(server),
      body: JSON.stringify(payload),
    })

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => '')

      throw createError({
        statusCode: upstream.status,
        message: `Ollama stream failed: ${upstream.statusText}. ${errText}`,
      })
    }

    setStreamHeaders(event, 'application/x-ndjson')

    return sendMeteredStream(event, upstream.body, async () => {
      const refId = body.chatId ? `chat:${body.chatId}` : `ollama:${Date.now()}`
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

function buildServerHeaders(server: {
  apiKey?: string | null
  apiKeyName?: string | null
  authType?: string | null
}): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const token = server.apiKey?.trim()

  if (!token || server.authType === 'NONE') {
    return headers
  }

  if (server.authType === 'BEARER') {
    headers.Authorization = token.startsWith('Bearer ')
      ? token
      : `Bearer ${token}`

    return headers
  }

  if (server.authType === 'HEADER' || server.authType === 'API_KEY') {
    headers[server.apiKeyName || 'X-API-Key'] = token
    return headers
  }

  return headers
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
      console.error('[ollama stream pump] error:', err)

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

function estimateOllamaTextCostUsd(input: {
  model: string
  maxTokens: number
}): number {
  const maxTokens = Math.max(1, input.maxTokens)

  return (maxTokens / 1_000_000) * 1
}

function getErrorStatusCode(error: unknown) {
  return typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
    ? error.statusCode
    : 500
}