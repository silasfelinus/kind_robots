// /utils/scripts/verifySerendipityVoiceActionGuard.ts
//
// Regression guard (alexa-integration/t-015) -- applyCommand() in
// stores/serendipityVoiceStore.ts branches on `command.target`, and for an
// unsupported target it explicitly pushes an "Ignored unsupported command
// target" message instead of pretending anything happened. But
// VoiceBusCommand's `action` field ('on' | 'off' | 'toggle' | 'clear' |
// 'set' | 'draft') is shared across every target, even though 'set' and
// 'draft' are only meaningful for the theme/art targets. Before the fix,
// target === 'animation' had no equivalent guard for `action`: a command
// with action 'set' or 'draft' would resolve an effect id, skip every
// on/off/toggle branch (so no effect state actually changed), then still
// fall through to the unconditional setSurfacePlacement() call and the
// verb ternary's default of "on" -- reporting a false "Applied: <effect>
// on." to the message feed and the voice ack even though nothing toggled.
//
// Fixed by rejecting any target === 'animation' command whose action isn't
// 'on' | 'off' | 'toggle' (action 'clear' is handled, and returns, earlier)
// with the same "ignored, not applied" shape already used for unsupported
// targets, before resolveEffectId() or any animationStore mutation runs.
//
// This asserts the textual shape of that fix stays in place: applyCommand()
// contains a guard rejecting action values outside 'on'/'off'/'toggle'
// (after the 'clear' handling, before resolveEffectId() is called) that
// pushes a message and returns rather than falling through --
// deliberately scoped to this one function/bug, mirroring this project's
// other narrow textual guards over a general-purpose static analyzer.
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

export function checkSerendipityVoiceActionGuard(content: string): string[] {
  const errors: string[] = []

  const body = extractFunctionSource(content, 'applyCommand')
  if (!body) {
    errors.push(
      'Could not find a function named applyCommand() -- has it been ' +
        'renamed, removed, or restructured? If so, this guard (and the ' +
        'false-success-on-unsupported-animation-action bug it protects ' +
        'against) needs to move with it.',
    )
    return errors
  }

  const clearIndex = body.search(/command\.action\s*===\s*'clear'/)
  const resolveIndex = body.search(/resolveEffectId\(command\)/)
  const actionGuardMatch = body.match(
    /command\.action\s*!==\s*'on'\s*&&\s*command\.action\s*!==\s*'off'\s*&&\s*command\.action\s*!==\s*'toggle'/,
  )

  if (clearIndex === -1) {
    errors.push(
      "applyCommand() no longer handles command.action === 'clear' -- has " +
        'the animation-command dispatch shape changed? This guard assumes ' +
        'that structure to locate the unsupported-action check.',
    )
  }

  if (resolveIndex === -1) {
    errors.push(
      'applyCommand() no longer calls resolveEffectId(command) -- has the ' +
        'animation-command dispatch shape changed? This guard assumes that ' +
        'structure to locate the unsupported-action check.',
    )
  }

  if (!actionGuardMatch) {
    errors.push(
      'applyCommand() no longer rejects command.action values outside ' +
        "'on' / 'off' / 'toggle' before applying an animation command -- " +
        "without it, a command with action 'set' or 'draft' targeting " +
        "'animation' resolves an effect id, skips every on/off/toggle " +
        'branch (so nothing actually changes), then still falls through to ' +
        'setSurfacePlacement() and a default "on" verb, reporting a false ' +
        '"Applied: <effect> on." to the feed and the voice ack even though ' +
        'no effect state changed.',
    )
  } else if (
    clearIndex !== -1 &&
    resolveIndex !== -1 &&
    !(
      actionGuardMatch.index! > clearIndex &&
      actionGuardMatch.index! < resolveIndex
    )
  ) {
    errors.push(
      'applyCommand() contains the action-guard check, but not between ' +
        "the 'clear' handling and resolveEffectId(command) -- it must run " +
        'before any effect id is resolved or animationStore is touched, so ' +
        'an unsupported action never has a chance to fall through to a ' +
        'false "applied" message.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkSerendipityVoiceActionGuard(content)

  if (errors.length) {
    console.error(
      'Serendipity Voice action guard contract failed in ' +
        'serendipityVoiceStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Serendipity Voice action guard contract passed: applyCommand() ' +
      'rejects unsupported animation actions instead of silently reporting ' +
      'a false "applied" message.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
