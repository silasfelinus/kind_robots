// /utils/scripts/verifyNarrativeArtPollEpochGuard.mjs
//
// Regression guard (storybook/t-010, front-end polish).
// stores/helpers/narrativeArtJobsHelper.ts runs one polling chain per
// illustration (keyed by dedupeKey): submit -> poll -> schedulePoll -> poll ...
// `retry()`, `enqueue()` and `resume()` each start a NEW chain for the same
// key. `clearPoll()` cancels the timer between polls, but it cannot cancel a
// `getArtJobStatus()` / `getArtImageById()` / `enqueueArtGeneration()` that is
// already awaiting. Without an epoch, a response from the replaced chain could
// land after the new one had begun and `update()` the reader's beat back to
// the old jobId -- and, for a still-busy old job, re-schedule polling for it,
// so two chains then fought over one beat's art state.
//
// This asserts the fix's shape stays in place:
//   - a module-level `pollEpochs` map with `currentEpoch()` / `bumpEpoch()`;
//   - `retry()`, `enqueue()` and `resume()` each bump the key's epoch;
//   - `poll()` and `schedulePoll()` carry an `epoch` parameter, and every
//     awaited step in `poll()`, `submit()` and `recoverOrSubmit()` re-checks
//     `epoch !== currentEpoch(...)` before touching state.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const HELPER_PATH = 'stores/helpers/narrativeArtJobsHelper.ts'
const helper = readFileSync(resolve(process.cwd(), HELPER_PATH), 'utf8')

// Pull one function body by name, brace-matched from its opening `{`.
function functionBody(name) {
  const match = helper.match(new RegExp(`(?:async )?function ${name}\\(`))
  assert.ok(match, `${HELPER_PATH}: function ${name}() not found.`)
  const open = helper.indexOf('{', match.index)
  let depth = 0
  for (let i = open; i < helper.length; i++) {
    if (helper[i] === '{') depth++
    else if (helper[i] === '}') {
      depth--
      if (depth === 0) return helper.slice(open, i + 1)
    }
  }
  assert.fail(`${HELPER_PATH}: unbalanced braces after ${name}().`)
}

assert.ok(
  helper.includes('const pollEpochs = new Map<string, number>()'),
  `${HELPER_PATH}: expected a module-level \`pollEpochs\` map.`,
)
assert.ok(
  /function currentEpoch\(dedupeKey: string\): number/.test(helper) &&
    /function bumpEpoch\(dedupeKey: string\): number/.test(helper),
  `${HELPER_PATH}: expected currentEpoch() and bumpEpoch() helpers.`,
)

for (const name of ['retry', 'enqueue', 'resume']) {
  assert.ok(
    functionBody(name).includes('bumpEpoch('),
    `${HELPER_PATH}: ${name}() must bumpEpoch() so any chain still awaiting for ` +
      'this dedupeKey drops its result instead of racing the new one.',
  )
}

const poll = functionBody('poll')
assert.ok(
  /async function poll\([\s\S]*?epoch = currentEpoch\(state\.dedupeKey\),/.test(
    helper,
  ),
  `${HELPER_PATH}: poll() must take an \`epoch\` parameter defaulting to ` +
    'currentEpoch(state.dedupeKey).',
)
const pollChecks = (poll.match(/if \(epoch !== currentEpoch\(state\.dedupeKey\)\) return/g) || [])
  .length
assert.ok(
  pollChecks >= 2,
  `${HELPER_PATH}: poll() must re-check the epoch after BOTH awaits ` +
    `(getArtJobStatus and getArtImageById); found ${pollChecks} check(s).`,
)
assert.ok(
  !/schedulePoll\([^)]*attempt\)\s*$/m.test(poll) &&
    (poll.match(/schedulePoll\([^)]*, epoch\)/g) || []).length >= 3,
  `${HELPER_PATH}: every schedulePoll() call inside poll() must pass \`epoch\` through.`,
)

const schedulePoll = functionBody('schedulePoll')
assert.ok(
  schedulePoll.includes('if (epoch !== currentEpoch(state.dedupeKey)) return') &&
    schedulePoll.includes('void poll(state, update, attempt + 1, epoch)'),
  `${HELPER_PATH}: schedulePoll() must refuse a stale epoch and forward it to the next poll().`,
)

for (const name of ['submit', 'recoverOrSubmit']) {
  const body = functionBody(name)
  assert.ok(
    body.includes('const epoch = currentEpoch(state.dedupeKey)') &&
      body.includes('if (epoch !== currentEpoch(state.dedupeKey)) return'),
    `${HELPER_PATH}: ${name}() must capture the epoch before its await and ` +
      'drop its result if the key has moved on.',
  )
}

console.log(
  'Narrative art poll epoch guard passed: a replaced illustration chain can no ' +
    'longer overwrite the chain that replaced it.',
)
