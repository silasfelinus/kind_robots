// server/api/botcafe/chat.ts
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const apiKey = process.env.OPENAI_API_KEY
  const data = {
    model: body.model || 'gpt-4o-mini',
    messages: body.messages,
    temperature: body.temperature,
    max_tokens: body.maxTokens,
    n: body.n,
    stream: body.stream || false,
  }
  const post = body.post || 'https://api.openai.com/v1/chat/completions'

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

  // Process streamed response chunks
  const reader = response.body?.getReader()
  const decoder = new TextDecoder("utf-8")
  let responseData = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    
    // Decode and accumulate chunk
    const chunk = decoder.decode(value)
    responseData += chunk

    try {
      // Try parsing the current accumulated data as JSON
      const json = JSON.parse(responseData)
      return json  // Successfully parsed JSON, return it
    } catch (error) {
      // Continue accumulating chunks until valid JSON
    }
  }

  // Final parsing attempt (for non-streaming responses)
  try {
    return JSON.parse(responseData)
  } catch (error) {
    console.error('Final parse error:', error)
    throw new Error('Failed to parse final response')
  }
})
