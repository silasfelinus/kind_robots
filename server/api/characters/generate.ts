//server/api/characters/generate.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'

export default defineEventHandler(async (event) => {
  try {
    console.log('[API] Received request to /generate endpoint')
    console.log('[API] Validating API Key...')

    // Validate API Key
    const { isValid } = await validateApiKey(event)
    if (!isValid) {
      console.warn('[API] Invalid or expired token')
      event.node.res.statusCode = 401
      return { success: false, message: 'Invalid or expired token.' }
    }
    console.log('[API] API Key validated successfully')

    // Parse request body
    console.log('[API] Parsing request body...')
    const body = await readBody(event)
    console.log('[API] Request body:', body)

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error('[API] Missing OpenAI API Key')
      throw createError({
        statusCode: 500,
        message:
          'Server API key is missing. Please provide a valid OpenAI API key.',
      })
    }

    // Destructure input data
    const { character, fieldsToUpgrade, instructions } = body
    console.log('[API] Character data received:', character)
    console.log('[API] Fields to upgrade:', fieldsToUpgrade)
    console.log('[API] Instructions:', instructions)

    if (!character || !Array.isArray(fieldsToUpgrade)) {
      console.error(
        '[API] Invalid request. "character" and "fieldsToUpgrade" are required.',
      )
      throw createError({
        statusCode: 400,
        message:
          'Invalid request. "character" and "fieldsToUpgrade" are required.',
      })
    }

    // Filter valid fields (only strings)
    console.log('[API] Filtering valid fields...')
    const validFields = fieldsToUpgrade.filter(
      (field) => typeof character[field] === 'string',
    )
    console.log('[API] Valid fields after filtering:', validFields)

    if (validFields.length === 0) {
      console.error('[API] No valid fields to upgrade')
      throw createError({
        statusCode: 400,
        message: 'No valid fields to upgrade in the request.',
      })
    }

    // Prepare content for API
    const promptIntro =
      instructions || 'Upgrade the given character fields creatively.'
    const promptCharacter = JSON.stringify(character, null, 2)
    const promptFields = validFields.join(', ')

    const content = `
      ${promptIntro}
      Character: 
      ${promptCharacter}
      
      Fields to upgrade: ${promptFields}
    `

    console.log('[API] Generated OpenAI prompt content:', content)

    // Construct request payload for OpenAI
    const requestData = {
      model: 'gpt-4',
      messages: [{ role: 'user', content }],
      temperature: 0.7,
      max_tokens: 1000,
    }

    console.log('[API] Sending request to OpenAI...')
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestData),
    })

    console.log('[API] OpenAI response received. Status:', response.status)

    if (!response.ok) {
      const errorData = await response.json()
      console.error('[API] Error from OpenAI:', errorData)
      throw createError({
        statusCode: response.status,
        message: `Error from OpenAI: ${response.statusText}. Details: ${JSON.stringify(
          errorData,
        )}`,
      })
    }

    const responseData = await response.json()
    console.log('[API] OpenAI response payload:', responseData)

    const rawContent = responseData.choices[0]?.message?.content?.trim()
    console.log('[API] Raw content from OpenAI response:', rawContent)

    if (!rawContent) {
      console.error('[API] Empty or malformed AI response content')
      throw createError({
        statusCode: 500,
        message: 'AI response is empty or malformed.',
      })
    }

    let updatedCharacter = null
    try {
      updatedCharacter = JSON.parse(rawContent)
      console.log(
        '[API] Parsed character data from AI response:',
        updatedCharacter,
      )

      // Validate essential fields
      if (typeof updatedCharacter !== 'object' || !updatedCharacter.name) {
        console.error('[API] Parsed character data is missing required fields')
        throw new Error('Parsed character data is missing required fields.')
      }
    } catch (err) {
      console.error('[API] Error parsing or validating AI response:', err)
      throw createError({
        statusCode: 500,
        message: 'Failed to parse or validate character data from AI response.',
      })
    }

    console.log('[API] Successfully generated character updates')
    return {
      success: true,
      message: 'Character updated successfully.',
      data: updatedCharacter,
    }
  } catch (error) {
    console.error('[API] Error in /generate handler:', error)
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || 'Failed to generate character updates.',
      data: null,
    }
  }
})
