// /utils/scripts/verifyStorybookVisualSetupChoiceGroupGuard.ts
//
// Regression guard (storybook/t-010) -- the "Narrator voice" and "Shape of
// the tale" grids in components/storybook/storybook-visual-setup.vue each
// render a set of individually meaningful, mutually-exclusive choice
// buttons (label + description + :aria-pressed), but neither grid container
// carried a role/aria-label tying its own options together as one named
// set. That is the exact gap kr-choice-list.vue's own doc comment, and this
// project's own storybook-life-run.vue dimension-grid fix
// (verifyDaVinciDimensionGroupGuard.ts), already closed elsewhere: the same
// "group of individually meaningful items" shape gets role="group" +
// aria-label at kr-choice-list.vue itself, narrative-role-assigner.vue's
// protagonist/antagonist lists, brainstorm-manager.vue's direction/shape
// rows, and storybook-page.vue's setup-progress nav.
//
// Fixed by giving each grid container role="group" and an aria-label
// matching its own heading ("Narrator voice" / "Shape of the tale").
//
// This asserts the textual shape of that fix stays in place -- deliberately
// scoped to these two template regions over a general-purpose static
// analyzer, mirroring this project's other narrow textual guards (see
// verifyDaVinciDimensionGroupGuard.ts, verifyDaVinciChoiceListGuard.ts).
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const COMPONENT_PATH = join(
  repositoryRoot,
  'components/storybook/storybook-visual-setup.vue',
)

interface ChoiceGroupSpec {
  label: string
  loopMarker: string
}

// Anchored on each grid's own `v-for` loop marker, which sits immediately
// inside the grid container in both the old and new markup, so this guard
// can report *how* a grid regressed (missing entirely vs. still present but
// ungrouped) instead of just "not found".
const CHOICE_GROUPS: ChoiceGroupSpec[] = [
  { label: 'Narrator voice', loopMarker: 'v-for="option in narratorCards"' },
  { label: 'Shape of the tale', loopMarker: 'v-for="option in structureCards"' },
]

function extractGridRegion(content: string, loopMarker: string): string | null {
  const loopIndex = content.indexOf(loopMarker)
  if (loopIndex === -1) return null

  // The grid container's opening tag sits some distance *before* the loop
  // marker (the v-for lives on the button div, one level in), and the
  // button's own attributes sit some distance after it. Slicing a window
  // around the marker comfortably covers the grid container's opening tag
  // on both sides without needing a real HTML parser for a narrow textual
  // check.
  const start = Math.max(0, loopIndex - 400)
  const end = Math.min(content.length, loopIndex + 400)
  return content.slice(start, end)
}

export function checkStorybookVisualSetupChoiceGroupGuard(
  content: string,
): string[] {
  const errors: string[] = []

  for (const { label, loopMarker } of CHOICE_GROUPS) {
    const region = extractGridRegion(content, loopMarker)
    if (!region) {
      errors.push(
        `Could not find the \`${loopMarker}\` marker in ` +
          'storybook-visual-setup.vue -- has the ' +
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
  const errors = checkStorybookVisualSetupChoiceGroupGuard(content)

  if (errors.length) {
    console.error(
      'Storybook visual-setup choice-group guard contract failed in ' +
        'storybook-visual-setup.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Storybook visual-setup choice-group guard contract passed: the ' +
      '"Narrator voice" and "Shape of the tale" grids still tie their ' +
      'choice buttons together with role="group" + a matching aria-label ' +
      'instead of exposing them as unrelated buttons.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
