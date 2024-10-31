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
  if (!reader) {
    console.error('Response body reader is undefined.')
    throw new Error('Failed to obtain response body reader')
  }

  const decoder = new TextDecoder('utf-8')
  let responseData = ''

  if (data.stream) {
    console.log('--- Streamed Response Mode ---')

    // Handle streamed response
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        console.log('Stream reading complete.')
        break
      }

      const chunk = decoder.decode(value, { stream: true })
      responseData += chunk
      console.log('Received chunk:', chunk)

      // Try parsing as JSON only if we have a complete JSON string
      try {
        const json = JSON.parse(responseData)
        console.log('Successfully parsed JSON from stream:', json)
        return json
      } catch (error) {
        console.warn(
          'Incomplete JSON received; waiting for more data...',
          error,
        )
      }
    }

    // Final attempt to parse accumulated data after stream completion
    try {
      const finalJson = JSON.parse(responseData)
      console.log('Final parsed JSON after stream:', finalJson)
      return finalJson
    } catch (error) {
      console.error('Final parse error after stream completion:', error)
      throw new Error('Failed to parse final response after stream completion')
    }
  } else {
    console.log('--- Non-streamed Response Mode ---')

    // Handle non-streamed response
    try {
      const responseData = await response.json()
      console.log('Parsed JSON from non-stream response:', responseData)
      return responseData
    } catch (error) {
      console.error('Error parsing non-streamed response:', error)
      throw new Error('Failed to parse non-streamed response')
    }
  }
})
