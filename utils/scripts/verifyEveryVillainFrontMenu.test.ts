import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { promArt } from '../cometAcademy/artManifest'
import {
  comicIntroArt,
  comicIntroFor,
} from '../cometAcademy/comicIntroductions'
import { IDENTITY_ARCS } from '../cometAcademy/identityArcs'
import {
  identityArtCandidateKeys,
  identityArtwork,
} from '../cometAcademy/artSlots'
import { isRejectedIdentityArt } from '../cometAcademy/artQuality'
import {
  POWER_ORIGINS,
  POWER_AFFINITIES,
  signatureFor,
} from '../cometAcademy/specialPowers'
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
  PLAYABLE_PERSPECTIVES,
  SCRAPBOOK_MOMENTS,
  SCRAPBOOK_TRIGGERS,
  animationScale,
  canStartOneShot,
  ORIGIN_STAGE_LEADS,
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
import {
  createSave,
  loadSave,
  saveChecksum,
} from '../everyVillainTactics/saves'
import {
  STAGE_PRESETS,
  clonePreset,
  stageProblems,
} from '../everyVillainTactics/studio'
import {
  PAINTED_EVT_MAP_ART,
  paintedMapArtId,
} from '../everyVillainTactics/mapArt'
import { VERIFIED_EVT_ARENA_RECEIPTS } from '../everyVillainTactics/verifiedArenaReceipts.generated'
import {
  PAINTED_EVT_REVEAL_ART,
  PAINTED_EVT_SUPPORT_ART,
  paintedRevealArtId,
} from '../everyVillainTactics/revealArt'
import {
  DEFAULT_FOIL,
  endTurn,
  exposureAt,
  isValidFoil,
  scriptedFoilFor,
  fireSelected,
  previewShot,
  moveSelected,
  rescueSelected,
  rescueTargets,
  selectedPowerTargets,
  useSelectedPower,
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
const pages = scrapbookPages(book)
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

// The Last Order is a real Backdraft-only origin battle with its own arena,
// signature-power rescue gate and persisted choice consequences.
const diner = clonePreset('last-order')
assert.deepEqual(stageProblems(diner), [])
assert.equal(diner.title, 'The Last Order')
assert.equal(diner.victory?.kind, 'rescue')
assert.equal(diner.script?.scenes[0]?.trigger.kind, 'opening')
assert.ok(diner.script?.scenes.some((scene) => scene.id === 'diner-choice'))
const dinerRun = trainingState(19, diner, { lead: 'accident-fire' })
const dinerLead = dinerRun.units.find((u) => u.id === 'backdraft')!
dinerRun.selected = dinerLead.id
dinerLead.x = 6
dinerLead.y = 2
dinerLead.ap = 2
assert.equal(rescueSelected(dinerRun), false, 'the hot kitchen blocks rescue')
dinerLead.x = 1
dinerLead.y = 2
assert.ok(
  selectedPowerTargets(dinerRun).some(
    (point) => point.x === 4 && point.y === 2,
  ),
  'Backdraft can aim his power through the diner hood',
)
assert.equal(useSelectedPower(dinerRun, { x: 4, y: 2 }), true)
assert.ok(dinerRun.flags?.includes('diner-hood-vented'))
const dinerSave = createSave({
  slot: 'slot-1',
  perspective: 'hero',
  leadSignature: 'accident-fire',
  stage: diner,
  state: dinerRun,
  story: { ...createStory(), current: null },
})
const restoredDiner = loadSave(JSON.stringify(dinerSave))
assert.ok(restoredDiner.ok, restoredDiner.ok ? '' : restoredDiner.reason)
assert.ok(restoredDiner.save.state.flags?.includes('diner-hood-vented'))
dinerLead.x = 6
dinerLead.y = 2
dinerLead.ap = 2
assert.equal(rescueTargets(dinerRun).length, 1)
assert.equal(rescueSelected(dinerRun), true)
assert.equal(dinerRun.civilians?.[0]?.status, 'rescued')
assert.equal(dinerRun.phase, 'victory')
const wrongPower = trainingState(19, diner, { lead: 'mutant-earth' })
const wrongLead = wrongPower.units.find((u) => u.id === 'backdraft')!
wrongPower.selected = wrongLead.id
wrongLead.x = 0
wrongLead.y = 2
assert.equal(useSelectedPower(wrongPower, { x: 4, y: 2 }), false)
assert.ok(!wrongPower.flags?.includes('diner-hood-vented'))

// Skyline's second playable power-origin battle uses a different tactical
// objective: protect the wind gauge, then evacuate two separate gondolas.
const ferris = clonePreset('ferris-wheel')
assert.deepEqual(stageProblems(ferris), [])
assert.equal(ferris.victory?.kind, 'rescue')
assert.equal(ferris.civilians?.length, 2)
assert.ok(ferris.script?.scenes.some((scene) => scene.id === 'wheel-choice'))
const ferrisRun = trainingState(37, ferris, { lead: 'accident-air' })
const skyline = ferrisRun.units.find((unit) => unit.id === 'backdraft')!
ferrisRun.selected = skyline.id
skyline.x = 6
skyline.y = 2
skyline.ap = 2
assert.equal(rescueSelected(ferrisRun), false, 'airless gondola stays shut')
skyline.x = 0
skyline.y = 4
assert.equal(
  ferrisRun.units.find((unit) => unit.id === 'pip')?.identity,
  'accident-fire',
  'Skyline must not be duplicated as their own canonical rival',
)
assert.ok(
  selectedPowerTargets(ferrisRun).some(
    (point) => point.x === 4 && point.y === 2,
  ),
  'Skyline can leap onto the unoccupied wind gauge with Updraft Catch',
)
assert.equal(useSelectedPower(ferrisRun, { x: 4, y: 2 }), true)
assert.ok(ferrisRun.flags?.includes('wheel-air-bridge'))
const ferrisSave = createSave({
  slot: 'slot-2',
  perspective: 'hero',
  leadSignature: 'accident-air',
  stage: ferris,
  state: ferrisRun,
  story: { ...createStory(), current: null },
})
const restoredFerris = loadSave(JSON.stringify(ferrisSave))
assert.ok(restoredFerris.ok, restoredFerris.ok ? '' : restoredFerris.reason)
assert.ok(restoredFerris.save.state.flags?.includes('wheel-air-bridge'))
const forgedBridge = createSave({
  slot: 'slot-2',
  perspective: 'hero',
  leadSignature: 'accident-air',
  stage: ferris,
  state: {
    ...ferrisRun,
    units: ferrisRun.units.map((unit) =>
      unit.id === 'backdraft' ? { ...unit, powerSpent: false } : unit,
    ),
  },
  story: { ...createStory(), current: null },
})
assert.equal(
  loadSave(JSON.stringify(forgedBridge)).ok,
  false,
  'a copied bridge flag cannot substitute for the signature power',
)
skyline.x = 6
skyline.y = 2
skyline.ap = 2
assert.equal(rescueSelected(ferrisRun), true)
assert.equal(ferrisRun.phase, 'active', 'first rescue is not victory')
skyline.x = 6
skyline.y = 4
skyline.ap = 2
assert.equal(rescueSelected(ferrisRun), true)
assert.equal(ferrisRun.phase, 'victory', 'both passengers are required')

// Cornerstone must actually brace the bus crossing before either passenger
// can be evacuated. A different earth hero cannot fake this origin power.
const street = clonePreset('sunken-street')
assert.deepEqual(stageProblems(street), [])
assert.equal(street.title, 'The Street That Sank')
assert.equal(street.victory?.kind, 'rescue')
assert.equal(street.civilians?.length, 2)
assert.ok(street.script?.scenes.some((scene) => scene.id === 'street-choice'))
const streetRun = trainingState(43, street, { lead: 'accident-earth' })
const cornerstone = streetRun.units.find((unit) => unit.id === 'backdraft')!
streetRun.selected = cornerstone.id
cornerstone.x = 6
cornerstone.y = 2
cornerstone.ap = 2
assert.equal(rescueSelected(streetRun), false, 'the sinkhole blocks the bus')
cornerstone.x = 4
cornerstone.y = 2
assert.ok(
  selectedPowerTargets(streetRun).some(
    (point) => point.x === 4 && point.y === 2,
  ),
  'Cornerstone can anchor the ramp only while standing on the fractured street',
)
assert.equal(useSelectedPower(streetRun, { x: 4, y: 2 }), true)
assert.ok(streetRun.flags?.includes('sinkhole-ramp-secured'))
const streetSave = createSave({
  slot: 'slot-2',
  perspective: 'villain',
  leadSignature: 'accident-earth',
  stage: street,
  state: streetRun,
  story: { ...createStory(), current: null },
})
const restoredStreet = loadSave(JSON.stringify(streetSave))
assert.ok(restoredStreet.ok, restoredStreet.ok ? '' : restoredStreet.reason)
assert.ok(restoredStreet.save.state.flags?.includes('sinkhole-ramp-secured'))
const forgedRamp = createSave({
  ...streetSave,
  state: {
    ...streetRun,
    units: streetRun.units.map((unit) =>
      unit.id === 'backdraft' ? { ...unit, powerSpent: false } : unit,
    ),
  },
})
assert.equal(
  loadSave(JSON.stringify(forgedRamp)).ok,
  false,
  'a copied ramp flag cannot replace Cornerstone’s signature power',
)
cornerstone.x = 6
cornerstone.y = 2
cornerstone.ap = 2
assert.equal(rescueSelected(streetRun), true)
assert.equal(
  streetRun.phase,
  'active',
  'the second passenger still needs rescue',
)
cornerstone.x = 6
cornerstone.y = 4
cornerstone.ap = 2
assert.equal(rescueSelected(streetRun), true)
assert.equal(streetRun.phase, 'victory')
const falseCornerstone = trainingState(43, street, { lead: 'mutant-earth' })
const falseLead = falseCornerstone.units.find(
  (unit) => unit.id === 'backdraft',
)!
falseCornerstone.selected = falseLead.id
falseLead.x = 4
falseLead.y = 2
falseLead.ap = 2
assert.equal(useSelectedPower(falseCornerstone, { x: 4, y: 2 }), true)
assert.ok(!falseCornerstone.flags?.includes('sinkhole-ramp-secured'))

// Captain Valcourt must shield an allied volunteer at the west-side gate.
// Casting the one-use cape on the player is blocked, rather than softlocking
// the civilians after wasting the sole signature charge.
const library = clonePreset('unlicensed-rescue')
assert.deepEqual(stageProblems(library), [])
assert.equal(library.victory?.kind, 'rescue')
assert.equal(library.civilians?.length, 2)
assert.ok(library.script?.scenes.some((scene) => scene.id === 'library-choice'))
const libraryRun = trainingState(53, library, { lead: 'accident-birthright' })
const valcourt = libraryRun.units.find((unit) => unit.id === 'backdraft')!
libraryRun.selected = valcourt.id
valcourt.x = 6
valcourt.y = 2
valcourt.ap = 2
assert.equal(rescueSelected(libraryRun), false, 'field blocks evacuation')
valcourt.x = 0
valcourt.y = 3
assert.equal(
  selectedPowerTargets(libraryRun).some(
    (point) => point.x === valcourt.x && point.y === valcourt.y,
  ),
  false,
)
assert.equal(useSelectedPower(libraryRun, { x: 0, y: 3 }), false)
assert.equal(valcourt.powerSpent, false)
assert.ok(
  selectedPowerTargets(libraryRun).some(
    (point) => point.x === 2 && point.y === 2,
  ),
)
assert.equal(useSelectedPower(libraryRun, { x: 2, y: 2 }), true)
assert.ok(libraryRun.flags?.includes('valcourt-cape-pass'))
const librarySave = createSave({
  slot: 'slot-1',
  perspective: 'hero',
  leadSignature: 'accident-birthright',
  stage: library,
  state: libraryRun,
  story: { ...createStory(), current: null },
})
const restoredLibrary = loadSave(JSON.stringify(librarySave))
assert.ok(restoredLibrary.ok, restoredLibrary.ok ? '' : restoredLibrary.reason)
assert.ok(restoredLibrary.save.state.flags?.includes('valcourt-cape-pass'))
const fakeCape = createSave({
  ...librarySave,
  state: {
    ...libraryRun,
    units: libraryRun.units.map((unit) =>
      unit.id === 'backdraft' ? { ...unit, powerSpent: false } : unit,
    ),
  },
})
assert.equal(loadSave(JSON.stringify(fakeCape)).ok, false)
valcourt.x = 6
valcourt.y = 2
valcourt.ap = 2
assert.equal(rescueSelected(libraryRun), true)
assert.equal(libraryRun.phase, 'active')
valcourt.x = 6
valcourt.y = 4
valcourt.ap = 2
assert.equal(rescueSelected(libraryRun), true)
assert.equal(libraryRun.phase, 'victory')
const wrongValcourt = trainingState(53, library, { lead: 'accident-fire' })
wrongValcourt.flags = ['valcourt-cape-pass']
const wrongSave = createSave({
  slot: 'slot-1',
  perspective: 'villain',
  leadSignature: 'accident-fire',
  stage: library,
  state: wrongValcourt,
  story: { ...createStory(), current: null },
})
assert.equal(loadSave(JSON.stringify(wrongSave)).ok, false)

// Chorus must reach the elevated studio booth before using their only rally.
// An early cast is rejected, and the crowd cannot be rescued until the
// counter-melody has genuinely broken the sponsored broadcast.
const radio = clonePreset('song-that-stopped')
assert.deepEqual(stageProblems(radio), [])
assert.equal(radio.title, 'The Song That Stopped')
assert.equal(radio.victory?.kind, 'rescue')
assert.equal(radio.civilians?.length, 2)
assert.ok(radio.script?.scenes.some((scene) => scene.id === 'radio-choice'))
const radioRun = trainingState(61, radio, { lead: 'accident-social' })
const chorus = radioRun.units.find((unit) => unit.id === 'backdraft')!
radioRun.selected = chorus.id
chorus.x = 6
chorus.y = 2
chorus.ap = 2
assert.equal(
  rescueSelected(radioRun),
  false,
  'the broadcast crowd blocks evacuation',
)
chorus.x = 0
chorus.y = 3
assert.equal(selectedPowerTargets(radioRun).length, 0)
assert.equal(useSelectedPower(radioRun, { x: 0, y: 3 }), false)
assert.equal(chorus.powerSpent, false)
chorus.x = 3
chorus.y = 2
chorus.ap = 2
assert.ok(
  selectedPowerTargets(radioRun).some(
    (point) => point.x === 3 && point.y === 2,
  ),
)
assert.equal(useSelectedPower(radioRun, { x: 3, y: 2 }), true)
assert.ok(radioRun.flags?.includes('radio-counter-melody'))
const radioSave = createSave({
  slot: 'slot-2',
  perspective: 'villain',
  leadSignature: 'accident-social',
  stage: radio,
  state: radioRun,
  story: { ...createStory(), current: null },
})
const radioRestored = loadSave(JSON.stringify(radioSave))
assert.ok(radioRestored.ok, radioRestored.ok ? '' : radioRestored.reason)
assert.ok(radioRestored.save.state.flags?.includes('radio-counter-melody'))
const fakeCounterSong = createSave({
  ...radioSave,
  state: {
    ...radioRun,
    units: radioRun.units.map((unit) =>
      unit.id === 'backdraft' ? { ...unit, powerSpent: false } : unit,
    ),
  },
})
assert.equal(loadSave(JSON.stringify(fakeCounterSong)).ok, false)
chorus.x = 6
chorus.y = 2
chorus.ap = 2
assert.equal(rescueSelected(radioRun), true)
assert.equal(radioRun.phase, 'active')
chorus.x = 6
chorus.y = 4
chorus.ap = 2
assert.equal(rescueSelected(radioRun), true)
assert.equal(radioRun.phase, 'victory')
const wrongChorus = trainingState(61, radio, { lead: 'accident-birthright' })
wrongChorus.flags = ['radio-counter-melody']
const wrongChorusSave = createSave({
  slot: 'slot-2',
  perspective: 'hero',
  leadSignature: 'accident-birthright',
  stage: radio,
  state: wrongChorus,
  story: { ...createStory(), current: null },
})
assert.equal(loadSave(JSON.stringify(wrongChorusSave)).ok, false)

// Environmental signature target is legal without any living rival.
const hydrant = clonePreset('hydrant-blue')
assert.deepEqual(stageProblems(hydrant), [])
assert.equal(hydrant.civilians?.length, 2)
for (const perspective of ['hero', 'villain'] as const) {
  const run = trainingState(41, hydrant, { lead: 'accident-water' })
  const tide = run.units.find((unit) => unit.id === 'backdraft')!
  run.selected = tide.id
  tide.x = 6
  tide.y = 1
  tide.ap = 2
  assert.equal(rescueSelected(run), false)
  assert.equal(useSelectedPower(run, { x: 4, y: 2 }), false)
  assert.equal(tide.powerSpent, false)
  tide.x = 3
  tide.y = 2
  tide.ap = 2
  const valve = { x: 4, y: 2 }
  assert.deepEqual(selectedPowerTargets(run), [valve])
  assert.equal(useSelectedPower(run, valve), true)
  assert.ok(run.flags?.includes('hydrant-main-flowing'))
  assert.equal(tide.powerSpent, true)
  assert.deepEqual(selectedPowerTargets(run), [])
  const checkpoint = createSave({
    slot: 'slot-2',
    perspective,
    leadSignature: 'accident-water',
    stage: hydrant,
    state: run,
    story: { ...createStory(), current: null },
  })
  assert.ok(loadSave(JSON.stringify(checkpoint)).ok)
  const forged = createSave({
    ...checkpoint,
    state: {
      ...run,
      units: run.units.map((unit) =>
        unit.id === tide.id ? { ...unit, powerSpent: false } : unit,
      ),
    },
  })
  assert.equal(loadSave(JSON.stringify(forged)).ok, false)
  tide.x = 6
  tide.y = 1
  tide.ap = 2
  assert.equal(rescueSelected(run), true)
  tide.x = 7
  tide.y = 4
  tide.ap = 2
  assert.equal(rescueSelected(run), true)
  assert.equal(run.phase, 'victory')
}
const emptyStation = trainingState(41, hydrant, { lead: 'accident-water' })
const tide = emptyStation.units[0]!
tide.x = 3
tide.y = 2
for (const rival of emptyStation.units.filter((unit) => unit.team === 'rival'))
  rival.hp = 0
assert.deepEqual(selectedPowerTargets(emptyStation), [{ x: 4, y: 2 }])
assert.equal(useSelectedPower(emptyStation, { x: 4, y: 2 }), true)
assert.ok(
  hydrant.script?.scenes.some((scene) => scene.id === 'hydrant-allocation'),
)
assert.ok(
  readFileSync(
    'components/every-villain-tactics/every-villain-front-menu.vue',
    'utf8',
  ).includes('front-origin-hydrant-blue'),
)

// Final two Accident origins: timed melee intervention versus remote analysis.
for (const [stageId, lead, target, flag] of [
  [
    'clocktower-collapse',
    'accident-discipline',
    { x: 4, y: 3 },
    'clock-lift-caught',
  ],
  [
    'equation-that-escaped',
    'accident-genius',
    { x: 5, y: 2 },
    'equation-drone-rewritten',
  ],
] as const) {
  const stage = clonePreset(stageId)
  assert.deepEqual(stageProblems(stage), [])
  for (const perspective of ['hero', 'villain'] as const) {
    const state = trainingState(41, stage, { lead })
    const actor = state.units[0]!
    state.selected = actor.id
    const first = stage.civilians![0]!
    actor.x = first.x - 1
    actor.y = first.y
    actor.ap = 2
    assert.equal(rescueSelected(state), false)
    actor.x = stageId === 'clocktower-collapse' ? 3 : 1
    actor.y = stageId === 'clocktower-collapse' ? 3 : 2
    if (stageId === 'clocktower-collapse') {
      assert.equal(
        useSelectedPower(state, target),
        false,
        'odd round is not the safe gear alignment',
      )
      state.turn = 2
    }
    assert.ok(
      selectedPowerTargets(state).some(
        (point) => point.x === target.x && point.y === target.y,
      ),
    )
    assert.equal(useSelectedPower(state, target), true)
    assert.ok(state.flags?.includes(flag))
    assert.equal(actor.powerSpent, true)
    assert.deepEqual(selectedPowerTargets(state), [])
    const checkpoint = createSave({
      slot: 'slot-2',
      perspective,
      leadSignature: lead,
      stage,
      state,
      story: { ...createStory(), current: null },
    })
    assert.ok(loadSave(JSON.stringify(checkpoint)).ok)
    const forged = createSave({
      ...checkpoint,
      state: { ...state, flags: [] },
    })
    assert.equal(loadSave(JSON.stringify(forged)).ok, false)
    for (const civilian of stage.civilians!) {
      actor.x = civilian.x
      actor.y = civilian.y
      actor.ap = 2
      assert.equal(rescueSelected(state), true)
    }
    assert.equal(state.phase, 'victory')
  }
}
const blockedDrone = trainingState(41, clonePreset('equation-that-escaped'), {
  lead: 'accident-genius',
})
blockedDrone.units[0]!.x = 2
blockedDrone.units[0]!.y = 1
assert.equal(
  useSelectedPower(blockedDrone, { x: 5, y: 2 }),
  false,
  'wall blocks remote proof rewrite',
)

// Lanternwitch's ritual uses both AP and binds a normally rechargeable power
// for this origin only. Check the saved receipt and ordinary power rejection.
for (const perspective of ['hero', 'villain'] as const) {
  const stage = clonePreset('candle-that-wouldnt-die')
  assert.deepEqual(stageProblems(stage), [])
  const state = trainingState(41, stage, { lead: 'magic-fire' })
  const actor = state.units[0]!
  state.selected = actor.id
  actor.x = 5
  actor.y = 2
  actor.ap = 2
  assert.equal(rescueSelected(state), false)
  actor.x = 3
  actor.y = 3
  actor.ap = 1
  assert.equal(useSelectedPower(state, { x: 4, y: 3 }), false)
  actor.ap = 2
  assert.deepEqual(selectedPowerTargets(state), [{ x: 4, y: 3 }])
  assert.equal(useSelectedPower(state, { x: 4, y: 3 }), true)
  assert.equal(actor.ap, 0)
  assert.ok(state.flags?.includes('vigil-flame-bound'))
  assert.equal(actor.powerSpent, true)
  const checkpoint = createSave({
    slot: 'slot-2',
    perspective,
    leadSignature: 'magic-fire',
    stage,
    state,
    story: { ...createStory(), current: null },
  })
  assert.ok(loadSave(JSON.stringify(checkpoint)).ok)
  assert.equal(
    loadSave(
      JSON.stringify(
        createSave({ ...checkpoint, state: { ...state, flags: [] } }),
      ),
    ).ok,
    false,
  )
  actor.ap = 2
  assert.deepEqual(selectedPowerTargets(state), [])
  for (const civilian of stage.civilians!) {
    actor.x = civilian.x
    actor.y = civilian.y
    actor.ap = 2
    assert.equal(rescueSelected(state), true)
  }
  assert.equal(state.phase, 'victory')
}
assert.ok(
  readFileSync(
    'components/every-villain-tactics/every-villain-front-menu.vue',
    'utf8',
  ).includes('front-origin-candle-that-wouldnt-die'),
)

// The orchard requires standing on the root; the greenhouse uses a
// clear remote sightline. Neither ritual can be repeated or skipped.
for (const [stageId, lead, target, start, flag] of [
  [
    'orchard-under-asphalt',
    'magic-earth',
    { x: 4, y: 2 },
    { x: 4, y: 2 },
    'orchard-arch-stitched',
  ],
  [
    'future-in-the-glass',
    'magic-water',
    { x: 5, y: 3 },
    { x: 2, y: 3 },
    'glass-future-reframed',
  ],
  [
    'overdue-thunder',
    'magic-air',
    { x: 5, y: 2 },
    { x: 2, y: 2 },
    'thunder-cloud-folded',
  ],
  [
    'bell-and-the-door',
    'magic-discipline',
    { x: 4, y: 3 },
    { x: 3, y: 3 },
    'bell-ward-unbound',
  ],
  [
    'when-two-plus-two-screamed',
    'magic-genius',
    { x: 6, y: 2 },
    { x: 3, y: 2 },
    'proof-bridge-complete',
  ],
  [
    'heir-who-said-no',
    'magic-birthright',
    { x: 4, y: 4 },
    { x: 3, y: 4 },
    'hearth-pact-unbound',
  ],
  [
    'empty-applause',
    'magic-social',
    { x: 4, y: 2 },
    { x: 4, y: 2 },
    'applause-contract-rewritten',
  ],
  [
    'ashes-of-the-ledger',
    'mutant-fire',
    { x: 4, y: 2 },
    { x: 3, y: 2 },
    'ash-intervention',
  ],
  [
    'balcony-witness',
    'mutant-air',
    { x: 5, y: 1 },
    { x: 3, y: 1 },
    'balcony-intervention',
  ],
  [
    'bridge-of-last-chances',
    'mutant-earth',
    { x: 4, y: 3 },
    { x: 4, y: 3 },
    'bridge-intervention',
  ],
  [
    'ship-with-no-port',
    'mutant-water',
    { x: 5, y: 3 },
    { x: 3, y: 3 },
    'ferry-intervention',
  ],
  [
    'four-hands-and-a-promise',
    'mutant-discipline',
    { x: 4, y: 2 },
    { x: 3, y: 2 },
    'rig-intervention',
  ],
  [
    'probability-of-panic',
    'mutant-genius',
    { x: 5, y: 2 },
    { x: 2, y: 2 },
    'forecast-intervention',
  ],
  [
    'keys-to-the-shelter',
    'mutant-birthright',
    { x: 4, y: 3 },
    { x: 3, y: 3 },
    'keys-intervention',
  ],
  [
    'friend-nobody-remembers',
    'mutant-social',
    { x: 4, y: 2 },
    { x: 4, y: 2 },
    'slate-intervention',
  ],
  [
    'furnace-lift',
    'tech-fire',
    { x: 4, y: 2 },
    { x: 3, y: 2 },
    'furnace-intervention',
  ],
  [
    'last-skyway',
    'tech-air',
    { x: 5, y: 1 },
    { x: 3, y: 1 },
    'skyway-intervention',
  ],
  [
    'foundation-day',
    'tech-earth',
    { x: 4, y: 3 },
    { x: 4, y: 3 },
    'foundation-intervention',
  ],
  [
    'flooded-platform',
    'tech-water',
    { x: 5, y: 3 },
    { x: 3, y: 3 },
    'platform-intervention',
  ],
  [
    'parade-that-couldnt-stop',
    'tech-discipline',
    { x: 4, y: 2 },
    { x: 3, y: 2 },
    'parade-intervention',
  ],
  [
    'grandmas-password',
    'tech-genius',
    { x: 5, y: 2 },
    { x: 2, y: 2 },
    'bakery-intervention',
  ],
  [
    'museum-of-tomorrow',
    'tech-birthright',
    { x: 4, y: 3 },
    { x: 3, y: 3 },
    'museum-intervention',
  ],
  [
    'edited-rescue',
    'tech-social',
    { x: 4, y: 2 },
    { x: 4, y: 2 },
    'edit-intervention',
  ],
] as const) {
  const stage = clonePreset(stageId)
  assert.deepEqual(stageProblems(stage), [])
  for (const perspective of ['hero', 'villain'] as const) {
    const state = trainingState(41, stage, { lead })
    const actor = state.units[0]!
    state.selected = actor.id
    actor.x = stage.civilians![0]!.x
    actor.y = stage.civilians![0]!.y
    actor.ap = 2
    assert.equal(rescueSelected(state), false)
    const originBlocked: Record<string, { x: number; y: number }> = {
      'ashes-of-the-ledger': { x: 0, y: 2 },
      'balcony-witness': { x: 0, y: 3 },
      'bridge-of-last-chances': { x: 0, y: 3 },
      'ship-with-no-port': { x: 0, y: 1 },
      'four-hands-and-a-promise': { x: 0, y: 4 },
      'probability-of-panic': { x: 0, y: 0 },
      'keys-to-the-shelter': { x: 0, y: 1 },
      'friend-nobody-remembers': { x: 0, y: 3 },
      'furnace-lift': { x: 0, y: 2 },
      'last-skyway': { x: 0, y: 4 },
      'foundation-day': { x: 0, y: 3 },
      'flooded-platform': { x: 0, y: 1 },
      'parade-that-couldnt-stop': { x: 0, y: 4 },
      'grandmas-password': { x: 0, y: 0 },
      'museum-of-tomorrow': { x: 0, y: 1 },
      'edited-rescue': { x: 0, y: 3 },
    }
    const blockedStart = originBlocked[stageId] ??
      (      stageId === 'orchard-under-asphalt'
        ? { x: 3, y: 2 }
        : stageId === 'overdue-thunder'
          ? { x: 0, y: 2 }
          : stageId === 'bell-and-the-door'
            ? { x: 1, y: 3 }
            : stageId === 'when-two-plus-two-screamed'
              ? { x: 0, y: 2 }
              : stageId === 'heir-who-said-no'
                ? { x: 0, y: 4 }
                : stageId === 'empty-applause'
                  ? { x: 3, y: 2 }
                  : { x: 2, y: 2 })
    actor.x = blockedStart.x
    actor.y = blockedStart.y
    assert.equal(useSelectedPower(state, target), false)
    actor.x = start.x
    actor.y = start.y
    const cost = lead.startsWith('magic-') ? 2 : 1
    actor.ap = cost - 1
    assert.equal(useSelectedPower(state, target), false)
    actor.ap = cost
    assert.deepEqual(selectedPowerTargets(state), [target])
    assert.equal(useSelectedPower(state, target), true)
    assert.equal(actor.ap, 0)
    assert.equal(actor.powerSpent, true)
    assert.ok(state.flags?.includes(flag))
    const checkpoint = createSave({
      slot: 'slot-2',
      perspective,
      leadSignature: lead,
      stage,
      state,
      story: { ...createStory(), current: null },
    })
    assert.ok(loadSave(JSON.stringify(checkpoint)).ok)
    assert.equal(
      loadSave(
        JSON.stringify(
          createSave({ ...checkpoint, state: { ...state, flags: [] } }),
        ),
      ).ok,
      false,
    )
    actor.ap = 2
    assert.deepEqual(selectedPowerTargets(state), [])
    for (const civilian of stage.civilians!) {
      actor.x = civilian.x
      actor.y = civilian.y
      actor.ap = 2
      assert.equal(rescueSelected(state), true)
    }
    assert.equal(state.phase, 'victory')
  }
}

// Identity-locked rescue scenarios cannot strand someone without the needed
// power, even if a saved menu or scripted call bypasses the visual filter.
assert.deepEqual(ORIGIN_STAGE_LEADS, {
  'last-order': 'accident-fire',
  'ferris-wheel': 'accident-air',
  'sunken-street': 'accident-earth',
  'unlicensed-rescue': 'accident-birthright',
  'song-that-stopped': 'accident-social',
  'hydrant-blue': 'accident-water',
  'clocktower-collapse': 'accident-discipline',
  'equation-that-escaped': 'accident-genius',
  'candle-that-wouldnt-die': 'magic-fire',
  'orchard-under-asphalt': 'magic-earth',
  'future-in-the-glass': 'magic-water',
  'overdue-thunder': 'magic-air',
  'bell-and-the-door': 'magic-discipline',
  'when-two-plus-two-screamed': 'magic-genius',
  'heir-who-said-no': 'magic-birthright',
  'empty-applause': 'magic-social',
  'ashes-of-the-ledger': 'mutant-fire',
  'balcony-witness': 'mutant-air',
  'bridge-of-last-chances': 'mutant-earth',
  'ship-with-no-port': 'mutant-water',
  'four-hands-and-a-promise': 'mutant-discipline',
  'probability-of-panic': 'mutant-genius',
  'keys-to-the-shelter': 'mutant-birthright',
  'friend-nobody-remembers': 'mutant-social',
  'furnace-lift': 'tech-fire',
  'last-skyway': 'tech-air',
  'foundation-day': 'tech-earth',
  'flooded-platform': 'tech-water',
  'parade-that-couldnt-stop': 'tech-discipline',
  'grandmas-password': 'tech-genius',
  'museum-of-tomorrow': 'tech-birthright',
  'edited-rescue': 'tech-social',
})
for (const [stage, signature] of Object.entries(ORIGIN_STAGE_LEADS)) {
  assert.equal(canStartOneShot(stage, signature), true)
  for (const different of ['accident-fire', 'accident-air', 'accident-earth']) {
    if (different !== signature)
      assert.equal(canStartOneShot(stage, different), false)
  }
}
assert.equal(canStartOneShot('science-lab', 'psychic-social'), true)

// One-shot menu: Picnic Panic first, every stage valid with shipped art.
assert.ok(
  readFileSync(
    'components/every-villain-tactics/every-villain-front-menu.vue',
    'utf8',
  ).includes('front-origin-song-that-stopped'),
)
const oneShots = oneShotStages()
assert.equal(oneShots.length, ONE_SHOT_MENU.length)
assert.equal(oneShots[0]!.id, 'picnic-plaza')
assert.equal(
  paintedMapArtId('picnic-plaza'),
  265016,
  'the existing painted Picnic Plaza map is the preview source',
)
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

// Rival foil: any canonical hero not already in the squad leads the rivals.
const foiled = trainingState(0x53a1b7, undefined, {
  lead: 'accident-fire',
  foil: 'magic-water',
})
const foilUnit = foiled.units.find((u) => u.team === 'rival')!
assert.equal(foilUnit.identity, 'magic-water')
assert.ok(foilUnit.role && foilUnit.power, 'the foil fights with their own kit')
assert.equal(
  trainingState(1, undefined, { lead: 'accident-fire' }).units.find(
    (u) => u.team === 'rival',
  )!.identity,
  DEFAULT_FOIL,
)
assert.equal(isValidFoil('accident-fire', 'accident-fire'), false)
assert.equal(isValidFoil('tech-genius', 'accident-fire'), false)
assert.equal(isValidFoil('not-a-hero', 'accident-fire'), false)
assert.equal(
  trainingState(1, undefined, {
    lead: 'accident-fire',
    foil: 'accident-fire',
  }).units.find((u) => u.team === 'rival')!.identity,
  DEFAULT_FOIL,
  'an invalid foil is ignored',
)
assert.equal(
  trainingState(1, clonePreset('college-quad'), {
    foil: 'magic-water',
  }).units.find((u) => u.team === 'rival')!.identity,
  DEFAULT_FOIL,
  'stage battles keep their authored rivals',
)
const foilSave = createSave({
  slot: 'slot-1',
  perspective: 'villain',
  leadSignature: 'accident-fire',
  foilSignature: 'magic-water',
  stage: null,
  state: foiled,
  story: createStory(),
  savedAt: '2026-10-30T14:30:00.000Z',
})
assert.equal(foilSave.foilSignature, 'magic-water')
assert.ok(loadSave(JSON.stringify(foilSave)).ok)
const noFoil = createSave({
  slot: 'slot-1',
  perspective: 'hero',
  leadSignature: 'accident-fire',
  foilSignature: null,
  stage: null,
  state: trainingState(0x53a1b7, undefined, { lead: 'accident-fire' }),
  story: createStory(),
})
assert.equal('foilSignature' in noFoil, false, 'old-shape saves stay identical')
const swapped = structuredClone(foilSave)
swapped.foilSignature = 'accident-fire'
const { checksum: _c, ...swappedPayload } = swapped
assert.equal(
  loadSave(
    JSON.stringify({
      ...swappedPayload,
      checksum: saveChecksum(swappedPayload),
    }),
  ).ok,
  false,
  'a foil that duplicates the lead is refused',
)
const unfoiled = structuredClone(foilSave)
delete unfoiled.foilSignature
const { checksum: _d, ...unfoiledPayload } = unfoiled
assert.equal(
  loadSave(
    JSON.stringify({
      ...unfoiledPayload,
      checksum: saveChecksum(unfoiledPayload),
    }),
  ).ok,
  false,
  'dropping the foil field cannot smuggle a different rival in',
)

// Only hero and villain are available at a new game's front door. Existing
// sidekick/henchman save content is still readable by the underlying engine.
assert.deepEqual(PLAYABLE_PERSPECTIVES, ['hero', 'villain'])
for (const identity of IDENTITY_ARCS) {
  for (const role of ['hero', 'villain'] as const) {
    // Mirror comicIntroArt's own fallback order: the role art, then student art.
    const candidates = [
      ...identityArtCandidateKeys(identity.signature, role),
      ...identityArtCandidateKeys(identity.signature, 'student'),
    ].filter((key) => promArt(key))
    const art = comicIntroArt(comicIntroFor(identity.signature, role))
    if (candidates.some((key) => !isRejectedIdentityArt(key))) {
      assert.ok(
        art,
        identity.signature +
          ' ' +
          role +
          ' intro must reuse existing painted art',
      )
    } else {
      // Only the visual canon quarantine may leave a shipped identity bare.
      assert.ok(
        candidates.some(isRejectedIdentityArt),
        identity.signature + ' ' + role + ' intro has no painted art at all',
      )
      assert.equal(
        art,
        null,
        identity.signature +
          ' ' +
          role +
          ' intro must not show quarantined art',
      )
    }
  }
  assert.equal(
    comicIntroArt(comicIntroFor(identity.signature, 'henchman')),
    null,
  )
}

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
  'front-foil-note',
])
  assert.match(menu, new RegExp('data-testid="' + id + '"'))
