// /utils/scripts/verifyModelBuilderContractTestsCoverageGuard.test.ts
//
// Regression test for checkContractTestsCoverageGuard() in
// verifyModelBuilderContractTestsCoverageGuard.ts (model-builder/t-029,
// cycle 26). Exercises the real check against synthetic package.json
// scripts maps and contract-tests.yml fixtures covering: fully wired
// (passes), one script missing its wiring (fails, names exactly that
// script), both selftest and real-check missing for a guard (fails twice),
// and non-model-builder scripts being ignored entirely.
import assert from 'node:assert/strict'

import {
  checkContractTestsCoverageGuard,
  modelBuilderScriptNames,
} from './verifyModelBuilderContractTestsCoverageGuard.js'

const SCRIPTS = {
  'test:model-builder-widget-guard-selftest':
    'tsx utils/scripts/verifyModelBuilderWidgetGuard.test.ts',
  'test:model-builder-widget-guard':
    'tsx utils/scripts/verifyModelBuilderWidgetGuard.ts',
  'test:model-builder-gadget-guard-selftest':
    'tsx utils/scripts/verifyModelBuilderGadgetGuard.test.ts',
  'test:model-builder-gadget-guard':
    'tsx utils/scripts/verifyModelBuilderGadgetGuard.ts',
  // Deliberately NOT model-builder-prefixed -- must never appear in the
  // guard's output even though it's also "missing" from the workflow below.
  'test:unrelated-thing': 'tsx utils/scripts/verifyUnrelatedThing.ts',
}

const FULLY_WIRED_WORKFLOW = `
      - name: Model Builder widget guard checker self-test
        run: npm run test:model-builder-widget-guard-selftest

      - name: Model Builder widget guard contract
        run: npm run test:model-builder-widget-guard

      - name: Model Builder gadget guard checker self-test
        run: npm run test:model-builder-gadget-guard-selftest

      - name: Model Builder gadget guard contract
        run: npm run test:model-builder-gadget-guard
`

const PARTIALLY_WIRED_WORKFLOW = `
      - name: Model Builder widget guard checker self-test
        run: npm run test:model-builder-widget-guard-selftest

      - name: Model Builder widget guard contract
        run: npm run test:model-builder-widget-guard
`

function run(): void {
  const names = modelBuilderScriptNames(SCRIPTS)
  assert.deepEqual(
    names,
    [
      'test:model-builder-gadget-guard',
      'test:model-builder-gadget-guard-selftest',
      'test:model-builder-widget-guard',
      'test:model-builder-widget-guard-selftest',
    ],
    `expected only the four model-builder-prefixed scripts, sorted, got: ${JSON.stringify(names)}`,
  )

  const fullyWiredErrors = checkContractTestsCoverageGuard(
    SCRIPTS,
    FULLY_WIRED_WORKFLOW,
  )
  assert.deepEqual(
    fullyWiredErrors,
    [],
    `expected the fully-wired fixture to pass, got: ${JSON.stringify(fullyWiredErrors)}`,
  )

  const partiallyWiredErrors = checkContractTestsCoverageGuard(
    SCRIPTS,
    PARTIALLY_WIRED_WORKFLOW,
  )
  assert.equal(
    partiallyWiredErrors.length,
    2,
    'expected the gadget guard (selftest + real check, both missing from ' +
      `the workflow) to produce exactly two errors, got: ${JSON.stringify(partiallyWiredErrors)}`,
  )
  assert.match(partiallyWiredErrors[0]!, /"test:model-builder-gadget-guard"/)
  assert.match(
    partiallyWiredErrors[1]!,
    /"test:model-builder-gadget-guard-selftest"/,
  )
  // The unrelated non-model-builder script is also absent from the workflow
  // fixture, but must never be flagged.
  for (const error of partiallyWiredErrors) {
    assert.doesNotMatch(error, /unrelated-thing/)
  }

  const emptyErrors = checkContractTestsCoverageGuard({}, '')
  assert.deepEqual(
    emptyErrors,
    [],
    'expected no scripts to produce no errors regardless of workflow content',
  )

  console.log(
    'Model Builder contract-tests coverage guard checker verified: passes ' +
      'when every test:model-builder-* script is wired, flags exactly the ' +
      'missing ones by name, and ignores non-model-builder scripts.',
  )
}

run()
