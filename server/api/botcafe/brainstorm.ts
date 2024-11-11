import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import type { Pitch } from '@prisma/client' // Assuming Pitch type is imported from your database types

interface Example {
  title: string
  pitch: string
}

interface Choice {
  text: string
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
    const body = await readBody(event)
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw new Error(
        'API key is missing. Please provide a valid OpenAI API key.',
      )
    }

    const { n = 5, title = 'Creative Ideas', examples = [] } = body

    // Format examples for OpenAI request
    const formattedExamples = examples.length
      ? examples.map((ex: Example) => ({
          input: `Topic: ${ex.title || 'Sample Topic'}`,
          output: `Pitch: ${ex.pitch || 'Sample pitch description for this topic.'}`,
        }))
      : creativePrompts.map(({ title, pitch }) => ({
          input: `Topic: ${title}`,
          output: `Pitch: ${pitch}`,
        }))

    // Construct OpenAI request data
    const data = {
      model: body.model || 'gpt-4o-mini',
      prompt: `Generate ideas based on this topic: ${title}`,
      temperature: body.temperature || 0.7,
      max_tokens: body.maxTokens || 150,
      n,
      examples: formattedExamples,
      stream: body.stream || false,
    }

    const post = body.post || 'https://api.openai.com/v1/completions'

    // Call OpenAI API
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
      throw new Error(
        `Error from OpenAI: ${response.statusText}. Details: ${JSON.stringify(errorData)}`,
      )
    }

    const responseData = await response.json()
    const generatedPitches: Partial<Pitch>[] = responseData.choices.map(
      (choice: Choice) => ({
        title: title,
        pitch: choice.text.trim(),
      }),
    )

    // Save generated pitches for demonstration
    savedPitches.push(...(generatedPitches as Pitch[]))

    return {
      success: true,
      message: 'Pitches generated successfully.',
      pitches: generatedPitches,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    throw createError({
      statusCode: statusCode || 500,
      statusMessage: message,
    })
  }
})
