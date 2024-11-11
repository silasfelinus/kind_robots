import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import type { Pitch } from '@prisma/client'

interface Example {
  title: string
  pitch: string
}

const savedPitches: Pitch[] = [] // Store submitted pitches for demonstration purposes

const creativePrompts: Example[] = [
  { title: 'Haunted Fitness Tracker', pitch: 'Counts steps... to your grave.' },
  {
    title: 'Reverse Life Insurance',
    pitch:
      'Pays out when you unexpectedly come back to life. Policy benefits include a complimentary zombie survival kit.',
  },
  {
    title: 'Misfortune Cookies',
    pitch:
      "Crack one open to ruin your day with prophecies like 'Your socks will always be slightly damp.'",
  },
  {
    title: 'The Procrastinator’s Alarm Clock',
    pitch: 'Always runs a few minutes late, just like you.',
  },
  {
    title: 'Invisible Ink Tattoos',
    pitch: 'Visible only under the scrutiny of disappointed parents.',
  },
  {
    title: 'Eau de Despair Perfume',
    pitch: 'The scent of looming deadlines mixed with broken dreams.',
  },
  {
    title: 'Self-Help Books by Villains',
    pitch: "Learn confidence from Darth Vader: 'Choke Your Way to the Top!'",
  },
  { title: 'Diet Water', pitch: 'Now with 30% less water!' },
  { title: 'Gluten-Full Bread', pitch: 'Twice the gluten, double the regret.' },
  {
    title: 'Anti-Social Media App',
    pitch: 'Connects you with people you’ll definitely dislike.',
  },
  {
    title: 'Midlife Crisis Action Figures',
    pitch: 'Comes with a convertible and questionable life choices.',
  },
  {
    title: 'Doomsday Clock',
    pitch:
      'It’s always almost midnight. Brighten up your desk with the constant reminder of impending doom.',
  },
  {
    title: 'Solar-Powered Flashlight',
    pitch: "Only works when you don't need it.",
  },
  { title: 'Portable Potholes', pitch: 'Bring traffic chaos wherever you go.' },
  {
    title: 'Unsolicited Advice Generator',
    pitch: 'Perfect for family gatherings. Dispenses advice nobody asked for.',
  },
]

export default defineEventHandler(async (event) => {
  try {
    // Validate API Key
    const { isValid } = await validateApiKey(event)
    if (!isValid) {
      event.node.res.statusCode = 401
      return { success: false, message: 'Invalid or expired token.' }
    }

    const body = await readBody(event)
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw createError({
        statusCode: 500,
        message:
          'Server API key is missing. Please provide a valid OpenAI API key.',
      })
    }

    const { n = 5, title = 'Creative Ideas', examples = [] } = body

    // Format examples into content for OpenAI message
    const formattedExamples = examples.length
      ? examples
          .map(
            (ex: Example) =>
              `Topic: ${ex.title || 'Sample Topic'}, Pitch: ${ex.pitch || 'Sample pitch description for this topic.'}`,
          )
          .join('\n')
      : creativePrompts
          .map(({ title, pitch }) => `Topic: ${title}, Pitch: ${pitch}`)
          .join('\n')

    // Create message content including title and examples
    const content = `Generate ideas based on this topic: ${title}. Here are some examples:\n${formattedExamples}`

    // Construct OpenAI request data
    const pitchRequest = {
      model: body.model || 'gpt-4o-mini',
      messages: [{ role: 'user', content }],
      temperature: body.temperature || 0.7,
      max_tokens: body.maxTokens || 150,
      n,
      stream: body.stream || false,
    }

    const post = body.post || 'https://api.openai.com/v1/chat/completions'

    // Call OpenAI API
    const response = await fetch(post, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(pitchRequest),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw createError({
        statusCode: response.status,
        message: `Error from OpenAI: ${response.statusText}. Details: ${JSON.stringify(errorData)}`,
      })
    }

    const responseData = await response.json()
    const data: Partial<Pitch>[] = responseData.choices.map(
      (choice: { message: { content: string } }) => {
        const content = choice.message.content.trim()
        const [title, pitch] = content.split(', Pitch: ')
        return { title: title.replace('Topic: ', ''), pitch: pitch || '' }
      },
    )

    // Save generated pitches for demonstration
    savedPitches.push(...(data as Pitch[]))

    return { success: true, message: 'Pitches generated successfully.', data }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || 'Failed to generate pitches.',
      pitches: null,
    }
  }
})
