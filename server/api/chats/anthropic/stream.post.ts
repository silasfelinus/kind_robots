// /server/api/chats/anthropic/stream.post.ts
import {
  createError,
  defineEventHandler,
  readBody,
  setHeader,
  type H3Event,
} from 'h3'
import { manaGate } from '../../../utils/manaGate'

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
  chatId?: number | string | null
}

type StreamManaResult = {
  balance: number
  charged: number
  free: boolean
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<AnthropicStreamBody>(event)
    const { anthropicApiKey } = useRuntimeConfig()

    if (!anthropicApiKey) {
      throw createError({
        statusCode: 500,
        message: 'anthropicApiKey not configured',
      })
    }

    const model = body.model || 'claude-sonnet-4-6'
    const maxTokens = body.maxTokens ?? 4096

    const gate = await manaGate(event, {
      kind: 'text',
      estCostUsd: estimateTextCostUsd({
        provider: 'anthropic',
        model,
        maxTokens,
      }),
      serverId: body.serverId ?? null,
    })

    const messages = body.messages?.length
      ? body.messages
      : [{ role: 'user' as const, content: body.prompt ?? '' }]

    const payload: Record<string, unknown> = {
      model,
      messages,
      max_tokens: maxTokens,
      temperature: body.temperature,
      stream: true,
    }

    if (body.system) {
      payload.system = body.system
    }

    const endpoint = 'https://api.anthropic.com/v1/messages'

    console.log('[anthropic/stream] →', {
      model: payload.model,
      messages: messages.length,
      chargedMana: gate.cost,
      free: gate.free,
    })

    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
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

    setHeader(event, 'Content-Type', 'text/event-stream')
    setHeader(event, 'Cache-Control', 'no-cache, no-transform')
    setHeader(event, 'Connection', 'keep-alive')
    setHeader(event, 'X-Accel-Buffering', 'no')

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
    const statusCode =
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof error.statusCode === 'number'
        ? error.statusCode
        : 500

    const message = error instanceof Error ? error.message : 'Unknown error'

    console.error('[anthropic/stream] error:', message)

    throw createError({
      statusCode,
      message: `Anthropic stream error: ${message}`,
    })
  }
})

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

function estimateTextCostUsd(input: {
  provider: string
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
