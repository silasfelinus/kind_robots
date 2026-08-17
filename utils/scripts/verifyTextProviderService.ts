// /utils/scripts/verifyTextProviderService.ts
//
// Regression guard for text-generation/t-002: the shared mechanics extracted
// from the three chat streaming routes (server/api/chats/{openai,anthropic,
// ollama}/stream.post.ts) into server/utils/textProviderService.ts. Covers
// the pure, DB-free helpers directly -- provider-key precedence, auth-header
// construction per Server.authType, the mana refId shape, and error
// status-code extraction. `resolveOptionalTextServer` (the one function that
// touches Prisma via serverResolver) is intentionally not exercised here;
// server resolution itself is already covered by serverResolver's own
// callers/tests -- this guard is about the mechanics that moved, not
// re-testing Prisma access.
import assert from 'node:assert/strict'
import {
  assertProviderApiKey,
  buildChatRefId,
  buildCloudProviderAuthHeaders,
  buildTextServerAuthHeaders,
  getErrorStatusCode,
  getRuntimeAnthropicKey,
  getRuntimeOpenAiKey,
  resolveApiKeyPrecedence,
} from '../../server/utils/textProviderService'

let failures = 0

function check(label: string, fn: () => void): void {
  try {
    fn()
    console.log(`ok - ${label}`)
  } catch (error) {
    failures += 1
    console.error(`FAIL - ${label}`)
    console.error(error instanceof Error ? error.message : error)
  }
}

// -- resolveApiKeyPrecedence -------------------------------------------------

check('userApiKey wins over server and runtime keys', () => {
  assert.equal(
    resolveApiKeyPrecedence({
      userApiKey: 'sk-user',
      serverApiKey: 'sk-server',
      runtimeApiKey: 'sk-runtime',
    }),
    'sk-user',
  )
})

check('serverApiKey wins over runtime key when no userApiKey', () => {
  assert.equal(
    resolveApiKeyPrecedence({
      serverApiKey: 'sk-server',
      runtimeApiKey: 'sk-runtime',
    }),
    'sk-server',
  )
})

check('runtimeApiKey is the last fallback', () => {
  assert.equal(
    resolveApiKeyPrecedence({ runtimeApiKey: 'sk-runtime' }),
    'sk-runtime',
  )
})

check('all-empty precedence resolves to an empty string, not throwing', () => {
  assert.equal(resolveApiKeyPrecedence({}), '')
})

check('a "Bearer " prefix on a stored key is stripped', () => {
  assert.equal(
    resolveApiKeyPrecedence({ serverApiKey: 'Bearer sk-server' }),
    'sk-server',
  )
})

check('whitespace-only keys are treated as absent', () => {
  assert.equal(
    resolveApiKeyPrecedence({
      userApiKey: '   ',
      serverApiKey: 'sk-server',
    }),
    'sk-server',
  )
})

// -- buildTextServerAuthHeaders ----------------------------------------------

check('NONE authType omits Authorization, keeps Content-Type', () => {
  const headers = buildTextServerAuthHeaders({
    apiKey: 'secret',
    authType: 'NONE',
  }) as Record<string, string>

  assert.equal(headers['Content-Type'], 'application/json')
  assert.equal('Authorization' in headers, false)
})

check('no apiKey at all omits Authorization', () => {
  const headers = buildTextServerAuthHeaders({
    authType: 'BEARER',
  }) as Record<string, string>

  assert.equal('Authorization' in headers, false)
})

check('BEARER authType sets a "Bearer <token>" Authorization header', () => {
  const headers = buildTextServerAuthHeaders({
    apiKey: 'secret-token',
    authType: 'BEARER',
  }) as Record<string, string>

  assert.equal(headers.Authorization, 'Bearer secret-token')
})

check(
  'BEARER authType does not double-prefix an already-prefixed token',
  () => {
    const headers = buildTextServerAuthHeaders({
      apiKey: 'Bearer secret-token',
      authType: 'BEARER',
    }) as Record<string, string>

    assert.equal(headers.Authorization, 'Bearer secret-token')
  },
)

check('HEADER authType uses the custom apiKeyName', () => {
  const headers = buildTextServerAuthHeaders({
    apiKey: 'secret-token',
    apiKeyName: 'X-Custom-Key',
    authType: 'HEADER',
  }) as Record<string, string>

  assert.equal(headers['X-Custom-Key'], 'secret-token')
})

check('API_KEY authType defaults to X-API-Key when apiKeyName is unset', () => {
  const headers = buildTextServerAuthHeaders({
    apiKey: 'secret-token',
    authType: 'API_KEY',
  }) as Record<string, string>

  assert.equal(headers['X-API-Key'], 'secret-token')
})

// -- buildCloudProviderAuthHeaders ---------------------------------------------
// text-generation/t-008: the shared dialect switch behind both the legacy
// chats/openai + chats/anthropic streaming routes' fetch headers and
// generate/text.post.ts's buildUpstreamAuth for those same two providers.

check('openai dialect sets a Bearer Authorization header', () => {
  const headers = buildCloudProviderAuthHeaders('openai', 'sk-real-key')

  assert.equal(headers['Content-Type'], 'application/json')
  assert.equal(headers.Authorization, 'Bearer sk-real-key')
  assert.equal('x-api-key' in headers, false)
})

