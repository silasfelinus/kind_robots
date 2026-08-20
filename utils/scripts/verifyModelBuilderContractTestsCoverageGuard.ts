// /utils/scripts/verifyModelBuilderContractTestsCoverageGuard.ts
//
// Regression guard (model-builder/t-029, cycle 26) -- every Model Builder
// regression guard this recurring task has added across 25 prior cycles is
// meant to run in CI via a `.github/workflows/contract-tests.yml` step, per
// this task's own established convention ("wired into package.json and
// contract-tests.yml" -- see this task's roadmap note for every prior
// cycle). package.json is where a guard becomes runnable
// (`npm run test:model-builder-*`); contract-tests.yml is what actually
// makes CI enforce it on every PR. The two can drift apart silently: a
// script defined in package.json but never referenced in contract-tests.yml
// still runs fine locally (which is how every prior cycle's own
// verification step -- "ran all N test:model-builder-* npm scripts" --
// would keep reporting success even after the drift), but CI itself never
// executes it, so a regression the guard exists to catch can land on `main`
// with a fully green PR.
//
// Found by cycle 26 doing exactly that comparison: three already-written,
// already-passing guards (verifyModelBuilderApprovedAssetGuard.ts,
// verifyModelBuilderCancelledRunGuard.ts, and
// verifyModelBuilderItemPatchStageGuard.ts -- the last of which directly
// covers prepareItemUpdate() in server/api/model-builder/runs/index.ts, the
// shared stage-editability gate commit.post.ts's own sibling PATCH routes
// rely on) had package.json scripts but no matching `npm run` step in
// contract-tests.yml, for both their selftest and their real-file check.
//
// This asserts the general property, not just those three names, so the
// same class of drift can't silently reoccur for any future guard added
// after this fix: every `test:model-builder-*` script key in package.json
// must appear as an `npm run <script>` line somewhere in
// contract-tests.yml.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const PACKAGE_JSON_PATH = join(repositoryRoot, 'package.json')
const WORKFLOW_PATH = join(
  repositoryRoot,
  '.github/workflows/contract-tests.yml',
)

const MODEL_BUILDER_SCRIPT_PREFIX = 'test:model-builder-'

// Every `test:model-builder-*` script key declared in package.json, sorted
// for stable, readable diffs when reporting a mismatch. Exported so the
// self-test can exercise it against a synthetic scripts map without reading
// the real package.json.
export function modelBuilderScriptNames(
  scripts: Record<string, string>,
): string[] {
  return Object.keys(scripts)
    .filter((key) => key.startsWith(MODEL_BUILDER_SCRIPT_PREFIX))
    .sort()
}

// Checks the real contract: every Model Builder script in `scripts` has a
// corresponding `npm run <script>` line somewhere in `workflowContent`.
// Takes plain strings (not file paths) so the self-test can run the exact
// same logic against synthetic fixtures.
export function checkContractTestsCoverageGuard(
  scripts: Record<string, string>,
  workflowContent: string,
): string[] {
  const missing = modelBuilderScriptNames(scripts).filter(
    (script) => !workflowContent.includes(`npm run ${script}`),
  )

  return missing.map(
    (script) =>
      `package.json defines "${script}" but contract-tests.yml never runs it ` +
      `(no \`npm run ${script}\` line) -- this guard exists in the repo and ` +
      'passes locally, but CI never executes it, so a regression it protects ' +
      'against could land on main with a fully green PR. Add a step to ' +
      '.github/workflows/contract-tests.yml.',
  )
}

function main(): void {
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8')) as {
    scripts?: Record<string, string>
  }
  const workflowContent = readFileSync(WORKFLOW_PATH, 'utf8')
  const errors = checkContractTestsCoverageGuard(
    pkg.scripts ?? {},
    workflowContent,
  )

  if (errors.length) {
    console.error(
      'Model Builder contract-tests coverage guard failed -- ' +
        `${errors.length} package.json script(s) are not wired into ` +
        'contract-tests.yml:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder contract-tests coverage guard passed: every ' +
      'test:model-builder-* script in package.json is run by ' +
      'contract-tests.yml.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
