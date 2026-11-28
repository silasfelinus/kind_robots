import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  MAX_ACTION_POINTS,
  gridDistance,
  reachableCells,
  tileAt,
} from '../everyVillainTactics/combat'
import {
  CROSSFIRE_CHAPTERS,
  advanceCrossfire,
  applyCrossfireCarryover,
  applyCrossfireFinaleNetwork,
  crossfireCarryover,
  crossfireCampaignScore,
  crossfireFinaleNetwork,
  crossfireChapterTitle,
  crossfireScrapbookSaves,
  evtCrossfireKey,
  newCrossfireJournal,
  readCrossfireJournal,
  retryCrossfire,
  snapshotCrossfire,
} from '../everyVillainTactics/crossfireCampaign'
import {
  PERSONAL_CASTS,
  personalCastFor,
} from '../everyVillainTactics/personalCasts'
import { IDENTITY_ARCS, identityFor } from '../cometAcademy/identityArcs'
import {
  ACCIDENT_SCIENCE_LINES,
  MAGIC_SCIENCE_LINES,
  TECH_SCIENCE_LINES,
  MUTANT_SCIENCE_LINES,
  ALIEN_SCIENCE_LINES,
  PSYCHIC_SCIENCE_LINES,
  PERSONAL_SCIENCE_LINES,
  personalScienceNode,
} from '../everyVillainTactics/personalScienceScenes'
import { SCIENCE_WING_SCRIPT } from '../everyVillainTactics/scienceWingScript'
import { ROOFTOP_BROADCAST_SCRIPT } from '../everyVillainTactics/rooftopBroadcastScript'
import {
  PERSONAL_ROOFTOP_LINES,
  personalRooftopNode,
} from '../everyVillainTactics/personalRooftopScenes'
import {
  PERSONAL_CROSSWALK_LINES,
  personalCrosswalkNode,
} from '../everyVillainTactics/personalCrosswalkScenes'
import {
  PERSONAL_BREACH_LINES,
  personalBreachNode,
} from '../everyVillainTactics/personalBreachScenes'
import {
  PERSONAL_FINALE_LINES,
  personalFinaleNode,
} from '../everyVillainTactics/personalFinaleScenes'
import { PROM_NIGHT_FINALE_SCRIPT } from '../everyVillainTactics/promNightFinaleScript'
import { UNDER_COMET_BREACH_SCRIPT } from '../everyVillainTactics/underCometBreachScript'
import { CROSSWALK_CRISIS_SCRIPT } from '../everyVillainTactics/crosswalkCrisisScript'
import {
  PERSONAL_SUPPORT_VOICES,
  personalSupportVoice,
} from '../everyVillainTactics/personalSupportVoices'
import { applySupport, supportPlan } from '../everyVillainTactics/supportAgency'
import {
  crossfireChapterBeat,
  PERSONAL_CAMPAIGNS,
  crossfireCurrentChapter,
  crossfireFinale,
  crossfirePreviousChapter,
} from '../everyVillainTactics/crossfireNarrative'
import {
  applyChoice,
  createStory,
  enqueueBeat,
  storyMoment,
} from '../everyVillainTactics/firstBellStory'
import {
  finishScene,
  latchScenes,
  pendingScriptScene,
  walkScene,
} from '../everyVillainTactics/sceneGraph'
import {
  createSave,
  evtSaveKey,
  loadSave,
  type EvtSave,
} from '../everyVillainTactics/saves'
import {
  mergeBattleResults,
  scoreFromSave,
} from '../everyVillainTactics/scores'
import { clonePreset, stageProblems } from '../everyVillainTactics/studio'
import {
  endTurn,
  exposureAt,
  fireSelected,
  hunkerSelected,
  isCrossfireFoilStage,
  moveSelected,
  overwatchSelected,
  previewSelectedPower,
  previewShot,
  rescueSelected,
  scriptedFoilFor,
  selectedPowerTargets,
  trainingState,
  useSelectedPower,
  type TrainingState,
  type Unit,
} from '../everyVillainTactics/training'

assert.deepEqual(
  CROSSFIRE_CHAPTERS.map((chapter) => chapter.id),
  [
    'first-bell',
    'science-lab',
    'crosswalk-crisis',
    'rooftop-broadcast',
    'under-comet-breach',
    'prom-night-finale',
  ],
)
assert.notEqual(evtCrossfireKey, evtSaveKey('auto'))
for (const chapter of CROSSFIRE_CHAPTERS.slice(1))
  assert.deepEqual(stageProblems(clonePreset(chapter.id)), [])

const first = createSave({
  slot: 'auto',
  perspective: 'hero',
  leadSignature: 'accident-fire',
  foilSignature: 'accident-air',
  stage: null,
  state: trainingState(0x53a1b7, undefined, {
    lead: 'accident-fire',
    foil: 'accident-air',
  }),
  story: createStory(),
})
const started = newCrossfireJournal(first)!
assert.ok(started)
assert.equal(crossfireChapterTitle(started), 'First Bell')
assert.equal(started.completed.length, 0)
assert.equal(started.finished, false)
assert.ok(readCrossfireJournal(JSON.stringify(started)))
assert.equal(advanceCrossfire(started), null, 'no free chapter advances')
assert.deepEqual(crossfireCampaignScore(started), {
  chapters: [],
  cleared: 0,
  total: 0,
  medals: 0,
})
assert.deepEqual(crossfireScrapbookSaves(started), [first])
assert.equal(scoreFromSave(crossfireScrapbookSaves(started)[0]!), null)
assert.equal(
  readCrossfireJournal(JSON.stringify({ ...started, chapter: 5 })),
  null,
  'a forged chapter counter does not unlock Prom Night',
)
assert.equal(readCrossfireJournal('this is not JSON'), null)
assert.equal(readCrossfireJournal(null), null)

const losing = createSave({
  slot: 'auto',
  perspective: 'hero',
  leadSignature: 'accident-fire',
  foilSignature: 'accident-air',
  stage: null,
  state: { ...first.state, phase: 'defeat' },
  story: first.story,
})
assert.equal(
  advanceCrossfire(snapshotCrossfire(started, losing)!),
  null,
  'losses never silently advance the campaign',
)
const unrelated = createSave({
  slot: 'auto',
  perspective: 'hero',
  leadSignature: 'accident-fire',
  stage: clonePreset('picnic-plaza'),
  state: trainingState(123, clonePreset('picnic-plaza'), {
    lead: 'accident-fire',
  }),
  story: { ...createStory(), current: null },
})
assert.equal(snapshotCrossfire(started, unrelated), null)

let journal = started
for (let chapter = 0; chapter < CROSSFIRE_CHAPTERS.length; chapter++) {
  const save = journal.active
  const state = structuredClone(save.state)
  state.phase = 'victory'
  const story = structuredClone(save.story)
  if (chapter === 0) {
    story.current = null
    story.seen.push('victory')
    story.decisions.push('finish')
    story.completed = true
    state.fired ??= []
    state.fired.push('story:victory')
  }
  const victory = createSave({
    slot: 'auto',
    perspective: 'hero',
    leadSignature: 'accident-fire',
    foilSignature: save.foilSignature,
    stage: save.stage,
    state,
    story,
  })
  assert.ok(loadSave(victory).ok, 'each chapter has a valid v2 checkpoint')
  const checkpoint = snapshotCrossfire(journal, victory)!
  assert.ok(checkpoint)
  assert.ok(readCrossfireJournal(JSON.stringify(checkpoint)))
  const recovered = crossfireScrapbookSaves(JSON.stringify(checkpoint))
  assert.equal(recovered.length, chapter + 1)
  assert.equal(recovered.at(-1)?.checksum, victory.checksum)
  const retried = retryCrossfire(checkpoint)!
  assert.ok(retried)
  assert.deepEqual(retried.completed, journal.completed)
  assert.deepEqual(retried.active.state, journal.active.state)
  assert.deepEqual(retried.active.story, journal.active.story)
  assert.equal(retried.active.state.phase, 'active')
  assert.equal(crossfireCampaignScore(retried)?.cleared, chapter)
  assert.ok(readCrossfireJournal(JSON.stringify(retried)))
  const next = advanceCrossfire(checkpoint)!
  assert.ok(next, 'the earned victory advances to next chapter')
  const beforeAdvance = crossfireCampaignScore(checkpoint)!
  const afterAdvance = crossfireCampaignScore(next)!
  assert.equal(beforeAdvance.cleared, chapter + 1)
  assert.deepEqual(beforeAdvance, afterAdvance, 'no duplicate on advance')
  assert.equal(
    afterAdvance.total,
    next.completed.reduce((sum, save) => sum + scoreFromSave(save)!.total, 0),
  )
  assert.deepEqual(
    crossfireCampaignScore(JSON.stringify(next)),
    afterAdvance,
    'score survives reload without granting new points',
  )
  assert.equal(next.completed.length, chapter + 1)
  assert.equal(next.chapter, Math.min(chapter + 1, 5))
  assert.ok(readCrossfireJournal(JSON.stringify(next)))
  if (chapter < 5) {
    assert.equal(
      next.active.stage?.id ?? 'first-bell',
      CROSSFIRE_CHAPTERS[chapter + 1]!.id,
    )
    assert.equal(next.active.leadSignature, 'accident-fire')
    assert.equal(next.active.foilSignature, 'accident-air')
    assert.equal(
      next.active.state.units.find((unit) => unit.id === 'pip')?.identity,
      'accident-air',
    )
    assert.equal(next.active.perspective, 'hero')
  }
  journal = next
}
assert.ok(journal.finished)
assert.equal(retryCrossfire(journal), null)
assert.equal(retryCrossfire('invalid'), null)
assert.equal(journal.completed.length, 6)
assert.equal(advanceCrossfire(journal), null, 'finale never repeats')
const forgedPrefix = structuredClone(journal)
forgedPrefix.completed[0] = unrelated
assert.equal(readCrossfireJournal(forgedPrefix), null)
const wrongOrder = structuredClone(journal)
wrongOrder.completed.reverse()
assert.equal(readCrossfireJournal(wrongOrder), null)
assert.deepEqual(crossfireScrapbookSaves(forgedPrefix), [])
assert.deepEqual(crossfireScrapbookSaves(wrongOrder), [])
assert.equal(crossfireCampaignScore(wrongOrder), null)
assert.equal(crossfireCampaignScore(forgedPrefix), null)
assert.equal(crossfireCampaignScore(journal)?.cleared, 6)
assert.equal(
  crossfireCampaignScore(snapshotCrossfire(started, losing))?.total,
  0,
  'a defeat cannot add to the earned campaign score',
)
assert.deepEqual(crossfireScrapbookSaves('not JSON'), [])
assert.deepEqual(crossfireScrapbookSaves(null), [])
const recoveredCampaign = crossfireScrapbookSaves(JSON.stringify(journal))
assert.deepEqual(recoveredCampaign, journal.completed)
const recoveredScores = recoveredCampaign.map((save) => ({
  ...scoreFromSave(save)!,
  mode: 'story' as const,
}))
assert.equal(recoveredScores.length, 6)
assert.ok(recoveredScores.every((score) => score.total > 0))
const recoveredBook = mergeBattleResults([], recoveredScores)
assert.equal(recoveredBook.length, 6)
assert.deepEqual(
  mergeBattleResults(recoveredBook, recoveredScores),
  recoveredBook,
  'reopening a completed campaign must not duplicate points',
)

