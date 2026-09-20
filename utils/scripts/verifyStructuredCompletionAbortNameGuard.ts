// /utils/scripts/verifyStructuredCompletionAbortNameGuard.ts
//
// Regression guard for server/utils/structuredCompletion.ts's timeout-error
// contract (found auditing storybook/t-010 cycle 78).
//
// completeStructured()'s own docstring says "An AbortError keeps its name so
// callers can decline to retry a timeout" -- but the catch block wrapped a
// real AbortError in `new Error(...)`, which always names itself "Error".
// storybookNarration.ts's generateStorybookTurn() is the one caller that
// depends on this: it retries once on any failure EXCEPT when
// `firstError.name === 'AbortError'`, specifically so a reader who already
// waited out a 20s timeout is not made to wait through a second one. With the
// name lost, every timeout silently doubled the wait instead of failing fast.
//
// No network: mocks global.fetch to reject with a real AbortError so the
// wrapping logic runs without waiting for a real timeout.

import { completeStructured } from '../../server/utils/structuredCompletion'

let failures = 0

function check(name: string, condition: boolean, detail = '') {
  if (condition) {
    console.log(`  PASS  ${name}`)
  } else {
    failures += 1
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

async function run() {
  const originalFetch = globalThis.fetch

  // Case 1: a real AbortError must surface with its name intact.
  globalThis.fetch = (async () => {
    throw new DOMException('The operation was aborted.', 'AbortError')
  }) as typeof fetch

  try {
    await completeStructured({
      system: 'system',
      user: 'user',
      schemaName: 'test_schema',
      schema: { type: 'object', properties: {}, additionalProperties: false },
      apiKey: 'test-key',
    })
    failures += 1
    console.error('  FAIL  completeStructured resolved instead of throwing')
  } catch (error) {
    check(
      'a timed-out request throws an Error named AbortError',
      error instanceof Error && error.name === 'AbortError',
      `got name=${error instanceof Error ? error.name : typeof error}`,
    )
    check(
      'the thrown error keeps a reader-facing timeout message',
      error instanceof Error &&
        error.message.includes('timed out before the serverless deadline'),
    )
    check(
      'the original AbortError is preserved as the cause',
      error instanceof Error &&
        error.cause instanceof DOMException &&
        error.cause.name === 'AbortError',
    )
  } finally {
    globalThis.fetch = originalFetch
  }

  // Case 2: a non-abort failure must NOT be relabeled as AbortError -- only
  // the timeout path should carry that name.
  globalThis.fetch = (async () => {
    throw new TypeError('network down')
  }) as typeof fetch

  try {
    await completeStructured({
      system: 'system',
      user: 'user',
      schemaName: 'test_schema',
      schema: { type: 'object', properties: {}, additionalProperties: false },
      apiKey: 'test-key',
    })
    failures += 1
    console.error('  FAIL  completeStructured resolved instead of throwing')
  } catch (error) {
    check(
      'a non-abort failure is not relabeled AbortError',
      error instanceof Error && error.name !== 'AbortError',
      `got name=${error instanceof Error ? error.name : typeof error}`,
    )
  } finally {
    globalThis.fetch = originalFetch
  }

  if (failures) {
    console.error(`\n${failures} check(s) failed.`)
    process.exit(1)
  }
  console.log('\nAll structuredCompletion abort-name checks passed.')
}

run()
