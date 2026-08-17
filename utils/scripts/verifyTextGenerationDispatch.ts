// /utils/scripts/verifyTextGenerationDispatch.ts
//
// Regression guard for text-generation/t-004: the unified generation
// endpoint's provider dispatch logic (server/utils/textGenerationDispatch.ts)
// -- provider selection from a server's serverType, message normalization,
// endpoint URL construction (cloud fallback vs. resolved server endpoint),
// upstream payload shaping per provider dialect, and response normalization
// back into one common contract. Entirely DB-free: this module never
// imports serverResolver/prisma, so every branch here is exercised with
// plain synthetic input, no live server or network call.
import assert from 'node:assert/strict'
import {
  buildGenerationEndpoint,
  buildGenerationPayload,
  defaultMaxTokensForProvider,
  defaultModelForProvider,
  normalizeGenerationMessages,
  parseGenerationResponse,
  providerFromServerType,
} from '../../server/utils/textGenerationDispatch'

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

// -- providerFromServerType ---------------------------------------------------

check('OPENAI server type maps to the openai provider', () => {
  assert.equal(providerFromServerType('OPENAI'), 'openai')
})

check(
  'CUSTOM server type also maps to the openai (chat/completions) dialect',
  () => {
    assert.equal(providerFromServerType('CUSTOM'), 'openai')
  },
)

check('ANTHROPIC server type maps to the anthropic provider', () => {
  assert.equal(providerFromServerType('ANTHROPIC'), 'anthropic')
})

check('OLLAMA server type maps to the ollama provider', () => {
  assert.equal(providerFromServerType('OLLAMA'), 'ollama')
})

check('no server type (cloud default) falls back to openai', () => {
  assert.equal(providerFromServerType(null), 'openai')
})

check('an explicit fallback overrides the default openai fallback', () => {
  assert.equal(providerFromServerType(undefined, 'anthropic'), 'anthropic')
})

check(
  'A1111 (art-only) server type throws rather than silently dispatching',
  () => {
    assert.throws(() => providerFromServerType('A1111'), /not text-capable/i)
  },
)

check(
  'COMFY (art-only) server type throws rather than silently dispatching',
  () => {
    assert.throws(() => providerFromServerType('COMFY'), /not text-capable/i)
  },
)

// -- defaultModelForProvider / defaultMaxTokensForProvider -------------------

check('each provider has a distinct, non-empty default model', () => {
  const models = new Set([
    defaultModelForProvider('openai'),
    defaultModelForProvider('anthropic'),
    defaultModelForProvider('ollama'),
  ])

  assert.equal(models.size, 3)
  for (const model of models) assert.ok(model.length > 0)
})

check('anthropic defaults to a larger max-tokens budget than ollama', () => {
  assert.ok(
    defaultMaxTokensForProvider('anthropic') >
      defaultMaxTokensForProvider('ollama'),
  )
})

// -- normalizeGenerationMessages ----------------------------------------------

check(
  'an explicit messages array is passed through unchanged for openai',
  () => {
    const messages = [{ role: 'user' as const, content: 'hi' }]

    assert.equal(normalizeGenerationMessages({ messages }, 'openai'), messages)
  },
)

check(
  'prompt+system shorthand becomes [system, user] for openai/ollama',
  () => {
    const result = normalizeGenerationMessages(
      { prompt: 'hello', system: 'be terse' },
      'openai',
    )

    assert.deepEqual(result, [
      { role: 'system', content: 'be terse' },
      { role: 'user', content: 'hello' },
    ])
  },
)

check('prompt-only shorthand omits the system message when absent', () => {
  const result = normalizeGenerationMessages({ prompt: 'hello' }, 'ollama')

  assert.deepEqual(result, [{ role: 'user', content: 'hello' }])
})

check(
  'anthropic shorthand never emits a system-role message (system is a top-level field)',
  () => {
    const result = normalizeGenerationMessages(
      { prompt: 'hello', system: 'be terse' },
      'anthropic',
    )

    assert.deepEqual(result, [{ role: 'user', content: 'hello' }])
  },
)

