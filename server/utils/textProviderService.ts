// /server/utils/textProviderService.ts
//
// Shared mechanics for the three chat streaming routes
// (server/api/chats/{openai,anthropic,ollama}/stream.post.ts) -- text-generation/t-002.
//
// Each route stayed a ~250-320 line, mostly-duplicated file: the same optional
// server resolution, the same provider-key precedence, the same SSE/ndjson
// header setup, the same byte-relay-then-mana-trailer pump, the same error
// status-code extraction, and three independently-drifted cost estimators
// (one of which -- the OpenAI route's -- didn't multiply by `n`, undercharging
// multi-completion requests). This module extracts the provider-agnostic
// mechanics so the three routes become thin adapters over it; each route keeps
// only what's genuinely provider-specific (message normalization shape,
// upstream payload shape, and the provider's own auth-header convention).
//
// Behavior is intentionally unchanged for every existing caller: same request
// URLs, same request/response shapes, same content-types, same two-phase
// error semantics (pre-stream createError vs. mid-stream `event: error`
// frame). The one deliberate change is cost estimation -- every route now
// calls the single shared `estimateTextCostUsd` (./manaCost) instead of a
// local per-route estimator, per the text-generation BRIEF.md's success
// criteria ("exactly one cost-estimation code path is used for text
// generation, not four").
import { Buffer } from 'node:buffer'
import { createError, setHeader, type H3Event } from 'h3'
import type { Server } from '~/prisma/generated/prisma/client'
import {
  DEFAULT_IDLE_TIMEOUT_MS,
  DEFAULT_MAX_RESPONSE_BYTES,
} from './networkSafety'

export type TextStreamManaResult = {
  balance: number
  charged: number
  free: boolean
}

/**
 * The three chat routes accept an optional `serverId`/`serverName` -- OpenAI
 * and Anthropic fall back to the public cloud API when neither is given;
 * Ollama has no cloud fallback and always resolves a stored `Server` (see
 * `resolveServer` directly in ollama/stream.post.ts for that required case).
 *
 * `serverResolver.ts` (and the Prisma client it pulls in) is imported
 * dynamically here, not at module scope: this file's pure mechanics
 * (`resolveApiKeyPrecedence`, `buildTextServerAuthHeaders`, etc.) are
 * exercised directly by `utils/scripts/verifyTextProviderService.ts`, which
 * runs under `contract-tests.yml` -- a workflow explicitly documented as
 * DB-free. A static Prisma-touching import here would break that invariant
 * for every pure helper in the file, not just this one function.
 */
export async function resolveOptionalTextServer(input: {
  userId: number
  serverId?: number | null
  serverName?: string | null
}): Promise<Server | null> {
  if (!input.serverId && !input.serverName) {
    return null
  }

  const { resolveServer } = await import('./serverResolver')

  return await resolveServer({
    userId: input.userId,
    serverId: input.serverId ?? null,
    serverName: input.serverName ?? null,
    capability: 'text',
  })
}

function cleanProviderKey(value?: string | null): string {
  return (
    value
      ?.trim()
      .replace(/^Bearer\s+/i, '')
      .trim() || ''
  )
}

/**
 * Shared provider-key precedence across OpenAI and Anthropic: an explicit
 * per-request key, then the resolved server's stored key, then the
 * system/runtime env key. (Ollama servers use `buildServerAuthHeaders`
 * instead -- their auth shape is generic per `Server.authType`, not a single
 * provider key.)
 */
export function resolveApiKeyPrecedence(options: {
  userApiKey?: string | null
  serverApiKey?: string | null
  runtimeApiKey?: string | null
}): string {
  return (
    cleanProviderKey(options.userApiKey) ||
    cleanProviderKey(options.serverApiKey) ||
    cleanProviderKey(options.runtimeApiKey)
  )
}

/** Auth-header construction for a stored `Server` profile, generalized from
 * the Ollama route's `authType`-driven builder (`NONE`/`BEARER`/`HEADER`/
 * `API_KEY`). Any text-capable server type can reuse this -- it does not
 * assume Ollama specifically.
 *
 * Deliberately named/kept distinct from `serverApi.ts`'s own
 * `buildServerAuthHeaders` (used by the health-check routes and
 * `textServer.ts`) rather than merged with it: that one omits
 * `Content-Type` (its GET-only health callers don't send a body) and adds
 * `Accept`, a different header contract than the chat routes' original,
 * preserved-as-is behavior. Unifying the two is a reasonable follow-up but
 * is out of scope here -- it would change response headers those other
 * callers currently send. */
