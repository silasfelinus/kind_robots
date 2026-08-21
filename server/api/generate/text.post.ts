// /server/api/generate/text.post.ts
//
// text-generation/t-004 -- the canonical, provider-agnostic text generation
// surface. Supersedes hand-rolling calls against chats/{openai,anthropic,
// ollama}/stream.post.ts for non-chat product features: one endpoint, one
// request shape, works against the system OpenAI/Anthropic cloud APIs or
// any configured trusted private server (OpenAI-compatible, Anthropic, or
// Ollama), in either one-shot (JSON) or streaming (SSE/ndjson) mode, with
// the same mana accounting either way.
//
// The three legacy chat routes are left exactly as they are -- existing
// callers keep working unchanged ("keep compatibility shims ... rather than
// breaking them wholesale", per the task note). This route is additive.
import { createError, defineEventHandler, readBody } from 'h3'
import { manaGate } from '../../utils/manaGate'
import { requireApiUser } from '../../utils/authGuard'
import { estimateTextCostUsd } from '../../utils/manaCost'
import { safeFetch } from '../../utils/safeFetch'
import {
  assertProviderApiKey,
  buildChatRefId,
  buildCloudProviderAuthHeaders,
  buildTextServerAuthHeaders,
  getErrorStatusCode,
  getRuntimeAnthropicKey,
  getRuntimeOpenAiKey,
  readJsonWithSizeCap,
  resolveApiKeyPrecedence,
  sendMeteredStream,
  setStreamHeaders,
} from '../../utils/textProviderService'
import {
  buildGenerationEndpoint,
  buildGenerationPayload,
  defaultMaxTokensForProvider,
  defaultModelForProvider,
  normalizeGenerationMessages,
  parseGenerationResponse,
  providerFromServerType,
  type GenerationMessage,
  type GenerationProvider,
} from '../../utils/textGenerationDispatch'
import type { Server } from '~/prisma/generated/prisma/client'

type GenerateTextBody = {
  prompt?: string
  system?: string
  messages?: GenerationMessage[]
  /** Explicit provider override, used only when no serverId/serverName is
   * given -- a resolved server's own serverType always wins, since sending
   * the wrong dialect's payload to a stored endpoint would just fail. */
  provider?: GenerationProvider
  model?: string
  temperature?: number
  maxTokens?: number
  n?: number
  /** One-shot (JSON response) by default -- the opposite default from the
   * legacy chat routes, which are always-streaming. Pass `true` for an SSE
   * (OpenAI/Anthropic) or ndjson (Ollama) relay identical in shape to those
   * routes' output, including the trailing `event: mana` frame. */
  stream?: boolean
  serverId?: number | null
  serverName?: string | null
  chatId?: number | string | null
  userApiKey?: string | null
  useOwnResource?: boolean
}

export default defineEventHandler(async (event) => {
  // text-generation/t-005 -- tied to `safeFetch`'s `signal` option so a
  // client that disconnects (navigates away, clicks "stop") tears down the
  // in-flight upstream request instead of running/billing to completion
  // unread. `sendMeteredStream` also registers its own `close` listener on
  // this same controller for the streaming branch below; both calling
  // `.abort()` is harmless (idempotent).
  const abortController = new AbortController()
  event.node.req.on('close', () => abortController.abort())

  try {
    const body = await readBody<GenerateTextBody>(event)
    const config = useRuntimeConfig()
    const auth = await requireApiUser(event)
    const stream = Boolean(body.stream)

    const server = await resolveGenerationServer({
      userId: auth.user.id,
      serverId: body.serverId ?? null,
      serverName: body.serverName ?? null,
    })

    const provider = server
      ? providerFromServerType(server.serverType)
      : (body.provider ?? 'openai')

    const model = body.model || defaultModelForProvider(provider)
    const maxTokens = body.maxTokens ?? defaultMaxTokensForProvider(provider)

    const gate = await manaGate(event, {
      kind: 'text',
      estCostUsd: estimateTextCostUsd({
        model,
        maxTokens,
        n: provider === 'openai' ? body.n : null,
      }),
      serverId: server?.id ?? body.serverId ?? null,
      useOwnResource: Boolean(body.useOwnResource || body.userApiKey),
    })

    if (provider === 'ollama' && !server) {
      throw createError({
        statusCode: 400,
        message:
          'Ollama has no default cloud API. Pass serverId/serverName for a ' +
          'configured private Ollama server, or set a preferredTextServerId.',
      })
    }

    const messages = normalizeGenerationMessages(body, provider)

    const resolvedEndpoint = server ? await getServerEndpointFor(server) : null
    const endpoint = buildGenerationEndpoint(provider, resolvedEndpoint)

    const { headers, apiKeyPrefix, apiKeyLength } = await buildUpstreamAuth({
      provider,
      server,
      userApiKey: body.userApiKey,
      config,
    })

    const payload = buildGenerationPayload(provider, {
      messages,
      model,
      system: body.system,
      temperature: body.temperature,
      maxTokens,
      n: body.n,
      stream,
    })

    console.log('[generate/text] →', {
      provider,
      endpoint,
      model,
      messages: messages.length,
      stream,
      authUserId: auth.user.id,
      serverId: server?.id ?? null,
      serverTitle: server?.title ?? `System ${provider}`,
      chargedMana: gate.cost,
      free: gate.free,
      providerKeyPrefix: apiKeyPrefix,
      providerKeyLength: apiKeyLength,
    })

    const upstream = await safeFetch(
      endpoint,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      },
      { signal: abortController.signal },
    )

    if (!upstream.ok || (stream && !upstream.body)) {
      const errText = await upstream.text().catch(() => '')

      throw createError({
        statusCode: upstream.status,
        message: `${provider} generation failed: ${upstream.statusText}. ${errText}`,
      })
    }

    const refId = buildChatRefId(provider, body.chatId)

    if (stream) {
      setStreamHeaders(
        event,
        provider === 'ollama' ? 'application/x-ndjson' : 'text/event-stream',
      )

      return sendMeteredStream(
        event,
        upstream.body!,
        provider,
        async () => {
          const { balance } = await gate.commit(refId)

          return { balance, charged: gate.cost, free: gate.free }
        },
        { abortController },
      )
    }

    const raw = await readJsonWithSizeCap(upstream)
    const normalized = parseGenerationResponse(provider, raw)
    const { balance } = await gate.commit(refId)

    return {
      provider,
      serverId: server?.id ?? null,
      text: normalized.text,
      completions: normalized.completions,
      model: normalized.model ?? model,
      finishReason: normalized.finishReason,
      usage: normalized.usage,
      mana: {
        balance,
        charged: gate.cost,
        free: gate.free,
      },
    }
  } catch (error) {
    const statusCode = getErrorStatusCode(error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    console.error('[generate/text] error:', message)

    throw createError({
      statusCode,
      message: `Text generation error: ${message}`,
    })
  }
})

