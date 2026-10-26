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
assert.match(page, /@done="finishIntroduction"/)
assert.match(page, /function finishIntroduction\(\)/)
assert.match(page, /if \(firstAudience\) enter\('throne'\)/)

// The quest room uses a fixed-height two-pane grid. Each pane owns its
// wheel scrolling; phones switch views rather than stacking two long pages.
assert.match(quests, /class="kr-panes/)
assert.match(quests, /@4xl:grid-cols-/)
assert.match(quests, /class="grid grid-cols-2 gap-2"/)
assert.equal(quests.split('kr-pane-scroll').length - 1, 2)
assert.doesNotMatch(quests, /scrollArea\\.value\\.scrollTo|scrollIntoView/)
assert.match(quests, /mobilePane = ref<'board' \\| 'details'>/)
assert.match(quests, /class="flex shrink-0 flex-wrap items-center/)
assert.match(page, /activeRoom === 'briefing' \\|\\| activeRoom === 'quests'/)

// Every illustrated fortress room uses the same opaque ink surface. The quest
// rewards and dispatch controls must not show wood grain through their text.
const inkRule = page.match(/(?:^|\n)\.eod \{([^}]+)\}/)?.[1] ?? ''
const panelRule = page.match(/\.eod \.kr-panel \{([^}]+)\}/)?.[1] ?? ''
const plateRule = page.match(/\.eod \.eod-plate \{([^}]+)\}/)?.[1] ?? ''
const chipRule = page.match(/\.eod \.eod-chip \{([^}]+)\}/)?.[1] ?? ''
assert.match(inkRule, /--eod-ink:\s*var\(--color-base-100\)/)
assert.match(panelRule, /background:\s*var\(--eod-ink\)/)
assert.doesNotMatch(panelRule, /backdrop-filter/)
assert.match(plateRule, /var\(--color-base-200\)/)
assert.doesNotMatch(plateRule, /transparent/)
assert.match(chipRule, /background:\s*var\(--color-base-200\)/)

console.log(
  'Emperor new-reign, bounded quest room, and opaque panel contrast verified',
)