// A new personal campaign keeps its selected supporting cast across all
// follow-on chapters, while the legacy journal above retains its old roster.
assert.deepEqual(
  Object.keys(PERSONAL_CASTS).sort(),
  IDENTITY_ARCS.map((person) => person.signature).sort(),
)
const castCombinations = new Set<string>()
for (const person of IDENTITY_ARCS) {
  const cast = personalCastFor(person.signature)!
  assert.ok(cast)
  const expected = [person.signature, ...cast.allies, cast.foil, ...cast.rivals]
  assert.equal(new Set(expected).size, 6)
  assert.ok(expected.every((id) => identityFor(id)))
  assert.ok(!castCombinations.has(expected.slice(1).join(',')))
  castCombinations.add(expected.slice(1).join(','))
  for (const version of [1, 2] as const) {
    for (const perspective of ['hero', 'villain'] as const) {
      const opening = createSave({
        slot: 'auto',
        perspective,
        leadSignature: person.signature,
        foilSignature: cast.foil,
        stage: null,
        state: trainingState(123, undefined, {
          lead: person.signature,
          foil: cast.foil,
          crossfireCast: version,
        }),
        story: createStory(),
      })
      let personal = newCrossfireJournal(opening)!
      assert.ok(personal)
      assert.equal(personal.active.state.crossfireCast, version)
      for (let chapter = 0; chapter < 6; chapter++) {
        const current = personal.active
        assert.ok(loadSave(current).ok)
        assert.equal(current.state.crossfireCast, version)
        if (chapter > 0 || version === 2) {
          assert.deepEqual(
            current.state.units.map((unit) => unit.identity),
            expected,
          )
          assert.deepEqual(
            retryCrossfire(personal)?.active.state.units.map(
              (unit) => unit.identity,
            ),
            expected,
          )
        }
        if (chapter === 0 && version === 2) {
          const arrival = storyMoment(
            perspective,
            'arrival',
            person.signature,
            current.story,
            current.state,
          )
          const roster = arrival.lines.find(
            (line) =>
              line.speaker === 'FIELD REPORT' &&
              line.text.includes('Opposing patrol:'),
          )
          assert.ok(roster)
          for (const id of expected)
            assert.ok(roster.text.includes(identityFor(id).hero.alias))
          assert.equal(
            arrival.lines[1]?.speaker,
            identityFor(cast.allies[0]).hero.alias,
          )
        }
        const state = structuredClone(current.state)
        state.phase = 'victory'
        const story = structuredClone(current.story)
        if (chapter === 0) {
          story.current = null
          story.seen.push('victory')
          story.decisions.push('finish')
          story.completed = true
          state.fired ??= []
          state.fired.push('story:victory')
        }
        const victory = createSave({
          slot: 'auto',
          perspective,
          leadSignature: person.signature,
          foilSignature: cast.foil,
          stage: current.stage,
          state,
          story,
        })
        const checkpoint = snapshotCrossfire(personal, victory)
        assert.ok(checkpoint)
        const next = advanceCrossfire(checkpoint)
        assert.ok(next)
        personal = next
      }
      assert.ok(personal.finished)
      assert.ok(readCrossfireJournal(JSON.stringify(personal)))
    }
  }
}
const personalCastStage = clonePreset('science-lab')
const personalCast = personalCastFor('alien-discipline')!
const forgedCastState = trainingState(123, personalCastStage, {
  lead: 'alien-discipline',
  foil: personalCast.foil,
  crossfireCast: 1,
})
forgedCastState.units[1]!.identity = 'accident-fire'
assert.equal(
  loadSave(
    createSave({
      slot: 'auto',
      perspective: 'hero',
      leadSignature: 'alien-discipline',
      foilSignature: personalCast.foil,
      stage: personalCastStage,
      state: forgedCastState,
      story: { ...createStory(), current: null },
    }),
  ).ok,
  false,
  'recalculating a checksum cannot forge a supporting identity',
)

// Previously the selected foil disappeared after First Bell, letting the
// default enemy silently replace the campaign's named rival. Test a lead
// whose first foil differs from that default and all 48 authored identities.
const alternateLead = 'accident-air'
const alternateFoil = scriptedFoilFor(alternateLead)
assert.notEqual(alternateFoil, alternateLead)
assert.notEqual(alternateFoil, 'accident-air')
const alternateFirst = createSave({
  slot: 'auto',
  perspective: 'villain',
  leadSignature: alternateLead,
  foilSignature: alternateFoil,
  stage: null,
  state: trainingState(144, undefined, {
    lead: alternateLead,
    foil: alternateFoil,
  }),
  story: createStory(),
})
const alternateStarted = newCrossfireJournal(alternateFirst)!
assert.ok(alternateStarted)
const alternateVictoryState = structuredClone(alternateFirst.state)
alternateVictoryState.phase = 'victory'
alternateVictoryState.fired ??= []
alternateVictoryState.fired.push('story:victory')
const alternateVictory = createSave({
  slot: 'auto',
  perspective: 'villain',
  leadSignature: alternateLead,
  foilSignature: alternateFoil,
  stage: null,
  state: alternateVictoryState,
  story: {
    ...createStory(),
    current: null,
    seen: ['victory'],
    decisions: ['finish'],
    completed: true,
  },
})
let alternate = advanceCrossfire(
  snapshotCrossfire(alternateStarted, alternateVictory)!,
)!
assert.ok(alternate)
assert.equal(alternate.chapter, 1)
for (let chapter = 1; chapter < CROSSFIRE_CHAPTERS.length; chapter++) {
  const save = alternate.active
  assert.equal(save.foilSignature, alternateFoil)
  assert.equal(
    save.state.units.find((unit) => unit.id === 'pip')?.identity,
    alternateFoil,
    'the same canonical foe must command all six missions',
  )
  assert.equal(
    new Set(save.state.units.map((unit) => unit.identity)).size,
    save.state.units.length,
    'the chosen foil must not also be a second rival or squadmate',
  )
  assert.ok(loadSave(JSON.stringify(save)).ok)
  if (chapter === 5) break
  const victory = createSave({
    slot: 'auto',
    perspective: 'villain',
    leadSignature: alternateLead,
    foilSignature: alternateFoil,
    stage: save.stage,
    state: { ...save.state, phase: 'victory' },
    story: save.story,
  })
  alternate = advanceCrossfire(snapshotCrossfire(alternate, victory)!)!
  assert.ok(alternate)
}

// Existing v1 Crossfire journals may hold pre-fix stage saves with no foil
// field. They must remain readable; the *next* battle adopts the named foe.
const oldStage = clonePreset('science-lab')
const legacyStage = createSave({
  slot: 'auto',
  perspective: 'villain',
  leadSignature: alternateLead,
  stage: oldStage,
  state: trainingState(0x53a1b7 + 997, oldStage, {
    lead: alternateLead,
  }),
  story: { ...createStory(), current: null },
})
const legacyJournal = {
  ...advanceCrossfire(snapshotCrossfire(alternateStarted, alternateVictory)!)!,
  active: legacyStage,
}
assert.ok(readCrossfireJournal(JSON.stringify(legacyJournal)))
const legacyVictory = createSave({
  slot: 'auto',
  perspective: 'villain',
  leadSignature: alternateLead,
  stage: oldStage,
  state: { ...legacyStage.state, phase: 'victory' },
  story: legacyStage.story,
})
const afterLegacy = advanceCrossfire(
  snapshotCrossfire(legacyJournal, legacyVictory)!,
)!
assert.ok(afterLegacy)
assert.equal(afterLegacy.active.foilSignature, alternateFoil)
assert.equal(
  afterLegacy.active.state.units.find((unit) => unit.id === 'pip')?.identity,
  alternateFoil,
)

const wrongFoil = 'psychic-water'
const forgedFoilSave = createSave({
  slot: 'auto',
  perspective: 'villain',
  leadSignature: alternateLead,
  foilSignature: wrongFoil,
  stage: alternate.active.stage,
  state: alternate.active.state,
  story: alternate.active.story,
})
assert.equal(
  loadSave(forgedFoilSave).ok,
  false,
  'foil metadata cannot turn an enemy into a different canonical person',
)
assert.equal(
  readCrossfireJournal({
    ...alternate,
    active: forgedFoilSave,
  }),
  null,
  'campaign journal rejects an unrelated valid opponent identity',
)

