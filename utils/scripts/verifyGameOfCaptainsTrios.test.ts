import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CREW,
  advanceVoyageDay,
  decidePolicy,
  finishVoyage,
  launchMission,
  nextDestination,
  restoreVoyage,
  startVoyage,
  type CrewId,
  type VoyageRun,
} from '../gameOfCaptains/rules'
import {
  ALL_PARTIES,
  TRIO_ADVENTURES,
  TRIO_BY_KEY,
  TRIO_FIRST_CHAPTER,
  chooseTrioStep,
  restoreTrioAdventure,
  trioAdventureFor,
  trioArtKey,
  trioEnding,
  trioEndingIndex,
  trioEpilogue,
  trioKey,
  trioOutcomeThisChapter,
  trioStepDue,
  type TrioEndingIndex,
  type TrioVoyage,
} from '../gameOfCaptains/trioAdventures'
import {
  COUCH_LOOK,
  CREW_LOOKS,
  WARP_ART_PROMPTS,
} from '../gameOfCaptains/artPrompts'
import { VOYAGE_CHAPTERS } from '../gameOfCaptains/voyageMap'
import { buildThisMeansWarpPlaybook } from '../playbook/thisMeansWarp'
import { EXISTING_PLAYBOOKS } from '../playbookForge/existing'

// Space Couch party adventures (kind_robots#4182, Silas 2026-10-27): twelve
// crew in threes are 220 parties, and an authored party gets a three-step
// interlude in Act II and two endings of its own at the jump gate.

const fromRoot = (path: string) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')

// --- Authored content -------------------------------------------------------

assert.ok(TRIO_ADVENTURES.length >= 20, 'at least twenty authored parties')
assert.equal(
  TRIO_ADVENTURES.length,
  ALL_PARTIES,
  'every party has an adventure',
)
assert.equal(
  Object.keys(TRIO_BY_KEY).length,
  TRIO_ADVENTURES.length,
  'every party is authored once',
)
const covered = new Set(TRIO_ADVENTURES.flatMap((a) => a.crew))
for (const member of CREW)
  assert.ok(covered.has(member.id), `${member.id} is in an authored party`)

const premises = new Set<string>()
const setups = new Set<string>()
const outcomes = new Set<string>()
const endingTitles = new Set<string>()
const endingTexts = new Set<string>()
const titles = new Set<string>()
for (const adventure of TRIO_ADVENTURES) {
  const key = trioKey(adventure.crew)
  assert.equal(new Set(adventure.crew).size, 3, `${key}: three crew`)
  assert.ok(
    adventure.crew.every((id) => CREW.some((m) => m.id === id)),
    `${key}: real crew`,
  )
  // Uniqueness: no two parties share a premise, title, step or ending.
  assert.ok(!premises.has(adventure.premise), `${key}: premise is unique`)
  premises.add(adventure.premise)
  assert.ok(!titles.has(adventure.title), `${key}: title is unique`)
  titles.add(adventure.title)
  assert.ok(adventure.premise.length > 150, `${key}: a real premise`)
  assert.equal(adventure.steps.length, 3, `${key}: three steps`)
  assert.equal(adventure.endings.length, 2, `${key}: two endings`)
  for (const step of adventure.steps) {
    assert.ok(!setups.has(step.setup), `${key}: step setup is unique`)
    setups.add(step.setup)
    assert.equal(step.options.length, 2, `${key}: a real choice`)
    assert.notEqual(step.options[0].label, step.options[1].label)
    for (const option of step.options) {
      assert.ok(!outcomes.has(option.outcome), `${key}: outcome is unique`)
      outcomes.add(option.outcome)
      assert.ok(option.outcome.length > 60, `${key}: authored outcome`)
    }
  }
  for (const ending of adventure.endings) {
    assert.ok(!endingTitles.has(ending.title), `${ending.title} is unique`)
    endingTitles.add(ending.title)
    assert.ok(!endingTexts.has(ending.text))
    endingTexts.add(ending.text)
  }
  // Both endings can be earned by some run of three choices.
  const reachable = new Set<number>()
  for (let mask = 0; mask < 8; mask++) {
    const leanB = [0, 1, 2].filter(
      (i) => adventure.steps[i]!.options[(mask >> i) & 1]!.ending === 1,
    ).length
    reachable.add(leanB >= 2 ? 1 : 0)
  }
  assert.deepEqual([...reachable].sort(), [0, 1], `${key}: both endings`)
  // Each party member's name appears in its own premise: the episode is about these three.
  for (const id of adventure.crew) {
    const short = CREW.find((m) => m.id === id)!
      .name.split(' ')
      .at(-1)!
    const first = CREW.find((m) => m.id === id)!.name.split(' ')[0]!
    assert.ok(
      [short, first, id.charAt(0).toUpperCase() + id.slice(1)].some((n) =>
        `${adventure.premise} ${adventure.steps.map((s) => s.setup).join(' ')}`.includes(
          n,
        ),
      ),
      `${key}: ${id} is in the episode`,
    )
  }
}

