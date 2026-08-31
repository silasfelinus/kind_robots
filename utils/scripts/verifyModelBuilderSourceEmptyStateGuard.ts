// /utils/scripts/verifyModelBuilderSourceEmptyStateGuard.ts
//
// Regression guard (model-builder/t-029, cycle 68) -- the source-picker's
// v-if/v-else-if chain over `store.sourceType` covered "no type picked yet"
// (store.sourceType unset), "still fetching" (store.loadingSources), and
// "fetch failed" (store.sourcesError), then fell straight through to three
// viewMode-keyed render branches (gallery/grid/list) that all iterate
// `store.sources`. A successful fetch that resolved to zero records matched
// none of the three named states and none of the viewMode branches guard
// against an empty array, so it silently rendered a blank panel -- no
// indication the load had actually finished, unlike every other terminal
// state in the same chain (loading has role="status" text, error has
// role="alert" text and a Retry button).
//
// Cycle 55 first identified this gap (source-picker data-fetch/error-
// handling audit) but could not land the fix in that pass; this asserts the
// empty-state branch it described stays in place: a `v-else-if` keyed to
// `!store.sources.length`, positioned after the error branch and before the
// viewMode branches so it wins the chain before any of them can render an
// empty grid.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const SOURCE_PICKER_PATH = join(
  repositoryRoot,
  'components/model-builder/model-builder-source-picker.vue',
)

const ERROR_MARKER = 'v-else-if="store.sourcesError"'
const EMPTY_MARKER = 'v-else-if="!store.sources.length"'
const GALLERY_MARKER = 'v-else-if="viewMode === \'gallery\'"'

export function checkSourceEmptyStateGuard(content: string): string[] {
  const errors: string[] = []

  const errorIndex = content.indexOf(ERROR_MARKER)
  if (errorIndex === -1) {
    errors.push(
      `Could not find the \`${ERROR_MARKER}\` block in ` +
        'model-builder-source-picker.vue -- has the sourcesError state been ' +
        'renamed, removed, or restructured? If so, this guard needs to move ' +
        'with it.',
    )
    return errors
  }

  const emptyIndex = content.indexOf(EMPTY_MARKER)
  if (emptyIndex === -1) {
    errors.push(
      'model-builder-source-picker.vue no longer has an ' +
        `\`${EMPTY_MARKER}\` branch -- a successful load that resolves to ` +
        'zero records will fall through to a viewMode branch and render a ' +
        'blank panel with no feedback, instead of an explicit empty state.',
    )
    return errors
  }

  const galleryIndex = content.indexOf(GALLERY_MARKER)
  if (galleryIndex === -1) {
    errors.push(
      `Could not find the \`${GALLERY_MARKER}\` block in ` +
        'model-builder-source-picker.vue -- has the gallery view mode been ' +
        'renamed, removed, or restructured? If so, this guard needs to move ' +
        'with it.',
    )
    return errors
  }

  if (!(errorIndex < emptyIndex && emptyIndex < galleryIndex)) {
    errors.push(
      "model-builder-source-picker.vue's empty-state branch must sit " +
        'between the sourcesError branch and the viewMode branches in the ' +
        'v-if/v-else-if chain -- found it out of order, so it either never ' +
        'wins (shadowed by an earlier branch) or wins too early (shadowing ' +
        'the error state).',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(SOURCE_PICKER_PATH, 'utf8')
  const errors = checkSourceEmptyStateGuard(content)

  if (errors.length) {
    console.error('Model Builder source empty-state guard contract failed:')
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder source empty-state guard contract passed: a successful ' +
      'zero-record load still renders an explicit empty state.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
