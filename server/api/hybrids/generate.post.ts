// /server/api/hybrids/generate.post.ts
import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const { OPENAI_API_KEY } = useRuntimeConfig()
  const body = await readBody(event)

  const prompt = body.prompt
  if (!prompt) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing prompt input.',
    })
  }

  const payload = {
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.8,
    max_tokens: 512,
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    throw createError({
      statusCode: response.status,
      statusMessage: `OpenAI Error: ${error?.error?.message || response.statusText}`,
    })
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content || ''
  return { success: true, text }
})
