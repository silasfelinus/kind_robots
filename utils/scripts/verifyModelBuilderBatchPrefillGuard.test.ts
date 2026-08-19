// /utils/scripts/verifyModelBuilderBatchPrefillGuard.test.ts
//
// Regression test for checkBatchPrefillGuard() in
// verifyModelBuilderBatchPrefillGuard.ts (model-builder/t-029, cycle 19).
// Exercises the real check against synthetic script-shaped fixtures
// covering: the pre-fix shape (no `onMounted`/`readFieldLine` at all --
// batchValues starts and stays blank), the fixed shape, an `onMounted`
// block present but missing the `readFieldLine` call, and one present but
// missing the actual seed write.
import assert from 'node:assert/strict'

import { checkBatchPrefillGuard } from './verifyModelBuilderBatchPrefillGuard.js'

const BUGGY_FIXTURE = `
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { fieldSpecFor } from '@/stores/helpers/modelBuilderFields'

const onlyEmpty = ref(false)
const batchValues = reactive<Record<string, string>>({})

function batchFieldId(key: string): string {
  return \`model-builder-batch-\${key}\`
}
</script>
`

const FIXED_FIXTURE = `
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { fieldSpecFor, readFieldLine } from '@/stores/helpers/modelBuilderFields'

const onlyEmpty = ref(false)
const batchValues = reactive<Record<string, string>>({})

onMounted(() => {
  const currentGroup = group.value
  if (!currentGroup) return
  for (const field of fields.value) {
    const values = currentGroup.items.map((item) =>
      readFieldLine(item.fieldsDraft, field.key, currentGroup.targetModel),
    )
    const [first, ...rest] = values
    if (first && rest.every((value) => value === first)) {
      batchValues[field.key] = first
    }
  }
})

function batchFieldId(key: string): string {
  return \`model-builder-batch-\${key}\`
}
</script>
`

const MISSING_READ_FIXTURE = `
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { fieldSpecFor, readFieldLine } from '@/stores/helpers/modelBuilderFields'

const batchValues = reactive<Record<string, string>>({})

onMounted(() => {
  batchValues.name = 'placeholder'
})
</script>
`

const MISSING_SEED_FIXTURE = `
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { fieldSpecFor, readFieldLine } from '@/stores/helpers/modelBuilderFields'

const batchValues = reactive<Record<string, string>>({})

onMounted(() => {
  const currentGroup = group.value
  if (!currentGroup) return
  for (const field of fields.value) {
    const values = currentGroup.items.map((item) =>
      readFieldLine(item.fieldsDraft, field.key, currentGroup.targetModel),
    )
    console.log(values)
  }
})
</script>
`

const buggyErrors = checkBatchPrefillGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  1,
  `expected the pre-fix shape to raise 1 error, got ${buggyErrors.length}: ` +
    `${JSON.stringify(buggyErrors)}`,
)
assert.ok(buggyErrors[0]!.includes('readFieldLine'))

const fixedErrors = checkBatchPrefillGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const missingReadErrors = checkBatchPrefillGuard(MISSING_READ_FIXTURE)
assert.equal(
  missingReadErrors.length,
  2,
  'expected the missing-readFieldLine-call shape to raise 2 errors ' +
    `(no read call, no seed write), got ${missingReadErrors.length}: ` +
    `${JSON.stringify(missingReadErrors)}`,
)

const missingSeedErrors = checkBatchPrefillGuard(MISSING_SEED_FIXTURE)
assert.equal(
  missingSeedErrors.length,
  1,
  'expected the missing-seed-write shape to raise 1 error, got ' +
    `${missingSeedErrors.length}: ${JSON.stringify(missingSeedErrors)}`,
)
assert.ok(missingSeedErrors[0]!.includes('batchValues[field.key] = first'))

console.log(
  'Model Builder batch-editor pre-fill guard checker verified: flags the ' +
    'pre-fix shape (no onMounted pre-fill at all), clears the fixed shape, ' +
    'and flags an onMounted block missing either the readFieldLine call or ' +
    'the actual seed write.',
)
