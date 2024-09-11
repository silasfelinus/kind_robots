import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'

// Array of darkly funny creative prompts
const creativePrompts = [
  'Haunted Fitness Tracker: Counts steps... to your grave.',
  'Reverse Life Insurance: Pays out when you unexpectedly come back to life. Policy benefits include a complimentary zombie survival kit.',
  "Misfortune Cookies: Crack one open to ruin your day with prophecies like 'Your socks will always be slightly damp.'",
  'The Procrastinator’s Alarm Clock: Always runs a few minutes late, just like you.',
  "Invisible Ink Tattoos: For when you want a tattoo but can't commit. Visible only under the scrutiny of disappointed parents.",
  'Eau de Despair Perfume: The scent of looming deadlines mixed with broken dreams. Perfect for office wear.',
  "Self-Help Books by Villains: Learn confidence from Darth Vader: 'Choke Your Way to the Top!'",
  'Diet Water: Now with 30% less water!',
  'Gluten-Full Bread: Twice the gluten, double the regret.',
  'Anti-Social Media App: Connects you with people you’ll definitely dislike. Blocking feature only enhances their resolve.',
  "Midlife Crisis Action Figures: Comes with a convertible and questionable life choices. Optional accessories include a boat and a guitar you'll never learn to play.",
  'Doomsday Clock: It’s always almost midnight. Brighten up your desk with the constant reminder of impending global catastrophe.',
  "Solar-Powered Flashlight: Only works when you don't need it.",
  'Portable Potholes: Bring traffic chaos wherever you go. City council not included.',
  'Unsolicited Advice Generator: Perfect for family gatherings. Watch the sparks fly as it dispenses advice nobody asked for.',
]

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('API key is missing. Please provide a valid OpenAI API key.')
    }

    const { n = 5 } = body // Default n to 5 if not provided

    console.log('Received body:', body) // Log the entire body to check what's received

    // Generate a list of prompts based on the provided 'n'
    const selectedPrompts = creativePrompts
      .slice(0, n)
      .map((content, index) => ({
        role: 'assistant',
        content: `${index + 1}. ${content}`,
      }))

    const data = {
      model: body.model || 'gpt-4o-mini',
      messages: selectedPrompts,
      temperature: body.temperature || 0.7,
      max_tokens: body.maxTokens || 150,
      n,
      stream: body.stream || false,
    }

    const post = body.post || 'https://api.openai.com/v1/chat/completions'

    console.log('Data to OpenAI:', data)
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

    const responseData = await response.json()
    return responseData
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    console.error('Error processing request:', message)
    throw createError({
      statusCode: statusCode || 500,
      statusMessage: message,
    })
  }
})
