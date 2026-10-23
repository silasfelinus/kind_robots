import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = (path: string) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')

const intro = source('components/EmperorFortressIntro.vue')
const chronicle = source('components/EmperorFortressChronicle.vue')
const page = source('pages/play/emperor-of-dust.vue')
const quests = source('components/EmperorFortressQuests.vue')
const store = source('stores/emperorFortressStore.ts')

assert.match(intro, /The barracks are empty/)
assert.match(intro, /two rival applicants/)
assert.doesNotMatch(
  intro,
  /Four souls followed you here|def\.starter|scene\.cast/,
)
assert.match(store, /function newRun\(\) \{[\s\S]*?introOpen\.value = true/)
assert.match(chronicle, /defineEmits<\{ 'new-run': \[\] \}>/)
assert.match(chronicle, /function startOver\(\) \{[\s\S]*?emit\('new-run'\)/)
assert.match(page, /@new-run="enter\('throne'\)"/)

// Tablet and phone stack the board before details. The quest room is one
// bounded scroll owner so nothing overlaps, and the shell itself stays still.
assert.match(quests, /ref="scrollArea"/)
assert.match(quests, /class="kr-scroll relative grid h-full min-h-0 min-w-0/)
assert.match(quests, /auto-rows-max content-start gap-3 overflow-y-auto/)
assert.match(quests, /@6xl:grid-cols-/)
assert.equal(quests.split('kr-scroll').length - 1, 1)
assert.equal(quests.split('overflow-y-auto').length - 1, 1)
assert.match(
  quests,
  /class="@container kr-panel min-h-0 min-w-0 space-y-3 p-4"/,
)
assert.match(quests, /scrollArea\.value\.scrollTo/)
assert.doesNotMatch(quests, /scrollIntoView/)

console.log(
  'Emperor new-reign introduction and bounded tablet quest room verified',
)