check(
  'an empty prompt/system still produces a well-formed user message',
  () => {
    const result = normalizeGenerationMessages({}, 'openai')

    assert.deepEqual(result, [{ role: 'user', content: '' }])
  },
)

// -- buildGenerationEndpoint ---------------------------------------------------

check(
  'openai with no resolved server falls back to the public cloud endpoint',
  () => {
    assert.equal(
      buildGenerationEndpoint('openai', null),
      'https://api.openai.com/v1/chat/completions',
    )
  },
)

check(
  'openai with a server endpoint already ending in /chat/completions is untouched',
  () => {
    assert.equal(
      buildGenerationEndpoint(
        'openai',
        'https://my-proxy.example/v1/chat/completions',
      ),
      'https://my-proxy.example/v1/chat/completions',
    )
  },
)

check(
  'openai with a server endpoint ending in /v1 gets /chat/completions appended',
  () => {
    assert.equal(
      buildGenerationEndpoint('openai', 'https://my-proxy.example/v1'),
      'https://my-proxy.example/v1/chat/completions',
    )
  },
)

check(
  'anthropic with no resolved server falls back to the public cloud endpoint',
  () => {
    assert.equal(
      buildGenerationEndpoint('anthropic', null),
      'https://api.anthropic.com/v1/messages',
    )
  },
)

check(
  'anthropic with a server endpoint ending in /v1 gets /messages appended',
  () => {
    assert.equal(
      buildGenerationEndpoint(
        'anthropic',
        'https://my-claude-proxy.example/v1',
      ),
      'https://my-claude-proxy.example/v1/messages',
    )
  },
)

check(
  'ollama with no resolved server throws (no cloud fallback exists)',
  () => {
    assert.throws(
      () => buildGenerationEndpoint('ollama', null),
      /no ollama endpoint/i,
    )
  },
)

check('ollama with a bare base URL gets /api/chat appended', () => {
  assert.equal(
    buildGenerationEndpoint('ollama', 'http://homelab.local:11434'),
    'http://homelab.local:11434/api/chat',
  )
})

check(
  'ollama with a trailing slash is normalized before appending /api/chat',
  () => {
    assert.equal(
      buildGenerationEndpoint('ollama', 'http://homelab.local:11434/'),
      'http://homelab.local:11434/api/chat',
    )
  },
)

check('ollama endpoint already ending in /api/chat is untouched', () => {
  assert.equal(
    buildGenerationEndpoint('ollama', 'http://homelab.local:11434/api/chat'),
    'http://homelab.local:11434/api/chat',
  )
})

// -- buildGenerationPayload ----------------------------------------------------

const baseMessages = [{ role: 'user' as const, content: 'hi' }]

check('openai payload includes n and a flat messages array', () => {
  const payload = buildGenerationPayload('openai', {
    messages: baseMessages,
    model: 'gpt-4o-mini',
    maxTokens: 512,
    n: 3,
    stream: false,
  })

  assert.equal(payload.model, 'gpt-4o-mini')
  assert.equal(payload.max_tokens, 512)
  assert.equal(payload.n, 3)
  assert.equal(payload.stream, false)
  assert.deepEqual(payload.messages, baseMessages)
})

check(
  'anthropic payload lifts `system` to a top-level field, not a message',
  () => {
    const payload = buildGenerationPayload('anthropic', {
      messages: baseMessages,
      model: 'claude-sonnet-4-6',
      system: 'be terse',
      maxTokens: 1024,
      stream: true,
    })

    assert.equal(payload.system, 'be terse')
    assert.equal(payload.max_tokens, 1024)
    assert.deepEqual(payload.messages, baseMessages)
  },
)

check('anthropic payload omits `system` entirely when not supplied', () => {
  const payload = buildGenerationPayload('anthropic', {
    messages: baseMessages,
    model: 'claude-sonnet-4-6',
    maxTokens: 1024,
    stream: true,
  })

  assert.equal('system' in payload, false)
})

