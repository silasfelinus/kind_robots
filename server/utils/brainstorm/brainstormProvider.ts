import { createError } from 'h3'
import {
  callSuggestProvider,
  str,
} from '../suggest/suggestProviders'
import type {
  SuggestProvider,
  SuggestProviderOptions,
} from '../suggest/suggestTypes'
import { brainstormJsonSchema } from './brainstormPrompt'

export type BrainstormProviderOptions = SuggestProviderOptions & {
  count: number
}

function extractOpenAIResponseText(responseData: unknown): string {
  if (!responseData || typeof responseData !== 'object') return ''

  const record = responseData as {
    output_text?: string
    output?: Array<{
      content?: Array<{
        text?: string
      }>
    }>
  }

  if (record.output_text?.trim()) return record.output_text.trim()

  return (
    record.output
      ?.flatMap(
        (item) => item.content?.map((content) => content.text || '') || [],
      )
      .join('')
      .trim() || ''
  )
}

async function callOfficialOpenAI(
  systemPrompt: string,
  userPrompt: string,
  options: BrainstormProviderOptions,
): Promise<string> {
  if (!options.apiKey) {
    throw createError({
      statusCode: 500,
      message: 'OpenAI API key is not configured.',
    })
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify({
      model: options.model,
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_output_tokens: options.maxTokens ?? 1200,
      text: {
        format: {
          type: 'json_schema',
          name: 'brainstorm_candidates',
          strict: true,
          schema: brainstormJsonSchema(options.count),
        },
      },
    }),
  })

  if (!response.ok) {
    const details = (await response.text()).slice(0, 1200)
    throw createError({
      statusCode: response.status,
      message: `OpenAI Brainstorm request failed: ${details || response.statusText}`,
    })
  }

  return extractOpenAIResponseText(await response.json())
}

export async function callBrainstormProvider(
  systemPrompt: string,
  userPrompt: string,
  options: BrainstormProviderOptions,
): Promise<string> {
  if (options.provider === 'openai') {
    return callOfficialOpenAI(systemPrompt, userPrompt, options)
  }

  return callSuggestProvider(systemPrompt, userPrompt, {
    provider: options.provider,
    model: options.model,
    maxTokens: options.maxTokens,
    apiKey: options.apiKey,
    baseUrl: options.baseUrl,
    endpointPath: options.endpointPath,
  })
}

export function brainstormProviderApiKey(
  provider: SuggestProvider,
  config: {
    anthropicApiKey?: unknown
    openaiApiKey?: unknown
  },
): string | undefined {
  if (provider === 'anthropic') {
    return str(config.anthropicApiKey) || undefined
  }

  if (provider === 'openai') {
    return str(config.openaiApiKey) || undefined
  }

  // Never forward first-party provider secrets to an arbitrary compatible URL.
  return undefined
}
