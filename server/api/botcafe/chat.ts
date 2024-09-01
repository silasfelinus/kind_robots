// server/api/botcafe/chat.ts
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const apiKey = event.node.req.headers['authorization']?.split(' ')[1]

  // Debug: log the API key
  console.log('API Key from headers:', apiKey)

  const data = {
    model: body.model || 'gpt-4o-mini',
    messages: body.messages,
    temperature: body.temperature,
    max_tokens: body.maxTokens,
    n: body.n,
    stream: body.stream || false,
  }
  const post = body.post || 'https://api.openai.com/v1/chat/completions'

  console.log('Sending request to OpenAI with API Key:', apiKey)
  const response = await fetch(post, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`, // Confirm API Key is attached
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error('Failed API Call with error:', errorData)
    throw new Error(
      `Error from OpenAI: ${response.statusText}. Details: ${JSON.stringify(errorData)}`,
    )
  }

  const responseData = await response.json()
  return responseData
})