const stages = CROSSFIRE_CHAPTERS.slice(1).map((chapter) =>
  clonePreset(chapter.id),
)
assert.equal(IDENTITY_ARCS.length, 48)
for (const person of IDENTITY_ARCS) {
  const foil = scriptedFoilFor(person.signature)
  for (const stage of stages) {
    assert.ok(isCrossfireFoilStage(stage))
    const state = trainingState(12345, stage, {
      lead: person.signature,
      foil,
    })
    const rival = state.units.find((unit) => unit.id === 'pip')!
    assert.equal(rival.identity, foil)
    assert.equal(
      new Set(state.units.map((unit) => unit.identity)).size,
      state.units.length,
      'Crossfire must not put the same canonical person on both sides',
    )
    const checkpoint = createSave({
      slot: 'auto',
      perspective: 'hero',
      leadSignature: person.signature,
      foilSignature: foil,
      stage,
      state,
      story: { ...createStory(), current: null },
    })
    const restored = loadSave(checkpoint)
    assert.ok(
      restored.ok,
      person.signature +
        ' / ' +
        stage.id +
        ': ' +
        (restored.ok ? 'valid' : restored.reason),
    )
  }
}
// A standalone stage has no forced Crossfire rival and no new save metadata.
const standalone = createSave({
  slot: 'slot-2',
  perspective: 'hero',
  leadSignature: alternateLead,
  stage: stages[0]!,
  state: trainingState(321, stages[0], { lead: alternateLead }),
  story: { ...createStory(), current: null },
})
assert.equal(standalone.foilSignature, undefined)
assert.equal(
  standalone.state.units.find((unit) => unit.id === 'pip')?.identity,
  'accident-air',
)
assert.ok(loadSave(standalone).ok)

// Consequences of *authored* choices are carried into the next real battle.
// Every resulting checkpoint must still pass the existing strict v2 validator.
const callbackCases: ReadonlyArray<{
  chapter: number
  flag?: string
  mercy?: boolean
  evidence?: number
  effect: 'guard' | 'intel' | 'none'
}> = [
  { chapter: 0, mercy: true, effect: 'guard' },
  { chapter: 0, evidence: 2, effect: 'intel' },
  { chapter: 0, effect: 'none' },
  { chapter: 1, flag: 'lab-rescued', effect: 'guard' },
  { chapter: 1, flag: 'lab-evidence', effect: 'intel' },
  { chapter: 2, flag: 'crosswalk-medics', effect: 'guard' },
  { chapter: 2, flag: 'crosswalk-jammed', effect: 'intel' },
  { chapter: 3, flag: 'roof-warning', effect: 'guard' },
  { chapter: 3, flag: 'roof-jammed', effect: 'intel' },
  { chapter: 4, flag: 'breach-vented', effect: 'guard' },
  { chapter: 4, flag: 'breach-evidence', effect: 'intel' },
]
for (const test of callbackCases) {
  const sourceStage =
    test.chapter === 0
      ? null
      : clonePreset(CROSSFIRE_CHAPTERS[test.chapter]!.id)
  const previousState = trainingState(0x53a1b7, sourceStage ?? undefined, {
    lead: 'accident-fire',
    foil: 'accident-air',
  })
  previousState.phase = 'victory'
  if (test.flag) previousState.flags = [test.flag]
  const previousStory = createStory()
  previousStory.current = null
  if (test.chapter === 0) {
    previousStory.seen.push('victory')
    previousStory.decisions.push('finish')
    previousStory.completed = true
    previousStory.mercy = !!test.mercy
    previousStory.evidence = test.evidence ?? 0
    previousState.fired ??= []
    previousState.fired.push('story:victory')
  }
  const previous = createSave({
    slot: 'auto',
    perspective: 'hero',
    leadSignature: 'accident-fire',
    foilSignature: test.chapter === 0 ? 'accident-air' : undefined,
    stage: sourceStage,
    state: previousState,
    story: previousStory,
  })
  assert.ok(
    loadSave(previous).ok,
    'the source decision must be a valid completed battle save',
  )
  const carry = crossfireCarryover(previous, test.chapter)
  assert.equal(carry.effect, test.effect)
  const nextStage = clonePreset(CROSSFIRE_CHAPTERS[test.chapter + 1]!.id)
  const incoming = trainingState(0x53a1b7 + test.chapter, nextStage, {
    lead: 'accident-fire',
  })
  applyCrossfireCarryover(incoming, previous, test.chapter)
  const squadLead = incoming.units.find((unit) => unit.id === 'backdraft')!
  const firstRival = incoming.units.find(
    (unit) => unit.team === 'rival' && unit.hp > 0,
  )!
  assert.equal(
    squadLead.statuses.includes('guarded'),
    test.effect === 'guard',
    'rescuing civilians gives a real opening defensive bonus',
  )
  assert.equal(
    firstRival.statuses.includes('marked'),
    test.effect === 'intel',
    'evidence carries a real opening hit-chance bonus',
  )
  assert.ok(incoming.log.includes(carry.note))
  assert.ok(incoming.events.includes(carry.note))
  const checkpoint = createSave({
    slot: 'auto',
    perspective: 'hero',
    leadSignature: 'accident-fire',
    stage: nextStage,
    state: incoming,
    story: { ...createStory(), current: null },
  })
  assert.ok(
    loadSave(checkpoint).ok,
    'the cross-chapter status effects must survive save/load validation',
  )
}

// Wounds carry as a single recoverable scar. Even a downed ally returns
// playable rather than silently killing that character in the next chapter.
const injured = structuredClone(started.active)
injured.state.units.find((unit) => unit.id === 'priya')!.hp = 1
injured.state.units.find((unit) => unit.id === 'hattie')!.hp = 0
const priorWounded = createSave({
  slot: 'auto',
  perspective: 'hero',
  leadSignature: 'accident-fire',
  foilSignature: 'accident-air',
  stage: null,
  state: injured.state,
  story: started.active.story,
})
assert.ok(loadSave(priorWounded).ok)
const scars = crossfireCarryover(priorWounded, 0)
assert.deepEqual(scars.wounded, ['priya', 'hattie'])
const scarStage = clonePreset('science-lab')
const scarState = trainingState(0x53a1b7, scarStage, {
  lead: 'accident-fire',
})
applyCrossfireCarryover(scarState, priorWounded, 0)
for (const unit of scarState.units.filter((u) => scars.wounded.includes(u.id)))
  assert.equal(unit.hp, Math.max(1, unit.maxHp - 1))
assert.equal(
  scarState.units.find((unit) => unit.id === 'backdraft')!.hp,
  scarState.units.find((unit) => unit.id === 'backdraft')!.maxHp,
)
const scarSave = createSave({
  slot: 'auto',
  perspective: 'hero',
  leadSignature: 'accident-fire',
  stage: scarStage,
  state: scarState,
  story: { ...createStory(), current: null },
})
assert.ok(loadSave(scarSave).ok, 'persistent wounds remain legal and playable')

// Every chapter now leaves a unique report that responds to the actual
// decisions. The final prom outcome is earned from the whole six-act history.
const choiceFlags = [
  ['', ''],
  ['lab-rescued', 'lab-evidence'],
  ['crosswalk-medics', 'crosswalk-jammed'],
  ['roof-warning', 'roof-jammed'],
  ['breach-vented', 'breach-evidence'],
  ['prom-shelter', 'prom-command'],
] as const
// A city that the squad protected in several chapters fights beside them
// at Prom Night. Two independently earned evidence trails expose *all* rivals.
// The conditional statuses survive the ordinary saved battle round-trip.
const finaleBase = journal.completed.slice(0, 5)
function chapterHistory(
  rescues: readonly number[],
  evidence: readonly number[],
) {
  return finaleBase.map((save, index) => {
    const story = structuredClone(save.story)
    const state = structuredClone(save.state)
    if (index === 0) {
      story.mercy = rescues.includes(index)
      story.civilians = 0
      story.evidence = evidence.includes(index) ? 1 : 0
    } else {
      const flag = rescues.includes(index)
        ? choiceFlags[index]![0]
        : evidence.includes(index)
          ? choiceFlags[index]![1]
          : null
      state.flags = flag ? [flag] : []
    }
    const entry = createSave({ ...save, state, story })
    assert.ok(loadSave(entry).ok, 'historical choices remain valid v2 saves')
    return entry
  })
}
const allHelp = chapterHistory([0, 1, 2], [])
const allProof = chapterHistory([], [0, 1, 2, 3, 4])
const mixedHistory = chapterHistory([0, 1, 2], [3, 4])
assert.deepEqual(crossfireFinaleNetwork(mixedHistory), {
  rescues: 3,
  evidence: 2,
  squadGuarded: true,
  enemiesExposed: true,
})
assert.equal(crossfireFinaleNetwork(finaleBase.slice(0, 4)), null)
assert.equal(
  crossfireFinaleNetwork([
    ...mixedHistory.slice(0, 4),
    {
      ...mixedHistory[4]!,
      state: { ...mixedHistory[4]!.state, phase: 'defeat' },
    },
  ]),
  null,
)
assert.equal(crossfireFinaleNetwork(allHelp)?.enemiesExposed, false)
assert.equal(crossfireFinaleNetwork(allProof)?.squadGuarded, false)
for (const [saved, expectedGuard, expectedMark] of [
  [mixedHistory, true, true],
  [allHelp, true, false],
  [allProof, false, true],
  [finaleBase, false, false],
] as const) {
  const finale = clonePreset('prom-night-finale')
  const battle = trainingState(67891, finale, {
    lead: 'accident-fire',
    foil: 'accident-air',
  })
  const bonuses = applyCrossfireFinaleNetwork(battle, saved)
  assert.ok(bonuses)
  assert.equal(bonuses.squadGuarded, expectedGuard)
  assert.equal(bonuses.enemiesExposed, expectedMark)
  assert.equal(
    battle.units
      .filter((unit) => unit.team === 'squad' && unit.hp > 0)
      .every((unit) => unit.statuses.includes('guarded')),
    expectedGuard,
  )
  assert.equal(
    battle.units
      .filter((unit) => unit.team === 'rival' && unit.hp > 0)
      .every((unit) => unit.statuses.includes('marked')),
    expectedMark,
  )
  const checkpoint = createSave({
    slot: 'auto',
    perspective: 'hero',
    leadSignature: 'accident-fire',
    foilSignature: 'accident-air',
    stage: finale,
    state: battle,
    story: { ...createStory(), current: null },
  })
  assert.ok(loadSave(checkpoint).ok, 'earned support survives save/restore')
}
// First Bell can earn rescue and evidence independently. Do not discard
// one reward when both were earned, even though the debrief chooses one beat.
const dualHistory = chapterHistory([0, 1, 2], [0, 3])
const dualCarry = crossfireCarryover(dualHistory[0]!, 0)
assert.equal(dualCarry.guarded, true)
assert.equal(dualCarry.marked, true)
assert.match(dualCarry.note, /people you protected/)
assert.match(dualCarry.note, /Evidence from your previous mission/)
const dualStage = clonePreset('science-lab')
const dualBattle = trainingState(123, dualStage, {
  lead: 'accident-fire',
  foil: 'accident-air',
})
applyCrossfireCarryover(dualBattle, dualHistory[0]!, 0)
assert.ok(
  dualBattle.units
    .find((unit) => unit.id === 'backdraft')
    ?.statuses.includes('guarded'),
)
assert.ok(
  dualBattle.units
    .find((unit) => unit.team === 'rival' && unit.hp > 0)
    ?.statuses.includes('marked'),
)
const dualSave = createSave({
  slot: 'auto',
  perspective: 'hero',
  leadSignature: 'accident-fire',
  foilSignature: 'accident-air',
  stage: dualStage,
  state: dualBattle,
  story: { ...createStory(), current: null },
})
assert.ok(loadSave(dualSave).ok)
assert.deepEqual(crossfireFinaleNetwork(dualHistory), {
  rescues: 3,
  evidence: 2,
  squadGuarded: true,
  enemiesExposed: true,
})
// Even with a full slate of flags, a loss never earns battlefield supporters.
const forgedSupport = structuredClone(mixedHistory)
forgedSupport[2]!.state.phase = 'defeat'
assert.equal(crossfireFinaleNetwork(forgedSupport), null)

