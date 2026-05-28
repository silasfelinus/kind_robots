// /server/utils/suggest/suggestTypes.ts
export type SuggestProvider = 'anthropic' | 'openai' | 'openai_compatible' | 'ollama'

export type SuggestBuilder = string

export type SuggestServerSnapshot = {
  serverType?: string | null
  baseUrl?: string | null
  endpointPath?: string | null
  model?: string | null
}

export type SuggestExtra = {
  modelType?: string
  builderLabel?: string
  cardKey?: string
  cardTitle?: string
  stepTitle?: string
  instruction?: string
  configContext?: Record<string, unknown>
  stepContext?: Record<string, unknown>
  cardPayload?: Record<string, unknown>
  stepPayload?: Record<string, unknown>
}

export type SuggestBody = {
  builder?: SuggestBuilder
  server?: SuggestServerSnapshot
  field?: string
  stepKey?: string
  current?: string
  context?: Record<string, unknown>
  extra?: SuggestExtra
}

export type SuggestSheet = {
  builder: SuggestBuilder
  label: string
  systemPrompt: string
  fallbackSystemPrompt?: string
  contextKeys?: string[]
  fieldPrompts?: Record<string, string>
  stepPrompts?: Record<string, string>
  buildContext?: (context: Record<string, unknown>, body: SuggestBody) => string[]
  buildInstruction?: (body: SuggestBody) => string | null
}

export type SuggestSheetSummary = {
  builder: string
  label: string
  contextKeys: string[]
  fieldPromptKeys: string[]
  stepPromptKeys: string[]
}

export type SuggestProviderOptions = {
  provider: SuggestProvider
  model: string
  apiKey?: string
  baseUrl?: string
  endpointPath?: string
}