/** Optional server resolution: an explicit serverId/serverName that doesn't
 * resolve is a real error (surfaced as-is). With neither given, this still
 * checks the user's `preferredTextServerId` and any `isDefault` server
 * before falling back to `null` (system cloud API) -- unlike the legacy
 * OpenAI/Anthropic routes' `resolveOptionalTextServer`, which only ever
 * looks at an explicit serverId/serverName and otherwise always goes
 * straight to the cloud default, ignoring the user's stored preference
 * entirely. That's intentional legacy behavior preserved as-is for those
 * routes; this new endpoint is free to do the more useful thing. */
async function resolveGenerationServer(input: {
  userId: number
  serverId?: number | null
  serverName?: string | null
}): Promise<Server | null> {
  const hasExplicitTarget = Boolean(input.serverId || input.serverName)
  const { resolveServer } = await import('../../utils/serverResolver')

  try {
    return await resolveServer({
      userId: input.userId,
      serverId: input.serverId ?? null,
      serverName: input.serverName ?? null,
      capability: 'text',
    })
  } catch (error) {
    if (hasExplicitTarget) throw error

    return null
  }
}

/** `getServerEndpoint` lives in serverResolver.ts (Prisma-touching module),
 * so it's dynamically imported here too -- same reasoning as
 * `resolveGenerationServer` above. Node's ESM module cache makes this a
 * cheap cache-hit on the second `import()` call in the same request, not a
 * re-evaluation of the module. */
async function getServerEndpointFor(server: Server): Promise<string> {
  const { getServerEndpoint } = await import('../../utils/serverResolver')

  return getServerEndpoint(server)
}

type UpstreamAuth = {
  headers: HeadersInit
  apiKeyPrefix: string
  apiKeyLength: number
}

/** Ollama uses the generic `Server.authType`-driven header builder (its
 * auth shape, like any stored server, isn't a single provider key
 * convention). OpenAI/Anthropic use the shared provider-key precedence
 * (per-request key > stored server key > runtime/env key), same as the
 * legacy chat routes, with the same provider-key shape assertion so a
 * misconfigured app key surfaces a clear error instead of a confusing
 * upstream 401. */
async function buildUpstreamAuth(input: {
  provider: GenerationProvider
  server: Server | null
  userApiKey?: string | null
  config: ReturnType<typeof useRuntimeConfig>
}): Promise<UpstreamAuth> {
  const { provider, server, userApiKey, config } = input

  if (provider === 'ollama') {
    // Guaranteed non-null by the caller's earlier 400 guard.
    const headers = buildTextServerAuthHeaders(server as Server)

    return { headers, apiKeyPrefix: '', apiKeyLength: 0 }
  }

  const apiKey = resolveApiKeyPrecedence({
    userApiKey,
    serverApiKey: server?.apiKey,
    runtimeApiKey:
      provider === 'anthropic'
        ? getRuntimeAnthropicKey(config)
        : getRuntimeOpenAiKey(config),
  })

  assertProviderApiKey({
    apiKey,
    providerLabel: provider === 'anthropic' ? 'Anthropic' : 'OpenAI',
    expectedPrefix:
      provider === 'anthropic'
        ? 'sk-ant-'
        : !server || server.serverType === 'OPENAI'
          ? 'sk-'
          : undefined,
  })

  const headers = buildCloudProviderAuthHeaders(provider, apiKey)

  return {
    headers,
    apiKeyPrefix: apiKey.slice(0, provider === 'anthropic' ? 8 : 6),
    apiKeyLength: apiKey.length,
  }
}