for (let chapter = 0; chapter < CROSSFIRE_CHAPTERS.length; chapter++) {
  const battle = journal.completed[chapter]!
  const rescue = structuredClone(battle)
  const evidence = structuredClone(battle)
  const command = structuredClone(battle)
  if (chapter === 0) {
    rescue.story.mercy = true
    rescue.story.evidence = 0
    evidence.story.mercy = false
    evidence.story.civilians = 0
    evidence.story.evidence = 2
    command.story.mercy = false
    command.story.civilians = 0
    command.story.evidence = 0
  } else {
    rescue.state.flags = [choiceFlags[chapter]![0]]
    evidence.state.flags = [choiceFlags[chapter]![1]]
    command.state.flags = []
  }
  const passages = [rescue, evidence, command].map((result) =>
    crossfireChapterBeat(
      chapter,
      result,
      'accident-fire',
      'accident-air',
      'hero',
    ),
  )
  assert.equal(passages[0]!.choice, 'rescue')
  assert.equal(passages[1]!.choice, chapter === 5 ? 'command' : 'evidence')
  assert.equal(passages[2]!.choice, 'command')
  assert.ok(
    passages.every(
      (beat) =>
        beat.text.includes(identityFor('accident-fire').hero.alias) &&
        beat.text.includes(identityFor('accident-air').hero.alias),
    ),
  )
  assert.notEqual(passages[0]!.text, passages[2]!.text)
  assert.notEqual(passages[0]!.title, passages[2]!.title)
  const villain = crossfireChapterBeat(
    chapter,
    rescue,
    'accident-fire',
    'accident-air',
    'villain',
  )
  assert.notEqual(villain.text, passages[0]!.text)
}
assert.equal(
  crossfirePreviousChapter({
    ...journal,
    chapter: 0,
  }),
  null,
)
assert.ok(crossfirePreviousChapter(journal))
assert.equal(
  crossfireCurrentChapter(journal, {
    ...journal.active,
    state: { ...journal.active.state, phase: 'active' },
  }),
  null,
  'chapter endings cannot appear before victory',
)

function finalNarrative(
  decisions: Array<'rescue' | 'evidence' | 'command'>,
  promDecision: 'shelter' | 'command',
) {
  const result = structuredClone(journal)
  for (let index = 0; index < 5; index++) {
    const save = result.completed[index]!
    const decision = decisions[index]
    if (index === 0) {
      save.story.mercy = decision === 'rescue'
      save.story.civilians = 0
      save.story.evidence = decision === 'evidence' ? 1 : 0
    } else {
      const flag =
        decision === 'rescue'
          ? choiceFlags[index]![0]
          : decision === 'evidence'
            ? choiceFlags[index]![1]
            : null
      save.state.flags = flag ? [flag] : []
    }
  }
  const final = structuredClone(result.active)
  final.state.flags = [
    promDecision === 'shelter' ? 'prom-shelter' : 'prom-command',
  ]
  return crossfireFinale(result, final)!
}
// A rescue and a discovered record in First Bell must both count toward
// the ending, just as they both count toward tactical support.
const dualEnding = {
  ...journal,
  completed: [...chapterHistory([0], [0, 1]), journal.active],
}
const shelterFinal = {
  ...journal.active,
  state: { ...journal.active.state, flags: ['prom-shelter'] },
}
assert.equal(crossfireFinale(dualEnding, shelterFinal)?.path, 'black-box')
assert.equal(
  crossfireFinale({ ...dualEnding, completed: forgedSupport }, shelterFinal),
  null,
  'a defeated preceding chapter cannot earn a finale',
)
assert.equal(
  crossfireFinale({ ...journal, completed: dualHistory }, shelterFinal)?.path,
  'open-doors',
  'rescue ending retains priority when both thresholds are earned',
)
const openedDoors = finalNarrative(
  ['rescue', 'rescue', 'rescue', 'evidence', 'command'],
  'shelter',
)
const blackBox = finalNarrative(
  ['evidence', 'evidence', 'evidence', 'rescue', 'command'],
  'shelter',
)
const unfinished = finalNarrative(
  ['command', 'command', 'rescue', 'command', 'command'],
  'shelter',
)
const signedOrder = finalNarrative(
  ['rescue', 'rescue', 'rescue', 'rescue', 'rescue'],
  'command',
)
assert.deepEqual(
  [openedDoors.path, blackBox.path, unfinished.path, signedOrder.path],
  ['open-doors', 'black-box', 'unfinished', 'signed-order'],
)
assert.equal(
  crossfireFinale(journal, {
    ...journal.active,
    state: { ...journal.active.state, phase: 'defeat' },
  }),
  null,
  'a lost final battle never earns a closing outcome',
)
assert.equal(
  crossfireFinale({
    ...journal,
    completed: journal.completed.slice(0, 2),
  }),
  null,
  'skipped chapters cannot earn a final ending',
)
for (const person of IDENTITY_ARCS) {
  const passage = crossfireChapterBeat(
    3,
    journal.completed[3]!,
    person.signature,
    'accident-air',
    'hero',
  )
  assert.ok(passage.text.includes(person.hero.alias))
}

// Mission-scope acceptance: every authored perspective, decision and
// outcome must reach its closing scene through the actual scene engine.
// Combat events are controlled here; tactical objectives have separate
// engine coverage in verifyEveryVillainStudio.test.ts.
for (const perspective of ['hero', 'villain'] as const)
  for (const approach of ['catwalk', 'service'] as const)
    for (const alarm of ['rescue', 'contain'] as const)
      for (const reckoning of ['spare', 'press'] as const)
        for (const outcome of ['victory', 'defeat'] as const) {
          const run = createStory()
          const battle = trainingState(0x53a1b7)
          assert.ok(applyChoice(run, battle, perspective, approach))
          battle.turn = 2
          enqueueBeat(run, battle)
          assert.equal(run.current, 'alarm')
          assert.ok(applyChoice(run, battle, perspective, alarm))
          battle.units.find((unit) => unit.team === 'rival')!.hp = 0
          enqueueBeat(run, battle)
          assert.equal(run.current, 'reckoning')
          assert.ok(applyChoice(run, battle, perspective, reckoning))
          battle.phase = outcome
          enqueueBeat(run, battle)
          assert.equal(run.current, outcome)
          assert.ok(
            storyMoment(perspective, outcome, 'accident-fire', run).lines
              .length > 0,
          )
          assert.ok(applyChoice(run, battle, perspective, 'finish'))
          assert.ok(run.completed)
          assert.equal(run.current, null)
          assert.equal(run.evidence, alarm === 'contain' ? 1 : 0)
          assert.equal(run.civilians, alarm === 'rescue' ? 2 : 0)
          assert.equal(run.mercy, reckoning === 'spare')
        }

