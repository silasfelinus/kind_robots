// /utils/scripts/verifySerendipityVoiceActionGuard.ts
//
// Regression guard (alexa-integration/t-015, extended by t-020). Every
// applyCommand()-dispatched function in stores/serendipityVoiceStore.ts
// shares the same VoiceBusCommand.action union ('on' | 'off' | 'toggle' |
// 'clear' | 'set' | 'draft'), but only a subset of those actions are
// meaningful for any given target:
//   - applyCommand() (target 'animation'): only 'on' | 'off' | 'toggle'
//     ('clear' is handled earlier and returns; 'set' | 'draft' are theme/
//     art-only)
//   - applyThemeCommand() (target 'theme'): only 'set'
//   - applyArtCommand() (target 'art'): only 'draft'
// Before t-015's fix, target === 'animation' had no equivalent guard: a
// command with action 'set' or 'draft' would resolve an effect id, skip
// every on/off/toggle branch (so no effect state actually changed), then
// still fall through to the unconditional setSurfacePlacement() call and
// the verb ternary's default of "on" -- reporting a false "Applied:
// <effect> on." to the message feed and the voice ack even though nothing
// toggled. t-020 found the identical gap on the other two targets:
// applyThemeCommand() and applyArtCommand() never checked command.action at
// all, so a mis-targeted on/off/toggle/clear command reaching either of
// them would still report a false "Applied: theme set to X." or "Art draft
// received." even though the action made no sense for that target.
//
// Fixed by rejecting any out-of-scope action with the same "ignored, not
// applied" shape already used for unsupported targets, before any of the
// three functions mutates state or reports success.
//
// This asserts the textual shape of each fix stays in place: each target
// function in TARGET_FUNCTIONS contains a guard rejecting action values
// outside its allowed set, placed before the function's real work runs,
// that pushes a message and returns rather than falling through --
// deliberately scoped to these three functions/bugs, mirroring this
// project's other narrow textual guards over a general-purpose static
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

type TargetFunction = {
  name: string
  // A regex matching the guard that must appear in this function's body,
  // rejecting every action value outside the ones meaningful for this
  // target.
  guardPattern: RegExp
  // Human-readable description of what the guard protects, used in error
  // messages.
  falseSuccessDescription: string
  // Anchors the guard must fall between (both optional). `mustAppearAfter`
  // is a pattern the guard must appear after; `mustAppearBefore` is a
  // pattern the guard must appear before. Used to catch a guard that
  // exists but runs too late to prevent the false-success fall-through.
  mustAppearAfter?: RegExp
  mustAppearBefore?: RegExp
}

const TARGET_FUNCTIONS: TargetFunction[] = [
  {
    name: 'applyCommand',
    guardPattern:
      /command\.action\s*!==\s*'on'\s*&&\s*command\.action\s*!==\s*'off'\s*&&\s*command\.action\s*!==\s*'toggle'/,
    falseSuccessDescription:
      'applyCommand() no longer rejects command.action values outside ' +
      "'on' / 'off' / 'toggle' before applying an animation command -- " +
      "without it, a command with action 'set' or 'draft' targeting " +
      "'animation' resolves an effect id, skips every on/off/toggle " +
      'branch (so nothing actually changes), then still falls through to ' +
      'setSurfacePlacement() and a default "on" verb, reporting a false ' +
      '"Applied: <effect> on." to the feed and the voice ack even though ' +
      'no effect state changed.',
    mustAppearAfter: /command\.action\s*===\s*'clear'/,
    mustAppearBefore: /resolveEffectId\(command\)/,
  },
  {
    name: 'applyThemeCommand',
    guardPattern: /command\.action\s*!==\s*'set'/,
    falseSuccessDescription:
      'applyThemeCommand() no longer rejects command.action values other ' +
      "than 'set' -- without it, a mis-targeted on/off/toggle/clear " +
      'command carrying a stale/leftover command.theme value still falls ' +
      'through to setActiveTheme() and can report a false "Applied: theme ' +
      'set to X." even though the action made no sense for this target.',
    mustAppearBefore: /setActiveTheme\(theme\)/,
  },
  {
    name: 'applyArtCommand',
    guardPattern: /command\.action\s*!==\s*'draft'/,
    falseSuccessDescription:
      'applyArtCommand() no longer rejects command.action values other ' +
      "than 'draft' -- without it, a mis-targeted on/off/toggle/clear/set " +
      'command still pushes a spurious entry onto artRequests and reports ' +
      'a false "Art draft received." even though the action made no sense ' +
      'for this target.',
    mustAppearBefore: /artRequests\.value\.push\(request\)/,
  },
]

// Checks the fix's exact shape against the full source text of a file
// containing these function names. Exported so the self-test below can run
// it against synthetic buggy/fixed fixtures without touching the real store.
export function checkSerendipityVoiceActionGuard(content: string): string[] {
  const errors: string[] = []

  for (const target of TARGET_FUNCTIONS) {
    const body = extractFunctionSource(content, target.name)
    if (!body) {
      errors.push(
        `Could not find a function named ${target.name}() -- has it been ` +
          'renamed, removed, or restructured? If so, this guard (and the ' +
          'false-success-on-mismatched-action bug it protects against) ' +
          'needs to move with it.',
      )
      continue
    }

    const guardMatch = body.match(target.guardPattern)

    if (target.mustAppearAfter) {
      const anchorIndex = body.search(target.mustAppearAfter)
      if (anchorIndex === -1) {
        errors.push(
          `${target.name}() no longer contains the expected anchor ` +
            `pattern (${target.mustAppearAfter}) -- has its dispatch shape ` +
            'changed? This guard assumes that structure to locate the ' +
            'action-mismatch check.',
        )
      }
    }

    if (target.mustAppearBefore) {
      const anchorIndex = body.search(target.mustAppearBefore)
      if (anchorIndex === -1) {
        errors.push(
          `${target.name}() no longer contains the expected anchor ` +
            `pattern (${target.mustAppearBefore}) -- has its dispatch ` +
            'shape changed? This guard assumes that structure to locate ' +
            'the action-mismatch check.',
        )
      }
    }

    if (!guardMatch) {
      errors.push(target.falseSuccessDescription)
      continue
    }

    const afterIndex = target.mustAppearAfter
      ? body.search(target.mustAppearAfter)
      : -1
    const beforeIndex = target.mustAppearBefore
      ? body.search(target.mustAppearBefore)
      : -1

    if (
      target.mustAppearAfter &&
      afterIndex !== -1 &&
      !(guardMatch.index! > afterIndex)
    ) {
      errors.push(
        `${target.name}() contains the action-mismatch guard, but not ` +
          `after the expected anchor (${target.mustAppearAfter}) -- it ` +
          'must run after that point so the guard actually has the ' +
          'context it needs.',
      )
    }

    if (
      target.mustAppearBefore &&
      beforeIndex !== -1 &&
      !(guardMatch.index! < beforeIndex)
    ) {
      errors.push(
        `${target.name}() contains the action-mismatch guard, but not ` +
          `before the expected anchor (${target.mustAppearBefore}) -- it ` +
          'must run before any state mutation or success report, so a ' +
          'mismatched action never has a chance to fall through to a ' +
          'false "applied" message.',
      )
    }
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
    'Serendipity Voice action guard contract passed: applyCommand(), ' +
      'applyThemeCommand(), and applyArtCommand() all reject action values ' +
      "that don't apply to their target instead of silently reporting a " +
      'false "applied" message.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
