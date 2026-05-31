// /server/utils/suggest/suggestProviders.ts
import { createError } from 'h3'
import type {
  SuggestProvider,
  SuggestProviderOptions,
  SuggestServerSnapshot,
} from './suggestTypes'

export function str(value: unknown, fallback = ''): string {
  if (value == null || value === '') return fallback
  if (typeof value === 'string') return value
  return fallback
}

export function deriveSuggestProvider(
  server?: SuggestServerSnapshot,
): SuggestProvider {
  if (!server?.baseUrl && !server?.serverType) return 'anthropic'

  const url = str(server.baseUrl).toLowerCase()
  const type = str(server.serverType).toUpperCase()

  if (url.includes('anthropic.com')) return 'anthropic'
  if (url.includes('openai.com')) return 'openai'
  if (
    url.includes('localhost') ||
    url.includes('127.0.0.1') ||
    url.includes('ollama')
  ) {
    return 'ollama'
  }

  if (type === 'OPENAI' || type === 'CUSTOM') {
    return 'openai_compatible'
  }

  return 'anthropic'
}

export function resolveSuggestModel(
  provider: SuggestProvider,
  serverModel?: string | null,
): string {
  if (serverModel?.trim()) return serverModel.trim()

  switch (provider) {
    case 'openai':
    case 'openai_compatible':
      return 'gpt-4o-mini'
    case 'ollama':
      return 'llama3.2'
    default:
      return 'claude-sonnet-4-6'
  }
}

async function callAnthropic(
  systemPrompt: string,
  userPrompt: string,
  options: SuggestProviderOptions,
): Promise<string> {
  if (!options.apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'anthropicApiKey not configured',
    })
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': options.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: options.model,
      max_tokens: 512,
      stream: false,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage: `Anthropic: ${response.statusText}`,
    })
  }

  type AnthropicResponse = { content: Array<{ type: string; text?: string }> }
  const data = (await response.json()) as AnthropicResponse

  return data.content?.[0]?.text?.trim() ?? ''
}

async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  options: SuggestProviderOptions,
): Promise<string> {
  if (!options.apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'openaiApiKey not configured',
    })
  }

  const baseUrl = (options.baseUrl || 'https://api.openai.com').replace(
    /\/$/,
    '',
  )
  const endpointPath = options.endpointPath || '/v1/chat/completions'

  const response = await fetch(`${baseUrl}${endpointPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify({
      model: options.model,
      max_tokens: 512,
      stream: false,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage: `OpenAI: ${response.statusText}`,
    })
  }

  type OpenAIResponse = { choices: Array<{ message: { content: string } }> }
  const data = (await response.json()) as OpenAIResponse

  return data.choices?.[0]?.message?.content?.trim() ?? ''
}

async function callOllama(
  systemPrompt: string,
  userPrompt: string,
  options: SuggestProviderOptions,
): Promise<string> {
  const baseUrl = (options.baseUrl || 'http://localhost:11434').replace(
    /\/$/,
    '',
  )

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: options.model,
      stream: false,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      options: { num_predict: 512 },
    }),
  })

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage: `Ollama: ${response.statusText}`,
    })
  }

  type OllamaResponse = { message: { content: string } }
  const data = (await response.json()) as OllamaResponse

  return data.message?.content?.trim() ?? ''
}

export async function callSuggestProvider(
  systemPrompt: string,
  userPrompt: string,
  options: SuggestProviderOptions,
): Promise<string> {
  if (options.provider === 'ollama') {
    return callOllama(systemPrompt, userPrompt, options)
  }

  if (
    options.provider === 'openai' ||
    options.provider === 'openai_compatible'
  ) {
    return callOpenAI(systemPrompt, userPrompt, options)
  }

  return callAnthropic(systemPrompt, userPrompt, options)
}
