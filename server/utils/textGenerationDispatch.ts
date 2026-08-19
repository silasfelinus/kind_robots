// /server/utils/textGenerationDispatch.ts
//
// Pure, provider-shape dispatch logic for the unified text-generation
// endpoint (server/api/generate/text.post.ts -- text-generation/t-004).
//
// The three legacy chat streaming routes (server/api/chats/{openai,
// anthropic,ollama}/stream.post.ts) each hand-roll their own message
// normalization, endpoint URL, upstream payload shape, and (for
// non-streaming callers) would each need their own response-parsing logic.
// This module is the single place that knows those three provider dialects,
// so the route stays a thin orchestrator and any future provider only needs
// one new branch here instead of a whole new duplicated route.
//
// Deliberately Prisma-free (no import of ./serverResolver or ./prisma, even
// as a type-only import) so it can be exercised directly by
// utils/scripts/verifyTextGenerationDispatch.ts under contract-tests.yml,
// a workflow that never sets DATABASE_URL -- same discipline as
// serverCapabilities.ts and textProviderService.ts's pure helpers.
export type GenerationProvider = 'openai' | 'anthropic' | 'ollama'

export type GenerationRole = 'system' | 'user' | 'assistant'

export type GenerationMessage = {
  role: GenerationRole
  content: string
}

/** Maps a stored `Server.serverType` to the upstream API dialect to speak.
 * CUSTOM servers are treated as OpenAI-compatible (chat/completions shape),
 * matching the existing openai/stream.post.ts route's behavior for any
 * server whose endpoint speaks that dialect regardless of its exact type.
 * A1111/COMFY are art-only server types and never reach here in practice --
 * `serverCapabilities.ts`'s `text`/`chat` capability excludes them -- but a
 * caller who resolves a server outside that path should still get a clear
 * error rather than a wrong-shaped payload. */
export function providerFromServerType(
  serverType: string | null | undefined,
  fallback: GenerationProvider = 'openai',
): GenerationProvider {
  if (serverType === 'ANTHROPIC') return 'anthropic'
  if (serverType === 'OLLAMA') return 'ollama'
  if (serverType === 'OPENAI' || serverType === 'CUSTOM') return 'openai'
  if (serverType === 'A1111' || serverType === 'COMFY') {
    throw new Error(
      `Server type "${serverType}" is not text-capable and cannot be used for generation.`,
    )
  }

  return fallback
}

export function defaultModelForProvider(provider: GenerationProvider): string {
  if (provider === 'anthropic') return 'claude-sonnet-4-6'
  if (provider === 'ollama') return 'llama3.2'

  return 'gpt-4o-mini'
}

export function defaultMaxTokensForProvider(
  provider: GenerationProvider,
): number {
  if (provider === 'anthropic') return 4096
  if (provider === 'ollama') return 1024

  return 2048
}

/** Anthropic's Messages API has no `system` role message -- `system` is a
 * separate top-level payload field (added in buildGenerationPayload) -- so
 * an explicit `messages` array is passed through unchanged for every
 * provider (the caller's responsibility to shape correctly when supplying
 * `messages` directly), but the prompt/system convenience shorthand is
 * normalized per provider dialect. */
export function normalizeGenerationMessages(
  input: {
    prompt?: string | null
    system?: string | null
    messages?: GenerationMessage[] | null
  },
  provider: GenerationProvider,
): GenerationMessage[] {
  if (input.messages?.length) {
    return input.messages
  }

  if (provider === 'anthropic') {
    return [{ role: 'user', content: input.prompt ?? '' }]
  }

  return [
    ...(input.system
      ? [{ role: 'system' as const, content: input.system }]
      : []),
    { role: 'user' as const, content: input.prompt ?? '' },
  ]
}

/** Normalizes a resolved server's raw endpoint (already computed by the
 * caller via serverResolver's `getServerEndpoint`, since that function lives
 * in a Prisma-touching module) into the provider-specific upstream URL.
 * `resolvedEndpoint` is `null` when no server was resolved -- only OpenAI and
 * Anthropic have a public cloud fallback; Ollama has none and throws. */
export function buildGenerationEndpoint(
  provider: GenerationProvider,
  resolvedEndpoint: string | null,
): string {
  if (provider === 'openai') {
    if (!resolvedEndpoint) return 'https://api.openai.com/v1/chat/completions'

    const endpoint = resolvedEndpoint.trim()

    if (endpoint.endsWith('/chat/completions')) return endpoint
    if (endpoint.endsWith('/v1')) return `${endpoint}/chat/completions`

    return endpoint
  }

  if (provider === 'anthropic') {
    if (!resolvedEndpoint) return 'https://api.anthropic.com/v1/messages'

    const endpoint = resolvedEndpoint.trim()

    if (endpoint.endsWith('/messages')) return endpoint
    if (endpoint.endsWith('/v1')) return `${endpoint}/messages`

    return endpoint
  }

  // ollama -- no cloud fallback, always requires a configured server.
  if (!resolvedEndpoint) {
    throw new Error(
      'No Ollama endpoint is configured. Ollama has no default cloud API -- ' +
        'pass serverId/serverName for a configured private Ollama server.',
    )
  }

  const endpoint = resolvedEndpoint.trim().replace(/\/+$/, '')

  if (endpoint.endsWith('/api/chat')) return endpoint

  return `${endpoint}/api/chat`
}

