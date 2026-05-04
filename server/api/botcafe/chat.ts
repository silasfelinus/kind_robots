// /server/api/botcafe/chat.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '@/server/utils/error'

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
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw createError({
        statusCode: 500,
        message: 'OPENAI_API_KEY is not configured.',
      })
    }

    const messages = normalizeMessages(body.messages)

    if (!messages.length) {
      throw createError({
        statusCode: 400,
        message: 'At least one chat message is required.',
      })
    }

    const openAiPayload = {
      model: body.model || 'gpt-4o-mini',
      messages,
      temperature: body.temperature ?? 0.7,
      max_tokens: body.max_tokens ?? body.maxTokens ?? 2048,
      stream: false,
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
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

    return {
      success: true,
      message: 'Bot response received.',
      data: {
        content,
        raw,
      },
    }
  } catch (error) {
    return errorHandler(error)
  }
})