check(
  'openai dialect does not double-prefix an already-Bearer-prefixed key',
  () => {
    const headers = buildCloudProviderAuthHeaders(
      'openai',
      'Bearer sk-real-key',
    )

    assert.equal(headers.Authorization, 'Bearer sk-real-key')
  },
)

check(
  'anthropic dialect sets x-api-key and a pinned anthropic-version, no Authorization',
  () => {
    const headers = buildCloudProviderAuthHeaders('anthropic', 'sk-ant-key')

    assert.equal(headers['Content-Type'], 'application/json')
    assert.equal(headers['x-api-key'], 'sk-ant-key')
    assert.equal(headers['anthropic-version'], '2023-06-01')
    assert.equal('Authorization' in headers, false)
  },
)

// -- getRuntimeOpenAiKey / getRuntimeAnthropicKey ------------------------------

check('getRuntimeOpenAiKey prefers runtimeConfig over the env var', () => {
  const prevEnv = process.env.OPENAI_API_KEY
  process.env.OPENAI_API_KEY = 'sk-env'

  try {
    assert.equal(
      getRuntimeOpenAiKey({ openaiApiKey: 'sk-config' } as never),
      'sk-config',
    )
  } finally {
    if (prevEnv === undefined) delete process.env.OPENAI_API_KEY
    else process.env.OPENAI_API_KEY = prevEnv
  }
})

check('getRuntimeOpenAiKey falls back to OPENAI_API_KEY and trims it', () => {
  const prevEnv = process.env.OPENAI_API_KEY
  process.env.OPENAI_API_KEY = '  sk-env  '

  try {
    assert.equal(getRuntimeOpenAiKey({} as never), 'sk-env')
  } finally {
    if (prevEnv === undefined) delete process.env.OPENAI_API_KEY
    else process.env.OPENAI_API_KEY = prevEnv
  }
})

check(
  'getRuntimeAnthropicKey falls back to CLAUDE_API_KEY when ANTHROPIC_API_KEY is unset',
  () => {
    const prevAnthropic = process.env.ANTHROPIC_API_KEY
    const prevClaude = process.env.CLAUDE_API_KEY
    delete process.env.ANTHROPIC_API_KEY
    process.env.CLAUDE_API_KEY = 'sk-ant-claude-env'

    try {
      assert.equal(getRuntimeAnthropicKey({} as never), 'sk-ant-claude-env')
    } finally {
      if (prevAnthropic === undefined) delete process.env.ANTHROPIC_API_KEY
      else process.env.ANTHROPIC_API_KEY = prevAnthropic
      if (prevClaude === undefined) delete process.env.CLAUDE_API_KEY
      else process.env.CLAUDE_API_KEY = prevClaude
    }
  },
)

// -- buildChatRefId -----------------------------------------------------------

check('a chatId produces a chat-scoped refId', () => {
  assert.equal(buildChatRefId('openai', 42), 'chat:42')
})

check('no chatId produces a provider-labeled synthetic refId', () => {
  const refId = buildChatRefId('ollama', null)

  assert.match(refId, /^ollama:\d+$/)
})

// -- assertProviderApiKey ------------------------------------------------------

check(
  'missing apiKey throws a 500 with a "no ... key configured" message',
  () => {
    assert.throws(
      () =>
        assertProviderApiKey({
          apiKey: '',
          providerLabel: 'OpenAI',
        }),
      (error: unknown) =>
        error instanceof Error &&
        (error as { statusCode?: number }).statusCode === 500 &&
        /no openai api key is configured/i.test(error.message),
    )
  },
)

check('an apiKey matching the expected prefix does not throw', () => {
  assertProviderApiKey({
    apiKey: 'sk-real-key',
    providerLabel: 'OpenAI',
    expectedPrefix: 'sk-',
  })
})

check('an apiKey NOT matching the expected prefix throws a 500', () => {
  assert.throws(
    () =>
      assertProviderApiKey({
        apiKey: 'app-authorization-key',
        providerLabel: 'Anthropic',
        expectedPrefix: 'sk-ant-',
      }),
    (error: unknown) =>
      error instanceof Error &&
      (error as { statusCode?: number }).statusCode === 500,
  )
})

check('no expectedPrefix skips the shape check entirely', () => {
  assertProviderApiKey({
    apiKey: 'whatever-a-custom-server-issues',
    providerLabel: 'OpenAI-compatible',
  })
})

// -- getErrorStatusCode --------------------------------------------------------

check(
  'an error-like object with a numeric statusCode is passed through',
  () => {
    assert.equal(getErrorStatusCode({ statusCode: 402 }), 402)
  },
)

check('a plain Error without statusCode defaults to 500', () => {
  assert.equal(getErrorStatusCode(new Error('boom')), 500)
})

check('a non-object thrown value defaults to 500', () => {
  assert.equal(getErrorStatusCode('boom'), 500)
})

if (failures > 0) {
  console.error(`\n${failures} failure(s).`)
  process.exitCode = 1
} else {
  console.log('\nAll text-provider-service self-tests passed.')
}