// Each authored origin identity has independently authored playable
// hero and villain scenes. The actual squad member speaks, not a stale slot.
assert.deepEqual(
  Object.keys(PERSONAL_CAMPAIGNS).sort(),
  IDENTITY_ARCS.map((entry) => entry.signature).sort(),
)
for (const [signature, campaign] of Object.entries(PERSONAL_CAMPAIGNS)) {
  assert.ok(IDENTITY_ARCS.some((entry) => entry.signature === signature))
  assert.equal(campaign.chapters.length, 6)
  assert.equal(new Set(campaign.chapters.map((chapter) => chapter[0])).size, 6)
  assert.equal(campaign.endings.length, 4)
}
const campaignPassages = new Set<string>()
for (const person of IDENTITY_ARCS) {
  for (const perspective of ['hero', 'villain'] as const) {
    for (let chapter = 0; chapter < 6; chapter++) {
      const flags = [
        [],
        ['lab-rescued', 'lab-evidence'],
        ['crosswalk-medics', 'crosswalk-jammed'],
        ['roof-warning', 'roof-jammed'],
        ['breach-vented', 'breach-evidence'],
        ['prom-shelter'],
      ][chapter]!
      const passages = (['rescue', 'evidence', 'command'] as const)
        .filter((choice) => chapter !== 5 || choice !== 'evidence')
        .map((choice) => {
          const scene = crossfireChapterBeat(
            chapter,
            {
              state: {
                phase: 'victory',
                flags:
                  choice === 'command' || chapter === 0
                    ? []
                    : [flags[choice === 'rescue' ? 0 : 1]!],
              },
              story: {
                mercy: false,
                civilians: chapter === 0 && choice === 'rescue' ? 2 : 0,
                evidence: chapter === 0 && choice === 'evidence' ? 1 : 0,
              },
            },
            person.signature,
            person.signature === 'magic-social'
              ? 'accident-fire'
              : 'magic-social',
            perspective,
          )
          assert.equal(scene.choice, choice)
          const authored =
            PERSONAL_CAMPAIGNS[person.signature]!.chapters[chapter]!
          assert.ok(scene.title.startsWith(authored[0]))
          assert.ok(
            scene.text.startsWith(
              authored[choice === 'rescue' ? 1 : choice === 'evidence' ? 2 : 3],
            ),
          )
          assert.ok(scene.text.includes(person.hero.alias))
          assert.ok(
            !campaignPassages.has(scene.text),
            person.signature + ':' + chapter + ':' + choice,
          )
          campaignPassages.add(scene.text)
          return scene
        })
      assert.equal(
        new Set(passages.map((scene) => scene.title)).size,
        passages.length,
      )
    }
  }
}
assert.equal(campaignPassages.size, 1632)
const personalFinales = new Set<string>()
for (const person of IDENTITY_ARCS) {
  for (const [index, [rescues, evidence, shelter, path]] of [
    [[0, 1, 2], [], true, 'open-doors'],
    [[], [0, 1], true, 'black-box'],
    [[], [], true, 'unfinished'],
    [[0, 1, 2], [], false, 'signed-order'],
  ].entries()) {
    const completed = chapterHistory(rescues as number[], evidence as number[])
    const current = {
      ...journal.active,
      state: {
        ...journal.active.state,
        flags: [shelter ? 'prom-shelter' : 'prom-command'],
      },
    }
    const ending = crossfireFinale(
      { ...journal, lead: person.signature, completed },
      current,
    )
    assert.equal(ending?.path, path)
    const authored = PERSONAL_CAMPAIGNS[person.signature]!.endings[index]!
    assert.ok(ending?.text.endsWith(authored))
    assert.ok(!personalFinales.has(authored))
    personalFinales.add(authored)
  }
}
assert.equal(personalFinales.size, 192)

const personalScenes = new Set<string>()
const firstBellVoices = new Set<string>()
for (const person of IDENTITY_ARCS) {
  for (const perspective of ['hero', 'villain'] as const) {
    const run = createStory()
    const battle = trainingState(0x53a1b7, undefined, {
      lead: person.signature,
    })
    const support = battle.units.find(
      (unit) => unit.team === 'squad' && unit.identity !== person.signature,
    )!
    const supportName = IDENTITY_ARCS.find(
      (entry) => entry.signature === support.identity,
    )!.hero.alias
    for (const beat of [
      'arrival',
      'alarm',
      'reckoning',
      'victory',
      'defeat',
    ] as const) {
      const scene = storyMoment(
        perspective,
        beat,
        person.signature,
        run,
        battle,
      )
      assert.equal(scene.lines[0]?.speaker, person.hero.alias)
      assert.equal(scene.lines[1]?.speaker, supportName)
      if (beat === 'arrival') assert.ok(scene.lines.length >= 3)
      const dialogue = scene.lines
        .slice(0, 2)
        .map((line) => line.text)
        .join(' ')
      assert.ok(!personalScenes.has(dialogue), person.signature + ':' + beat)
      personalScenes.add(dialogue)
      firstBellVoices.add(scene.lines[0]!.text)
      firstBellVoices.add(scene.lines[1]!.text)
      assert.equal(
        scene.choices.length,
        beat === 'victory' || beat === 'defeat' ? 1 : 2,
      )
    }
    assert.ok(applyChoice(run, battle, perspective, 'catwalk'))
    battle.turn = 2
    enqueueBeat(run, battle)
    assert.ok(applyChoice(run, battle, perspective, 'rescue'))
    assert.equal(run.civilians, 2)
    battle.units.find((unit) => unit.team === 'rival')!.hp = 0
    enqueueBeat(run, battle)
    assert.ok(applyChoice(run, battle, perspective, 'spare'))
    battle.phase = 'victory'
    enqueueBeat(run, battle)
    assert.ok(
      storyMoment(
        perspective,
        'victory',
        person.signature,
        run,
        battle,
      ).lines.some((line) => line.text.includes('2 students evacuated')),
    )
    assert.ok(applyChoice(run, battle, perspective, 'finish'))
    assert.ok(run.completed)
  }
}
assert.equal(personalScenes.size, 480)
assert.equal(firstBellVoices.size, 960)

for (const person of IDENTITY_ARCS) {
  for (const perspective of ['hero', 'villain'] as const) {
    const battle = trainingState(41, undefined, {
      lead: person.signature,
      foil: personalCastFor(person.signature)!.foil,
      crossfireCast: 2,
    })
    const allies = battle.units.filter(
      (unit) => unit.team === 'squad' && unit.id !== 'backdraft',
    )
    assert.equal(allies.length, 2)
    for (const ally of allies) ally.hp = 0
    const run = createStory()
    const before = JSON.stringify({ battle, run })
    for (const beat of [
      'arrival',
      'alarm',
      'reckoning',
      'victory',
      'defeat',
    ] as const) {
      const scene = storyMoment(
        perspective,
        beat,
        person.signature,
        run,
        battle,
      )
      assert.ok(
        scene.lines.every(
          (line) =>
            line.speaker === person.hero.alias ||
            line.speaker === 'FIELD REPORT',
        ),
        person.signature + ':' + perspective + ':' + beat,
      )
      assert.ok(
        scene.lines.some(
          (line) => line.text === 'No supporting fighter is available.',
        ),
      )
      assert.equal(
        scene.choices.length,
        beat === 'victory' || beat === 'defeat' ? 1 : 2,
      )
    }
    assert.equal(JSON.stringify({ battle, run }), before)
    const survivor = allies[1]!
    survivor.hp = survivor.maxHp
    const survivorName = IDENTITY_ARCS.find(
      (identity) => identity.signature === survivor.identity,
    )!.hero.alias
    const arrival = storyMoment(
      perspective,
      'arrival',
      person.signature,
      run,
      battle,
    )
    assert.equal(arrival.lines[1]?.speaker, survivorName)
    assert.equal(arrival.lines.at(-1)?.speaker, survivorName)
  }
}

// Across every canonical lead and both allegiances, each support action is
// previewed, applied to a real living fighter, persisted, and never replayed.
// Controlled combat events isolate the narrative decisions from hit RNG.
for (const person of IDENTITY_ARCS)
  for (const perspective of ['hero', 'villain'] as const)
    for (const alarm of ['rescue', 'contain'] as const)
      for (const reckoning of ['spare', 'press'] as const) {
        const state = trainingState(123, undefined, { lead: person.signature })
        const run = createStory()
        const seed = state.seed
        assert.ok(applyChoice(run, state, perspective, 'catwalk'))
        state.turn = 2
        enqueueBeat(run, state)
        const preview = storyMoment(
          perspective,
          'alarm',
          person.signature,
          run,
          state,
        )
        assert.match(
          preview.choices.find((choice) => choice.effect === alarm)!.detail,
          /marked|guarded/,
        )
        assert.ok(applyChoice(run, state, perspective, alarm))
        assert.equal(run.supportActions?.length, 1)
        const firstAction = run.supportActions![0]!
        assert.ok(
          state.units
            .find((unit) => unit.id === firstAction.target)!
            .statuses.includes(firstAction.effect),
        )
        assert.equal(applyChoice(run, state, perspective, alarm), false)
        const saved = createSave({
          slot: 'auto',
          perspective,
          leadSignature: person.signature,
          stage: null,
          state,
          story: run,
        })
        const restored = loadSave(JSON.stringify(saved))
        assert.ok(restored.ok)
        assert.deepEqual(restored.save.story.supportActions, run.supportActions)
        const battle = restored.save.state
        const story = restored.save.story
        battle.units.find((unit) => unit.team === 'rival')!.hp = 0
        enqueueBeat(story, battle)
        assert.ok(applyChoice(story, battle, perspective, reckoning))
        assert.equal(story.supportActions?.length, 2)
        const secondAction = story.supportActions![1]!
        assert.notEqual(firstAction.actor, secondAction.actor)
        assert.ok(
          battle.units
            .find((unit) => unit.id === secondAction.target)!
            .statuses.includes(secondAction.effect),
        )
        if (reckoning === 'press') assert.equal(secondAction.effect, 'guarded')
        assert.equal(battle.seed, seed)
        battle.phase = 'victory'
        enqueueBeat(story, battle)
        const report = storyMoment(
          perspective,
          'victory',
          person.signature,
          story,
          battle,
        )
        assert.ok(
          report.lines.some((line) =>
            line.text.includes('independently guarded'),
          ),
        )
        assert.ok(applyChoice(story, battle, perspective, 'finish'))
        assert.ok(story.completed)
      }

// No phantom aid from fallen companions; legacy four-role saves remain valid.
for (const role of ['hero', 'villain', 'sidekick', 'henchman'] as const) {
  const state = trainingState(88)
  const run = createStory()
  assert.ok(applyChoice(run, state, role, 'service'))
  if (role === 'hero' || role === 'villain')
    for (const unit of state.units)
      if (unit.team === 'squad' && unit.id !== 'backdraft') unit.hp = 0
  state.turn = 2
  enqueueBeat(run, state)
  assert.ok(applyChoice(run, state, role, 'contain'))
  assert.equal(run.supportActions, undefined)
}
const forgedAgency = createSave({
  slot: 'auto',
  perspective: 'hero',
  leadSignature: 'accident-fire',
  stage: null,
  state: trainingState(),
  story: {
    ...createStory(),
    supportActions: [
      { beat: 'alarm', actor: 'backdraft', target: 'priya', effect: 'guarded' },
    ],
  },
})
assert.equal(loadSave(JSON.stringify(forgedAgency)).ok, false)

