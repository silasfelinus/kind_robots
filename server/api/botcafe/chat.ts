export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { OPENAI_API_KEY } = useRuntimeConfig()
  const OPENAI_API_URL = body.post || 'https://api.openai.com/v1/chat/completions'

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      body: JSON.stringify({
        model: body.model,
        messages: body.messages,
        temperature: body.temperature,
        max_tokens: body.max_tokens,
        stream: body.stream,
        n: body.n,
        mask: body.mask
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      }
    })

    const responseData = await response.json()
    return responseData.choices
  } catch (error) {
    throw new Error('An error occurred while fetching data from OpenAI API')
  }
})
