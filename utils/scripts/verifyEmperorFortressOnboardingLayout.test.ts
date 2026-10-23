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
assert.doesNotMatch(intro, /Four souls followed you here|def\.starter|scene\.cast/)
assert.match(store, /function newRun\(\) \{[\s\S]*?introOpen\.value = true/)
assert.match(chronicle, /defineEmits<\{ 'new-run': \[\] \}>/)
assert.match(chronicle, /function startOver\(\) \{[\s\S]*?emit\('new-run'\)/)
assert.match(page, /@new-run="enter\('throne'\)"/)

// The split panel must fit inside the console on tablet and phone. Neither
// pane can grow over the other when the quest's narrative is long.
assert.match(quests, /grid-rows-\[minmax\(11rem,0\.36fr\)_minmax\(0,1fr\)\]/)
assert.match(quests, /@6xl:grid-rows-1/)
assert.match(quests, /overflow-hidden/)
assert.match(quests, /class="kr-scroll flex min-h-0 min-w-0 flex-col gap-2 overflow-y-auto/)
assert.match(quests, /class="@container kr-panel kr-scroll min-h-0 min-w-0 space-y-3 overflow-y-auto/)
assert.match(quests, /detail\.value\?\.scrollTo\(\{ top: 0 \}\)/)
assert.doesNotMatch(quests, /scrollIntoView/)

console.log('Emperor new-reign introduction and bounded tablet quest panes verified')
