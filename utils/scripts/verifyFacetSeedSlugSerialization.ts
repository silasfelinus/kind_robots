// /utils/scripts/verifyFacetSeedSlugSerialization.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runWithKeyedConcurrency } from './facetSeedConcurrency'

type TestItem = {
  id: string
  targetSlug: string
}

const items: TestItem[] = [
  { id: 'alpha-1', targetSlug: 'shared-alpha' },
  { id: 'alpha-2', targetSlug: 'shared-alpha' },
  { id: 'beta-1', targetSlug: 'shared-beta' },
  { id: 'beta-2', targetSlug: 'shared-beta' },
]

const activeBySlug = new Map<string, number>()
const maxActiveBySlug = new Map<string, number>()
const completionOrder: string[] = []
let activeOverall = 0
let maxActiveOverall = 0
let firstWaveStarted = 0
let releaseFirstWave!: () => void
const firstWave = new Promise<void>((resolve) => {
  releaseFirstWave = resolve
})
const fallback = setTimeout(releaseFirstWave, 250)

await runWithKeyedConcurrency(
  items,
  2,
  (item) => item.targetSlug,
  async (item) => {
    const activeForSlug = (activeBySlug.get(item.targetSlug) ?? 0) + 1
    activeBySlug.set(item.targetSlug, activeForSlug)
    maxActiveBySlug.set(
      item.targetSlug,
      Math.max(maxActiveBySlug.get(item.targetSlug) ?? 0, activeForSlug),
    )
    activeOverall++
    maxActiveOverall = Math.max(maxActiveOverall, activeOverall)

    if (++firstWaveStarted === 2) releaseFirstWave()
    await firstWave
    await Promise.resolve()

    completionOrder.push(item.id)
    activeOverall--
    activeBySlug.set(item.targetSlug, activeForSlug - 1)
  },
)
clearTimeout(fallback)

assert.equal(maxActiveBySlug.get('shared-alpha'), 1)
assert.equal(maxActiveBySlug.get('shared-beta'), 1)
assert.equal(
  maxActiveOverall,
  2,
  'unrelated target slugs should retain bounded parallelism',
)
assert.ok(
  completionOrder.indexOf('alpha-1') < completionOrder.indexOf('alpha-2'),
  'same-slug candidates should retain source order',
)
assert.ok(
  completionOrder.indexOf('beta-1') < completionOrder.indexOf('beta-2'),
  'same-slug candidates should retain source order',
)

await assert.rejects(
  runWithKeyedConcurrency(items, 0, (item) => item.targetSlug, async () => {}),
  RangeError,
)

const seedSource = readFileSync(
  fileURLToPath(new URL('./seedFacetCatalog.ts', import.meta.url)),
  'utf8',
)
assert.match(seedSource, /runWithKeyedConcurrency\(/)
assert.match(seedSource, /\(candidate\) => slugify\(candidate\.title\)/)
assert.match(seedSource, /\(candidate\) => saveCandidate\(candidate, state\)/)

console.log('Facet seed target-slug serialization verified.')
