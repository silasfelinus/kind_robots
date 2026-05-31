// /server/api/botcafe/titleStorm.ts
import { createError, defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import { manaGate } from '../../utils/manaGate'
import { estimateTextCostUsd } from '../../utils/manaCost'

type TitleStormBody = {
  content?: string
  model?: string
  temperature?: number
  maxTokens?: number
  n?: number
  stream?: boolean
  serverId?: number | null
  chatId?: number | string | null
}

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null
    }
  }>
  error?: {
    message?: string
  }
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<TitleStormBody>(event)
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw createError({
        statusCode: 500,
        message: 'OPENAI_API_KEY is not configured.',
      })
    }

    const content = body.content?.trim()

    if (!content) {
      throw createError({
        statusCode: 400,
        message: 'Content is required.',
      })
    }

    const model = body.model || process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini'
    const maxTokens = body.maxTokens || 150

    const gate = await manaGate(event, {
      kind: 'text',
      estCostUsd: estimateTextCostUsd({
        model,
        maxTokens,
      }),
      serverId: body.serverId ?? null,
    })

    const pitchRequest = {
      model,
      messages: [{ role: 'user', content }],
      temperature:
        typeof body.temperature === 'number' ? body.temperature : 0.7,
      max_tokens: maxTokens,
      n: body.n || 5,
      stream: false,
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(pitchRequest),
    })

    const responseData = (await response.json()) as OpenAIChatResponse

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message:
          responseData.error?.message ||
          `OpenAI request failed: ${response.statusText}.`,
      })
    }

    const rawContent = responseData.choices?.[0]?.message?.content?.trim() || ''
    const data = rawContent.match(/\|\|(.*?)\|\|/s)?.[1]

    const { balance } = await gate.commit(
      body.chatId ? `chat:${body.chatId}` : `title-storm:${Date.now()}`,
    )

    if (data) {
      return {
        success: true,
        message: 'Examples generated successfully.',
        data,
        mana: {
          balance,
          charged: gate.cost,
          free: gate.free,
        },
      }
    }

    return {
      success: false,
      message: 'Unexpected response format. Please check the response content.',
      data: rawContent,
      mana: {
        balance,
        charged: gate.cost,
        free: gate.free,
      },
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to generate pitches.',
      data: null,
    }
  }
})
