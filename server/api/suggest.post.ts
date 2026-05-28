// /server/api/suggest.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { buildSuggestPrompt } from '@/server/utils/suggest/suggestPrompt'
import {
  callSuggestProvider,
  deriveProvider,
  resolveModel,
} from '@/server/utils/suggest/suggestProviders'
import type { SuggestBody } from '@/server/utils/suggest/suggestTypes'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<SuggestBody>(event)
    const field = body?.field?.trim() ?? ''
    const stepKey = body?.stepKey?.trim() || field
    const builder = body?.builder?.trim() || 'adventure'
    const server = body?.server

    if (!field && !stepKey) {
      return { success: false, message: 'field or stepKey is required.' }
    }

    const runtimeConfig = useRuntimeConfig() as unknown as Record<string, unknown>
    const provider = deriveProvider(server)
    const model = resolveModel(provider, server?.model)
    const prompt = buildSuggestPrompt({
      ...body,
      builder,
      field: field || stepKey,
      stepKey,
    })

    console.log('[suggest]', {
      builder,
      sheet: prompt.sheet.builder,
      provider,
      model,
      field: field || stepKey,
      stepKey,
    })

    const value = await callSuggestProvider({
      provider,
      server,
      model,
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt,
      maxTokens: prompt.maxTokens,
      temperature: prompt.temperature,
      runtimeConfig,
    })

    if (!value) {
      return {
        success: false,
        message: 'The model returned an empty response.',
      }
    }

    return {
      success: true,
      data: {
        value,
        builder,
        sheet: prompt.sheet.builder,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[suggest] error:', message)

    throw createError({
      statusCode: 500,
      statusMessage: `Suggestion failed: ${message}`,
    })
  }
})
