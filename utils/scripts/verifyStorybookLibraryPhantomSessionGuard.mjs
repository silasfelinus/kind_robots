// /utils/scripts/verifyStorybookLibraryPhantomSessionGuard.mjs
//
// Regression guard (storybook/t-010, front-end polish). storybookLibraryHelper
// watches `bridge.getSession()` (deep) and calls `upsert()` on every change --
// once when a session is (re)assigned and again, with `previous`, whenever it
// is cleared:
//
//   watch(() => bridge.getSession(), (next, previous) => {
//     if (!initialized.value) return
//     if (next) upsert(next)
//     else if (previous) upsert(previous)
//   }, { deep: true })
//
// `beginStory` (and `restartStory`, which calls it) creates a session with
// `beats: []` *before* the first `weaveBeat` call, then rolls `session.value`
// back to `null` if that opening generation fails -- a real, reachable path
// (a transient generateText error, an unparsable response, a moderation
// rejection). Without a guard in `upsert()` itself, both watcher firings
// archive that zero-beat session into the reader's recent-stories library:
// once on the pre-generation reassignment, again (via `previous`) on the
// post-failure rollback. The result is a permanent, unopenable "Untitled
// story" phantom sitting in the Story Library -- opening it clones a session
// with no beats, so the reading view shows an empty transcript forever with
// no composer and no way to generate anything, and it can push a real story
// out of the capped MAX_LIBRARY_SESSIONS window over time.
//
// This asserts the fix's shape stays in place: `upsert` refuses to persist a
// session that has no beats yet.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const HELPER_PATH = 'stores/helpers/storybookLibraryHelper.ts'
const FN_NAME = 'upsert'

function extractFunctionBody(content, name) {
  const signaturePattern = new RegExp(`^ {2}function ${name}\\s*\\(`, 'm')
  const match = signaturePattern.exec(content)
  if (!match) {
    throw new Error(
      `Could not find \`  function ${name}(\` in ${HELPER_PATH} -- has it ` +
        'been renamed, removed, or inlined? If so, this guard (and the ' +
        'phantom-library-entry bug it protects against) needs to move with it.',
    )
  }

  const parenOpen = match.index + match[0].length - 1
  let parenDepth = 0
  let i = parenOpen
  for (; i < content.length; i++) {
    if (content[i] === '(') parenDepth++
    else if (content[i] === ')') {
      parenDepth--
      if (parenDepth === 0) break
    }
  }
  const braceOpen = content.indexOf('{', i)
  let braceDepth = 0
  let j = braceOpen
  for (; j < content.length; j++) {
    if (content[j] === '{') braceDepth++
    else if (content[j] === '}') {
      braceDepth--
      if (braceDepth === 0) break
    }
  }
  return content.slice(braceOpen, j + 1)
}

const content = readFileSync(resolve(process.cwd(), HELPER_PATH), 'utf8')
const body = extractFunctionBody(content, FN_NAME)

const required = [
  [
    'if (!value.beats.length) return',
    'must refuse to archive a session before it has woven its opening beat',
  ],
]

for (const [needle, why] of required) {
  assert.ok(
    body.includes(needle),
    `${FN_NAME}() no longer contains \`${needle}\` -- ${why}, or a failed ` +
      'or interrupted opening generation permanently archives an empty, ' +
      'unopenable "Untitled story" into the reader\'s recent-stories library.',
  )
}

// The watcher must still route both a fresh session and a just-cleared one
// through this same guarded upsert() -- otherwise the guard above is dead
// code that never sees the paths that actually cause the phantom entry.
const helperContent = content
assert.ok(
  /if \(next\) upsert\(next\)/.test(helperContent) &&
    /else if \(previous\) upsert\(previous\)/.test(helperContent),
  `${HELPER_PATH} must still route both the next-session and ` +
    'previous-session (post-clear) cases through upsert() -- otherwise this ' +
    "guard's fix is not actually reachable from the watcher that caused the bug.",
)

console.log(
  'Storybook library phantom-session guard contract passed: upsert() ' +
    'refuses to archive a zero-beat session, so a failed or interrupted ' +
    'opening generation can no longer leave a permanent, unopenable entry ' +
    'in the recent-stories library.',
)
