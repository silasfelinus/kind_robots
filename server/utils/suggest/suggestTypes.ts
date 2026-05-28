// /server/utils/suggest/suggestTypes.ts
export type SuggestProvider = 'anthropic' | 'openai' | 'openai_compatible' | 'ollama'

export type SuggestServerSnapshot = {
  serverType?: string | null
  baseUrl?: string | null
  endpointPath?: string | null
  model?: string | null
}

export type SuggestBody = {
  builder?: string
  server?: SuggestServerSnapshot
  field?: string
  stepKey?: string
  current?: string
  context?: Record<string, unknown>
  extra?: Record<string, unknown>
}

export type SuggestFieldPromptArgs = {
  builder: string
  field: string
  stepKey: string
  current: string
  context: Record<string, unknown>
  extra: Record<string, unknown>
}

export type SuggestContextEntry = {
  source: string
  label?: string
  contextKey?: string
  aliases?: string[]
  transform?: (value: unknown, context: Record<string, unknown>) => string | null
}

export type SuggestSheet = {
  builder: string
  label: string
  systemPrompt: string
  defaultFieldPrompt?: string
  fieldPrompts?: Record<string, string | ((args: SuggestFieldPromptArgs) => string)>
  stepPrompts?: Record<string, string | ((args: SuggestFieldPromptArgs) => string)>
  contextFields?: SuggestContextEntry[]
  maxTokens?: number
  temperature?: number
  fallbackBuilder?: string
}

export type RegisteredSuggestSheet = SuggestSheet & {
  builder: string
}

export type SuggestPromptResult = {
  systemPrompt: string
  userPrompt: string
  maxTokens: number
  temperature: number
  sheet: RegisteredSuggestSheet
}

export type ProviderCallArgs = {
  systemPrompt: string
  userPrompt: string
  model: string
  maxTokens: number
  temperature: number
  provider: SuggestProvider
  server?: SuggestServerSnapshot
  runtimeConfig: Record<string, unknown>
}
