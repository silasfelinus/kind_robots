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
    stream: false,
  }
  const post = body.post || 'https://api.openai.com/v1/chat/completions'

  console.log('Sending request to OpenAI API with data:', JSON.stringify(data))

  const response = await fetch(post, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
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

  const reader = response.body?.getReader()
  const decoder = new TextDecoder("utf-8")
  let responseData = ""

  console.log('Starting to read streamed response...')

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      console.log('Stream reading complete.')
      break
    }
    
    const chunk = decoder.decode(value)
    responseData += chunk
    console.log('Received chunk:', chunk)

    try {
      const json = JSON.parse(responseData)
      console.log('Successfully parsed JSON:', json)
      return json
    } catch (error) {
      console.warn('JSON parse attempt failed. Accumulating more chunks...')
    }
  }

  console.log('Final accumulated responseData:', responseData)

  try {
    const finalJson = JSON.parse(responseData)
    console.log('Final parsed JSON:', finalJson)
    return finalJson
  } catch (error) {
    console.error('Final parse error after stream completion:', error)
    throw new Error('Failed to parse final response after stream completion')
  }
})
