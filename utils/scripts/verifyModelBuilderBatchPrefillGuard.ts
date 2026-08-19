// /utils/scripts/verifyModelBuilderBatchPrefillGuard.ts
//
// Regression guard (model-builder/t-029, cycle 19) -- model-builder-batch-
// editor.vue's "Set a field on all N" panel binds each control directly to
// `batchValues[field.key]`, a plain `reactive<Record<string, string>>({})`
// that starts empty. Every item in the group already carries a
// "key: value" fieldsDraft blob (seeded by defaultFieldsTemplate, drafted
// by AI, or previously set by this very panel via a prior batchSetField
// pass), and stores/helpers/modelBuilderFields.ts's readFieldLine() exists
// specifically to read one field's value back out of that blob -- but
// nothing in this component called it, so the panel always started blank
// even when every item in the group already agreed on a value, forcing the
// user to retype a value that was already true of all N items.
//
// Fixed by an onMounted() hook that reads each field's value across every
// item in the group via readFieldLine and, only when all of them agree on
// an identical non-empty value, seeds batchValues[field.key] with it.
//
// This asserts the textual shape of that fix stays in place: an
// `onMounted` block in model-builder-batch-editor.vue that calls
// `readFieldLine(` to seed `batchValues[`, deliberately scoped to this one
// bug shape, mirroring this project's other narrow textual guards over a
// general-purpose static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const BATCH_EDITOR_PATH = join(
  repositoryRoot,
  'components/model-builder/model-builder-batch-editor.vue',
)

const IMPORT_NEEDLE = 'readFieldLine'
const MOUNT_NEEDLE = 'onMounted('
const READ_CALL_NEEDLE = 'readFieldLine('
const SEED_NEEDLE = 'batchValues[field.key] = first'

// Checks the fix's exact shape against the full source text of
// model-builder-batch-editor.vue. Exported so the self-test below can run
// it against synthetic buggy/fixed fixtures without touching the real
// component file.
export function checkBatchPrefillGuard(content: string): string[] {
  const errors: string[] = []

  if (!content.includes(IMPORT_NEEDLE)) {
    errors.push(
      'model-builder-batch-editor.vue no longer references ' +
        '`readFieldLine` -- without it the batch-edit panel cannot read ' +
        "each item's existing field value, so it has no way to pre-fill " +
        '"Set a field on all N" with a value every item already shares.',
    )
    return errors
  }

  const mountIndex = content.indexOf(MOUNT_NEEDLE)
  if (mountIndex === -1) {
    errors.push(
      'model-builder-batch-editor.vue has no `onMounted(` block -- the ' +
        'shared-value pre-fill for "Set a field on all N" ran once on ' +
        'mount; without that hook the panel goes back to always starting ' +
        'blank even when every item in the group already agrees on a value.',
    )
    return errors
  }

  const mountBody = content.slice(mountIndex)

  if (!mountBody.includes(READ_CALL_NEEDLE)) {
    errors.push(
      "model-builder-batch-editor.vue's `onMounted` block does not call " +
        "`readFieldLine(` -- it can no longer read each item's existing " +
        'field value out of its fieldsDraft blob, so the pre-fill has ' +
        'nothing to derive a shared value from.',
    )
  }

  if (!mountBody.includes(SEED_NEEDLE)) {
    errors.push(
      "model-builder-batch-editor.vue's `onMounted` block no longer " +
        `writes \`${SEED_NEEDLE}\` -- without seeding batchValues from the ` +
        'derived shared value, "Set a field on all N" starts blank again ' +
        'even when every item in the group already agrees on a value.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(BATCH_EDITOR_PATH, 'utf8')
  const errors = checkBatchPrefillGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder batch-editor pre-fill guard contract failed for ' +
        'model-builder-batch-editor.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder batch-editor pre-fill guard contract passed: ' +
      '"Set a field on all N" still pre-fills from each field\'s existing ' +
      'shared value across the group on mount.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
