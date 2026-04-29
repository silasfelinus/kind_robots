// /server/api/botcafe/brainstorm/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'

type BrainstormExample = {
  title?: string
  pitch?: string
}

type BrainstormIdea = {
  title: string
  pitch: string
}

type BrainstormResponse = {
  ideas: BrainstormIdea[]
}

const fallbackExamples: BrainstormExample[] = [
  { title: 'Haunted Fitness Tracker', pitch: 'Counts steps... to your grave.' },
  {
    title: 'Reverse Life Insurance',
    pitch: 'Pays out when you unexpectedly come back to life.',
  },
  {
    title: 'Misfortune Cookies',
    pitch: 'Crack one open to ruin your day with prophecies nobody requested.',
  },
]

function clampNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(Math.round(parsed), min), max)
}

function normalizeExamples(value: unknown): BrainstormExample[] {
  if (!Array.isArray(value)) return fallbackExamples

  const examples = value
    .map((item) => {
      if (!item || typeof item !== 'object') return null

      const example = item as BrainstormExample
      const title = example.title?.trim()
      const pitch = example.pitch?.trim()

      if (!title && !pitch) return null

      return {
        title: title || 'Untitled example',
        pitch: pitch || '',
      }
    })
    .filter(Boolean) as BrainstormExample[]

  return examples.length ? examples : fallbackExamples
}

function normalizeIdeas(value: unknown): BrainstormIdea[] {
  if (!value || typeof value !== 'object') return []

  const record = value as { ideas?: unknown }

  if (!Array.isArray(record.ideas)) return []

  return record.ideas
    .map((item) => {
      if (!item || typeof item !== 'object') return null

      const idea = item as BrainstormIdea
      const title = idea.title?.trim()
      const pitch = idea.pitch?.trim()

      if (!title && !pitch) return null

      return {
        title: title || 'Untitled Idea',
        pitch: pitch || '',
      }
    })
    .filter(Boolean) as BrainstormIdea[]
}

function modelSupportsTemperature(model: string) {
  const normalized = model.toLowerCase()

  if (normalized.startsWith('gpt-5')) return false
  if (normalized.startsWith('o1')) return false
  if (normalized.startsWith('o3')) return false
  if (normalized.startsWith('o4')) return false

  return true
}

function extractOutputText(responseData: unknown) {
  if (!responseData || typeof responseData !== 'object') return ''

  const record = responseData as {
    output_text?: string
    output?: Array<{
      content?: Array<{
        text?: string
      }>
    }>
  }

  if (record.output_text) return record.output_text

  return (
    record.output
      ?.flatMap(
        (item) => item.content?.map((content) => content.text || '') || [],
      )
      .join('') || ''
  )
}

export default defineEventHandler(async (event) => {
  try {
    const { isValid } = await validateApiKey(event)

    if (!isValid) {
      event.node.res.statusCode = 401

      return {
        success: false,
        message: 'Invalid or expired token.',
        data: [],
      }
    }

    const body = await readBody(event)
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw createError({
        statusCode: 500,
        message: 'Server API key is missing.',
      })
    }

    const model = String(
      body.model || process.env.OPENAI_TEXT_MODEL || 'gpt-5.5',
    ).trim()

    const title = String(body.title || body.content || 'Creative Ideas').trim()
    const instructions = String(
      body.instructions || body.description || '',
    ).trim()

    const n = clampNumber(body.n, 10, 1, 10)
    const temperature = Number.isFinite(Number(body.temperature))
      ? Number(body.temperature)
      : 0.8

    const maxOutputTokens = clampNumber(
      body.maxOutputTokens ?? body.max_tokens ?? body.maxTokens,
      1200,
      300,
      4000,
    )

    const examples = normalizeExamples(body.examples)

    const requestBody: Record<string, unknown> = {
      model,
      input: [
        {
          role: 'system',
          content:
            'You generate concise brainstorm ideas for Kind Robots. Return only structured data. Do not include introductions, explanations, markdown, numbering, or wrap-up text.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            task: `Generate exactly ${n} brainstorm ideas.`,
            topic: title,
            instructions:
              instructions ||
              'Create punchy, specific, useful product launch ideas.',
            examples,
            output_rules: [
              'Each idea must have a short title.',
              'Each pitch must be one sentence.',
              'No intro text.',
              'No markdown.',
              'No numbering.',
            ],
          }),
        },
      ],
      max_output_tokens: maxOutputTokens,
      text: {
        format: {
          type: 'json_schema',
          name: 'brainstorm_ideas',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              ideas: {
                type: 'array',
                minItems: n,
                maxItems: n,
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    title: {
                      type: 'string',
                      minLength: 1,
                    },
                    pitch: {
                      type: 'string',
                      minLength: 1,
                    },
                  },
                  required: ['title', 'pitch'],
                },
              },
            },
            required: ['ideas'],
          },
        },
      },
    }

    if (modelSupportsTemperature(model)) {
      requestBody.temperature = temperature
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const details = await response.text()

      throw createError({
        statusCode: response.status,
        message: `OpenAI request failed: ${details}`,
      })
    }

    const responseData = await response.json()
    const outputText = extractOutputText(responseData)

    if (!outputText) {
      throw createError({
        statusCode: 502,
        message: 'OpenAI returned an empty brainstorm response.',
      })
    }

    const parsed = JSON.parse(outputText) as BrainstormResponse
    const ideas = normalizeIdeas(parsed)

    return {
      success: true,
      message: `Generated ${ideas.length} brainstorm idea(s).`,
      data: ideas,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to generate brainstorm ideas.',
      data: [],
    }
  }
})
