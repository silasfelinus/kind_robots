// /utils/scripts/verifyModelBuilderErrorPersistenceGuard.ts
//
// Regression guard (model-builder/t-029). `ModelBuildItem.error` is a real,
// client-writable server column (prisma/model-builder.prisma; accepted by
// ItemPatchBody in server/api/model-builder/runs/index.ts, see `error` in
// prepareItemUpdate) that item-panel.vue's error banner
// (`v-if="item.error"`) and model-builder-progress-matrix.vue's / model-
// builder-batch-editor.vue's per-item "failed" badge both read -- but every
// failure branch in generateItemAsset, generateItemAssetAsync,
// pollAsyncArtJob, and commitItem used to only mutate the local reactive
// `item.error`, never push it to the server. adaptItem always rebuilds a
// fresh item from `server.error ?? null` on resume/reopen/reload (the same
// class of bug fixed for stageStatuses/sourceSnapshot by
// verifyModelBuilderStageStatusJsonParseGuard.ts), so a real, still-
// unresolved failure -- and the badge that depends on it -- silently
// vanished the moment the page reloaded or the run was reopened from Run
// History, even though the item was still stuck exactly where it failed.
//
// This walks each target function in modelBuilderStore.ts and requires its
// body to contain at least one `pushItem(item, { ... error: ... })` call --
// i.e. that the function actually persists item.error somewhere, on some
// path, rather than only mutating it locally. Deliberately a presence check
// (mirroring verifyModelBuilderAutoBuildOutcomePersistenceGuard.ts's own
// style) rather than proving every single branch pushes -- a future
// refactor that drops ALL such calls from a function fails loudly; the
// finer-grained "does every failure branch push" property is exercised by
// this guard's own self-test fixtures instead.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const TARGET_FUNCTIONS = [
  'generateItemAsset',
  'generateItemAssetAsync',
  'pollAsyncArtJob',
  'commitItem',
] as const

// A pushItem(...) call whose object-literal payload includes `error` as a
// key. Matches both `pushItem(item, { error: ... })` (possibly among other
// keys, in either order, across lines) and does not require it to be the
// only field -- generateItemAsset's success path piggybacks `error: null`
// onto its existing `stageStatuses`/`artImageId` payload rather than firing
// a second request.
const PUSHES_ERROR = /pushItem\(\s*item,\s*\{[^}]*\berror\s*:/s

// Checks the fix's exact shape against the full source text of a file
// containing these function names. Exported so the self-test below can run
// it against synthetic buggy/fixed fixtures without touching the real store.
export function checkErrorPersistenceGuard(content: string): string[] {
  const errors: string[] = []

  const functions = extractFunctionBodies(content)

  for (const name of TARGET_FUNCTIONS) {
    const fn = functions.find((f) => f.name === name)
    if (!fn) {
      errors.push(
        `Could not find a function named ${name}() -- has it been renamed, ` +
          'removed, or inlined? If so, this guard (and the item.error ' +
          'persistence it protects) needs to move with it.',
      )
      continue
    }

    if (!PUSHES_ERROR.test(fn.body)) {
      errors.push(
        `${name}() sets item.error somewhere but never pushes it to the ` +
          'server (expected a `pushItem(item, { ..., error: ... })` call ' +
          'in its body). Without it, a genuine failure this function ' +
          "records is only local reactive state -- item-panel.vue's error " +
          'banner and the per-item "failed" badge in model-builder-' +
          'progress-matrix.vue / model-builder-batch-editor.vue both go ' +
          'silently blank the next time this item resumes, reopens, or ' +
          'reloads, even though nothing about it was actually fixed.',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkErrorPersistenceGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder item.error persistence guard contract failed in ' +
        'modelBuilderStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder item.error persistence guard contract passed: ' +
      'generateItemAsset(), generateItemAssetAsync(), pollAsyncArtJob(), ' +
      'and commitItem() all push item.error to the server, so a real ' +
      'failure (and the badge/banner reading it) survives resume/reopen/' +
      'reload instead of only ever existing in local reactive state.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