export function buildTextServerAuthHeaders(server: {
  apiKey?: string | null
  apiKeyName?: string | null
  authType?: string | null
}): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const token = server.apiKey?.trim()

  if (!token || server.authType === 'NONE') {
    return headers
  }

  if (server.authType === 'BEARER') {
    headers.Authorization = token.startsWith('Bearer ')
      ? token
      : `Bearer ${token}`

    return headers
  }

  if (server.authType === 'HEADER' || server.authType === 'API_KEY') {
    headers[server.apiKeyName || 'X-API-Key'] = token
    return headers
  }

  return headers
}

/** Resolves the system/runtime-config OpenAI key -- the lowest-precedence
 * input to `resolveApiKeyPrecedence` for the OpenAI cloud path. Was
 * previously three byte-identical copies (chats/openai/stream.post.ts,
 * chats/anthropic/stream.post.ts's Anthropic counterpart, and
 * generate/text.post.ts) before text-generation/t-008 consolidated them. */
export function getRuntimeOpenAiKey(
  config: ReturnType<typeof useRuntimeConfig>,
): string {
  return String(config.openaiApiKey || process.env.OPENAI_API_KEY || '').trim()
}

/** Anthropic counterpart to `getRuntimeOpenAiKey` -- see that function's doc
 * comment. */
export function getRuntimeAnthropicKey(
  config: ReturnType<typeof useRuntimeConfig>,
): string {
  return String(
    config.anthropicApiKey ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.CLAUDE_API_KEY ||
      '',
  ).trim()
}

export type CloudTextProvider = 'openai' | 'anthropic'

/**
 * Auth-header construction for the two direct cloud provider dialects:
 * OpenAI-style `Authorization: Bearer <key>`, and Anthropic's `x-api-key` +
 * pinned `anthropic-version`. Shared by the legacy `chats/openai` and
 * `chats/anthropic` streaming routes and the unified `generate/text`
 * endpoint's OpenAI/Anthropic branches -- previously three independently-
 * maintained copies of the same two-branch dialect switch
 * (text-generation/t-008, kaizen from t-001/t-003/t-004). Ollama servers use
 * `buildTextServerAuthHeaders` instead -- their auth shape is generic per
 * `Server.authType`, not a single provider key convention.
 */
