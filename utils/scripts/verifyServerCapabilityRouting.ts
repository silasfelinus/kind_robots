// /utils/scripts/verifyServerCapabilityRouting.ts
//
// Regression guard for text-generation/t-003: server/utils/
// serverCapabilities.ts's getCapabilityServerTypes() decides which
// Server.serverType values are even eligible to serve a given capability,
// via a where-clause every serverResolver.ts resolveServer() path ANDs
// against -- explicit serverId, explicit serverName, and
// preferredArtServerId/preferredTextServerId lookups alike. Before this fix,
// 'text'/'chat' excluded OLLAMA, which silently broke resolution for every
// Ollama server (including one picked by explicit id/name/preference) even
// though server/api/chats/ollama/stream.post.ts's own request path already
// worked end-to-end. getCapabilityServerTypes() lives in its own Prisma-free
// module specifically so it can be imported here directly -- importing it
// via serverResolver.ts would transitively pull in ./prisma, which throws at
// module-load time without a DATABASE_URL (this CI job intentionally has
// none set).
import assert from 'node:assert/strict'
import { getCapabilityServerTypes } from '../../server/utils/serverCapabilities'

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

// -- text / chat capability ---------------------------------------------------

check('text capability includes OLLAMA', () => {
  assert.ok(getCapabilityServerTypes('text')?.includes('OLLAMA'))
})

check('chat capability includes OLLAMA', () => {
  assert.ok(getCapabilityServerTypes('chat')?.includes('OLLAMA'))
})

check(
  'text and chat capability resolve to the identical server-type set',
  () => {
    assert.deepEqual(
      getCapabilityServerTypes('text'),
      getCapabilityServerTypes('chat'),
    )
  },
)

check(
  'text capability still includes the pre-existing cloud/custom providers',
  () => {
    const types = getCapabilityServerTypes('text')
    assert.ok(types?.includes('OPENAI'))
    assert.ok(types?.includes('ANTHROPIC'))
    assert.ok(types?.includes('CUSTOM'))
  },
)

check('text capability excludes the art-only engine types', () => {
  const types = getCapabilityServerTypes('text')
  assert.ok(!types?.includes('A1111'))
  assert.ok(!types?.includes('COMFY'))
})

// -- art / comfy capability (must not regress from the text/chat fix) --------

check('art capability is unchanged (A1111, COMFY, OPENAI)', () => {
  assert.deepEqual(getCapabilityServerTypes('art'), [
    'A1111',
    'COMFY',
    'OPENAI',
  ])
})

check('art capability excludes OLLAMA and ANTHROPIC', () => {
  const types = getCapabilityServerTypes('art')
  assert.ok(!types?.includes('OLLAMA'))
  assert.ok(!types?.includes('ANTHROPIC'))
})

check('comfy capability is unchanged (COMFY only)', () => {
  assert.deepEqual(getCapabilityServerTypes('comfy'), ['COMFY'])
})

// -- no capability -------------------------------------------------------------

check('no capability means no serverType restriction (null)', () => {
  assert.equal(getCapabilityServerTypes(undefined), null)
})

if (failures > 0) {
  console.error(`\n${failures} failure(s).`)
  process.exitCode = 1
} else {
  console.log('\nAll server-capability-routing self-tests passed.')
}