// --- Art: five literal prompts per party, crew looks and couch word for word.

const lookOf = new Map(
  Object.entries(CREW_LOOKS).map(([id, look]) => [look, id as CrewId]),
)
for (const adventure of TRIO_ADVENTURES) {
  const key = trioKey(adventure.crew)
  const parts = [1, 2, 3, 'a', 'b'] as const
  const prompts = parts.map((part) => WARP_ART_PROMPTS[trioArtKey(key, part)])
  prompts.forEach((prompt, i) =>
    assert.ok(prompt, `${key} ${parts[i]}: has a Krea 2 prompt`),
  )
  let crewShown = 0
  for (const prompt of prompts as string[]) {
    assert.ok(prompt.length >= 120 && prompt.length <= 900, `${key}: length`)
    for (const [look, id] of lookOf)
      if (prompt.includes(look)) {
        assert.ok(adventure.crew.includes(id), `${key}: only its own crew`)
        crewShown += 1
      }
    if (/scarlet velvet couch/.test(prompt))
      assert.ok(
        prompt.toLowerCase().includes(COUCH_LOOK.toLowerCase()),
        `${key}: the couch phrase, word for word`,
      )
    for (const id of adventure.crew)
      assert.ok(
        !new RegExp(`\\b${id}\\b`, 'i').test(prompt),
        `${key}: prompts describe ${id}, never name them`,
      )
  }
  assert.ok(crewShown >= 3, `${key}: its crew appear in its pictures`)
  for (const id of adventure.crew)
    assert.ok(
      prompts.some((p) => p!.includes(CREW_LOOKS[id])),
      `${key}: ${id} is painted at least once`,
    )
}

// --- Seeded voyages from a new game ---------------------------------------

function completeMission(run: VoyageRun) {
  run = launchMission(run)
  assert.equal(run.phase, 'transit')
  while (run.phase === 'transit') run = advanceVoyageDay(run)
  assert.equal(run.phase, 'decision')
  return decidePolicy(run, 'aid')
}

/** Plays the whole voyage, taking the party's choices as each step falls due. */
function voyage(
  crew: CrewId[],
  seed: number,
  choices: TrioEndingIndex[] | null,
  stopAfterChapter?: number,
) {
  let run: VoyageRun = startVoyage('vale', crew, seed)
  const due: number[] = []
  let picked = 0
  while (run.phase === 'briefing') {
    run = completeMission(run)
    assert.equal(run.phase, 'debrief')
    const step = trioStepDue(run)
    if (step) {
      due.push(run.chapter)
      assert.equal(step.index, picked)
      if (choices && picked < choices.length) {
        const before = run
        run = chooseTrioStep(run, choices[picked]!)
        assert.notEqual(run, before)
        assert.equal(run.scene, before.scene, 'the mission debrief stays')
        assert.equal(
          trioOutcomeThisChapter(run)?.startsWith(
            step.step.options[choices[picked]!].outcome,
          ),
          true,
        )
        assert.equal(trioStepDue(run), null, 'one step per chapter')
        assert.equal(chooseTrioStep(run, 0), run)
        picked += 1
      }
    }
    if (run.chapter === stopAfterChapter) return { run, due }
    run = nextDestination(run)
  }
  assert.equal(run.phase, 'finale')
  return { run, due }
}

// The Armrest Accord: Jex, Rue and Taal reach both endings by choice.
const accord = TRIO_BY_KEY['jex-rue-taal']!
const toward = (ending: TrioEndingIndex) =>
  accord.steps.map(
    (step) =>
      step.options.findIndex((o) => o.ending === ending) as TrioEndingIndex,
  )