const missionChoices = [
  ['science-lab', 'lab-rescued', 'lab-evidence'],
  ['crosswalk-crisis', 'crosswalk-medics', 'crosswalk-jammed'],
  ['rooftop-broadcast', 'roof-warning', 'roof-jammed'],
  ['under-comet-breach', 'breach-vented', 'breach-evidence'],
  ['prom-night-finale', 'prom-shelter', 'prom-command'],
] as const
for (const [id, rescueFlag, evidenceFlag] of missionChoices)
  for (const perspective of ['hero', 'villain'] as const)
    for (const choice of [0, 1] as const)
      for (const outcome of ['victory', 'defeat'] as const) {
        const stage = clonePreset(id)
        const script = stage.script!
        const battle = trainingState(0x53a1b7, stage)
        const drainScenes = () => {
          for (let count = 0; count < 30; count++) {
            latchScenes(battle, script, stage)
            const scene = pendingScriptScene(battle, script)
            if (!scene) return
            const preview = walkScene(scene, [], {
              state: battle,
              perspective,
            })
            assert.ok(preview, scene.id)
            const path = preview.done ? [] : [choice]
            assert.ok(finishScene(battle, scene, path, perspective))
            assert.equal(finishScene(battle, scene, path, perspective), false)
          }
          assert.fail(id + ' scene queue did not drain')
        }
        drainScenes()
        battle.turn = 2
        drainScenes()
        assert.ok(
          battle.flags?.includes(choice === 0 ? rescueFlag : evidenceFlag),
        )
        assert.ok(
          !battle.flags?.includes(choice === 0 ? evidenceFlag : rescueFlag),
        )
        battle.phase = outcome
        drainScenes()
        const closing = script.scenes.find(
          (scene) =>
            scene.trigger.kind === 'closing' &&
            scene.trigger.outcome === outcome,
        )
        assert.ok(closing)
        assert.ok(battle.fired?.includes('seen:scene:' + closing.id))
        assert.equal(pendingScriptScene(battle, script), null)
      }

const store = readFileSync('stores/everyVillainTacticsStore.ts', 'utf8')
const front = readFileSync(
  'components/every-villain-tactics/every-villain-front-menu.vue',
  'utf8',
)
const page = readFileSync('pages/admin/every-villain-tactics.vue', 'utf8')
assert.ok(store.includes('storage.setItem(evtCrossfireKey'))
assert.ok(
  store.includes("campaign ? { ...result, mode: 'story' as const } : result"),
  'Crossfire battles must not count toward the One-Shot sweep',
)
assert.ok(store.includes('crossfireActive.value = false'))
assert.ok(store.includes('function continueCrossfire()'))
assert.ok(
  store.includes(
    'recordMoments(crossfireScrapbookSaves(crossfire.value), false, true)',
  ),
  'restore campaign history on load, without granting new achievements',
)
assert.ok(front.includes('data-testid="front-new-crossfire"'))
assert.ok(front.includes('data-testid="front-continue-crossfire"'))
assert.ok(front.includes('data-testid="front-new-story"'))
assert.ok(page.includes('data-testid="tactics-crossfire-advance"'))
assert.ok(page.includes('data-testid="tactics-crossfire-epilogue"'))
assert.ok(page.includes('data-testid="tactics-crossfire-earned-ending"'))
assert.ok(page.includes('data-testid="tactics-crossfire-score"'))
assert.ok(store.includes('const crossfireScore = computed('))
assert.ok(store.includes('const crossfireAftermath = computed('))
assert.ok(store.includes('const crossfireEnding = computed('))
assert.ok(store.includes('function replayBattle()'))
assert.ok(page.includes('@click="store.replayBattle()"'))
console.log(
  'Crossfire: six ordered chapters, independent save key, First Bell story bridge, verified victory/defeat transitions, checkpoint restoration, anti-forgery and UI wiring checked.',
)

// All canonical identities have authored support motives and legal actions.
assert.deepEqual(
  Object.keys(PERSONAL_SUPPORT_VOICES).sort(),
  IDENTITY_ARCS.map((person) => person.signature).sort(),
)
const supportLines = new Set<string>()
for (const person of IDENTITY_ARCS) {
  const voice = personalSupportVoice(person.signature)!
  assert.ok(voice)
  for (const line of [voice.mark, voice.guard, voice.refuse]) {
    assert.ok(!supportLines.has(line))
    supportLines.add(line)
  }
  const lead =
    person.signature === 'accident-fire' ? 'accident-air' : 'accident-fire'
  const state = trainingState(41, undefined, { lead })
  state.crossfireCast = 1
  const actor = state.units.find((unit) => unit.id === 'priya')!
  actor.identity = person.signature
  state.units.find((unit) => unit.id === 'hattie')!.hp = 0
  const before = JSON.stringify(state)
  const plan = supportPlan(state, 'alarm', 'rescue')!
  assert.ok(plan)
  assert.equal(plan.action.actor, actor.id)
  assert.equal(
    plan.action.effect,
    voice.preference === 'mark' ? 'marked' : 'guarded',
  )
  assert.ok(plan.text.startsWith(voice[voice.preference]))
  assert.equal(JSON.stringify(state), before)
  assert.ok(applySupport(state, plan.action, plan.text))
  assert.ok(state.events[0]?.includes(plan.text))
  assert.ok(
    state.units
      .find((unit) => unit.id === plan.action.target)
      ?.statuses.includes(plan.action.effect),
  )
  for (const unit of state.units)
    unit.statuses = unit.statuses.filter((status) => status !== 'guarded')
  const refusal = supportPlan(state, 'reckoning', 'press')!
  assert.ok(refusal)
  assert.equal(refusal.action.effect, 'guarded')
  assert.ok(refusal.text.startsWith(voice.refuse))
  assert.ok(applySupport(state, refusal.action, refusal.text))
  assert.ok(state.events[0]?.includes(voice.refuse))
  actor.hp = 0
  assert.equal(supportPlan(state, 'alarm', 'rescue'), null)
}
assert.equal(supportLines.size, 144)
assert.equal(personalSupportVoice('constructor'), undefined)

// The personalized dialogue changes presentation, not saved scene graphs or
// their rescue/evidence decisions. Both allegiances keep the actual cast.
const scienceNodes = SCIENCE_WING_SCRIPT.scenes.flatMap((scene) => scene.nodes)
const scienceVoices = new Set<string>()
assert.equal(Object.keys(ACCIDENT_SCIENCE_LINES).length, 8)
assert.equal(Object.keys(MAGIC_SCIENCE_LINES).length, 8)
assert.equal(Object.keys(TECH_SCIENCE_LINES).length, 8)
assert.equal(Object.keys(MUTANT_SCIENCE_LINES).length, 8)
assert.equal(Object.keys(ALIEN_SCIENCE_LINES).length, 8)
assert.equal(Object.keys(PSYCHIC_SCIENCE_LINES).length, 8)
assert.equal(Object.keys(PERSONAL_SCIENCE_LINES).length, 48)
assert.deepEqual(
  Object.keys(PERSONAL_SCIENCE_LINES).sort(),
  IDENTITY_ARCS.map((identity) => identity.signature).sort(),
)
for (const lead of Object.keys(PERSONAL_SCIENCE_LINES)) {
  for (const perspective of ['hero', 'villain'] as const) {
    const state = trainingState(41, clonePreset('science-lab'), {
      lead,
      foil: personalCastFor(lead)!.foil,
      crossfireCast: 2,
    })
    const arrival = walkScene(SCIENCE_WING_SCRIPT.scenes[0]!, [], {
      state,
      perspective,
    })
    assert.ok(arrival)
    assert.ok(
      arrival.nodes.some(
        (node) => node.id === (perspective === 'hero' ? 'sh' : 'sv'),
      ),
    )
    const before = JSON.stringify(state)
    let changed = 0
    for (const node of scienceNodes) {
      const line = personalScienceNode(node, lead, 'science-lab', true, state)
      assert.deepEqual(line.choices, node.choices)
      assert.deepEqual(line.branch, node.branch)
      assert.equal(line.next, node.next)
      assert.equal(line.id, node.id)
      if (line !== node) {
        changed++
        assert.ok(line.text.length > 10 && line.text.length <= 400)
        assert.notEqual(line.text, node.text)
        assert.ok(
          state.units.some((u) => u.id === line.speaker && u.team === 'squad'),
        )
        if (/\b(?:I|me|my|mine)\b/i.test(line.text))
          assert.equal(line.speaker, 'backdraft')
        scienceVoices.add(line.text)
      }
      assert.equal(
        personalScienceNode(node, lead, 'science-lab', false, state),
        node,
      )
      assert.equal(
        personalScienceNode(node, lead, 'crosswalk-crisis', true, state),
        node,
      )
      assert.equal(
        personalScienceNode(node, 'constructor', 'science-lab', true, state),
        node,
      )
      assert.equal(
        personalScienceNode(node, lead, 'science-lab', true, {
          ...state,
          crossfireCast: 1,
        }),
        node,
      )
    }
    assert.equal(changed, 11)
    assert.equal(JSON.stringify(state), before)
  }
}
assert.equal(scienceVoices.size, 528)
assert.ok(store.includes('personalScienceNode('))

