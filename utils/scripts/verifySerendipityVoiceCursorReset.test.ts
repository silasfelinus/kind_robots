// /utils/scripts/verifySerendipityVoiceCursorReset.test.ts
//
// Regression test for checkSerendipityVoiceCursorReset() in
// verifySerendipityVoiceCursorReset.ts (alexa-integration/t-015). Exercises
// the real check against synthetic store-shaped fixtures covering: the
// fixed shape (both setRelayBaseUrl() and start() reset the cursors), the
// pre-fix shape (neither resets), a partial-fix shape (only one of the two
// resets), and missing-function fixtures.
import assert from 'node:assert/strict'

import { checkSerendipityVoiceCursorReset } from './verifySerendipityVoiceCursorReset.js'

function fixture(opts: { relayReset: string; startReset: string }): string {
  return `
    function setRelayBaseUrl(url: string): void {
      const next = url.trim().replace(/\\/+$/, '') || DEFAULT_RELAY_URL
      if (next !== relayBaseUrl.value) {
        ${opts.relayReset}
      }
      relayBaseUrl.value = next
      if (isClient())
        window.localStorage.setItem(RELAY_URL_KEY, relayBaseUrl.value)
    }

    function start(): void {
      if (!isClient() || polling.value) return
      loadRelayUrl()
      ${opts.startReset}
      polling.value = true
      void pollOnce()
      pollTimer.value = setInterval(() => void pollOnce(), POLL_INTERVAL_MS)
    }
  `
}

const RESET = 'commandCursor.value = 0\n        messageCursor.value = 0'

const FIXED = fixture({ relayReset: RESET, startReset: RESET })

// Pre-fix: neither function resets the cursors -- a relay restart or URL
// switch leaves the client polling with a stale `since` value forever.
const BUGGY = fixture({ relayReset: '', startReset: '' })

// Partial fix: only setRelayBaseUrl() resets -- a same-URL relay restart
// (the scenario the file's own header comment calls the normal case) still
// reproduces the bug because start() never resets on reconnect.
const PARTIAL_ONLY_RELAY = fixture({ relayReset: RESET, startReset: '' })

// Partial fix: only start() resets -- a relay URL switch without a
// disconnect/reconnect cycle still reproduces the bug.
const PARTIAL_ONLY_START = fixture({ relayReset: '', startReset: RESET })

function run(): void {
  const fixedErrors = checkSerendipityVoiceCursorReset(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const buggyErrors = checkSerendipityVoiceCursorReset(BUGGY)
  assert.equal(
    buggyErrors.length,
    2,
    `expected the pre-fix fixture (neither function resets) to fail twice, got: ${JSON.stringify(buggyErrors)}`,
  )

  const partialRelayErrors =
    checkSerendipityVoiceCursorReset(PARTIAL_ONLY_RELAY)
  assert.equal(
    partialRelayErrors.length,
    1,
    `expected the relay-only partial fix to fail once (start() still missing), got: ${JSON.stringify(partialRelayErrors)}`,
  )
  assert.ok(/start\(\) no longer resets/.test(partialRelayErrors[0]!))

  const partialStartErrors =
    checkSerendipityVoiceCursorReset(PARTIAL_ONLY_START)
  assert.equal(
    partialStartErrors.length,
    1,
    `expected the start-only partial fix to fail once (setRelayBaseUrl() still missing), got: ${JSON.stringify(partialStartErrors)}`,
  )
  assert.ok(/setRelayBaseUrl\(\) no longer resets/.test(partialStartErrors[0]!))

  const missingFnErrors = checkSerendipityVoiceCursorReset(
    'function someOtherFunction(): void {}',
  )
  assert.equal(missingFnErrors.length, 2)
  assert.ok(
    missingFnErrors.every((e) => /Could not find a function named/.test(e)),
  )

  console.log(
    'Serendipity Voice cursor-reset self-test passed: buggy fixture fails ' +
      'twice, both partial fixes fail once each on the missing side, fixed ' +
      'fixture passes, missing-function fixture fails clearly.',
  )
}

run()
