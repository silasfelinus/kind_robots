// /utils/scripts/verifyDaVinciDimensionGroupGuard.ts
//
// Regression guard (davinci/t-021 slice 7) -- the ten-pill dimension grid in
// components/conductor/davinci-page.vue rendered each stat as an
// individually meaningful pill (label + value, plus a hover-only :title),
// but the grid container itself carried no role/aria-label tying the ten
// pills together as one set. That is the exact gap kr-choice-list.vue's own
// doc comment -- and this file's own slice-6 fix -- closed for the chapter
// choices ("no role="group"/aria-label tying the options together as one
// choice set"), just left open here for the dimension grid instead. The
// same "group of individually meaningful items" shape gets role="group" +
// aria-label elsewhere in the app: kr-choice-list.vue itself,
// narrative-role-assigner.vue's protagonist/antagonist lists,
// brainstorm-manager.vue's direction/shape rows, and this project's own
// sibling storybook-page.vue setup-progress nav (aria-label="Story setup
// progress").
//
// Fixed by giving the grid container role="group" and
// aria-label="Life dimensions".
//
// This asserts the textual shape of that fix stays in place -- deliberately
// scoped to this one template region over a general-purpose static
// analyzer, mirroring this project's other narrow textual guards (see
// verifyDaVinciDimensionToneGuard.ts, verifyDaVinciChoiceListGuard.ts).
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const COMPONENT_PATH = join(
  repositoryRoot,
  'components/conductor/davinci-page.vue',
)

// Anchored on the `v-for="dim in DAVINCI_DIMENSIONS"` pill loop, which sits
// immediately inside the grid container in both the old and new markup, so
// this guard can report *how* the grid regressed (missing entirely vs.
// still present but ungrouped) instead of just "not found".
const PILL_LOOP_MARKER = 'v-for="dim in DAVINCI_DIMENSIONS"'

function extractDimensionGridRegion(content: string): string | null {
  const loopIndex = content.indexOf(PILL_LOOP_MARKER)
  if (loopIndex === -1) return null

  // The grid container's opening tag sits some distance *before* the loop
  // marker (the v-for lives on the pill div, one level in), and the pills'
  // own attributes sit some distance after it. Slicing a window around the
  // marker comfortably covers the grid container's opening tag on both
  // sides without needing a real HTML parser for a narrow textual check.
  const start = Math.max(0, loopIndex - 400)
  const end = Math.min(content.length, loopIndex + 400)
  return content.slice(start, end)
}

export function checkDimensionGroupGuard(content: string): string[] {
  const errors: string[] = []

  const region = extractDimensionGridRegion(content)
  if (!region) {
    errors.push(
      `Could not find the \`${PILL_LOOP_MARKER}\` marker in ` +
        'davinci-page.vue -- has the dimension grid been restructured or ' +
        'removed? If so, this guard needs to move with it.',
    )
    return errors
  }

  if (!region.includes('role="group"')) {
    errors.push(
      'The dimension grid container no longer has role="group" -- the ' +
        'ten stat pills are no longer tied together as one named set for ' +
        'assistive tech, the exact regression this guard exists to catch.',
    )
  }

  if (!region.includes('aria-label="Life dimensions"')) {
    errors.push(
      'The dimension grid container no longer has ' +
        'aria-label="Life dimensions" -- the group has lost its accessible ' +
        'name.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(COMPONENT_PATH, 'utf8')
  const errors = checkDimensionGroupGuard(content)

  if (errors.length) {
    console.error(
      'Da Vinci dimension-group guard contract failed in davinci-page.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Da Vinci dimension-group guard contract passed: the dimension grid ' +
      'still ties its ten stat pills together with role="group" + ' +
      'aria-label="Life dimensions" instead of exposing them as ten ' +
      'unrelated items.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