check('ollama payload nests sampling options and has no top-level n', () => {
  const payload = buildGenerationPayload('ollama', {
    messages: baseMessages,
    model: 'llama3.2',
    maxTokens: 256,
    temperature: 0.2,
    stream: true,
  }) as { options: { num_predict: number; temperature: number } }

  assert.equal(payload.options.num_predict, 256)
  assert.equal(payload.options.temperature, 0.2)
  assert.equal('n' in payload, false)
})

check('a missing temperature defaults to 0.7 for every provider', () => {
  const openai = buildGenerationPayload('openai', {
    messages: baseMessages,
    model: 'gpt-4o-mini',
    maxTokens: 100,
    stream: false,
  })
  const ollama = buildGenerationPayload('ollama', {
    messages: baseMessages,
    model: 'llama3.2',
    maxTokens: 100,
    stream: false,
  }) as { options: { temperature: number } }

  assert.equal(openai.temperature, 0.7)
  assert.equal(ollama.options.temperature, 0.7)
})

// -- parseGenerationResponse ---------------------------------------------------

check(
  'openai response normalizes text, model, usage, and finish reason',
  () => {
    const result = parseGenerationResponse('openai', {
      model: 'gpt-4o-mini',
      choices: [{ message: { content: 'hello there' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    })

    assert.equal(result.text, 'hello there')
    assert.deepEqual(result.completions, [])
    assert.equal(result.model, 'gpt-4o-mini')
    assert.equal(result.finishReason, 'stop')
    assert.deepEqual(result.usage, {
      promptTokens: 10,
      completionTokens: 5,
      totalTokens: 15,
    })
  },
)

check('openai response with n>1 exposes extra choices as `completions`', () => {
  const result = parseGenerationResponse('openai', {
    model: 'gpt-4o-mini',
    choices: [
      { message: { content: 'first' }, finish_reason: 'stop' },
      { message: { content: 'second' }, finish_reason: 'stop' },
      { message: { content: 'third' }, finish_reason: 'stop' },
    ],
  })

  assert.equal(result.text, 'first')
  assert.deepEqual(result.completions, ['second', 'third'])
})

check(
  'openai response with no choices throws rather than returning empty text',
  () => {
    assert.throws(
      () => parseGenerationResponse('openai', { choices: [] }),
      /no choices/i,
    )
  },
)

check(
  'anthropic response joins text content blocks and maps token usage',
  () => {
    const result = parseGenerationResponse('anthropic', {
      model: 'claude-sonnet-4-6',
      content: [
        { type: 'text', text: 'hello ' },
        { type: 'text', text: 'there' },
      ],
      stop_reason: 'end_turn',
      usage: { input_tokens: 20, output_tokens: 8 },
    })

    assert.equal(result.text, 'hello there')
    assert.equal(result.finishReason, 'end_turn')
    assert.deepEqual(result.usage, {
      promptTokens: 20,
      completionTokens: 8,
      totalTokens: 28,
    })
  },
)

check('anthropic response with no content blocks throws', () => {
  assert.throws(
    () => parseGenerationResponse('anthropic', { content: [] }),
    /no content blocks/i,
  )
})

check('ollama response maps message content and eval counts to usage', () => {
  const result = parseGenerationResponse('ollama', {
    model: 'llama3.2',
    message: { role: 'assistant', content: 'hi there' },
    done: true,
    done_reason: 'stop',
    prompt_eval_count: 12,
    eval_count: 4,
  })

  assert.equal(result.text, 'hi there')
  assert.equal(result.finishReason, 'stop')
  assert.deepEqual(result.usage, {
    promptTokens: 12,
    completionTokens: 4,
    totalTokens: 16,
  })
})

check('ollama response missing message content throws', () => {
  assert.throws(
    () => parseGenerationResponse('ollama', { done: true }),
    /no message content/i,
  )
})

if (failures > 0) {
  console.error(`\n${failures} failure(s).`)
  process.exitCode = 1
} else {
  console.log('\nAll text-generation-dispatch self-tests passed.')
}
