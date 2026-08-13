// /utils/scripts/verifySerendipityVoicePollGuard.test.ts
//
// Regression test for checkSerendipityVoicePollGuard() in
// verifySerendipityVoicePollGuard.ts (alexa-integration/t-015). Exercises
// the real check against synthetic store-shaped fixtures covering: the
// pre-fix shape (no polling.value re-check at all), the fixed shape (the
// re-check sits between the Promise.all fetch and `connected.value = true`),
// a misplaced-guard regression (the check exists but too early, before the
// fetches even start -- which would not catch a stop() that happens while
// the fetches are in flight), and a missing-function fixture.
import assert from 'node:assert/strict'

import { checkSerendipityVoicePollGuard } from './verifySerendipityVoicePollGuard.js'

function fixture(opts: { stoppedGuard: string }): string {
  return `
    async function pollOnce(): Promise<void> {
      if (!isClient()) return
      if (pollInFlight.value) return
      pollInFlight.value = true

      try {
        const [commandsRes, messagesRes] = await Promise.all([
          fetch(\`\${relayBaseUrl.value}/api/commands?since=\${commandCursor.value}\`),
          fetch(\`\${relayBaseUrl.value}/api/messages?since=\${messageCursor.value}\`),
        ])

        ${opts.stoppedGuard}

        if (!commandsRes.ok || !messagesRes.ok) {
          throw new Error('Relay error')
        }

        for (const message of messagesData.messages) messages.value.push(message)
        messageCursor.value = messagesData.cursor

        for (const command of commandsData.commands) applyCommand(command)
        commandCursor.value = commandsData.cursor

        connected.value = true
        lastError.value = null
      } catch (error) {
        connected.value = false
        lastError.value = error instanceof Error ? error.message : 'Relay poll failed'
      } finally {
        pollInFlight.value = false
      }
    }
  `
}

const FIXED = fixture({ stoppedGuard: 'if (!polling.value) return' })

// Pre-fix: no re-check of polling.value anywhere -- a poll whose fetches
// resolve after stop() ran will still apply the response.
const BUGGY = fixture({ stoppedGuard: '' })

// Misplaced regression: the guard exists, but before the try block up near
// the top-of-function re-entrancy guards instead of after the fetches
// resolve. Only the trailing "" from stoppedGuard's slot is used here, and
// the guard is inserted before pollInFlight.value = true instead -- this
// fixture builds that shape directly rather than via the helper above.
const GUARD_TOO_EARLY = `
    async function pollOnce(): Promise<void> {
      if (!isClient()) return
      if (pollInFlight.value) return
      if (!polling.value) return
      pollInFlight.value = true

      try {
        const [commandsRes, messagesRes] = await Promise.all([
          fetch(\`\${relayBaseUrl.value}/api/commands?since=\${commandCursor.value}\`),
          fetch(\`\${relayBaseUrl.value}/api/messages?since=\${messageCursor.value}\`),
        ])

        connected.value = true
      } catch (error) {
        connected.value = false
      } finally {
        pollInFlight.value = false
      }
    }
  `

function run(): void {
  const fixedErrors = checkSerendipityVoicePollGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const buggyErrors = checkSerendipityVoicePollGuard(BUGGY)
  assert.equal(
    buggyErrors.length,
    1,
    `expected the pre-fix fixture (no polling.value re-check) to fail once, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(/no longer contains/.test(buggyErrors[0]!))

  const tooEarlyErrors = checkSerendipityVoicePollGuard(GUARD_TOO_EARLY)
  assert.equal(
    tooEarlyErrors.length,
    1,
    `expected a guard placed before the fetches to fail once, got: ${JSON.stringify(tooEarlyErrors)}`,
  )
  assert.ok(/not between/.test(tooEarlyErrors[0]!))

  const missingFnErrors = checkSerendipityVoicePollGuard(
    'function someOtherFunction(): void {}',
  )
  assert.equal(missingFnErrors.length, 1)
  assert.ok(/Could not find a function named/.test(missingFnErrors[0]!))

  console.log(
    'Serendipity Voice poll guard self-test passed: buggy fixture fails, ' +
      'fixed fixture passes, a too-early-guard fixture fails, missing-' +
      'function fixture fails clearly.',
  )
}

run()
