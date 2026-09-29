// /utils/scripts/verifyLatestFirstQueue.test.ts
//
// Self-test for stores/helpers/latestFirstQueue.ts: never more than `limit`
// jobs run at once, the most recently queued job runs next, and every queued
// job still completes.
import assert from 'node:assert/strict'
import { createLatestFirstQueue } from '../../stores/helpers/latestFirstQueue'

const queue = createLatestFirstQueue(2)
const started: number[] = []
let running = 0
let peak = 0
const releases = new Map<number, () => void>()

function job(id: number) {
  return queue.run(async () => {
    started.push(id)
    running += 1
    peak = Math.max(peak, running)
    await new Promise<void>((resolve) => releases.set(id, resolve))
    running -= 1
    return id
  })
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

const results = [1, 2, 3, 4, 5].map(job)
await tick()
assert.deepEqual(started, [1, 2], 'only `limit` jobs start immediately')

releases.get(1)?.()
await tick()
assert.deepEqual(started, [1, 2, 5], 'the newest waiting job runs next')

releases.get(2)?.()
await tick()
releases.get(5)?.()
await tick()
assert.deepEqual(started, [1, 2, 5, 4, 3], 'older jobs still run, newest first')

releases.get(4)?.()
releases.get(3)?.()
assert.deepEqual(await Promise.all(results), [1, 2, 3, 4, 5])
assert.equal(peak, 2, 'never more than `limit` at once')
console.log(
  'verifyLatestFirstQueue: newest-first, bounded, and every job completes',
)
