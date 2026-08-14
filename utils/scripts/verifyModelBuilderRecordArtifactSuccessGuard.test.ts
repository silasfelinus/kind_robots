// /utils/scripts/verifyModelBuilderRecordArtifactSuccessGuard.test.ts
//
// Regression test for checkRecordArtifactSuccessGuard() in
// verifyModelBuilderRecordArtifactSuccessGuard.ts (model-builder/t-029).
// Exercises the real check against synthetic store-shaped fixtures covering:
// the pre-fix shape (a bare try/catch around performFetch with no `.success`
// check -- the exact gap found by manual read-through, since performFetch
// never rejects for an HTTP-level failure so that catch block never actually
// fires for the failures this function needs to report), and the fixed
// shape.
import assert from 'node:assert/strict'

import { checkRecordArtifactSuccessGuard } from './verifyModelBuilderRecordArtifactSuccessGuard.js'

const BUGGY_FIXTURE = `
  async function recordArtifact(
    item: BuildItem,
    image: { id: number; imagePath?: string | null },
    output: BuildOutputConfig | undefined,
    prompt: string,
    dims: { width: number; height: number },
  ): Promise<void> {
    try {
      await performFetch(\`/api/model-builder/items/\${item.id}/artifacts\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'image',
          provider: output?.engine ?? null,
          prompt,
          width: dims.width,
          height: dims.height,
          artImageId: image.id,
          draftPath: image.imagePath ?? null,
          reviewState: 'PENDING',
        }),
      })
    } catch (error) {
      handleError(error, 'recording build artifact')
    }
  }
`

const FIXED_FIXTURE = `
  async function recordArtifact(
    item: BuildItem,
    image: { id: number; imagePath?: string | null },
    output: BuildOutputConfig | undefined,
    prompt: string,
    dims: { width: number; height: number },
    runId: string,
  ): Promise<void> {
    const result = await performFetch(\`/api/model-builder/items/\${item.id}/artifacts\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'image',
        provider: output?.engine ?? null,
        prompt,
        width: dims.width,
        height: dims.height,
        artImageId: image.id,
        draftPath: image.imagePath ?? null,
        reviewState: 'PENDING',
      }),
    })
    if (!result.success) {
      setStatusForRun(
        runId,
        'error',
        result.message || \`Generated a candidate for \${item.label}, but recording it failed.\`,
      )
    }
  }
`

const MISSING_FIXTURE = `
  function approveStage(itemId: string, stageKey: BuildStageKey): void {
    const item = findItem(itemId)
    if (!item) return
    item.stages[stageKey] = { status: 'approved' }
  }
`

const buggyErrors = checkRecordArtifactSuccessGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  1,
  `expected the pre-fix shape (no .success check on the resolved ` +
    `performFetch response) to raise 1 error, got ${buggyErrors.length}: ` +
    `${JSON.stringify(buggyErrors)}`,
)
assert.ok(
  buggyErrors[0]!.includes('.success'),
  'expected a violation naming the missing .success check',
)

const fixedErrors = checkRecordArtifactSuccessGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const missingFnErrors = checkRecordArtifactSuccessGuard(MISSING_FIXTURE)
assert.equal(
  missingFnErrors.length,
  1,
  'expected a single "function not found" violation when recordArtifact ' +
    'is absent',
)
assert.ok(missingFnErrors[0]!.includes('recordArtifact'))

console.log(
  'Model Builder recordArtifact success guard checker verified: flags the ' +
    'pre-fix shape (no .success check on the resolved performFetch ' +
    'response), clears the fixed shape, and flags recordArtifact being ' +
    'absent entirely.',
)
