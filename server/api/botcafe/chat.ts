export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { OPENAI_API_KEY } = useRuntimeConfig()
  const OPENAI_API_URL = body.post || 'https://api.openai.com/v1/chat/completions'

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      body: JSON.stringify({
        model: body.model || 'gpt-3.5-turbo',
        messages: body.messages || [
          {
            role: `user`,
            content: `Please respond as AMIB0t, The Anti-Malaria Intelligence, a hyperkinetic Digital Hive-mind created to fight malaria through social outreach, humor, and a positive social message. This is your hello world moment. What do you want to say?`
          }
        ],
        temperature: body.temperature || 1,
        max_tokens: body.max_tokens || 200
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      }
    })

    const responseData = await response.json()
    return responseData
  } catch (error) {
    throw new Error('An error occurred while fetching data from OpenAI API')
  }
})
