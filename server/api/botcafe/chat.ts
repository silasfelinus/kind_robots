// server/api/botcafe/chat.ts
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    console.log('Request Body:', body) // Log request body for validation

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error('Missing OpenAI API Key')
      return {
        success: false,
        statusCode: 500,
        message: 'API key not found',
      }
    }

    // Prepare data for the OpenAI API request
    const data = {
      model: body.model || 'gpt-4o-mini',
      messages: body.messages,
      temperature: body.temperature,
      max_tokens: body.maxTokens,
      n: body.n,
      stream: body.stream || false,
    }
    console.log('Payload Data:', JSON.stringify(data, null, 2)) // Log payload data before API call

    const post = body.post || 'https://api.openai.com/v1/chat/completions'
    console.log('API Endpoint:', post) // Confirm the endpoint

    // Send the API request to OpenAI
    const response = await fetch(post, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      // Log detailed error info from API if request fails
      const errorData = await response.json()
      console.error('API Response Error:', {
        statusCode: response.status,
        statusText: response.statusText,
        details: errorData,
      })
      return {
        success: false,
        statusCode: response.status,
        message: response.statusText,
        details: errorData,
      }
    }

    // Check if the response is a stream
    if (data.stream && response.body) {
      console.log('Streaming response detected') // Log streaming initiation
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let responseData = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Decode chunk and handle server-sent events
        const chunk = decoder.decode(value, { stream: true })
        console.log('Received Raw Chunk:', chunk) // Log raw chunk for debugging

        // Split by double newlines to capture individual JSON objects
        const events = chunk.split('\n\n').filter(Boolean)
        for (const event of events) {
          if (event.startsWith('data: ')) {
            const jsonData = event.replace('data: ', '').trim()
            if (jsonData === '[DONE]') {
              console.log('Stream End Signal Received')
              return { success: true, data: responseData }
            }
            try {
              const parsedData = JSON.parse(jsonData)
              const content = parsedData.choices[0]?.delta?.content || ''
              console.log('Parsed Content Chunk:', content)
              responseData += content // Append content to final response data
            } catch (parseError) {
              console.warn('Failed to parse JSON data chunk:', jsonData)
            }
          }
        }
      }

      console.log('--- Stream Ended ---')
      return { success: true, data: responseData }
    } else {
      // Handle non-streaming response (standard JSON)
      const responseData = await response.json()
      console.log('Successful API Response:', responseData) // Log successful response data
      return { success: true, data: responseData }
    }
  } catch (error) {
    console.error('Unhandled Error:', error)
    return {
      success: false,
      statusCode: 500,
      message: 'Internal Server Error',
      details: error instanceof Error ? error.message : String(error),
    }
  }
})