export type GenerationPayloadInput = {
  messages: GenerationMessage[]
  model: string
  system?: string | null
  temperature?: number | null
  maxTokens: number
  n?: number | null
  stream: boolean
}

/** Builds the provider-shaped upstream request body. Each dialect's
 * quirks are preserved from the equivalent legacy route: OpenAI's `n` is
 * only meaningful there (Anthropic/Ollama silently ignore it, matching
 * that neither upstream API supports multi-completion); Anthropic's
 * `system` is a top-level field, not a message; Ollama nests sampling
 * options under `options`. */
export function buildGenerationPayload(
  provider: GenerationProvider,
  input: GenerationPayloadInput,
): Record<string, unknown> {
  if (provider === 'openai') {
    return {
      model: input.model,
      messages: input.messages,
      temperature: input.temperature ?? 0.7,
      max_tokens: input.maxTokens,
      n: input.n,
      stream: input.stream,
    }
  }

  if (provider === 'anthropic') {
    const payload: Record<string, unknown> = {
      model: input.model,
      messages: input.messages,
      max_tokens: input.maxTokens,
      temperature: input.temperature ?? 0.7,
      stream: input.stream,
    }

    if (input.system) {
      payload.system = input.system
    }

    return payload
  }

  // ollama
  return {
    model: input.model,
    messages: input.messages,
    stream: input.stream,
    options: {
      temperature: input.temperature ?? 0.7,
      num_predict: input.maxTokens,
    },
  }
}

export type NormalizedGenerationUsage = {
  promptTokens: number | null
  completionTokens: number | null
  totalTokens: number | null
}

export type NormalizedGenerationResult = {
  text: string
  /** Additional completions beyond the first, when the caller requested
   * OpenAI's `n > 1` -- always present, empty when there's only one. */
  completions: string[]
  model: string | null
  finishReason: string | null
  usage: NormalizedGenerationUsage
}

const EMPTY_USAGE: NormalizedGenerationUsage = {
  promptTokens: null,
  completionTokens: null,
  totalTokens: null,
}

/** Parses a provider's non-streaming JSON response into one normalized
 * shape -- the "same normalized contract" the task's acceptance criteria
 * calls for regardless of which upstream answered. Throws a descriptive
 * error rather than returning a half-populated result if the response
 * doesn't match the expected dialect shape, so a malformed/unexpected
 * upstream response surfaces clearly instead of silently returning empty
 * text. */
export function parseGenerationResponse(
  provider: GenerationProvider,
  raw: unknown,
): NormalizedGenerationResult {
  if (provider === 'openai') return parseOpenAiResponse(raw)
  if (provider === 'anthropic') return parseAnthropicResponse(raw)

  return parseOllamaResponse(raw)
}

function parseOpenAiResponse(raw: unknown): NormalizedGenerationResult {
  const body = raw as {
    choices?: Array<{
      message?: { content?: string }
      finish_reason?: string
    }>
    model?: string
    usage?: {
      prompt_tokens?: number
      completion_tokens?: number
      total_tokens?: number
    }
  }

  const choices = body.choices ?? []

  if (!choices.length) {
    throw new Error('OpenAI response contained no choices.')
  }

  const [first, ...rest] = choices as [
    (typeof choices)[number],
    ...typeof choices,
  ]

  return {
    text: first.message?.content ?? '',
    completions: rest.map((choice) => choice.message?.content ?? ''),
    model: body.model ?? null,
    finishReason: first.finish_reason ?? null,
    usage: body.usage
      ? {
          promptTokens: body.usage.prompt_tokens ?? null,
          completionTokens: body.usage.completion_tokens ?? null,
          totalTokens: body.usage.total_tokens ?? null,
        }
      : EMPTY_USAGE,
  }
}

function parseAnthropicResponse(raw: unknown): NormalizedGenerationResult {
  const body = raw as {
    content?: Array<{ type?: string; text?: string }>
    model?: string
    stop_reason?: string
    usage?: { input_tokens?: number; output_tokens?: number }
  }

  const blocks = body.content ?? []

  if (!blocks.length) {
    throw new Error('Anthropic response contained no content blocks.')
  }

  const text = blocks
    .filter((block) => block.type === 'text' || block.text)
    .map((block) => block.text ?? '')
    .join('')

  const usage = body.usage

  return {
    text,
    completions: [],
    model: body.model ?? null,
    finishReason: body.stop_reason ?? null,
    usage: usage
      ? {
          promptTokens: usage.input_tokens ?? null,
          completionTokens: usage.output_tokens ?? null,
          totalTokens:
            usage.input_tokens != null && usage.output_tokens != null
              ? usage.input_tokens + usage.output_tokens
              : null,
        }
      : EMPTY_USAGE,
  }
}

function parseOllamaResponse(raw: unknown): NormalizedGenerationResult {
  const body = raw as {
    message?: { content?: string }
    model?: string
    done_reason?: string
    done?: boolean
    prompt_eval_count?: number
    eval_count?: number
  }

  if (body.message?.content == null) {
    throw new Error('Ollama response contained no message content.')
  }

  const promptTokens = body.prompt_eval_count ?? null
  const completionTokens = body.eval_count ?? null

  return {
    text: body.message.content,
    completions: [],
    model: body.model ?? null,
    finishReason: body.done_reason ?? (body.done ? 'stop' : null),
    usage: {
      promptTokens,
      completionTokens,
      totalTokens:
        promptTokens != null && completionTokens != null
          ? promptTokens + completionTokens
          : null,
    },
  }
}