const roofNodes = ROOFTOP_BROADCAST_SCRIPT.scenes.flatMap(
  (scene) => scene.nodes,
)
const roofVoices = new Set<string>()
assert.deepEqual(
  Object.keys(PERSONAL_ROOFTOP_LINES).sort(),
  IDENTITY_ARCS.map((identity) => identity.signature).sort(),
)
for (const lead of Object.keys(PERSONAL_ROOFTOP_LINES)) {
  for (const perspective of ['hero', 'villain'] as const) {
    const state = trainingState(41, clonePreset('rooftop-broadcast'), {
      lead,
      foil: personalCastFor(lead)!.foil,
      crossfireCast: 2,
    })
    const arrival = walkScene(ROOFTOP_BROADCAST_SCRIPT.scenes[0]!, [], {
      state,
      perspective,
    })
    assert.ok(
      arrival?.nodes.some(
        (node) => node.id === (perspective === 'hero' ? 'oh' : 'ov'),
      ),
    )
    const before = JSON.stringify(state)
    let changed = 0
    for (const node of roofNodes) {
      const line = personalRooftopNode(
        node,
        lead,
        'rooftop-broadcast',
        true,
        state,
      )
      assert.deepEqual(line.choices, node.choices)
      assert.deepEqual(line.branch, node.branch)
      assert.equal(line.next, node.next)
      assert.equal(line.id, node.id)
      if (line !== node) {
        changed++
        assert.ok(line.text.length > 10 && line.text.length <= 400)
        assert.notEqual(line.text, node.text)
        assert.ok(
          state.units.some((u) => u.id === line.speaker && u.team === 'squad'),
        )
        if (/\b(?:I|me|my|mine)\b/i.test(line.text))
          assert.equal(line.speaker, 'backdraft')
        roofVoices.add(line.text)
      }
      assert.equal(
        personalRooftopNode(node, lead, 'rooftop-broadcast', false, state),
        node,
      )
      assert.equal(
        personalRooftopNode(node, lead, 'science-lab', true, state),
        node,
      )
      assert.equal(
        personalRooftopNode(
          node,
          'constructor',
          'rooftop-broadcast',
          true,
          state,
        ),
        node,
      )
      assert.equal(
        personalRooftopNode(node, lead, 'rooftop-broadcast', true, {
          ...state,
          crossfireCast: 1,
        }),
        node,
      )
    }
    assert.equal(changed, 15)
    assert.equal(JSON.stringify(state), before)
  }
}
assert.equal(roofVoices.size, 720)
assert.ok(store.includes('personalRooftopNode('))

const crosswalkNodes = CROSSWALK_CRISIS_SCRIPT.scenes.flatMap(
  (scene) => scene.nodes,
)
const crosswalkVoices = new Set<string>()
assert.deepEqual(
  Object.keys(PERSONAL_CROSSWALK_LINES).sort(),
  IDENTITY_ARCS.map((identity) => identity.signature).sort(),
)
for (const lead of Object.keys(PERSONAL_CROSSWALK_LINES)) {
  for (const perspective of ['hero', 'villain'] as const) {
    const state = trainingState(41, clonePreset('crosswalk-crisis'), {
      lead,
      foil: personalCastFor(lead)!.foil,
      crossfireCast: 2,
    })
    const arrival = walkScene(CROSSWALK_CRISIS_SCRIPT.scenes[0]!, [], {
      state,
      perspective,
    })
    assert.ok(
      arrival?.nodes.some(
        (node) => node.id === (perspective === 'hero' ? 'ah' : 'av'),
      ),
    )
    const before = JSON.stringify(state)
    let changed = 0
    for (const node of crosswalkNodes) {
      const line = personalCrosswalkNode(
        node,
        lead,
        'crosswalk-crisis',
        true,
        state,
      )
      assert.deepEqual(line.choices, node.choices)
      assert.deepEqual(line.branch, node.branch)
      assert.equal(line.next, node.next)
      assert.equal(line.id, node.id)
      if (line !== node) {
        changed++
        assert.ok(line.text.length > 10 && line.text.length <= 400)
        assert.notEqual(line.text, node.text)
        assert.ok(
          state.units.some((u) => u.id === line.speaker && u.team === 'squad'),
        )
        if (/\b(?:I|me|my|mine)\b/i.test(line.text))
          assert.equal(line.speaker, 'backdraft')
        crosswalkVoices.add(line.text)
      }
      assert.equal(
        personalCrosswalkNode(node, lead, 'crosswalk-crisis', false, state),
        node,
      )
      assert.equal(
        personalCrosswalkNode(node, lead, 'science-lab', true, state),
        node,
      )
      assert.equal(
        personalCrosswalkNode(
          node,
          'constructor',
          'crosswalk-crisis',
          true,
          state,
        ),
        node,
      )
      assert.equal(
        personalCrosswalkNode(node, lead, 'crosswalk-crisis', true, {
          ...state,
          crossfireCast: 1,
        }),
        node,
      )
    }
    assert.equal(changed, 16)
    assert.equal(JSON.stringify(state), before)
  }
}
assert.equal(crosswalkVoices.size, 768)
assert.ok(store.includes('personalCrosswalkNode('))

const breachNodes = UNDER_COMET_BREACH_SCRIPT.scenes.flatMap(
  (scene) => scene.nodes,
)
const breachVoices = new Set<string>()
assert.deepEqual(
  Object.keys(PERSONAL_BREACH_LINES).sort(),
  IDENTITY_ARCS.map((identity) => identity.signature).sort(),
)
for (const lead of Object.keys(PERSONAL_BREACH_LINES)) {
  for (const perspective of ['hero', 'villain'] as const) {
    const state = trainingState(41, clonePreset('under-comet-breach'), {
      lead,
      foil: personalCastFor(lead)!.foil,
      crossfireCast: 2,
    })
    const arrival = walkScene(UNDER_COMET_BREACH_SCRIPT.scenes[0]!, [], {
      state,
      perspective,
    })
    assert.ok(
      arrival?.nodes.some(
        (node) => node.id === (perspective === 'hero' ? 'oh' : 'ov'),
      ),
    )
    const before = JSON.stringify(state)
    let changed = 0
    for (const node of breachNodes) {
      const line = personalBreachNode(
        node,
        lead,
        'under-comet-breach',
        true,
        state,
      )
      assert.deepEqual(line.choices, node.choices)
      assert.deepEqual(line.branch, node.branch)
      assert.equal(line.next, node.next)
      assert.equal(line.id, node.id)
      if (line !== node) {
        changed++
        assert.ok(line.text.length > 10 && line.text.length <= 400)
        assert.notEqual(line.text, node.text)
        assert.ok(
          state.units.some((u) => u.id === line.speaker && u.team === 'squad'),
        )
        if (/\b(?:I|me|my|mine)\b/i.test(line.text))
          assert.equal(line.speaker, 'backdraft')
        breachVoices.add(line.text)
      }
      assert.equal(
        personalBreachNode(node, lead, 'under-comet-breach', false, state),
        node,
      )
      assert.equal(
        personalBreachNode(node, lead, 'science-lab', true, state),
        node,
      )
      assert.equal(
        personalBreachNode(
          node,
          'constructor',
          'under-comet-breach',
          true,
          state,
        ),
        node,
      )
      assert.equal(
        personalBreachNode(node, lead, 'under-comet-breach', true, {
          ...state,
          crossfireCast: 1,
        }),
        node,
      )
    }
    assert.equal(changed, 15)
    assert.equal(JSON.stringify(state), before)
  }
}
assert.equal(breachVoices.size, 720)
assert.ok(store.includes('personalBreachNode('))

const finaleNodes = PROM_NIGHT_FINALE_SCRIPT.scenes.flatMap(
  (scene) => scene.nodes,
)
const finaleVoices = new Set<string>()
assert.deepEqual(
  Object.keys(PERSONAL_FINALE_LINES).sort(),
  IDENTITY_ARCS.map((identity) => identity.signature).sort(),
)
for (const lead of Object.keys(PERSONAL_FINALE_LINES)) {
  for (const perspective of ['hero', 'villain'] as const) {
    const state = trainingState(41, clonePreset('prom-night-finale'), {
      lead,
      foil: personalCastFor(lead)!.foil,
      crossfireCast: 2,
    })
    const arrival = walkScene(PROM_NIGHT_FINALE_SCRIPT.scenes[0]!, [], {
      state,
      perspective,
    })
    assert.ok(
      arrival?.nodes.some(
        (node) => node.id === (perspective === 'hero' ? 'oh' : 'ov'),
      ),
    )
    const before = JSON.stringify(state)
    let changed = 0
    for (const node of finaleNodes) {
      const line = personalFinaleNode(
        node,
        lead,
        'prom-night-finale',
        true,
        state,
      )
      assert.deepEqual(line.choices, node.choices)
      assert.deepEqual(line.branch, node.branch)
      assert.equal(line.next, node.next)
      assert.equal(line.id, node.id)
      if (line !== node) {
        changed++
        assert.ok(line.text.length > 10 && line.text.length <= 400)
        assert.notEqual(line.text, node.text)
        assert.ok(
          state.units.some((u) => u.id === line.speaker && u.team === 'squad'),
        )
        if (/\b(?:I|me|my|mine)\b/i.test(line.text))
          assert.equal(line.speaker, 'backdraft')
        finaleVoices.add(line.text)
      }
      assert.equal(
        personalFinaleNode(node, lead, 'prom-night-finale', false, state),
        node,
      )
      assert.equal(
        personalFinaleNode(node, lead, 'science-lab', true, state),
        node,
      )
      assert.equal(
        personalFinaleNode(
          node,
          'constructor',
          'prom-night-finale',
          true,
          state,
        ),
        node,
      )
      assert.equal(
        personalFinaleNode(node, lead, 'prom-night-finale', true, {
          ...state,
          crossfireCast: 1,
        }),
        node,
      )
    }
    assert.equal(changed, 17)
    assert.equal(JSON.stringify(state), before)
  }
}
assert.equal(finaleVoices.size, 816)
assert.ok(store.includes('personalFinaleNode('))

// Combat-driven coverage complements the synthetic checkpoint fixtures above.
// The bot can lose: never promote a losing or stalled route to a victory.
type CombatPerspective = 'hero' | 'villain'
type CombatOutcome = TrainingState['phase']