const finishes: string[] = []
for (const ending of [0, 1] as const) {
  const { run, due } = voyage(['rue', 'taal', 'jex'], 4182, toward(ending))
  assert.deepEqual(
    due,
    [TRIO_FIRST_CHAPTER, TRIO_FIRST_CHAPTER + 1, TRIO_FIRST_CHAPTER + 2],
    'the interlude plays across Act II, one step per debrief',
  )
  assert.equal(trioEndingIndex(run), ending)
  assert.equal(trioEnding(run), accord.endings[ending])
  const plain = finishVoyage(run, 'protect')
  const done = trioEpilogue(plain)
  assert.ok(done.scene.startsWith(plain.scene), 'galactic ending kept')
  assert.ok(done.scene.includes(accord.endings[ending].text))
  assert.ok(!done.scene.includes(accord.endings[1 - ending]!.text))
  assert.equal(done.ending, plain.ending)
  assert.equal(done.nemesisEnding, plain.nemesisEnding)
  assert.equal((done as TrioVoyage).trioAdventure?.ending, ending)
  assert.ok(
    done.log.at(-1)!.includes(accord.endings[ending].title),
    'the party ending is in the log',
  )
  assert.equal(trioEpilogue(done), done, 'the epilogue is added once')
  assert.deepEqual(
    restoreTrioAdventure(restoreVoyage(JSON.parse(JSON.stringify(done)))),
    done,
  )
  finishes.push(done.scene)
}
assert.notEqual(finishes[0], finishes[1])

// A mixed run is decided by the majority of its leanings.
{
  const mixed = [toward(1)[0]!, toward(0)[1]!, toward(1)[2]!]
  const { run } = voyage(['jex', 'taal', 'rue'], 4182, mixed)
  assert.equal(trioEndingIndex(run), 1)
}

// Skipped steps wait for a later debrief and can still finish by chapter 9.
{
  let run: VoyageRun = startVoyage('quill', ['sora', 'mox', 'omi'], 77)
  const chapters: number[] = []
  while (run.phase === 'briefing') {
    run = completeMission(run)
    if (run.chapter >= 7 && trioStepDue(run)) {
      run = chooseTrioStep(run, 0)
      chapters.push(run.chapter)
    }
    run = nextDestination(run)
  }
  assert.deepEqual(chapters, [7, 8, 9])
  assert.notEqual(trioEndingIndex(run), null)
}

// An unfinished interlude gets one plain line, not an ending.
{
  const { run } = voyage(['brin', 'pell', 'sora'], 12, [0])
  const done = trioEpilogue(finishVoyage(run, 'compromise'))
  assert.equal(trioEndingIndex(run), null)
  assert.ok(done.scene.includes('never finished The Shears Grievance'))
  assert.equal((done as TrioVoyage).trioAdventure?.ending, undefined)
}

// Every one of the twelve-choose-three parties is authored (batches A-J).
// A party without an authored adventure would be unaffected; the check below
// still runs if a future roster change leaves one unwritten.
const unauthored = CREW.flatMap((a, i) =>
  CREW.slice(i + 1).flatMap((b, j) =>
    CREW.slice(i + j + 2).map((c) => [a.id, b.id, c.id] as CrewId[]),
  ),
).find((crew) => !TRIO_BY_KEY[trioKey(crew)])
if (unauthored) {
  const crew = unauthored
  assert.equal(TRIO_BY_KEY[trioKey(crew)], undefined)
  const { run, due } = voyage(crew, 41, [0, 0, 0])
  assert.deepEqual(due, [], 'no interlude offered')
  const plain = finishVoyage(run, 'protect')
  assert.equal(trioEpilogue(plain), plain)
  assert.equal((plain as TrioVoyage).trioAdventure, undefined)
  assert.equal(chooseTrioStep(run, 0), run)
  assert.equal(trioAdventureFor(run), null)
}

// --- Saves --------------------------------------------------------------

