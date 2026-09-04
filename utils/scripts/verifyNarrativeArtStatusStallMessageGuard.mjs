// /utils/scripts/verifyNarrativeArtStatusStallMessageGuard.mjs
//
// Regression guard (storybook/t-010, front-end polish).
// stores/helpers/narrativeArtJobsHelper.ts gives up polling a scene
// illustration after MAX_POLL_ATTEMPTS (120 x 5s = ten minutes). When it does,
// it writes an explanation to `error` ("The illustration is still queued. It
// will resume checking when this story is opened again.") but deliberately
// leaves `status` at queued/rendering, because the job is not failed -- it is
// simply no longer being watched from this tab.
//
// narrative-art-status.vue renders queued/rendering through its busy branch,
// which shows `statusMessage`, and `statusMessage` used to ignore `error` for
// those statuses. Net effect: after ten minutes a stalled illustration sat
// behind a spinner reading "The scene illustration is queued." indefinitely,
// with aria-busy still true, while nothing was checking on it any more. The
// one sentence that would have told the reader what was actually happening
// was computed and never displayed.
//
// This asserts `statusMessage` returns `art.error` for queued/rendering when
// it is set, ahead of the generic busy strings.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const STATUS_PATH = 'components/narrative/narrative-art-status.vue'
const HELPER_PATH = 'stores/helpers/narrativeArtJobsHelper.ts'

const status = readFileSync(resolve(process.cwd(), STATUS_PATH), 'utf8')
const helper = readFileSync(resolve(process.cwd(), HELPER_PATH), 'utf8')

// The helper still produces the state this guard exists for: an error string
// on a still-busy status once polling stops. If that changes, revisit whether
// the status component's preference for `error` is still the right contract.
assert.ok(
  /if \(attempt >= MAX_POLL_ATTEMPTS\) \{[\s\S]*?error:\s*\n?\s*'The illustration is still queued/.test(
    helper,
  ),
  `${HELPER_PATH}: expected schedulePoll() to record an \`error\` message when ` +
    'MAX_POLL_ATTEMPTS is reached -- has the stop-polling behaviour moved?',
)

const start = status.indexOf('const statusMessage = computed(')
assert.ok(start >= 0, `${STATUS_PATH}: statusMessage computed not found.`)
const body = status.slice(start, status.indexOf('})', start))

const errorFirst = body.indexOf(
  "if (art.error && (art.status === 'queued' || art.status === 'rendering'))",
)
const genericRendering = body.indexOf("if (art.status === 'rendering') return")
const genericQueued = body.indexOf("if (art.status === 'queued') return")

assert.ok(
  errorFirst >= 0,
  `${STATUS_PATH}: statusMessage must return \`art.error\` for queued/rendering ` +
    'when it is set, so a stalled poll is explained instead of spinning forever.',
)
assert.ok(
  body.slice(errorFirst, errorFirst + 220).includes('return art.error'),
  `${STATUS_PATH}: the queued/rendering error branch must \`return art.error\`.`,
)
assert.ok(
  genericRendering > errorFirst && genericQueued > errorFirst,
  `${STATUS_PATH}: the error branch must come BEFORE the generic ` +
    '"is rendering." / "is queued." returns, or it never runs.',
)

console.log(
  'Narrative art status stall message guard passed: a stalled illustration ' +
    'poll explains itself instead of spinning silently.',
)
