import assert from 'node:assert/strict'
import {
  executeButterflyBatch,
  previewButterflyBatch,
} from '../../stores/helpers/butterflyGalleryBatch'

async function main() {
  assert.deepEqual(previewButterflyBatch([1, 1, 2]), {
    count: 2,
    requiresConfirmation: false,
    reason: null,
  })
  assert.deepEqual(previewButterflyBatch([1, 2], { destructive: true }), {
    count: 2,
    requiresConfirmation: true,
    reason: 'destructive',
  })
  assert.deepEqual(previewButterflyBatch([1, 2], { expensive: true }), {
    count: 2,
    requiresConfirmation: true,
    reason: 'expensive',
  })

  const calls: number[] = []
  const result = await executeButterflyBatch([1, 2, 2, 3], async (entryId) => {
    calls.push(entryId)
    if (entryId === 2) return false
    if (entryId === 3) throw new Error('network down')
    return true
  })

  assert.deepEqual(calls, [1, 2, 3])
  assert.deepEqual(result, {
    attempted: 3,
    succeededIds: [1],
    failures: [
      { entryId: 2, message: 'Action was not applied.' },
      { entryId: 3, message: 'network down' },
    ],
  })

  console.log('Butterfly Gallery batch contract: OK')
}

void main()
