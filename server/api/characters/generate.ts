//server/api/characters/generate.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'

export default defineEventHandler(async (event) => {
  try {
    // Validate API Key
    const { isValid } = await validateApiKey(event)
    if (!isValid) {
      event.node.res.statusCode = 401
      return { success: false, message: 'Invalid or expired token.' }
    }

    // Parse request body
    const body = await readBody(event)
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw createError({
        statusCode: 500,
        message:
          'Server API key is missing. Please provide a valid OpenAI API key.',
      })
    }

    // Destructure input data
    const { character, fieldsToUpgrade, instructions } = body
    if (!character || !Array.isArray(fieldsToUpgrade)) {
      throw createError({
        statusCode: 400,
        message:
          'Invalid request. "character" and "fieldsToUpgrade" are required.',
      })
    }

    // Prepare content for API
    const promptIntro =
      instructions || 'Upgrade the given character fields creatively.'
    const promptCharacter = JSON.stringify(character, null, 2)
    const promptFields = fieldsToUpgrade.join(', ')

    const content = `
      ${promptIntro}
      Character: 
      ${promptCharacter}
      
      Fields to upgrade: ${promptFields}
    `

    // Construct request payload for OpenAI
    const requestData = {
      model: 'gpt-4',
      messages: [{ role: 'user', content }],
      temperature: 0.7,
      max_tokens: 1000,
    }

    // Make API call to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw createError({
        statusCode: response.status,
        message: `Error from OpenAI: ${response.statusText}. Details: ${JSON.stringify(errorData)}`,
      })
    }

    const responseData = await response.json()
    const rawContent = responseData.choices[0].message.content.trim()

    // Parse the response data
    let updatedCharacter = null
    try {
      updatedCharacter = JSON.parse(rawContent)
    } catch {
      throw createError({
        statusCode: 500,
        message: 'Failed to parse character data from AI response.',
      })
    }

    // Return the updated character
    return {
      success: true,
      message: 'Character updated successfully.',
      data: updatedCharacter,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || 'Failed to generate character updates.',
      data: null,
    }
  }
})
