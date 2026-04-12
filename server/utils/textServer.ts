// /server/api/utils/textServer.ts
import { createError } from 'h3'
import type { Server } from '~/prisma/generated/prisma/client'
import { getServerEndpoint } from './serverResolver'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface TextCompletionInput {
  server: Server
  apiKey?: string
  model: string
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

export async function createTextCompletion({
  server,
  apiKey,
  model,
  messages,
  temperature,
  max_tokens,
  stream = false,
}: TextCompletionInput): Promise<Response> {
  const endpoint = getServerEndpoint(server)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
      stream,
    }),
  })

  if (!response.ok) {
    let details = ''
    try {
      const errorData = await response.json()
      details = errorData?.error?.message || JSON.stringify(errorData)
    } catch {
      details = response.statusText
    }

    throw createError({
      statusCode: response.status,
      message: `Text server error: ${details}`,
    })
  }

  return response
}
