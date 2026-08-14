// /utils/scripts/verifySerendipityVoiceCursorReset.ts
//
// Regression guard (alexa-integration/t-015) -- commandCursor/messageCursor
// in stores/serendipityVoiceStore.ts are monotonically-advancing "since"
// pointers into the relay's command/message log. The relay is explicitly
// documented (top-of-file comment) as "an in-memory dev seam on localhost",
// meaning it is expected to be restarted often -- a restart resets its
// command/message log, and their id space, back to 0.
//
// Failure scenario this protects against: the store is a long-lived Pinia
// singleton whose cursor state survives across a relay restart at the same
// URL, or a Relay URL switch to a different relay instance (saveRelay() in
// serendipity-page.vue). If the cursors are never reset, the next poll sends
// `since=<a value the new/restarted relay's fresh log may never reach>` --
// the server-side filter then drops every future command/message, silently.
// The fetches still succeed (`connected.value = true`, no lastError), so the
// UI shows "Relay connected" while every subsequent voice command and chat
// message is swallowed with no visible sign anything is wrong.
//
// Fixed by resetting both cursors to 0: (a) in setRelayBaseUrl() whenever the
// URL actually changes, and (b) in start() on every fresh connect, since a
// same-URL relay restart between sessions is exactly the scenario the file's
// own header comment calls out as expected/normal for this dev tool.
//
// This asserts the textual shape of that fix stays in place: both
// setRelayBaseUrl() and start() contain a `commandCursor.value = 0` /
// `messageCursor.value = 0` reset -- deliberately scoped to this one
// bug/fix, mirroring this project's other narrow textual guards over a
// general-purpose static analyzer.
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

function hasCursorReset(body: string): boolean {
  return (
    /commandCursor\.value\s*=\s*0/.test(body) &&
    /messageCursor\.value\s*=\s*0/.test(body)
  )
}

export function checkSerendipityVoiceCursorReset(content: string): string[] {
  const errors: string[] = []

  const setRelayBaseUrlBody = extractFunctionSource(content, 'setRelayBaseUrl')
  if (!setRelayBaseUrlBody) {
    errors.push(
      'Could not find a function named setRelayBaseUrl() -- has it been ' +
        'renamed, removed, or restructured? If so, this guard (and the ' +
        'stale-cursor-after-relay-switch bug it protects against) needs to ' +
        'move with it.',
    )
  } else if (!hasCursorReset(setRelayBaseUrlBody)) {
    errors.push(
      'setRelayBaseUrl() no longer resets commandCursor/messageCursor to 0 ' +
        'when the relay URL changes -- without it, switching to a ' +
        'different relay instance keeps the old cursor, and the server-side ' +
        '`since` filter can silently drop every future command/message ' +
        'because the new relay may never reach that id.',
    )
  }

  const startBody = extractFunctionSource(content, 'start')
  if (!startBody) {
    errors.push(
      'Could not find a function named start() -- has it been renamed, ' +
        'removed, or restructured? If so, this guard needs to move with it.',
    )
  } else if (!hasCursorReset(startBody)) {
    errors.push(
      'start() no longer resets commandCursor/messageCursor to 0 on ' +
        'connect -- without it, restarting the relay (documented as an ' +
        'in-memory dev seam expected to restart often) while the app stays ' +
        "open leaves the client holding a cursor the restarted relay's " +
        'fresh log may never reach, silently dropping every future poll ' +
        'result.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkSerendipityVoiceCursorReset(content)

  if (errors.length) {
    console.error(
      'Serendipity Voice cursor-reset contract failed in ' +
        'serendipityVoiceStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Serendipity Voice cursor-reset contract passed: setRelayBaseUrl() and ' +
      'start() both reset the command/message cursors so a relay restart ' +
      'or URL switch cannot leave the client polling with a stale `since` ' +
      'value.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
