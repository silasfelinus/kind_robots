// /utils/scripts/verifyDaVinciNarrationErrorToneGuard.ts
//
// Regression guard (davinci/t-021 slice 2) -- the narration-error callout in
// components/conductor/davinci-page.vue used `border-warning/40 bg-warning/5`,
// half the documented canonical opacity for a warning status callout
// (assets/css/tailwind.css's .kr-note-warning formula, and every other
// border-warning/40 callout in the app, use bg-warning/10). The border
// opacity was already correct, which made the drift easy to miss on a
// visual skim -- only the background was half-strength, giving this one
// callout a visibly fainter tint than every sibling warning callout
// elsewhere in the app.
//
// Fixed by bringing the background opacity token in line with the
// canonical border-warning/40 + bg-warning/10 pair. This asserts the
// textual shape of that fix stays in place: the narration-error block still
// pairs border-warning/40 with bg-warning/10, not bg-warning/5 or any other
// opacity -- deliberately scoped to this one template class string, mirroring
// this project's other narrow textual guards over a general-purpose static
// analyzer (see verifyDaVinciDimensionToneGuard.ts).
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const COMPONENT_PATH = join(
  repositoryRoot,
  'components/conductor/davinci-page.vue',
)

function extractNarrationErrorBlock(content: string): string | null {
  const marker = content.indexOf('v-else-if="narrationError"')
  if (marker === -1) return null

  // Walk backward to the start of this element's opening tag, and forward
  // to the end of the opening tag, so we isolate just the tag's attributes
  // (in particular its class string) rather than the whole block's body.
  const tagStart = content.lastIndexOf('<div', marker)
  if (tagStart === -1) return null
  const tagEnd = content.indexOf('>', marker)
  if (tagEnd === -1) return null

  return content.slice(tagStart, tagEnd + 1)
}

export function checkNarrationErrorToneGuard(content: string): string[] {
  const errors: string[] = []

  const openingTag = extractNarrationErrorBlock(content)
  if (!openingTag) {
    errors.push(
      'Could not find a `v-else-if="narrationError"` block in ' +
        'davinci-page.vue -- has the narration-error callout been renamed, ' +
        'removed, or restructured? If so, this guard needs to move with it.',
    )
    return errors
  }

  if (!openingTag.includes('border-warning/40')) {
    errors.push(
      'The narration-error callout no longer uses border-warning/40 -- ' +
        'has its border tone been changed?',
    )
  }

  if (!openingTag.includes('bg-warning/10')) {
    if (/bg-warning\/\d+/.test(openingTag)) {
      const found = openingTag.match(/bg-warning\/\d+/)?.[0]
      errors.push(
        `The narration-error callout uses ${found} instead of the ` +
          'canonical bg-warning/10 -- this is the exact opacity-drift bug ' +
          '(half-strength background tint vs. every other border-warning/40 ' +
          'callout in the app) this guard exists to catch.',
      )
    } else {
      errors.push(
        'The narration-error callout no longer sets a bg-warning/* ' +
          'background tint at all.',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(COMPONENT_PATH, 'utf8')
  const errors = checkNarrationErrorToneGuard(content)

  if (errors.length) {
    console.error(
      'Da Vinci narration-error tone guard contract failed in davinci-page.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Da Vinci narration-error tone guard contract passed: the narration-error ' +
      'callout pairs border-warning/40 with the canonical bg-warning/10, ' +
      'matching every other warning callout in the app.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