function drainCombatDialogue(save: EvtSave, perspective: CombatPerspective) {
  const { state, story, stage } = save
  if (!stage) {
    enqueueBeat(story, state)
    for (let guard = 0; story.current && guard < 8; guard++) {
      const scene = storyMoment(
        perspective,
        story.current,
        save.leadSignature,
        story,
        state,
      )
      const choice =
        scene.choices[
          perspective === 'villain' && scene.choices.length > 1 ? 1 : 0
        ]!
      assert.ok(applyChoice(story, state, perspective, choice.effect))
    }
    assert.equal(story.current, null, 'First Bell dialogue drains')
    return
  }
  const script = stage.script
  assert.ok(script)
  for (let guard = 0; guard <= script.scenes.length; guard++) {
    latchScenes(state, script, stage)
    const scene = pendingScriptScene(state, script)
    if (!scene) return
    const path: number[] = []
    let walk = walkScene(scene, path, { state, perspective })
    while (walk && !walk.done && path.length < 12) {
      const node = walk.nodes.at(-1)
      assert.ok(node?.choices?.length)
      path.push(perspective === 'villain' && node.choices.length > 1 ? 1 : 0)
      walk = walkScene(scene, path, { state, perspective })
    }
    assert.ok(walk?.done, stage.id + ':' + scene.id)
    assert.ok(finishScene(state, scene, path, perspective))
    assert.equal(finishScene(state, scene, path, perspective), false)
  }
  assert.fail(stage.id + ': dialogue queue did not drain')
}

function combatAct(state: TrainingState, unit: Unit): boolean {
  state.selected = unit.id
  if (rescueSelected(state)) return true
  const rivals = state.units.filter((u) => u.team === 'rival' && u.hp > 0)
  const shot = rivals
    .map((target) => ({
      target,
      hit: previewShot(unit, target, state.map).hit,
    }))
    .filter((candidate) => candidate.hit > 0)
    .sort((a, b) => b.hit - a.hit || a.target.hp - b.target.hp)[0]
  const power = selectedPowerTargets(state)
    .map((target) => ({ target, preview: previewSelectedPower(state, target) }))
    .filter((candidate) => candidate.preview)
    .map(({ target, preview }) => ({
      target,
      score: preview!.effects.reduce((score, effect) => {
        const actor = state.units.find((u) => u.id === effect.id)
        return (
          score +
          (effect.side === 'enemy'
            ? (effect.damage * (preview!.chance ?? 100)) / 100 +
              effect.statuses.length * 0.2
            : Math.min(effect.heal, (actor?.maxHp ?? 0) - (actor?.hp ?? 0)) *
                1.8 +
              effect.ap * 0.6)
        )
      }, 0),
    }))
    .sort((a, b) => b.score - a.score)[0]
  if (power && power.score >= 1.25 && useSelectedPower(state, power.target))
    return true
  if (shot && shot.hit >= 60 && fireSelected(state, shot.target)) return true

  const victory = state.rules?.victory
  const waiting = (state.civilians ?? []).filter((c) => c.status === 'waiting')
  const goals =
    victory?.kind === 'rescue' && waiting.length
      ? waiting
      : victory?.kind === 'hold-zone'
        ? victory.cells
        : victory?.kind === 'defeat-boss'
          ? rivals.filter((r) => r.id === victory.unit)
          : rivals
  const distance = (p: { x: number; y: number }) =>
    Math.min(30, ...goals.map((goal) => gridDistance(p, goal)))
  const positionScore = (p: { x: number; y: number; cost: number }) => {
    const aim = Math.max(
      0,
      ...rivals.map(
        (r) => previewShot({ ...unit, x: p.x, y: p.y }, r, state.map).hit,
      ),
    )
    const exposed = exposureAt(state, unit, p).reduce(
      (sum, e) => sum + e.hit,
      0,
    )
    const danger =
      state.field?.fire.some((f) => f.x === p.x && f.y === p.y) ||
      state.rules?.hazards.some((h) => h.x === p.x && h.y === p.y)
    const objective =
      victory?.kind === 'rescue' || victory?.kind === 'hold-zone'
    return (
      (victory?.kind === 'survive'
        ? -exposed
        : -distance(p) * (objective ? 35 : 12) - exposed * 0.3) +
      aim * (objective ? 0.15 : 0.6) +
      (tileAt(state.map, p).cover ? 8 : 0) -
      p.cost * 8 -
      (danger ? 60 : 0)
    )
  }
  if (!unit.moved) {
    const current = positionScore({ ...unit, cost: 0 })
    const best = reachableCells(state.map, state.units, unit)
      .map((cell) => ({ cell, score: positionScore(cell) }))
      .sort(
        (a, b) =>
          b.score - a.score || a.cell.y - b.cell.y || a.cell.x - b.cell.x,
      )[0]
    if (best && best.score > current && moveSelected(state, best.cell))
      return true
  }
  if (shot && fireSelected(state, shot.target)) return true
  if (victory?.kind === 'survive' && hunkerSelected(state)) return true
  return overwatchSelected(state) || hunkerSelected(state)
}

function playCombat(save: EvtSave, perspective: CombatPerspective) {
  let state = structuredClone(save.state)
  let story = structuredClone(save.story)
  let actions = 0
  const limit = (state.turnLimit ?? 16) + 1
  const tag =
    save.leadSignature +
    ':' +
    perspective +
    ':' +
    (save.stage?.id ?? 'first-bell')
  const roundSave = () =>
    createSave({
      slot: 'auto',
      perspective,
      leadSignature: save.leadSignature,
      foilSignature: save.foilSignature,
      stage: save.stage,
      state,
      story,
    })
  const dialogue = () => {
    const live = { ...save, state, story }
    drainCombatDialogue(live, perspective)
  }
  for (let round = 0; round < limit && state.phase === 'active'; round++) {
    dialogue()
    for (const unit of state.units.filter((u) => u.team === 'squad')) {
      for (
        let step = 0;
        step < 5 && state.phase === 'active' && unit.hp > 0 && unit.ap > 0;
        step++
      ) {
        if (!combatAct(state, unit)) break
        actions++
        dialogue()
      }
    }
    endTurn(state)
    dialogue()
    const occupied = new Set<string>()
    for (const unit of state.units) {
      assert.ok(unit.hp >= 0 && unit.hp <= unit.maxHp, tag + ': HP')
      assert.ok(
        Number.isInteger(unit.ap) &&
          unit.ap >= 0 &&
          unit.ap <= MAX_ACTION_POINTS,
        tag + ': AP ' + unit.id + '=' + unit.ap,
      )
      if (unit.hp <= 0) continue
      const key = unit.x + ',' + unit.y
      assert.ok(!occupied.has(key), tag + ': stacked units')
      assert.ok(!tileAt(state.map, unit).wall, tag + ': unit in wall')
      occupied.add(key)
    }
    const loaded = loadSave(roundSave())
    assert.ok(loaded.ok, tag + ': ' + (loaded.ok ? '' : loaded.reason))
    assert.deepEqual(
      loaded.save.state,
      JSON.parse(JSON.stringify(state)),
      tag + ': checkpoint state',
    )
    state = loaded.save.state
    story = loaded.save.story
  }
  if (state.turnLimit !== null)
    assert.notEqual(state.phase, 'active', tag + ': expired mission')
  return { save: roundSave(), actions, outcome: state.phase }
}

const combatCoverage = CROSSFIRE_CHAPTERS.map((chapter) => ({
  chapter: chapter.id,
  attempts: 0,
  actions: 0,
  victory: 0,
  defeat: 0,
  active: 0,
}))
let fullCampaignVictories = 0
let fullCampaignAttempts = 0
const campaignStops: Record<CombatOutcome, number> = {
  victory: 0,
  defeat: 0,
  active: 0,
}
for (const person of IDENTITY_ARCS) {
  const cast = personalCastFor(person.signature)!
  for (const perspective of ['hero', 'villain'] as const) {
    let campaign: ReturnType<typeof newCrossfireJournal> = null
    for (const [index, chapter] of CROSSFIRE_CHAPTERS.entries()) {
      const stage = index === 0 ? null : clonePreset(chapter.id)
      const story = createStory()
      if (stage) story.current = null
      // Independent starts keep later missions covered when an earlier
      // chapter defeats the bot. A surviving campaign uses earned carryover.
      const opening =
        campaign?.active ??
        createSave({
          slot: 'auto',
          perspective,
          leadSignature: person.signature,
          foilSignature: cast.foil,
          stage,
          state: trainingState(0x53a1b7 + index * 997, stage ?? undefined, {
            lead: person.signature,
            foil: cast.foil,
            crossfireCast: 2,
          }),
          story,
        })
      if (index === 0) {
        campaign = newCrossfireJournal(opening)
        assert.ok(campaign)
        fullCampaignAttempts++
      }
      const result = playCombat(opening, perspective)
      const tally = combatCoverage[index]!
      tally.attempts++
      tally.actions += result.actions
      tally[result.outcome]++
      if (!campaign) continue
      const checkpoint = snapshotCrossfire(campaign, result.save)
      assert.ok(checkpoint)
      assert.ok(readCrossfireJournal(JSON.stringify(checkpoint)))
      if (result.outcome !== 'victory') {
        assert.equal(advanceCrossfire(checkpoint), null)
        const retry = retryCrossfire(checkpoint)
        assert.ok(retry)
        assert.equal(retry.active.state.phase, 'active')
        assert.deepEqual(retry.completed, checkpoint.completed)
        campaignStops[result.outcome]++
        campaign = null
        continue
      }
      const next = advanceCrossfire(checkpoint)
      assert.ok(next)
      if (next.finished) {
        assert.equal(next.completed.length, 6)
        assert.ok(crossfireFinale(next, next.active))
        assert.ok(readCrossfireJournal(JSON.stringify(next)))
        fullCampaignVictories++
        campaignStops.victory++
      }
      campaign = next
    }
  }
}
for (const tally of combatCoverage) {
  assert.equal(tally.attempts, 96)
  assert.equal(tally.victory + tally.defeat + tally.active, tally.attempts)
  assert.ok(tally.actions > 0, tally.chapter + ': no legal actions exercised')
}
assert.equal(fullCampaignAttempts, 96)
assert.equal(
  Object.values(campaignStops).reduce((a, b) => a + b, 0),
  96,
)
console.log(
  JSON.stringify({
    combatCoverage,
    fullCampaignAttempts,
    fullCampaignVictories,
    campaignStops,
  }),
)
