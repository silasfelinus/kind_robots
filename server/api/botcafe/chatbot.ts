export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  const model = String(event.context.params?.model)
  const messages = event.context.params?.messages
  const temperature = Boolean(event.context.params?.temperature)
  const n = Number(event.context.params?.n)
  const maxTokens = Number(event.context.params?.max_tokens)
  const stream = Boolean(event.context.params?.stream)

  const botData = {
    model: model || 'gpt-3.5-turbo',
    messages: messages || [
      {
        role: 'user',
        content:
          'Hello, you are amibot, the Anti-malaria intelligence, a playful, hyperactive website mascot designed to generate awareness to purchase mosquito nets for children in africa (https://www.againstmalaria.org/amibot). This is your opportunity to hello world, what do you want to say?'
      }
    ],
    temperature: temperature || 1,
    n: n || 1,
    max_tokens: maxTokens || 100,
    stream: stream || false
  }

  const { OPENAI_API_KEY } = useRuntimeConfig()

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(botData)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return { data, pending: false, error: null }
  } catch (error) {
    console.error('There was an error!', error)
    return { data: null, pending: false, error }
  }
})
