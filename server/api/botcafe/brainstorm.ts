import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'


const savedPitches = [] // This will store the submitted pitches for demonstration

const creativePrompts = [
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
    pitch:
      "For when you want a tattoo but can't commit. Visible only under the scrutiny of disappointed parents.",
  },
  {
    title: 'Eau de Despair Perfume',
    pitch:
      'The scent of looming deadlines mixed with broken dreams. Perfect for office wear.',
  },
  {
    title: 'Self-Help Books by Villains',
    pitch: "Learn confidence from Darth Vader: 'Choke Your Way to the Top!'",
  },
  { title: 'Diet Water', pitch: 'Now with 30% less water!' },
  { title: 'Gluten-Full Bread', pitch: 'Twice the gluten, double the regret.' },
  {
    title: 'Anti-Social Media App',
    pitch:
      'Connects you with people you’ll definitely dislike. Blocking feature only enhances their resolve.',
  },
  {
    title: 'Midlife Crisis Action Figures',
    pitch:
      "Comes with a convertible and questionable life choices. Optional accessories include a boat and a guitar you'll never learn to play.",
  },
  {
    title: 'Doomsday Clock',
    pitch:
      'It’s always almost midnight. Brighten up your desk with the constant reminder of impending global catastrophe.',
  },
  {
    title: 'Solar-Powered Flashlight',
    pitch: "Only works when you don't need it.",
  },
  {
    title: 'Portable Potholes',
    pitch: 'Bring traffic chaos wherever you go. City council not included.',
  },
  {
    title: 'Unsolicited Advice Generator',
    pitch:
      'Perfect for family gatherings. Watch the sparks fly as it dispenses advice nobody asked for.',
  },
]



export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw new Error('API key is missing. Please provide a valid OpenAI API key.')
    }

    const { n = 5, newPitches = [] } = body // Expecting an array of new pitches if provided

    // If new pitches are provided, validate and store them
    if (Array.isArray(newPitches) && newPitches.length > 0) {
      // Validate each pitch
      const validPitches = newPitches.filter(
        (pitch) => pitch.title && pitch.pitch // Ensure both title and pitch are present
      )

      if (validPitches.length > 0) {
        // Add the valid pitches to our saved pitches (you can replace this with DB logic)
        savedPitches.push(...validPitches)

        return {
          success: true,
          message: `${validPitches.length} new pitches added successfully.`,
          pitches: validPitches,
        }
      } else {
        return {
          success: false,
          message: 'No valid pitches provided. Please ensure title and pitch are present in each entry.',
        }
      }
    }

    // Generate a list of existing prompts based on 'n'
    const selectedPrompts = creativePrompts
      .slice(0, n)
      .map(({ title, pitch }) => ({
        role: 'assistant',
        content: `title: ${title}, pitch: ${pitch}`,
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
      throw new Error(`Error from OpenAI: ${response.statusText}. Details: ${JSON.stringify(errorData)}`)
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
