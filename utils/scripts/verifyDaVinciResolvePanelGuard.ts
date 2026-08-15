// /utils/scripts/verifyDaVinciResolvePanelGuard.ts
//
// Regression guard (davinci/t-021 slice 3) -- the "See your ending" resolve
// panel in components/conductor/davinci-page.vue is a standalone `v-if`, not
// part of the `v-if`/`v-else-if` chain above it that switches between the
// narrating / narrationError / currentChapter states. Its condition was
// `!narrating && (canEndRun || !currentChapter)`.
//
// narrateChapter() clears `aiChapter` (making the `currentChapter` computed
// null) *before* sending the request that can then fail, and only
// repopulates it on success. So while a narration failure is being shown --
// `narrating` is false and `narrationError` is set -- `currentChapter` is
// also null, which made `!currentChapter` true. The resolve panel rendered
// stacked underneath the narration-error retry panel, offering "See your
// ending" with the misleading copy "Your chapters are told. It's time to
// see how this life resolves" at the same time as "Try again" / "Play the
// written chapters instead" -- even at chapter 1 with zero recorded choices.
//
// Fixed by excluding narrationError from the resolve panel's condition:
// `!narrating && !narrationError && (canEndRun || !currentChapter)`. This
// asserts the textual shape of that fix stays in place: the resolve panel's
// `v-if` condition still excludes narrationError, deliberately scoped to
// this one template condition, mirroring this project's other narrow
// textual guards over a general-purpose static analyzer (see
// verifyDaVinciDimensionToneGuard.ts).
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const COMPONENT_PATH = join(
  repositoryRoot,
  'components/conductor/davinci-page.vue',
)

// Anchored on the resolveLife button's click handler rather than any
// particular wording of the condition itself, so this guard can still
// report *which* part of the condition regressed instead of just "not
// found" when e.g. canEndRun is dropped from it.
const CLICK_MARKER = '@click="resolveLife"'

function extractResolvePanelCondition(content: string): string | null {
  const clickIndex = content.indexOf(CLICK_MARKER)
  if (clickIndex === -1) return null

  const tagStart = content.lastIndexOf('<div', clickIndex)
  if (tagStart === -1) return null
  const tagEnd = content.indexOf('>', tagStart)
  if (tagEnd === -1) return null
  const openingTag = content.slice(tagStart, tagEnd + 1)

  const attrPrefix = 'v-if="'
  const attrStart = openingTag.indexOf(attrPrefix)
  if (attrStart === -1) return null

  const valueStart = attrStart + attrPrefix.length
  const valueEnd = openingTag.indexOf('"', valueStart)
  if (valueEnd === -1) return null

  return openingTag.slice(valueStart, valueEnd)
}

export function checkResolvePanelGuard(content: string): string[] {
  const errors: string[] = []

  const condition = extractResolvePanelCondition(content)
  if (!condition) {
    errors.push(
      'Could not find a `<div v-if="...">` wrapping a ' +
        `\`${CLICK_MARKER}\` button in davinci-page.vue -- has the ` +
        'resolve/ending panel been restructured or removed? If so, this ' +
        'guard needs to move with it.',
    )
    return errors
  }

  if (!condition.includes('!narrationError')) {
    errors.push(
      "The resolve/ending panel's v-if condition no longer excludes " +
        '`narrationError` -- this is the exact bug this guard exists to ' +
        'catch: narrateChapter() clears aiChapter (making currentChapter ' +
        'null) before a request that then fails, so without this exclusion ' +
        '`!currentChapter` is also true during a narration failure and the ' +
        '"See your ending" panel renders stacked underneath the ' +
        'narration-error retry panel with a misleading "chapters are told" ' +
        'message -- even at chapter 1 with zero recorded choices.',
    )
  }

  if (!condition.includes('!narrating')) {
    errors.push(
      "The resolve/ending panel's v-if condition no longer excludes " +
        '`narrating` -- the panel could render while the narrator is still ' +
        'composing the current chapter.',
    )
  }

  if (!condition.includes('canEndRun')) {
    errors.push(
      "The resolve/ending panel's v-if condition no longer references " +
        '`canEndRun` -- has the "end any time after chapter 6" rule been ' +
        'dropped?',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(COMPONENT_PATH, 'utf8')
  const errors = checkResolvePanelGuard(content)

  if (errors.length) {
    console.error(
      'Da Vinci resolve-panel guard contract failed in davinci-page.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Da Vinci resolve-panel guard contract passed: the "See your ending" ' +
      'panel stays excluded while a narration error is being shown, so it ' +
      "never stacks underneath the narration-error retry panel's " +
      'contradictory "chapters are told" copy.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
