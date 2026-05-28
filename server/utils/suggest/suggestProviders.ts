// /server/utils/suggest/suggestProviders.ts
import { createError } from 'h3'
import type {
  ProviderCallArgs,
  SuggestProvider,
  SuggestServerSnapshot,
} from './suggestTypes'

export function str(val: unknown, fallback = ''): string {
  if (val == null || val === '') return fallback
  if (typeof val === 'string') return val
  return fallback
}

export function deriveProvider(server?: SuggestServerSnapshot): SuggestProvider {
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
  if (type === 'OPENAI_COMPATIBLE' || type === 'TEXT') return 'openai_compatible'

  return 'anthropic'
}

export function resolveModel(
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

async function callAnthropic(args: ProviderCallArgs & { apiKey: string }) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': args.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: args.model,
      max_tokens: args.maxTokens,
      stream: false,
      system: args.systemPrompt,
      messages: [{ role: 'user', content: args.userPrompt }],
      temperature: args.temperature,
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
  args: ProviderCallArgs & {
    apiKey: string
    baseUrl?: string
    endpointPath?: string
  },
) {
  const baseUrl = args.baseUrl ?? 'https://api.openai.com'
  const endpointPath = args.endpointPath ?? '/v1/chat/completions'

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}${endpointPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify({
      model: args.model,
      max_tokens: args.maxTokens,
      stream: false,
      temperature: args.temperature,
      messages: [
        { role: 'system', content: args.systemPrompt },
        { role: 'user', content: args.userPrompt },
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
  args: ProviderCallArgs & {
    baseUrl: string
  },
) {
  const response = await fetch(`${args.baseUrl.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: args.model,
      stream: false,
      messages: [
        { role: 'system', content: args.systemPrompt },
        { role: 'user', content: args.userPrompt },
      ],
      options: {
        num_predict: args.maxTokens,
        temperature: args.temperature,
      },
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

export async function callSuggestProvider(args: ProviderCallArgs): Promise<string> {
  if (args.provider === 'ollama') {
    return callOllama({
      ...args,
      baseUrl: str(
        args.server?.baseUrl,
        str(args.runtimeConfig.ollamaBaseUrl, 'http://localhost:11434'),
      ),
    })
  }

  if (args.provider === 'openai_compatible') {
    const key = str(args.runtimeConfig.openaiApiKey)

    return callOpenAI({
      ...args,
      apiKey: key,
      baseUrl: str(args.server?.baseUrl, 'http://localhost:1234'),
      endpointPath: str(args.server?.endpointPath, '/v1/chat/completions'),
    })
  }

  if (args.provider === 'openai') {
    const key = str(args.runtimeConfig.openaiApiKey)

    if (!key) {
      throw createError({
        statusCode: 500,
        statusMessage: 'openaiApiKey not configured',
      })
    }

    return callOpenAI({
      ...args,
      apiKey: key,
    })
  }

  const key = str(args.runtimeConfig.anthropicApiKey)

  if (!key) {
    throw createError({
      statusCode: 500,
      statusMessage: 'anthropicApiKey not configured',
    })
  }

  return callAnthropic({
    ...args,
    apiKey: key,
  })
}
