// /server/utils/structuredCompletion.ts
//
// One non-streaming, JSON-schema-constrained model call.
//
// Extracted from davinciNarration.ts's callNarrator when Storybook's narration
// layer was generalized to every shape (storybook/t-031). Before this, three
// call sites hand-rolled the same OpenAI strict-mode request with their own
// timeout, their own error strings, and their own JSON-parse branch:
// davinciNarration.ts, brainstormProvider.ts and commentBackfillGeneration.ts.
// The chat routes' shared helper (textProviderService.ts) is streaming-only and
// carries no schema, so it could not serve this shape.
//
// Deliberately NOT a provider abstraction. Strict `response_format:
// json_schema` is an OpenAI-compatible feature; Anthropic and Ollama need
// different plumbing for the same guarantee. Callers that need a provider
// choice should keep using the chat routes. What this owns is the transport:
// key, timeout, HTTP errors, empty responses, and JSON parsing -- everything up
// to a parsed object. VALIDATION IS THE CALLER'S JOB, because "the model
// returned an object" and "the object obeys our bounds" are different claims
// and only the caller knows the second one.

// `useRuntimeConfig` is auto-imported by Nitro (see server/utils/authGuard.ts).
// Left un-imported deliberately: a static `#imports` import breaks the tsx
// contract-test runner, which imports this module's callers directly.
import { getRuntimeOpenAiKey } from './textProviderService'

export const DEFAULT_STRUCTURED_MODEL = 'gpt-4o-mini'
export const DEFAULT_STRUCTURED_TIMEOUT_MS = 20_000

const OPENAI_CHAT_COMPLETIONS = 'https://api.openai.com/v1/chat/completions'

export interface StructuredCompletionRequest {
  system: string
  user: string
  /** Schema name sent to the provider; identifies the document, not the call. */
  schemaName: string
  schema: Record<string, unknown>
  model?: string
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
  /** Overrides the runtime key. Mostly for tests and one-off tools. */
  apiKey?: string
  /** Names the feature in error messages a user may see. */
  label?: string
}

/**
 * Ask for one JSON document matching `schema` and return it parsed.
 *
 * Throws with a readable message on: no key, HTTP failure, timeout, empty
 * content, or unparseable JSON. An AbortError keeps its name so callers can
 * decline to retry a timeout (retrying a call that already burned the budget
 * just doubles the wait the reader is staring at).
 */
export async function completeStructured<T = unknown>(
  request: StructuredCompletionRequest,
): Promise<T> {
  const label = request.label || 'This request'
  const model = request.model || DEFAULT_STRUCTURED_MODEL
  const apiKey = (
    request.apiKey || getRuntimeOpenAiKey(useRuntimeConfig())
  ).trim()
  if (!apiKey) {
    throw new Error(`No OpenAI API key is configured for ${label}.`)
  }

  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    request.timeoutMs ?? DEFAULT_STRUCTURED_TIMEOUT_MS,
  )
  try {
    const response = await fetch(OPENAI_CHAT_COMPLETIONS, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey.startsWith('Bearer ')
          ? apiKey
          : `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: request.system },
          { role: 'user', content: request.user },
        ],
        temperature: request.temperature ?? 0.9,
        max_tokens: request.maxTokens ?? 900,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: request.schemaName,
            strict: true,
            schema: request.schema,
          },
        },
      }),
    })

    const body = (await response.json().catch(() => null)) as {
      choices?: Array<{ message?: { content?: string | null } }>
      error?: { message?: string }
    } | null
    if (!response.ok) {
      throw new Error(
        body?.error?.message || `${label} failed (${response.status}).`,
      )
    }

    const content = body?.choices?.[0]?.message?.content?.trim()
    if (!content) throw new Error(`${label} returned an empty response.`)

    try {
      return JSON.parse(content) as T
    } catch (error) {
      throw new Error(`${label} returned invalid JSON.`, { cause: error })
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`${label} timed out before the serverless deadline.`, {
        cause: error,
      })
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}