assert.match(menu, /route\.query\.from === 'prom'/)
assert.match(
  menu,
  /store\.roster\.some\(\(person\) => person\.signature === incomingLead\)/,
)
assert.match(menu, /store\.chooseLead\(incomingLead\)/)
assert.match(menu, /store\.choosePerspective\(incomingView\)/)
assert.match(
  menu,
  /identityArtwork\(\s*pickedLead\.value,\s*pickedView\.value === 'villain' \? 'villain' : 'hero',/,
  'selection falls back to canon-safe hero/villain art',
)
assert.match(
  menu,
  /reviewedIdentityArtwork\(/,
  'perspective thumbnails must observe the quarantined artwork list',
)
assert.doesNotMatch(
  menu,
  /promArt\(\s*'identities\/' \+ pickedLead\.value \+ '\/outcomes\/'/,
  'old unreviewed identity outcome paths must not reach the menu',
)
for (const signature of ['tech-genius', 'magic-earth', 'mutant-discipline']) {
  const unsafeKey = 'identities/' + signature + '/outcomes/hero'
  assert.ok(isRejectedIdentityArt(unsafeKey))
  assert.notEqual(
    identityArtwork(signature, 'hero'),
    promArt(unsafeKey),
    signature + ' cannot use a visually rejected hero image in selection',
  )
}
assert.match(menu, /store\.openScreen\('story'\)/)
const academyOpening = readFileSync(
  new URL(
    '../../components/play/cometAcademy/AcademyOpening.vue',
    import.meta.url,
  ),
  'utf8',
)
for (const id of [
  'academy-shared-mode',
  'academy-mode-story',
  'academy-mode-tactics',
  'academy-mode-continue',
  'academy-tactics-allegiance',
  'academy-tactics-launch',
])
  assert.match(academyOpening, new RegExp('data-testid="' + id + '"'))
assert.match(academyOpening, /path: '\/admin\/every-villain-tactics'/)
assert.match(academyOpening, /lead: currentSignature\.value\.id/)
assert.match(academyOpening, /view: selectedAllegiance\.value/)
assert.match(
  academyOpening,
  /selectedMode\.value === 'story' \? 'vow' : 'tactics-side'/,
)
assert.match(menu, /'front-origin-' \+ option\.id/)
assert.match(menu, /'front-affinity-' \+ option\.id/)
assert.match(menu, /data-testid="front-character-reveal"/)
assert.match(menu, /paintedRevealArtId\(comicIntroFor\(pickedLead.value/)
assert.match(menu, /useEveryVillainTacticsArtStore/)
assert.match(menu, /paintedArt.ensure\(heroId\)/)
assert.match(menu, /paintedArt.ensure\(villainId\)/)
assert.match(menu, /selectedPaintedArtwork.value/)
assert.match(menu, /evf-painted-art/)
assert.match(menu, /store\.startOneShot\(stage\.id, pickedLead, pickedView\)/)
assert.match(menu, /data-testid="front-origin-last-order"/)
assert.match(menu, /data-testid="front-origin-sunken-street"/)
assert.match(menu, /data-testid="front-origin-unlicensed-rescue"/)
assert.match(menu, /pickedLead === 'accident-earth'/)
assert.match(menu, /pickedLead === 'accident-fire'/)
assert.match(menu, /scriptedFoilFor\(pickedLead\.value\)/)
assert.doesNotMatch(menu, /'front-foil-' \+ person\.signature/)
assert.match(menu, /PLAYABLE_PERSPECTIVES\.map/)
assert.doesNotMatch(menu, /four viewpoints/)
assert.match(menu, /aria-modal="true"/)
assert.match(menu, /data-roving="vertical"/)
assert.ok(menu.includes("paintedMapArtId('picnic-plaza')"))
assert.ok(menu.includes('paintedArt.ensure(picnicPaintedMapId)'))
assert.ok(menu.includes(':src="oneShotArtwork(stage)!"'))
assert.ok(menu.includes('paintedArt.images[picnicPaintedMapId]?.src'))
assert.ok(
  menu.includes('paintedArt.images[picnicPaintedMapId]?.src || art(stage.art)'),
  'failed private image delivery must preserve the existing public fallback',
)
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
assert.match(page, /data-testid="tactics-fire-targets"/)
assert.match(page, /store\.fireAt\(target\.target\)/)
assert.match(page, /--evt-board-art/)
assert.match(page, /class="evt-map-legend-items"/)
// Playable arenas must use real generated painted ArtImages, never code-drawn
// SVG maps. All shipped preset stages resolve to DONE ArtImage IDs.
for (const stage of STAGE_PRESETS) {
  assert.ok(paintedMapArtId(stage.id), stage.id + ' needs modeler painting')
}
assert.equal(paintedMapArtId(null), 265014)
assert.equal(paintedMapArtId('unknown-custom-stage'), null)
assert.deepEqual(
  [
    paintedMapArtId('last-order'),
    paintedMapArtId('sunken-street'),
    paintedMapArtId('unlicensed-rescue'),
  ],
  [
    VERIFIED_EVT_ARENA_RECEIPTS['last-order'].imageId,
    VERIFIED_EVT_ARENA_RECEIPTS['sunken-street'].imageId,
    VERIFIED_EVT_ARENA_RECEIPTS['unlicensed-rescue'].imageId,
  ],
  'three distinct DONE production arenas replace temporary paintings',
)
assert.equal(
  new Set([
    paintedMapArtId('last-order'),
    paintedMapArtId('sunken-street'),
    paintedMapArtId('unlicensed-rescue'),
  ]).size,
  3,
)

for (const [stage, receipt] of Object.entries(VERIFIED_EVT_ARENA_RECEIPTS)) {
  assert.equal(paintedMapArtId(stage), receipt.imageId)
  assert.ok(receipt.jobId > 0)
  assert.match(receipt.artKey, /^every-villain-tactics\/maps\//)
  assert.match(receipt.sourceLedger, /-ROUND-1\.yaml$/)
}
assert.ok(Object.values(PAINTED_EVT_MAP_ART).every((id) => id > 265000))
assert.match(page, /useEveryVillainTacticsArtStore/)
assert.match(page, /paintedArt\.ensure\(id\)/)
assert.match(page, /tactics-painted-map-status/)
assert.doesNotMatch(page, /every-villain-tactics\/maps\/[^'"]+\.svg/)
const paintedLoader = readFileSync(
  new URL('../../stores/everyVillainTacticsArtStore.ts', import.meta.url),
  'utf8',
)
assert.match(paintedLoader, /Authorization: `Bearer/)
assert.match(paintedLoader, /URL\.createObjectURL\(blob\)/)
assert.match(paintedLoader, /response\.headers\.get\('content-type'\)/)
for (const origin of POWER_ORIGINS)
  for (const affinity of POWER_AFFINITIES) {
    const signature = signatureFor(origin.id, affinity.id).id
    assert.ok(
      IDENTITY_ARCS.some((identity) => identity.signature === signature),
      signature + ' has a real canonical fighter',
    )
    assert.ok(isValidFoil(scriptedFoilFor(signature), signature))
  }
// FIRE uses the same real deterministic attack as clicking a rival on the
// board; the new touch target list is just a direct route to that action.
const rangeState = trainingState(12)
const shooter = rangeState.units.find((unit) => unit.id === 'backdraft')!
const rival = rangeState.units.find((unit) => unit.id === 'remy')!
shooter.x = 5
shooter.y = 4
rival.x = 7
rival.y = 4
assert.ok(previewShot(shooter, rival, rangeState.map).hit > 0)
assert.equal(fireSelected(rangeState, rival), true)
assert.equal(shooter.fired, true)
assert.equal(shooter.ap, 1)
assert.equal(fireSelected(rangeState, rival), false)
// All 177 newly generated ArtImages are attached, without replacing the
// 12 earlier First Bell paintings or a finished direct Prom poster.
const firstBellReveals = [
  ['accident-fire', 270741, 270742],
  ['tech-genius', 270743, 270744],
  ['mutant-earth', 270745, 270746],
  ['accident-air', 270747, 270748],
  ['tech-fire', 270749, 270750],
  ['magic-social', 270751, 270752],
] as const
assert.equal(Object.keys(PAINTED_EVT_REVEAL_ART).length, 95)
assert.equal(Object.keys(PAINTED_EVT_SUPPORT_ART).length, 96)
const ids = [
  ...Object.values(PAINTED_EVT_REVEAL_ART),
  ...Object.values(PAINTED_EVT_SUPPORT_ART),
]
assert.equal(new Set(ids).size, 191)
assert.ok(ids.every((id) => Number.isSafeInteger(id) && id > 0))
const newlyRenderedIds = ids
  .filter((id) => id >= 271955 && id <= 272131)
  .sort((a, b) => a - b)
assert.deepEqual(
  newlyRenderedIds,
  Array.from({ length: 177 }, (_, index) => 271955 + index),
  'all 177 new Comfy render receipts are attached once',
)
for (const [signature, heroImage, villainImage] of firstBellReveals) {
  assert.equal(paintedRevealArtId(comicIntroFor(signature, 'hero')), heroImage)
  assert.equal(
    paintedRevealArtId(comicIntroFor(signature, 'villain')),
    villainImage,
  )
}
assert.equal(
  paintedRevealArtId(comicIntroFor('accident-earth', 'hero')),
  271955,
)
assert.equal(
  paintedRevealArtId(comicIntroFor('accident-earth', 'villain')),
  271956,
)
assert.equal(
  paintedRevealArtId(comicIntroFor('accident-fire', 'lieutenant')),
  272038,
)
assert.equal(
  paintedRevealArtId(comicIntroFor('accident-fire', 'henchman')),
  272085,
)
assert.equal(
  paintedRevealArtId(comicIntroFor('accident-earth', 'lieutenant')),
  257611,
)
assert.equal(
  paintedRevealArtId(comicIntroFor('accident-earth', 'henchman')),
  257626,
)
assert.equal(paintedRevealArtId(null), null)
for (const person of IDENTITY_ARCS) {
  for (const role of ['hero', 'villain'] as const) {
    const intro = comicIntroFor(person.signature, role)
    const privateId = paintedRevealArtId(intro)
    if (person.signature === 'mutant-genius' && role === 'villain') {
      assert.equal(privateId, null, 'use the existing direct Prom poster')
    } else {
      assert.ok(privateId, person.signature + ' ' + role)
    }
    assert.ok(privateId || comicIntroArt(intro))
  }
  for (const role of ['lieutenant', 'henchman'] as const) {
    const intro = comicIntroFor(person.signature, role)
    assert.ok(
      paintedRevealArtId(intro),
      person.signature + ' ' + role + ' must have its own painted actor',
    )
  }
}
assert.match(page, /paintedRevealArtId\(activeComicIntro.value\)/)
assert.match(page, /\[activeComicImageId, \(\) => viewer.token\]/)
assert.match(page, /paintedArt.ensure\(id\)/)
assert.match(page, /paintedArt.images\[id\]\?\.src/)
assert.match(page, /comicIntroArt\(intro\)/)
assert.match(page, /:art-src="activeComicArt"/)
assert.ok(
  (page.match(/class="evt-dialogue-portrait"/g) ?? []).length >= 3,
  'all three cinematic dialogue surfaces provide portrait slots',
)

console.log(
  'Every Villain Tactics front menu: settings, ' +
    SCRAPBOOK_MOMENTS.length +
    ' save-grounded scrapbook pages, ' +
    oneShots.length +
    ' one-shots and exact threat preview verified.',
)
