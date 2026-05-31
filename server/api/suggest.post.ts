// /server/api/suggest.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { manaGate } from '../utils/manaGate'
import { estimateTextCostUsd } from '../utils/manaCost'
import { buildSuggestUserPrompt } from '../utils/suggest/suggestPrompt'
import { getSuggestSheet } from '../utils/suggest/suggestRegistry'
import {
  callSuggestProvider,
  deriveSuggestProvider,
  resolveSuggestModel,
  str,
} from '../utils/suggest/suggestProviders'
import type { SuggestBody } from '../utils/suggest/suggestTypes'

type SuggestServerLike = {
  id?: number | null
  model?: string | null
  baseUrl?: string | null
  endpointPath?: string | null
}

function getSuggestServerId(server: unknown): number | null {
  if (!server || typeof server !== 'object') return null
  const id = (server as SuggestServerLike).id
  return typeof id === 'number' && Number.isInteger(id) ? id : null
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<SuggestBody>(event)

    const field = body?.field ?? ''
    const stepKey = body?.stepKey ?? body?.field ?? ''
    const builder = body?.builder ?? 'adventure'
    const server = body?.server
    const current = body?.current ?? ''
    const context = body?.context ?? {}

    if (!field && !stepKey) {
      return {
        success: false,
        message: 'field or stepKey is required.',
      }
    }

    const config = useRuntimeConfig()
    const provider = deriveSuggestProvider(server)
    const model = resolveSuggestModel(provider, server?.model)
    const sheet = getSuggestSheet(builder)

    const systemPrompt =
      sheet.systemPrompt ||
      sheet.fallbackSystemPrompt ||
      'You are a helpful creative writing assistant.'

    const userPrompt = buildSuggestUserPrompt(sheet, {
      ...body,
      builder,
      field,
      stepKey,
      current,
      context,
    })

    const gate = await manaGate(event, {
      kind: 'text',
      estCostUsd: estimateTextCostUsd({
        model,
        maxTokens: body.maxTokens ?? body.max_tokens ?? 512,
      }),
      serverId: getSuggestServerId(server),
    })

    console.log('[suggest]', {
      builder,
      sheet: sheet.builder,
      provider,
      model,
      field,
      stepKey,
    })

    const value = await callSuggestProvider(systemPrompt, userPrompt, {
      provider,
      model,
      apiKey:
        provider === 'anthropic'
          ? str(config.anthropicApiKey)
          : str(config.openaiApiKey),
      baseUrl:
        provider === 'ollama'
          ? str(server?.baseUrl, str(config.ollamaBaseUrl, 'http://localhost:11434'))
          : provider === 'openai_compatible'
            ? str(server?.baseUrl, 'http://localhost:1234')
            : undefined,
      endpointPath:
        provider === 'openai_compatible'
          ? str(server?.endpointPath, '/v1/chat/completions')
          : undefined,
    })

    if (!value) {
      return {
        success: false,
        message: 'The model returned an empty response.',
      }
    }

    const { balance } = await gate.commit(
      `suggest:${builder}:${stepKey || field}:${Date.now()}`,
    )

    return {
      success: true,
      message: 'Suggestion generated.',
      data: { value },
      mana: {
        balance,
        charged: gate.cost,
        free: gate.free,
      },
    }
  } catch (error) {
    console.error('[suggest] failed:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage:
        error instanceof Error ? error.message : 'Suggestion request failed.',
    })
  }
})
