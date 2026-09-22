// /utils/scripts/verifyStorybookPageChoiceGroupGuard.ts
//
// Regression guard (storybook/t-062) -- components/conductor/storybook-page.vue
// duplicates the "Narrator voice" and "Shape of the tale" choice grids that
// components/storybook/storybook-visual-setup.vue also renders (both build the
// same StorybookStartInput draft). storybook/t-010
// (verifyStorybookVisualSetupChoiceGroupGuard.ts) gave that sibling file's two
// grids role="group" + a matching aria-label, but this file's own copies were
// never audited and stayed ungrouped: a set of individually meaningful,
// mutually-exclusive :aria-pressed buttons with no container tying them
// together as one named set for assistive tech.
//
// Fixed by giving each grid container role="group" and an aria-label matching
// its own heading ("Narrator voice" / "Shape of the tale"), same shape as the
// sibling file's fix.
//
// This asserts the textual shape of that fix stays in place -- deliberately
// scoped to these two template regions over a general-purpose static
// analyzer, mirroring this project's other narrow textual guards (see
// verifyStorybookVisualSetupChoiceGroupGuard.ts, verifyDaVinciDimensionGroupGuard.ts).
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const COMPONENT_PATH = join(
  repositoryRoot,
  'components/conductor/storybook-page.vue',
)

interface ChoiceGroupSpec {
  label: string
  loopMarker: string
}

// Anchored on each grid's own `v-for` loop marker, which sits immediately
// inside the grid container, so this guard can report *how* a grid
// regressed (missing entirely vs. still present but ungrouped) instead of
// just "not found".
const CHOICE_GROUPS: ChoiceGroupSpec[] = [
  {
    label: 'Narrator voice',
    loopMarker: 'v-for="style in STORYBOOK_NARRATOR_STYLES"',
  },
  {
    label: 'Shape of the tale',
    loopMarker: 'v-for="structure in STORYBOOK_STRUCTURES"',
  },
]

function extractGridRegion(content: string, loopMarker: string): string | null {
  const loopIndex = content.indexOf(loopMarker)
  if (loopIndex === -1) return null

  // The grid container's opening tag sits some distance *before* the loop
  // marker (the v-for lives on the button, one level in), and the button's
  // own attributes sit some distance after it. Slicing a window around the
  // marker comfortably covers the grid container's opening tag on both
  // sides without needing a real HTML parser for a narrow textual check.
  const start = Math.max(0, loopIndex - 400)
  const end = Math.min(content.length, loopIndex + 400)
  return content.slice(start, end)
}

export function checkStorybookPageChoiceGroupGuard(content: string): string[] {
  const errors: string[] = []

  for (const { label, loopMarker } of CHOICE_GROUPS) {
    const region = extractGridRegion(content, loopMarker)
    if (!region) {
      errors.push(
        `Could not find the \`${loopMarker}\` marker in ` +
          'storybook-page.vue -- has the ' +
          `"${label}" grid been restructured or removed? If so, this ` +
          'guard needs to move with it.',
      )
      continue
    }

    if (!region.includes('role="group"')) {
      errors.push(
        `The "${label}" grid container no longer has role="group" -- ` +
          'its choice buttons are no longer tied together as one named ' +
          'set for assistive tech, the exact regression this guard ' +
          'exists to catch.',
      )
    }

    if (!region.includes(`aria-label="${label}"`)) {
      errors.push(
        `The "${label}" grid container no longer has ` +
          `aria-label="${label}" -- the group has lost its accessible ` +
          'name.',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(COMPONENT_PATH, 'utf8')
  const errors = checkStorybookPageChoiceGroupGuard(content)

  if (errors.length) {
    console.error(
      'Storybook page choice-group guard contract failed in ' +
        'storybook-page.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Storybook page choice-group guard contract passed: the ' +
      '"Narrator voice" and "Shape of the tale" grids still tie their ' +
      'choice buttons together with role="group" + a matching aria-label ' +
      'instead of exposing them as unrelated buttons.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
