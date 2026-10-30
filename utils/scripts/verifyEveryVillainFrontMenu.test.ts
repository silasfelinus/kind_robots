import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { promArt } from '../cometAcademy/artManifest'
import { IDENTITY_ARCS } from '../cometAcademy/identityArcs'
import { chanceFrom } from '../everyVillainTactics/combat'
import {
  applyChoice,
  createStory,
  enqueueBeat,
} from '../everyVillainTactics/firstBellStory'
import {
  ANIMATION_SPEEDS,
  DEFAULT_SETTINGS,
  ONE_SHOT_MENU,
  PERSPECTIVE_ART,
  SCRAPBOOK_MOMENTS,
  SCRAPBOOK_TRIGGERS,
  animationScale,
  emptyScrapbook,
  mergeScrapbook,
  momentsFromSave,
  oneShotStages,
  sanitizeScrapbook,
  sanitizeSettings,
  scrapbookPages,
  type ScrapbookRecord,
} from '../everyVillainTactics/frontMenu'
import { dismissPicnicScene } from '../everyVillainTactics/picnicPanic'
import { createSave, loadSave } from '../everyVillainTactics/saves'
import { clonePreset, stageProblems } from '../everyVillainTactics/studio'
import {
  endTurn,
  exposureAt,
  moveSelected,
  rescueSelected,
  trainingState,
} from '../everyVillainTactics/training'

// Settings: garbage never crashes and falls back field by field.
assert.deepEqual(sanitizeSettings(null), DEFAULT_SETTINGS)
assert.deepEqual(sanitizeSettings('{not json'), DEFAULT_SETTINGS)
assert.deepEqual(sanitizeSettings([1, 2]), DEFAULT_SETTINGS)
assert.deepEqual(
  sanitizeSettings(
    JSON.stringify({ animation: 'slow', confirmEndTurn: 'yes', extra: 1 }),
  ),
  { ...DEFAULT_SETTINGS, animation: 'slow' },
)
assert.deepEqual(
  sanitizeSettings({ animation: 'warp', threatPreview: false }),
  { ...DEFAULT_SETTINGS, threatPreview: false },
)
assert.equal(animationScale('off'), 0)
assert.equal(animationScale('normal'), 1)
const scales = ANIMATION_SPEEDS.map((s) => s.scale)
assert.deepEqual(
  scales,
  [...scales].sort((a, b) => a - b),
  'speeds run from off to cinematic',
)

// Every recordable trigger has exactly one scrapbook page with shipped art.
assert.deepEqual(
  SCRAPBOOK_MOMENTS.map((m) => m.id).sort(),
  [...SCRAPBOOK_TRIGGERS].sort(),
)
for (const moment of SCRAPBOOK_MOMENTS)
  assert.ok(promArt(moment.art), moment.id + ' art ' + moment.art + ' ships')

// A real story save earns only the moments it fired.
const state = trainingState(0x53a1b7, undefined, { lead: 'accident-fire' })
const story = createStory()
assert.ok(applyChoice(story, state, 'hero', 'catwalk'))
endTurn(state)
enqueueBeat(story, state)
assert.equal(story.current, 'alarm')
assert.ok(applyChoice(story, state, 'hero', 'rescue'))
const save = createSave({
  slot: 'slot-2',
  perspective: 'hero',
  leadSignature: 'accident-fire',
  stage: null,
  state,
  story,
  savedAt: '2026-10-30T14:00:00.000Z',
})
const loaded = loadSave(JSON.stringify(save))
assert.ok(loaded.ok)
const earned = momentsFromSave(loaded.save)
assert.deepEqual(earned.map((r) => r.id).sort(), [
  'story:alarm',
  'story:arrival',
])
assert.ok(earned.every((r) => r.stage === 'First Bell'))
let book = mergeScrapbook(emptyScrapbook(), earned)
let pages = scrapbookPages(book)
assert.equal(pages.filter((p) => p.record).length, 2)
assert.equal(
  pages.find((p) => p.id === 'story:arrival')!.leadAlias,
  IDENTITY_ARCS.find((a) => a.signature === 'accident-fire')!.hero.alias,
)
assert.equal(pages.find((p) => p.id === 'story:victory')!.record, null)

// A save that claims an unearned ending fails validation, so it never
// reaches the scrapbook.
const forged = structuredClone(save)
forged.state.fired!.push('story:victory')
assert.equal(loadSave(JSON.stringify(forged)).ok, false)

// Picnic Panic one-shot: opening, a rescue and the all-rescued trigger.
const picnicStage = clonePreset('picnic-plaza')
const picnic = trainingState(7, picnicStage, { lead: 'accident-fire' })
dismissPicnicScene(picnic, 'picnic:opening')
for (const civilian of picnic.civilians!) {
  const hero = picnic.units.find((u) => u.id === picnic.selected)!
  hero.x = civilian.x === 0 ? 1 : civilian.x - 1
  hero.y = civilian.y
  hero.ap = 2
  assert.ok(rescueSelected(picnic))
}
assert.ok(picnic.fired!.includes('picnic:all-rescued'))
// Teleport the lead back to a legal spawn so the save's tiles validate.
const lead = picnic.units.find((u) => u.id === picnic.selected)!
lead.x = 0
lead.y = 4
const picnicSave = createSave({
  slot: 'auto',
  perspective: 'hero',
  leadSignature: 'accident-fire',
  stage: picnicStage,
  state: picnic,
  story: { ...createStory(), current: null },
  savedAt: '2026-10-30T13:00:00.000Z',
})
const picnicLoaded = loadSave(JSON.stringify(picnicSave))
assert.ok(picnicLoaded.ok, picnicLoaded.ok ? '' : picnicLoaded.reason)
const picnicMoments = momentsFromSave(picnicLoaded.save)
assert.deepEqual(picnicMoments.map((r) => r.id).sort(), [
  'picnic:all-rescued',
  'picnic:opening',
])
assert.ok(picnicMoments.every((r) => !r.id.startsWith('seen:')))
assert.ok(picnicMoments.every((r) => r.stage === 'Picnic Panic'))

