// /utils/scripts/verifySerendipityVoicePollGuard.ts
//
// Regression guard (alexa-integration/t-015) -- pollOnce() in
// stores/serendipityVoiceStore.ts already guards against overlapping polls
// via pollInFlight (fixed 2026-07-29, kind_robots PR #1127), but that guard
// only prevents two polls from racing each other. It never checked whether
// the caller had, in the meantime, called stop() -- the authoritative
// "I am no longer polling the relay" action, fired both from the explicit
// Disconnect button and from onBeforeUnmount on both voice-lab-page.vue and
// serendipity-page.vue.
//
// Failure scenario this protects against: sendVoiceText() awaits its POST
// to /api/handle, then calls `await pollOnce()` to fetch the resulting
// commands/messages. If stop() runs (Disconnect click, or the user
// navigating away and unmounting the component) while that trailing
// pollOnce()'s own fetches are still in flight, the poll had no way to know
// the caller had disconnected -- it would go on to unconditionally set
// `connected.value = true` and apply any pending commands (which can toggle
// global animation effects or change the app theme) even though `stop()`
// already set `polling.value = false` and cleared the poll interval. The UI
// would end up self-contradictory (a green "Relay connected" badge next to
// a "Connect" button) and permanently unable to poll again until the user
// manually reconnected, and a voice command could still land on global
// stores after the page that was supposedly listening had already gone.
//
// Fixed by re-checking `polling.value` immediately after the commands/
// messages fetches resolve, before any of their results are applied to
// store state -- late enough to catch a stop() that happened mid-flight,
// early enough that nothing has been mutated yet.
//
// This asserts the textual shape of that fix stays in place: pollOnce()'s
// body contains a `if (!polling.value) return` guard positioned after the
// `Promise.all([...])` fetch call and before the `connected.value = true`
// assignment -- deliberately scoped to this one function/bug, mirroring
// this project's other narrow textual guards over a general-purpose static
// analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/serendipityVoiceStore.ts')

function extractFunctionSource(content: string, name: string): string | null {
  const signature = new RegExp(
    `^\\s*(?:async\\s+)?function ${name}\\([^)]*\\)[^{]*\\{`,
    'm',
  )
  const match = signature.exec(content)
  if (!match) return null

  const braceOpen = match.index + match[0].length - 1
  let depth = 0
  let i = braceOpen
  for (; i < content.length; i++) {
    if (content[i] === '{') depth++
    else if (content[i] === '}') {
      depth--
      if (depth === 0) break
    }
  }
  if (depth !== 0) return null
  return content.slice(braceOpen, i + 1)
}

export function checkSerendipityVoicePollGuard(content: string): string[] {
  const errors: string[] = []

  const body = extractFunctionSource(content, 'pollOnce')
  if (!body) {
    errors.push(
      'Could not find a function named pollOnce() -- has it been renamed, ' +
        'removed, or restructured? If so, this guard (and the stale-poll-' +
        'after-stop bug it protects against) needs to move with it.',
    )
    return errors
  }

  const promiseAllIndex = body.search(/Promise\.all\(/)
  const stoppedGuardMatch = body.match(
    /if\s*\(\s*!polling\.value\s*\)\s*return/,
  )
  const connectedTrueIndex = body.search(/connected\.value\s*=\s*true/)

  if (promiseAllIndex === -1) {
    errors.push(
      'pollOnce() no longer calls Promise.all([...]) for its commands/' +
        'messages fetch -- has the relay-polling shape changed? This guard ' +
        'assumes that structure to locate the mid-flight disconnect race.',
    )
  }

  if (!stoppedGuardMatch) {
    errors.push(
      'pollOnce() no longer contains `if (!polling.value) return` -- ' +
        'without it, a poll whose fetches resolve after stop() has already ' +
        'run (explicit Disconnect, or unmount) will resurrect ' +
        '`connected.value` and can still apply a voice command to global ' +
        'stores after the caller declared itself stopped.',
    )
  } else if (
    promiseAllIndex !== -1 &&
    connectedTrueIndex !== -1 &&
    !(
      stoppedGuardMatch.index! > promiseAllIndex &&
      stoppedGuardMatch.index! < connectedTrueIndex
    )
  ) {
    errors.push(
      'pollOnce() contains `if (!polling.value) return`, but not between ' +
        'the Promise.all([...]) fetch and `connected.value = true` -- it ' +
        'must sit right after the fetches resolve (late enough to catch a ' +
        'stop() that happened mid-flight) and before any state is applied ' +
        '(early enough that nothing has been mutated yet).',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkSerendipityVoicePollGuard(content)

  if (errors.length) {
    console.error(
      'Serendipity Voice poll guard contract failed in ' +
        'serendipityVoiceStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Serendipity Voice poll guard contract passed: pollOnce() bails before ' +
      'applying a response that resolved after stop() already ran.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