export function buildCloudProviderAuthHeaders(
  provider: CloudTextProvider,
  apiKey: string,
): Record<string, string> {
  if (provider === 'anthropic') {
    return {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    }
  }

  return {
    'Content-Type': 'application/json',
    Authorization: apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`,
  }
}

export function setStreamHeaders(event: H3Event, contentType: string): void {
  setHeader(event, 'Content-Type', contentType)
  setHeader(event, 'Cache-Control', 'no-cache, no-transform')
  setHeader(event, 'Connection', 'keep-alive')
  setHeader(event, 'X-Accel-Buffering', 'no')
}

export type SendMeteredStreamOptions = {
  /** Total bytes relayed before the pump aborts the upstream stream and
   * surfaces an `event: error` frame -- caps how much an upstream server
   * (private/self-hosted, so not necessarily well-behaved) can make this
   * process buffer/relay for one request. */
  maxBytes?: number
  /** Aborts the pump if no chunk arrives from upstream within this window --
   * an upstream that accepts the connection but never sends (or stalls
   * mid-stream) would otherwise hold the response open indefinitely. */
  idleTimeoutMs?: number
  /** Aborted when the pump gives up for any reason (idle timeout, size cap,
   * client disconnect) so the upstream connection this controller's signal
   * was given to (see `safeFetch`'s `signal` option) actually tears down
   * instead of continuing to run/bill on the provider side unread. */
  abortController?: AbortController
}

async function readChunkWithTimeout(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  idleTimeoutMs: number,
): Promise<ReadableStreamReadResult<Uint8Array>> {
  let timer: ReturnType<typeof setTimeout>

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new Error(`Upstream response idle for over ${idleTimeoutMs}ms.`),
        ),
      idleTimeoutMs,
    )
  })

  try {
    return await Promise.race([reader.read(), timeout])
  } finally {
    clearTimeout(timer!)
  }
}

/**
 * Relays the upstream byte stream to the client as-is, then appends the
 * synthetic `event: mana` trailer frame (or `event: error` if the pump or
 * `onComplete` -- the mana-gate commit -- throws). Identical across all three
 * routes today except for the console.error log label, which callers pass in
 * as `logLabel` so the failure is still attributable to its route.
 *
 * Enforces a response-size cap and a per-chunk idle timeout (text-generation
 * /t-005), and tears down the upstream request if the client disconnects
 * mid-stream (`event.node.req`'s `close` event) rather than continuing to
 * relay/bill for a response nobody is reading.
 */
export function sendMeteredStream(
  event: H3Event,
  body: ReadableStream<Uint8Array>,
  logLabel: string,
  onComplete: () => Promise<TextStreamManaResult>,
  options: SendMeteredStreamOptions = {},
): Promise<never> {
  const reader = body.getReader()
  const res = event.node.res
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_RESPONSE_BYTES
  const idleTimeoutMs = options.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS
  let bytesReceived = 0

  const onClientDisconnect = () => {
    options.abortController?.abort()
    reader.cancel().catch(() => {})
  }

  event.node.req.on('close', onClientDisconnect)

  const pump = async () => {
    try {
      while (true) {
        const { done, value } = await readChunkWithTimeout(
          reader,
          idleTimeoutMs,
        )

        if (done) break

        bytesReceived += value.byteLength

        if (bytesReceived > maxBytes) {
          throw new Error(
            `Upstream ${logLabel} response exceeded ${maxBytes} bytes; aborted.`,
          )
        }

        res.write(value)
      }

      const mana = await onComplete()

      res.write(
        `event: mana\ndata: ${JSON.stringify({
          mana,
        })}\n\n`,
      )
    } catch (err) {
      console.error(`[${logLabel} stream pump] error:`, err)
      options.abortController?.abort()
      reader.cancel().catch(() => {})

      res.write(
        `event: error\ndata: ${JSON.stringify({
          message:
            err instanceof Error ? err.message : 'Streaming response failed.',
        })}\n\n`,
      )
    } finally {
      event.node.req.off('close', onClientDisconnect)
      res.end()
    }
  }

  pump()

  return new Promise(() => {})
}

/**
 * Reads a one-shot (non-streaming) upstream JSON response with the same
 * response-size cap `sendMeteredStream` enforces for streaming responses --
 * `response.json()` alone has no size limit and would happily buffer an
 * unbounded body before parsing.
 */
export async function readJsonWithSizeCap(
  response: Response,
  maxBytes: number = DEFAULT_MAX_RESPONSE_BYTES,
): Promise<unknown> {
  if (!response.body) {
    return response.json()
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  while (true) {
    const { done, value } = await reader.read()

    if (done) break

    total += value.byteLength

    if (total > maxBytes) {
      await reader.cancel().catch(() => {})

      throw createError({
        statusCode: 502,
        message: `Upstream response exceeded ${maxBytes} bytes.`,
      })
    }

    chunks.push(value)
  }

  const combined = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)))

  return JSON.parse(combined.toString('utf-8'))
}

export function getErrorStatusCode(error: unknown): number {
  return typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
    ? error.statusCode
    : 500
}

/** `refId` shape used for the mana-transaction ledger: chat-scoped when a
 * `chatId` was supplied, otherwise a per-request synthetic id so one-shot
 * (non-chat) callers still get a distinct, traceable refId. */
export function buildChatRefId(
  providerLabel: string,
  chatId: number | string | null | undefined,
): string {
  return chatId ? `chat:${chatId}` : `${providerLabel}:${Date.now()}`
}

/** Asserts a resolved provider API key is present and looks like the right
 * provider's key shape, throwing the same 500 + explanatory-hint shape every
 * route already used when the app's own authorization key gets passed where
 * a provider key belongs. */
export function assertProviderApiKey(input: {
  apiKey: string
  providerLabel: string
  expectedPrefix?: string
}): void {
  const { apiKey, providerLabel, expectedPrefix } = input

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      message: `No ${providerLabel} API key is configured.`,
    })
  }

  if (expectedPrefix && !apiKey.startsWith(expectedPrefix)) {
    throw createError({
      statusCode: 500,
      message:
        `${providerLabel} provider key is invalid. Expected a ${providerLabel} key ` +
        `starting with "${expectedPrefix}". The app authorization key is probably ` +
        'being used as the provider key.',
    })
  }
}
