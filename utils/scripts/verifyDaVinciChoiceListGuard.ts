// /utils/scripts/verifyDaVinciChoiceListGuard.ts
//
// Regression guard (davinci/t-021 slice 6) -- the "playing" chapter's choice
// buttons in components/conductor/davinci-page.vue used to be a hand-rolled
// `v-for` of plain `btn-outline` buttons: the fourth separate implementation
// of exactly the pick-one-option list kr-choice-list.vue's own doc comment
// says it exists to unify ("replaces at least three separate
// implementations of the same idea"). The duplicate had no
// role="group"/aria-label tying the buttons together as one choice set, and
// none of the focus-visible/motion-reduce/disabled:pointer-events-none
// guards every other narrative choice list gets for free.
//
// Fixed by rendering <kr-choice-list> instead, matching kr-narrator-stage,
// workspace-narrator, narrative-response-composer, kr-chat-window,
// scenario-story, and taskmaster-page. This asserts the textual shape of
// that fix stays in place -- the chapter choices still go through
// kr-choice-list rather than a hand-rolled button loop -- deliberately
// scoped to this one template region over a general-purpose static
// analyzer, mirroring this project's other narrow textual guards (see
// verifyDaVinciDimensionToneGuard.ts, verifyDaVinciResolvePanelGuard.ts).
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const COMPONENT_PATH = join(
  repositoryRoot,
  'components/conductor/davinci-page.vue',
)

// Anchored on the currentChapter block's narrative paragraph, which sits
// immediately above the choice list in both the old and new markup, so this
// guard can report *how* the choice region regressed (missing entirely vs.
// reverted to a hand-rolled loop) instead of just "not found".
const NARRATIVE_MARKER = '{{ currentChapter.narrative }}'

function extractChoiceRegion(content: string): string | null {
  const narrativeIndex = content.indexOf(NARRATIVE_MARKER)
  if (narrativeIndex === -1) return null

  // The next closing }} after milestoneCandidate (or the section's closing
  // </div> if that paragraph is absent) bounds the region reliably enough
  // for a narrow textual check; slicing ~2000 chars past the narrative
  // marker comfortably covers the choice list markup either shape produces.
  return content.slice(narrativeIndex, narrativeIndex + 2000)
}

export function checkChoiceListGuard(content: string): string[] {
  const errors: string[] = []

  const region = extractChoiceRegion(content)
  if (!region) {
    errors.push(
      `Could not find the \`${NARRATIVE_MARKER}\` marker in ` +
        'davinci-page.vue -- has the currentChapter block been ' +
        'restructured or removed? If so, this guard needs to move with it.',
    )
    return errors
  }

  if (!region.includes('<kr-choice-list')) {
    errors.push(
      'The chapter choices no longer render through <kr-choice-list> -- ' +
        'this is the exact regression this guard exists to catch: a ' +
        'hand-rolled v-for of plain buttons loses the shared role="group"/' +
        'aria-label choice-set semantics and the focus-visible/' +
        'motion-reduce/disabled:pointer-events-none guards every other ' +
        'narrative choice list gets for free.',
    )
  }

  if (region.includes('<kr-choice-list') && !region.includes('@select=')) {
    errors.push(
      'The <kr-choice-list> in the chapter-choice region has no @select ' +
        'handler -- picking an option would no longer do anything.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(COMPONENT_PATH, 'utf8')
  const errors = checkChoiceListGuard(content)

  if (errors.length) {
    console.error(
      'Da Vinci choice-list guard contract failed in davinci-page.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Da Vinci choice-list guard contract passed: chapter choices still ' +
      'render through the shared <kr-choice-list> primitive rather than a ' +
      'hand-rolled button loop.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
