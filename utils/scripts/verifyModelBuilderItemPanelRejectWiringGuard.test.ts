// /utils/scripts/verifyModelBuilderItemPanelRejectWiringGuard.test.ts
//
// Regression test for checkItemPanelRejectWiringGuard() in
// verifyModelBuilderItemPanelRejectWiringGuard.ts (model-builder/t-029,
// cycles 78-79). Exercises the real check against synthetic file-shaped
// fixtures covering: the pre-cycle-78 shape (no reject() wrapper, no Reject
// buttons or note callouts at all -- store.rejectStage has no caller), the
// cycle-78-only shape (Reject buttons wired but reject() never collects or
// passes a note, and nothing renders it), the fully fixed shape (all three
// stages wired with a note-collecting reject() and a note callout), a
// partial fix (one stage missing its note callout), and reject() redefined
// with a differently-shaped body (should still be flagged, since the guard
// checks the exact call shape).
import assert from 'node:assert/strict'

import { checkItemPanelRejectWiringGuard } from './verifyModelBuilderItemPanelRejectWiringGuard.js'

const BUGGY_FIXTURE = `
<template>
  <button type="button" :disabled="isLocked('PITCH') || !pitch.trim()" @click="approve('PITCH')">
    Approve pitch
  </button>
</template>
<script setup lang="ts">
function approve(stage: BuildStageKey): void {
  store.approveStage(props.itemId, stage)
}
</script>
`

function rejectButton(stage: string): string {
  return `
  <button
    type="button"
    :disabled="isLocked('${stage}') || isAnyDraftInFlight"
    @click="reject('${stage}')"
  >
    Reject
  </button>`
}

function rejectionNoteCallout(stage: string): string {
  return `
      <p
        v-if="rejectionNoteFor('${stage}')"
        class="mb-1.5 rounded-lg bg-error/10 px-2 py-1 text-xs text-error/80"
      >
        {{ rejectionNoteFor('${stage}') }}
      </p>`
}

const STAGES = ['PITCH', 'FIELDS_AND_PROMPTS', 'GENERATE_ASSETS']

// Cycle 78 only: buttons wired, but reject() never collected/passed a note,
// and no template callout renders it at all.
const CYCLE_78_ONLY_FIXTURE = `
<template>
  ${STAGES.map(rejectButton).join('\n')}
</template>
<script setup lang="ts">
function approve(stage: BuildStageKey): void {
  store.approveStage(props.itemId, stage)
}

function reject(stage: BuildStageKey): void {
  store.rejectStage(props.itemId, stage)
}
</script>
`

const FIXED_FIXTURE = `
<template>
  ${STAGES.map((s) => rejectionNoteCallout(s) + rejectButton(s)).join('\n')}
</template>
<script setup lang="ts">
function approve(stage: BuildStageKey): void {
  store.approveStage(props.itemId, stage)
}

function reject(stage: BuildStageKey): void {
  const note = window.prompt('Reject this stage? Optional note for why:', '')
  if (note === null) return
  store.rejectStage(props.itemId, stage, note.trim() || undefined)
}

function rejectionNoteFor(stage: BuildStageKey): string | undefined {
  const current = item.value?.stages[stage]
  return current?.status === 'rejected' ? current.note : undefined
}
</script>
`

const PARTIAL_FIX_FIXTURE = `
<template>
  ${rejectionNoteCallout('PITCH') + rejectButton('PITCH')}
  ${rejectButton('FIELDS_AND_PROMPTS')}
  ${rejectionNoteCallout('GENERATE_ASSETS') + rejectButton('GENERATE_ASSETS')}
</template>
<script setup lang="ts">
function reject(stage: BuildStageKey): void {
  const note = window.prompt('Reject this stage? Optional note for why:', '')
  if (note === null) return
  store.rejectStage(props.itemId, stage, note.trim() || undefined)
}

function rejectionNoteFor(stage: BuildStageKey): string | undefined {
  const current = item.value?.stages[stage]
  return current?.status === 'rejected' ? current.note : undefined
}
</script>
`

const WRONG_BODY_FIXTURE = `
<template>
  ${STAGES.map((s) => rejectionNoteCallout(s) + rejectButton(s)).join('\n')}
</template>
<script setup lang="ts">
function reject(stage: BuildStageKey): void {
  console.log('rejecting', stage)
}

function rejectionNoteFor(stage: BuildStageKey): string | undefined {
  const current = item.value?.stages[stage]
  return current?.status === 'rejected' ? current.note : undefined
}
</script>
`

const buggyErrors = checkItemPanelRejectWiringGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  8,
  'expected the pre-cycle-78 shape (no reject() wrapper, no rejectionNoteFor ' +
    'helper, no Reject buttons or note callouts) to raise 8 errors (wrapper ' +
    `+ helper + 3 stages x 2), got ${buggyErrors.length}: ` +
    `${JSON.stringify(buggyErrors)}`,
)
assert.ok(buggyErrors[0]!.includes('reject(stage: BuildStageKey)` wrapper'))
assert.ok(buggyErrors[1]!.includes('rejectionNoteFor(stage)` helper'))

const cycle78Errors = checkItemPanelRejectWiringGuard(CYCLE_78_ONLY_FIXTURE)
assert.equal(
  cycle78Errors.length,
  5,
  'expected the cycle-78-only shape (buttons wired, but reject() collects ' +
    'no note and nothing renders one) to raise 5 errors (reject() body + ' +
    `helper + 3 note callouts; the 3 buttons themselves are already wired), ` +
    `got ${cycle78Errors.length}: ${JSON.stringify(cycle78Errors)}`,
)
assert.ok(cycle78Errors[0]!.includes('reject(stage: BuildStageKey)` wrapper'))
assert.ok(cycle78Errors[1]!.includes('rejectionNoteFor(stage)` helper'))
assert.ok(
  cycle78Errors.slice(2).every((e) => e.includes('rejection-note callout')),
)

const fixedErrors = checkItemPanelRejectWiringGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fully fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const partialErrors = checkItemPanelRejectWiringGuard(PARTIAL_FIX_FIXTURE)
assert.equal(
  partialErrors.length,
  1,
  'expected the partial-fix shape (FIELDS_AND_PROMPTS note callout missing) ' +
    `to raise exactly 1 error, got ${partialErrors.length}: ` +
    `${JSON.stringify(partialErrors)}`,
)
assert.ok(partialErrors[0]!.includes('FIELDS_AND_PROMPTS stage'))
assert.ok(partialErrors[0]!.includes('rejection-note callout'))

const wrongBodyErrors = checkItemPanelRejectWiringGuard(WRONG_BODY_FIXTURE)
assert.equal(
  wrongBodyErrors.length,
  1,
  'expected the wrong-body shape (reject() defined but not calling ' +
    `store.rejectStage) to raise exactly 1 error, got ` +
    `${wrongBodyErrors.length}: ${JSON.stringify(wrongBodyErrors)}`,
)
assert.ok(wrongBodyErrors[0]!.includes('reject(stage: BuildStageKey)` wrapper'))

console.log(
  'Model Builder item-panel Reject wiring guard checker verified: flags ' +
    'the pre-cycle-78 shape (nothing wired), flags the cycle-78-only shape ' +
    '(buttons wired but no note collected/rendered), clears the fully ' +
    "fixed shape, flags a partial fix missing one stage's note callout, " +
    "and flags reject() being redefined with a body that doesn't actually " +
    'call store.rejectStage.',
)