// Mid-adventure: a saved record round-trips through the v1 save and the
// voyage carries on to the step after it.
{
  const { run } = voyage(['vela', 'fen', 'mox'], 990, [1, 0], 5)
  assert.deepEqual((run as TrioVoyage).trioAdventure, {
    trio: 'fen-mox-vela',
    choices: [1, 0],
    lastChapter: 5,
  })
  const restored = restoreTrioAdventure(
    restoreVoyage(JSON.parse(JSON.stringify(run))),
  )
  assert.deepEqual(restored, run)
  assert.equal(trioStepDue(restored!), null, 'still one step per chapter')
  let next = nextDestination(restored!)
  next = completeMission(next)
  assert.equal(trioStepDue(next)?.index, 2, 'the third step follows')
  next = chooseTrioStep(next, 1)
  assert.deepEqual((next as TrioVoyage).trioAdventure?.choices, [1, 0, 1])
}

// Old saves: written before party adventures, they load unchanged and can
// still start the interlude.
{
  const { run } = voyage(['omi', 'taal', 'vela'], 13, null, 4)
  const old = JSON.parse(JSON.stringify(run))
  assert.equal('trioAdventure' in old, false)
  const restored = restoreTrioAdventure(restoreVoyage(old))
  assert.deepEqual(restored, run)
  assert.equal(trioStepDue(restored!)?.index, 0)
  assert.equal(restoreTrioAdventure(null), null)
}

// A malformed or foreign record is dropped; the voyage itself still loads.
{
  const { run } = voyage(['kivo', 'tess', 'fen'], 61, [0], 4)
  const save = JSON.parse(JSON.stringify(run))
  for (const bad of [
    { ...save.trioAdventure, trio: 'jex-rue-taal' },
    { ...save.trioAdventure, choices: [0, 2] },
    { ...save.trioAdventure, choices: [0, 0, 0, 0] },
    { ...save.trioAdventure, lastChapter: VOYAGE_CHAPTERS + 1 },
    'interlude',
    null,
  ]) {
    const restored = restoreTrioAdventure(
      restoreVoyage({ ...save, trioAdventure: bad }),
    )
    assert.ok(restored, 'the voyage still loads')
    assert.equal((restored as TrioVoyage).trioAdventure, undefined)
    assert.equal(trioStepDue(restored!)?.index, 0, 'the interlude starts over')
  }
}

// --- Wiring: the store, page, Playbook Studio and the Forge -------------

const store = fromRoot('stores/gameOfCaptainsStore.ts')
assert.match(store, /chooseTrioStep\(run\.value, option\)/)
assert.match(
  store,
  /trioEpilogue\(\s*relationshipEpilogue\(finishVoyage\(run\.value, strategy\)\)/,
)
assert.match(store, /restoreTrioAdventure\(\s*restoreVoyage\(/)
const page = fromRoot('pages/play/game-of-captains.vue')
assert.equal(page.match(/<SpaceCouchTrioInterlude \/>/g)?.length, 2)

const book = buildThisMeansWarpPlaybook()
for (const adventure of TRIO_ADVENTURES) {
  const key = trioKey(adventure.crew)
  for (const n of [1, 2, 3]) {
    const node = book.nodes[`trio:${key}:${n}`]!
    assert.ok(node, `${key} step ${n} is a Playbook beat`)
    assert.equal(node.choices.length, 2)
    assert.ok(node.choices.every((c) => c.success?.text))
    assert.equal(node.artPrompt, WARP_ART_PROMPTS[trioArtKey(key, n as 1)])
  }
  for (const part of ['a', 'b'] as const)
    assert.ok(book.nodes[`trio-ending:${key}:${part}`]?.artPrompt)
}
assert.ok(book.order.includes(`trio:${trioKey(accord.crew)}:1`))

// The Forge counts only what exists. With all 220 parties authored, the
// party factors light up: three interlude steps and two endings each.
const forge = EXISTING_PLAYBOOKS.find((p) => p.slug === 'game-of-captains')!
const counted = await forge.count()
assert.equal(unauthored, undefined, 'no party is left unwritten')
assert.equal(counted.values.partyAdventureSteps, 3)
assert.equal(counted.values.partyEndings, 2)
assert.match(
  counted.source,
  new RegExp(`${TRIO_ADVENTURES.length} of ${ALL_PARTIES} parties authored`),
)

console.log(
  `Space Couch party adventures: ${TRIO_ADVENTURES.length} of ${ALL_PARTIES} parties authored, seeded traces OK`,
)
