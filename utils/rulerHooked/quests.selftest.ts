// utils/rulerHooked/quests.selftest.ts
//
// The three kingdom quest arcs added for ruler-hooked/t-052: the Millrace Weir,
// the Reed Shallows and the Castle Moat. Each starts through the real turn
// loop, every branch runs to completion, and every ending changes which
// species the lake holds at that place (habitat) — opening some, closing
// others. Seeded reigns start all three without any hand-set state.

import assert from 'node:assert/strict'
import { RULER_HOOKED_CONTENT as C } from '~/utils/rulerHooked/content'
import { createRun } from '~/utils/rulerHooked/newGame'
import { resolveChoice } from '~/utils/rulerHooked/applyEffects'
import { eligiblePool } from '~/utils/rulerHooked/select'
import { allDeckCards, takeTurn } from '~/utils/rulerHooked/loop'
import { availableFish, RULER_HOOKED_FISH } from '~/utils/rulerHooked/fish'
import { makeRng } from '~/utils/rulerHooked/seed'
import { CARD_PROMPTS, FISH_PROMPTS } from '~/utils/rulerHooked/artPrompts'
import type { RunSave } from '~/types/ruler-hooked'

const QUESTS = ['millrace-weir', 'reed-shallows', 'castle-moat'] as const
const arc = (id: string) =>
  C.arcs.find((a) => a.id === id) ?? assert.fail(`no arc ${id}`)

const has = (save: RunSave, slug: string) =>
  availableFish(save).some((f) => f.slug === slug)

/** A reign at the arc's opening turn where only `arcId` can start. */
function readyFor(arcId: string, tweak?: (s: RunSave) => void): RunSave {
  const save = createRun(C, {
    saveId: 'sv_q',
    name: 'Q',
    seed: 'q-1',
    rulerName: 'Mo',
    honorific: 'Queen',
    stamp: 'T0',
  })
  for (const other of C.arcs)
    if (other.id !== arcId) save.deckState.seenCardIds.push(other.steps[0]!.id)
  save.turnCount = (arc(arcId).start?.trigger?.minTurn ?? 1) - 1
  tweak?.(save)
  return save
}

/** Start the arc through takeTurn (searching seeds for its chance roll), then play `choices`. */
function runQuest(
  arcId: string,
  choices: string[],
  tweak?: (s: RunSave) => void,
): RunSave {
  const base = readyFor(arcId, tweak)
  let save: RunSave | null = null
  let card = null
  for (let i = 0; i < 50 && !card; i++) {
    const turn = takeTurn(C, base, makeRng(`quest-${arcId}-${i}`))
    if (turn.arcId === arcId) {
      save = turn.save
      card = turn.card
    }
  }
  assert.ok(save && card, `${arcId} starts through the turn loop`)
  assert.equal(card!.id, arc(arcId).steps[0]!.id)
  for (const [index, choiceId] of choices.entries()) {
    const choice =
      card!.choices.find((c) => c.id === choiceId) ??
      assert.fail(`${card!.id} has no ${choiceId}`)
    save = resolveChoice(save!, card!, choice)
    if (index === choices.length - 1) break
    const next = takeTurn(C, save, makeRng(`quest-${arcId}-next-${index}`))
    assert.equal(
      next.arcId,
      arcId,
      `${arcId} presents its next step before anything else`,
    )
    save = next.save
    card = next.card
  }
  assert.ok(!save!.deckState.activeArcs[arcId], `${arcId} completes`)
  return save!
}

for (const id of QUESTS) {
  const a = arc(id)
  assert.equal(a.steps.length, 3, `${id} has an opening and two branches`)
  for (const step of a.steps) {
    assert.ok(
      step.art === `card-${step.id}` && CARD_PROMPTS[step.id],
      `${step.id} is prompted`,
    )
    for (const choice of step.choices)
      assert.ok(
        choice.result?.trim(),
        `${step.id}/${choice.id} has result text`,
      )
  }
}

// The Millrace Weir: a solid weir and a netted run close the sturgeon road;
// the sluice keeps it; the ladder brings the Stairclimber Trout.
{
  const giants = (s: RunSave) => {
    s.flags.heededNix = true
    s.kingdomHealth.nature = 95
    s.kingdomHealth.order = 60
  }
  assert.ok(has(readyFor('millrace-weir', giants), 'bridgeback-sturgeon'))
  const netted = runQuest(
    'millrace-weir',
    ['build-weir', 'net-the-run'],
    giants,
  )
  assert.ok(
    netted.kingdomHealth.nature >= 70,
    'the Bridgeback’s own conditions still hold',
  )
  assert.ok(
    netted.flags.runBlocked && !has(netted, 'bridgeback-sturgeon'),
    'netting the run closes the Bridgeback',
  )
  assert.equal(netted.regionOverrides.village_edge, 'township')
  const sluice = runQuest(
    'millrace-weir',
    ['build-weir', 'open-sluice'],
    giants,
  )
  assert.ok(
    has(sluice, 'bridgeback-sturgeon'),
    'the sluice keeps the Bridgeback',
  )
  for (const end of ['open-ladder-pools', 'guard-ladder']) {
    const ladder = runQuest('millrace-weir', ['ladder-weir', end])
    assert.ok(
      has(ladder, 'stairclimber-trout'),
      `the ladder opens the Stairclimber Trout (${end})`,
    )
    assert.ok(!has(netted, 'stairclimber-trout'))
  }
}