// Merging keeps the earliest witness and catalog order.
book = mergeScrapbook(book, picnicMoments)
const later: ScrapbookRecord = {
  ...earned[0]!,
  at: '2027-01-01T00:00:00.000Z',
  lead: 'tech-genius',
}
book = mergeScrapbook(book, [later])
assert.equal(
  book.records.find((r) => r.id === earned[0]!.id)!.lead,
  'accident-fire',
)
const earlier: ScrapbookRecord = {
  ...earned[0]!,
  at: '2026-01-01T00:00:00.000Z',
  lead: 'mutant-earth',
}
book = mergeScrapbook(book, [earlier])
assert.equal(
  book.records.find((r) => r.id === earned[0]!.id)!.lead,
  'mutant-earth',
)
const order = SCRAPBOOK_MOMENTS.map((m) => m.id)
assert.deepEqual(
  book.records.map((r) => r.id),
  order.filter((id) => book.records.some((r) => r.id === id)),
)

// Stored books are sanitized: unknown, malformed or forged pages are dropped.
assert.deepEqual(sanitizeScrapbook('nope'), emptyScrapbook())
assert.deepEqual(sanitizeScrapbook({ records: 'x' }), emptyScrapbook())
const stored = sanitizeScrapbook(
  JSON.stringify({
    version: 1,
    records: [
      ...book.records,
      { ...book.records[0], id: 'achievement:flawless' },
      { ...book.records[0], id: 'story:defeat', lead: 'not-a-hero' },
      { ...book.records[0], id: 'story:victory', at: 'yesterday' },
      { ...book.records[0], id: 'picnic:defeat', perspective: 'narrator' },
      { ...book.records[0], id: 'story:reckoning', stage: '' },
    ],
  }),
)
assert.deepEqual(stored, book)

// One-shot menu: Picnic Panic first, every stage valid with shipped art.
const oneShots = oneShotStages()
assert.equal(oneShots.length, ONE_SHOT_MENU.length)
assert.equal(oneShots[0]!.id, 'picnic-plaza')
assert.ok(!oneShots.some((s) => s.id === 'first-bell'))
for (const stage of oneShots) {
  assert.deepEqual(stageProblems(stage), [], stage.id)
  assert.ok(promArt(stage.art), stage.id + ' art ships')
}
for (const view of Object.values(PERSPECTIVE_ART))
  assert.ok(promArt('identities/accident-fire/outcomes/' + view))

// Threat preview uses the exact rival shot formula.
const first = trainingState(0x53a1b7, undefined, { lead: 'accident-fire' })
const backdraft = first.units.find((u) => u.id === 'backdraft')!
let exposedTiles = 0
for (let y = 0; y < first.map.height; y++)
  for (let x = 0; x < first.map.width; x++) {
    const shots = exposureAt(first, backdraft, { x, y })
    for (const shot of shots) {
      const rival = first.units.find((u) => u.id === shot.shooter)!
      assert.equal(
        shot.hit,
        chanceFrom(first.map, rival, { ...backdraft, x, y }).hit,
      )
      assert.equal(rival.team, 'rival')
    }
    if (shots.length) exposedTiles++
  }
assert.ok(exposedTiles > 5 && exposedTiles < 54, 'some tiles are safe')
// Wind-up toys never shoot, so they never appear as threats.
const toys = trainingState(3, clonePreset('lab-mascot-recall'))
const toyHero = toys.units.find((u) => u.team === 'squad')!
assert.deepEqual(exposureAt(toys, toyHero, { x: 6, y: 1 }), [])
// The preview never consumes RNG.
const seedBefore = first.seed
exposureAt(first, backdraft, { x: 4, y: 3 })
assert.equal(first.seed, seedBefore)
assert.ok(moveSelected(first, { x: 1, y: 4 }))

// UI contracts: menu items, keyboard roving, motion and confirm wiring.
const menu = readFileSync(
  new URL(
    '../../components/every-villain-tactics/every-villain-front-menu.vue',
    import.meta.url,
  ),
  'utf8',
)
for (const id of [
  'front-new-story',
  'front-continue',
  'front-one-shot',
  'front-settings',
  'front-scrapbook',
  'front-begin-story',
  'front-confirm-end-turn',
  'front-threat-preview',
  'front-erase-progress',
])
  assert.match(menu, new RegExp('data-testid="' + id + '"'))
assert.match(menu, /aria-modal="true"/)
assert.match(menu, /data-roving="vertical"/)
assert.match(menu, /event\.key === 'Escape'/)
assert.match(menu, /@media \(prefers-reduced-motion: reduce\)/)
assert.doesNotMatch(menu, /localStorage/, 'the store owns storage')
const page = readFileSync(
  new URL('../../pages/admin/every-villain-tactics.vue', import.meta.url),
  'utf8',
)
assert.match(page, /<EveryVillainFrontMenu v-if="store\.screen" \/>/)
assert.match(page, /store\.requestEndTurn\(\)/)
assert.match(page, /store\.loadPreferences\(\)/)
assert.match(page, /var\(--evt-anim, 1\)/)
assert.match(page, /data-testid="tactics-open-menu"/)

console.log(
  'Every Villain Tactics front menu: settings, ' +
    SCRAPBOOK_MOMENTS.length +
    ' save-grounded scrapbook pages, ' +
    oneShots.length +
    ' one-shots and exact threat preview verified.',
)