// The Reed Shallows: dredging opens the Mooring Mullet and drives out the
// Sunspoke Koi; a nursery brings the koi back without the sanctuary.
{
  const sanctuary = (s: RunSave) => {
    s.flags.treelineSanctuarySettled = true
    s.kingdomHealth.nature = 85
  }
  assert.ok(has(readyFor('reed-shallows', sanctuary), 'sunspoke-koi'))
  for (const end of ['charge-moorings', 'village-berths']) {
    const marina = runQuest('reed-shallows', ['dredge-cove', end], sanctuary)
    assert.ok(
      has(marina, 'mooring-mullet'),
      `the marina opens the Mooring Mullet (${end})`,
    )
    assert.ok(
      marina.kingdomHealth.nature >= 65 && !has(marina, 'sunspoke-koi'),
      'dredging drives out the Sunspoke Koi',
    )
    assert.equal(marina.regionOverrides.far_shore, 'farmed')
  }
  const closed = runQuest('reed-shallows', ['declare-nursery', 'close-cove'])
  assert.ok(
    !closed.flags.treelineSanctuarySettled && has(closed, 'sunspoke-koi'),
    'the nursery brings the koi back',
  )
  assert.ok(!has(closed, 'mooring-mullet'))
  const released = runQuest('reed-shallows', [
    'declare-nursery',
    'catch-and-release',
  ])
  assert.ok(
    released.flags.catchRelease &&
      released.regionOverrides.far_shore === 'pristine',
  )
}

// The Castle Moat: a preserve kept by fines feeds the Tithe Lamprey; a moat
// fished without rules fills with Barebone Roach; honour rules keep them out
// and throw a fair; hired poachers hand over the smuggler's chart.
{
  const fined = runQuest('castle-moat', ['enclose-moat', 'fine-poachers'])
  assert.equal(fined.counters.taxHikes, 1)
  assert.ok(
    has(fined, 'tithe-lamprey'),
    'a preserve kept by fines feeds the Tithe Lamprey',
  )
  const keepers = runQuest('castle-moat', ['enclose-moat', 'hire-poachers'])
  assert.ok(!has(keepers, 'tithe-lamprey'))
  assert.ok(
    eligiblePool(keepers, allDeckCards(C)).some((c) => c.id === 'sunken-cache'),
    'the keepers’ chart opens the sunken cache',
  )
  const stripped = runQuest('castle-moat', ['keep-moat-common', 'let-moat-run'])
  assert.ok(
    has(stripped, 'barebone-roach'),
    'a stripped moat fills with Barebone Roach',
  )
  const honour = runQuest('castle-moat', ['keep-moat-common', 'honour-rules'])
  assert.ok(!has(honour, 'barebone-roach') && honour.counters.festivals === 1)
}

// New species are prompted, and every species can still be found in some lake.
for (const slug of ['stairclimber-trout', 'mooring-mullet', 'barebone-roach']) {
  const fish =
    RULER_HOOKED_FISH.find((f) => f.slug === slug) ?? assert.fail(slug)
  assert.ok(
    FISH_PROMPTS[slug] && fish.habitats.length,
    `${slug} has a plate and a place`,
  )
}

// Seeded reigns start every quest with no hand-set state, deterministically.
function reignArcs(seed: string): string[] {
  let save = createRun(C, {
    saveId: 'sv_r',
    name: 'R',
    seed,
    rulerName: 'Mo',
    honorific: 'Queen',
    stamp: 'T0',
  })
  const rng = makeRng(seed)
  const started: string[] = []
  for (let i = 0; i < 80; i++) {
    const turn = takeTurn(C, save, rng, 0.7)
    save = turn.save
    if (!turn.card) continue
    if (turn.arcId && turn.card.id === arc(turn.arcId).steps[0]!.id)
      started.push(turn.arcId)
    save = resolveChoice(save, turn.card, turn.card.choices[0]!)
  }
  return started
}
assert.deepEqual(reignArcs('quest-reign-1'), reignArcs('quest-reign-1'))
const startedAnywhere = new Set(
  ['quest-reign-1', 'quest-reign-2', 'quest-reign-3', 'quest-reign-4'].flatMap(
    reignArcs,
  ),
)
for (const id of QUESTS)
  assert.ok(startedAnywhere.has(id), `${id} starts in a seeded reign`)

console.log('ruler-hooked QUESTS self-test: ALL PASS')
