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
import { applyEffect, resolveChoice } from '~/utils/rulerHooked/applyEffects'
import { eligiblePool } from '~/utils/rulerHooked/select'
import {
  allDeckCards,
  dismissedFinaleFlag,
  eligibleEnding,
  takeTurn,
} from '~/utils/rulerHooked/loop'
import {
  hearProclamation,
  pendingProclamation,
} from '~/utils/rulerHooked/dailyEvents'
import { availableFish, RULER_HOOKED_FISH } from '~/utils/rulerHooked/fish'
import { makeRng } from '~/utils/rulerHooked/seed'
import { CARD_PROMPTS, FISH_PROMPTS } from '~/utils/rulerHooked/artPrompts'
import type { AxisKey, RunSave } from '~/types/ruler-hooked'

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

// Each aftershock is a delayed, once-only consequence of a legally completed
// prior quest. Outcomes must change both the reign and the eligible fish.
{
  const aftershocks = [
    {
      id: 'weir-reckoning',
      arc: 'millrace-weir',
      path: ['build-weir', 'net-the-run'],
      fish: 'bridgeback-sturgeon',
      repair: 'reopen-migration',
      deepen: 'keep-netting',
      tweak: (save: RunSave) => {
        save.flags.heededNix = true
        save.kingdomHealth.nature = 95
        save.kingdomHealth.order = 60
      },
    },
    {
      id: 'moat-reckoning',
      arc: 'castle-moat',
      path: ['keep-moat-common', 'let-moat-run'],
      fish: 'barebone-roach',
      repair: 'restore-moat',
      deepen: 'license-roach',
    },
    {
      id: 'treaty-reckoning',
      arc: 'envoy-treaty',
      path: ['negotiate-tough', 'finalize-tough'],
      fish: 'tollbell-sturgeon',
      repair: 'ease-the-border',
      deepen: 'hold-the-tolls',
    },
    {
      id: 'marina-reckoning',
      arc: 'reed-shallows',
      path: ['dredge-cove', 'charge-moorings'],
      fish: 'mooring-mullet',
      repair: 'return-the-reeds',
      deepen: 'clean-the-marina',
      tweak: (save: RunSave) => {
        save.kingdomHealth.nature = 85
      },
    },
    {
      id: 'wedding-reckoning',
      arc: 'child-elopes',
      path: ['bless', 'welcome'],
      fish: 'orchardjaw-perch',
      repair: 'family-orchard',
      deepen: 'family-nursery',
    },
  ] as const

  for (const scenario of aftershocks) {
    const terminal = runQuest(
      scenario.arc,
      [...scenario.path],
      'tweak' in scenario ? scenario.tweak : undefined,
    )
    terminal.turnCount = 24
    const card =
      allDeckCards(C).find((candidate) => candidate.id === scenario.id) ??
      assert.fail(`missing ${scenario.id}`)
    assert.ok(card.once, `${scenario.id} must be a one-time callback`)
    assert.ok(CARD_PROMPTS[scenario.id], `${scenario.id} needs authored art`)
    assert.ok(
      eligiblePool(terminal, allDeckCards(C)).some((c) => c.id === scenario.id),
      `${scenario.id} should become eligible after its legal quest outcome`,
    )
    const before = has(terminal, scenario.fish)
    const choose = (choiceId: string) => {
      const choice =
        card.choices.find((candidate) => candidate.id === choiceId) ??
        assert.fail(`missing ${scenario.id}/${choiceId}`)
      return resolveChoice(terminal, card, choice)
    }
    const restored = choose(scenario.repair)
    const entrenched = choose(scenario.deepen)
    assert.notDeepEqual(
      restored.kingdomHealth,
      entrenched.kingdomHealth,
      `${scenario.id} must have material policy consequences`,
    )
    assert.notDeepEqual(
      restored.regionOverrides,
      entrenched.regionOverrides,
      `${scenario.id} must change the illustrated map differently`,
    )
    assert.equal(
      eligiblePool(restored, allDeckCards(C)).some((c) => c.id === scenario.id),
      false,
      `${scenario.id} must never recur after either choice`,
    )
    assert.equal(
      eligiblePool(entrenched, allDeckCards(C)).some(
        (c) => c.id === scenario.id,
      ),
      false,
    )

    if (scenario.id === 'wedding-reckoning') {
      assert.equal(before, false)
      assert.equal(has(restored, 'orchardjaw-perch'), true)
      assert.equal(has(entrenched, 'orchardjaw-perch'), false)
      assert.equal(has(entrenched, 'sunspoke-koi'), true)
    } else {
      assert.equal(
        before,
        scenario.id !== 'weir-reckoning',
        `${scenario.id} starts with the species state its earlier choice caused`,
      )
      assert.equal(
        has(restored, scenario.fish),
        scenario.id === 'weir-reckoning',
      )
      assert.equal(
        has(entrenched, scenario.fish),
        scenario.id !== 'weir-reckoning',
      )
      if (scenario.id === 'marina-reckoning')
        assert.equal(has(restored, 'sunspoke-koi'), true)
    }

    const tooEarly = { ...terminal, turnCount: 1 }
    assert.equal(
      eligiblePool(tooEarly, allDeckCards(C)).some((c) => c.id === scenario.id),
      false,
      `${scenario.id} should be a delayed consequence`,
    )
    const rerun = runQuest(
      scenario.arc,
      [...scenario.path],
      'tweak' in scenario ? scenario.tweak : undefined,
    )
    assert.deepEqual(
      rerun.kingdomHealth,
      runQuest(
        scenario.arc,
        [...scenario.path],
        'tweak' in scenario ? scenario.tweak : undefined,
      ).kingdomHealth,
      `${scenario.id} must be deterministic from the same seed and decisions`,
    )
  }
}

// Cross-faction policy petitions require two separately completed earlier
// paths. They are not generic random events and do not expire with time.
{
  const allCards = allDeckCards(C)
  const findCard = (id: string) =>
    allCards.find((c) => c.id === id) ??
    C.arcs.flatMap((a) => a.steps).find((c) => c.id === id) ??
    assert.fail(`missing policy card ${id}`)
  const base = () => {
    const save = createRun(C, {
      saveId: 'sv_cross',
      name: 'Cross faction',
      seed: 'cross-faction-1',
      rulerName: 'Mo',
      honorific: 'Queen',
      stamp: 'T0',
    })
    save.turnCount = 35
    save.kingdomHealth.nature = 80
    save.kingdomHealth.order = 65
    save.kingdomHealth.joy = 72
    save.kingdomHealth.treasury = 75
    return save
  }
  const route = (path: readonly (readonly [string, string])[]) => {
    let save = base()
    for (const [id, choiceId] of path) {
      const card = findCard(id)
      const choice =
        card.choices.find((candidate) => candidate.id === choiceId) ??
        assert.fail(`missing ${id}/${choiceId}`)
      save = resolveChoice(save, card, choice)
    }
    return save
  }
  const ready = (save: RunSave, id: string) =>
    eligiblePool(save, allCards).some((c) => c.id === id)

  const cases = [
    {
      id: 'river-commons-vote',
      before: [
        ['weir-1', 'build-weir'],
        ['weir-stone', 'net-the-run'],
        ['weir-reckoning', 'reopen-migration'],
      ],
      other: [
        ['envoy-1', 'negotiate-tough'],
        ['envoy-tough', 'finalize-tough'],
        ['treaty-reckoning', 'ease-the-border'],
      ],
      choices: ['charter-the-run', 'license-the-run'],
      fish: ['bridgeback-sturgeon', 'tollbell-sturgeon'],
    },
    {
      id: 'marina-family-charter',
      before: [
        ['reed-1', 'dredge-cove'],
        ['reed-marina', 'charge-moorings'],
        ['marina-reckoning', 'clean-the-marina'],
      ],
      other: [
        ['elope-1', 'bless'],
        ['elope-blessing', 'welcome'],
        ['wedding-reckoning', 'family-nursery'],
      ],
      choices: ['charter-the-cooperative', 'reserve-the-royal-pier'],
      fish: ['orchardjaw-perch', 'mooring-mullet'],
    },
    {
      id: 'water-rights-hearing',
      before: [
        ['weir-1', 'build-weir'],
        ['weir-stone', 'net-the-run'],
        ['weir-reckoning', 'keep-netting'],
      ],
      other: [
        ['moat-1', 'keep-moat-common'],
        ['moat-crowded', 'let-moat-run'],
        ['moat-reckoning', 'license-roach'],
      ],
      choices: ['found-the-water-trust', 'auction-the-water'],
      fish: ['bridgeback-sturgeon', 'barebone-roach'],
    },
  ] as const

  for (const scenario of cases) {
    const card = findCard(scenario.id)
    assert.equal(card.art, `card-${scenario.id}`)
    assert.ok(CARD_PROMPTS[scenario.id], `${scenario.id} has art prompt`)
    assert.ok(card.once, `${scenario.id} must be a one-time vote`)
    assert.equal(ready(base(), scenario.id), false)
    assert.equal(ready(route([...scenario.before]), scenario.id), false)
    assert.equal(ready(route([...scenario.other]), scenario.id), false)
    const reached = route([...scenario.before, ...scenario.other])
    assert.ok(ready(reached, scenario.id), `${scenario.id} is reachable`)
    const [firstId, secondId] = scenario.choices
    const first = resolveChoice(
      reached,
      card,
      card.choices.find((c) => c.id === firstId)!,
    )
    const second = resolveChoice(
      reached,
      card,
      card.choices.find((c) => c.id === secondId)!,
    )
    assert.notDeepEqual(first.kingdomHealth, second.kingdomHealth)
    assert.notDeepEqual(first.regionOverrides, second.regionOverrides)
    assert.notDeepEqual(
      first.regionOverrides,
      reached.regionOverrides,
      `${scenario.id} first decree must visibly change the lake`,
    )
    assert.notDeepEqual(
      second.regionOverrides,
      reached.regionOverrides,
      `${scenario.id} second decree must visibly change the lake`,
    )
    assert.notDeepEqual(first.flags, second.flags)
    assert.ok(!ready(first, scenario.id) && !ready(second, scenario.id))
    const early = { ...reached, turnCount: 2 }
    assert.ok(!ready(early, scenario.id), 'later consequences do not rush')
    assert.equal(card.choices.length, 2)
    for (const choice of card.choices)
      assert.ok(choice.result?.trim(), `${scenario.id}/${choice.id}`)
    const [recoveredFish, alternativeFish] = scenario.fish
    if (scenario.id === 'river-commons-vote') {
      assert.equal(has(first, recoveredFish), true)
      assert.equal(has(second, alternativeFish), true)
    } else if (scenario.id === 'marina-family-charter') {
      assert.equal(has(first, recoveredFish), true)
      assert.equal(has(second, recoveredFish), false)
      assert.equal(has(second, alternativeFish), true)
    } else {
      assert.equal(has(first, recoveredFish), true)
      assert.equal(has(second, alternativeFish), true)
      assert.equal(has(first, alternativeFish), false)
    }
  }
}

// Late follow-ups remain reachable after either initial policy, and offer a
// meaningful chance to revise that policy rather than replaying its decision.
{
  const cards = allDeckCards(C)
  const cases = [
    {
      parent: 'river-commons-vote',
      followup: 'flood-debt-council',
      first: 'fund-floodplain',
      second: 'mortgage-crossing',
      good: 'bridgeback-sturgeon',
      other: 'tollbell-sturgeon',
      earlyTurn: 37,
    },
    {
      parent: 'marina-family-charter',
      followup: 'harbour-apprentice-hearing',
      first: 'share-the-launch',
      second: 'sell-apprentice-licenses',
      good: 'orchardjaw-perch',
      other: 'ironmandate-skate',
      earlyTurn: 38,
    },
  ] as const

  for (const scenario of cases) {
    const parent = cards.find((c) => c.id === scenario.parent)!
    const followup = cards.find((c) => c.id === scenario.followup)!
    assert.ok(parent && followup)
    assert.ok(CARD_PROMPTS[followup.id])
    for (const parentChoice of parent.choices) {
      const base = createRun(C, {
        saveId: 'late-policy-test',
        name: 'Late policy',
        seed: 'late-policy',
        rulerName: 'Mo',
        stamp: 'T0',
      })
      base.turnCount = scenario.earlyTurn + 1
      base.kingdomHealth.nature = 80
      base.kingdomHealth.joy = 50
      base.kingdomHealth.order = 70
      base.kingdomHealth.treasury = 80
      assert.ok(!eligiblePool(base, cards).includes(followup))

      const after = resolveChoice(base, parent, parentChoice)
      // Neutral intervening joy isolates each late decree's habitat effect.
      after.kingdomHealth.joy = 50
      assert.ok(eligiblePool(after, cards).includes(followup))
      assert.ok(
        !eligiblePool(
          { ...after, turnCount: scenario.earlyTurn },
          cards,
        ).includes(followup),
      )

      const restored = resolveChoice(
        after,
        followup,
        followup.choices.find((c) => c.id === scenario.first)!,
      )
      const licensed = resolveChoice(
        after,
        followup,
        followup.choices.find((c) => c.id === scenario.second)!,
      )
      assert.notDeepEqual(restored.kingdomHealth, licensed.kingdomHealth)
      assert.notDeepEqual(restored.regionOverrides, licensed.regionOverrides)
      assert.ok(has(restored, scenario.good))
      assert.ok(!has(restored, scenario.other))
      assert.ok(has(licensed, scenario.other))
      assert.ok(!eligiblePool(restored, cards).includes(followup))
      assert.ok(!eligiblePool(licensed, cards).includes(followup))
    }
  }
}

// Unlike the focused reducer fixtures above, these witnesses start at turn zero
// and choose only cards actually offered by the normal seeded narrative loop.
{
  const families = [
    {
      name: 'family-blessing',
      path: { 'elope-1': 'bless' },
      parent: 'elope-blessing',
      parentChoices: ['welcome'],
      target: 'wedding-reckoning',
      outcomes: ['family-orchard', 'family-nursery'],
    },
    {
      name: 'family-reconciliation',
      path: { 'elope-1': 'forbid' },
      parent: 'elope-defiance',
      parentChoices: ['relent', 'recognize-marriage'],
      target: 'wedding-reckoning',
      outcomes: ['family-orchard', 'family-nursery'],
    },
    {
      name: 'river',
      path: {
        'weir-1': 'build-weir',
        'weir-stone': 'net-the-run',
        'weir-reckoning': 'reopen-migration',
        'envoy-1': 'negotiate-tough',
        'envoy-tough': 'finalize-tough',
        'treaty-reckoning': 'ease-the-border',
      },
      parent: 'river-commons-vote',
      parentChoices: ['charter-the-run', 'license-the-run'],
      target: 'flood-debt-council',
      outcomes: ['fund-floodplain', 'mortgage-crossing'],
    },
    {
      name: 'harbour',
      path: {
        'reed-1': 'dredge-cove',
        'reed-marina': 'charge-moorings',
        'marina-reckoning': 'clean-the-marina',
        'elope-1': 'bless',
        'elope-blessing': 'welcome',
        'wedding-reckoning': 'family-nursery',
      },
      parent: 'marina-family-charter',
      parentChoices: ['charter-the-cooperative', 'reserve-the-royal-pier'],
      target: 'harbour-apprentice-hearing',
      outcomes: ['share-the-launch', 'sell-apprentice-licenses'],
    },
    {
      name: 'water-rights',
      path: {
        'weir-1': 'build-weir',
        'weir-stone': 'net-the-run',
        'weir-reckoning': 'keep-netting',
        'moat-1': 'keep-moat-common',
        'moat-crowded': 'let-moat-run',
        'moat-reckoning': 'license-roach',
      },
      parent: 'moat-reckoning',
      parentChoices: ['license-roach'],
      target: 'water-rights-hearing',
      outcomes: ['found-the-water-trust', 'auction-the-water'],
    },
    {
      name: 'water-stewards',
      path: {
        'weir-1': 'build-weir',
        'weir-stone': 'net-the-run',
        'weir-reckoning': 'keep-netting',
        'moat-1': 'keep-moat-common',
        'moat-crowded': 'let-moat-run',
        'moat-reckoning': 'license-roach',
      },
      parent: 'water-rights-hearing',
      parentChoices: ['found-the-water-trust', 'auction-the-water'],
      target: 'water-stewards-strike',
      outcomes: ['pay-the-stewards', 'contract-the-patrol', 'share-the-patrol'],
    },
  ] as const

  function witness(
    seed: string,
    policy: Record<string, string>,
    target: string,
  ) {
    let save = createRun(C, {
      saveId: 'route-witness',
      name: 'Route witness',
      seed,
      rulerName: 'Mo',
      stamp: 'T0',
    })
    const rng = makeRng(seed)
    const actions: string[] = []
    for (let turn = 0; turn < 240; turn++) {
      const next = takeTurn(C, save, rng)
      save = next.save
      actions.push(`cast:${next.catch.fishSlug}`)
      if (!next.card) continue
      const card = next.card
      const preferred = policy[card.id]
      const choice = preferred
        ? (card.choices.find((c) => c.id === preferred) ??
          assert.fail(`Unknown choice ${card.id}/${preferred}`))
        : card.choices[0]!
      save = resolveChoice(save, card, choice)
      actions.push(`${card.id}:${choice.id}`)
      if (card.id === target) {
        return { seed, actions, save }
      }
      if (save.status === 'COMPLETE') break
    }
    return null
  }

  for (const family of families) {
    for (const parentChoice of family.parentChoices) {
      for (const outcome of family.outcomes) {
        const policy = {
          ...family.path,
          [family.parent]: parentChoice,
          [family.target]: outcome,
        }
        let reached: ReturnType<typeof witness> = null
        for (let i = 0; i < 48 && !reached; i++) {
          reached = witness(`legal-${family.name}-${i}`, policy, family.target)
        }
        assert.ok(
          reached,
          `No legal route: ${family.name}/${parentChoice}/${outcome}`,
        )
        assert.ok(
          reached.actions.includes(`${family.parent}:${parentChoice}`),
          'The earlier policy must have been played, not injected',
        )
        assert.equal(reached.actions.at(-1), `${family.target}:${outcome}`)
        assert.deepEqual(
          witness(reached.seed, policy, family.target),
          reached,
          'The legal cast and petition sequence must replay exactly',
        )
        assert.ok(
          !eligiblePool(reached.save, allDeckCards(C)).some(
            (card) => card.id === family.target,
          ),
          'Resolved once-only petition must retire from the deck',
        )
        console.log(
          `Legal route ${family.name}/${parentChoice}/${outcome}: ${reached.seed}, ${reached.save.turnCount} casts`,
        )
      }
    }
  }
}

// Each late labor settlement changes the available shoals and the landscape,
// regardless of whether the crown previously auctioned or restored the water.
{
  const cards = allDeckCards(C)
  const parent = cards.find((card) => card.id === 'water-rights-hearing')!
  const followup = cards.find((card) => card.id === 'water-stewards-strike')!
  assert.ok(CARD_PROMPTS[followup.id])
  for (const policy of parent.choices) {
    const base = createRun(C, {
      saveId: 'sv_stewards',
      name: 'Stewards',
      seed: 'stewards',
      rulerName: 'Mo',
      stamp: 'T0',
    })
    base.turnCount = 48
    base.kingdomHealth.nature = 80
    base.kingdomHealth.joy = 60
    base.kingdomHealth.order = 60
    assert.ok(!eligiblePool(base, cards).includes(followup))
    const previous = resolveChoice(base, parent, policy)
    assert.ok(eligiblePool(previous, cards).includes(followup))
    assert.ok(
      !eligiblePool({ ...previous, turnCount: 47 }, cards).includes(followup),
    )
    const choices = followup.choices.map((choice) =>
      resolveChoice(previous, followup, choice),
    )
    const [publicWater, privateWater, sharedWater] = choices
    assert.ok(publicWater && privateWater && sharedWater)
    assert.ok(has(publicWater, 'oathscale-minnow'))
    assert.ok(!has(publicWater, 'barebone-roach'))
    assert.ok(has(privateWater, 'barebone-roach'))
    assert.ok(!has(privateWater, 'oathscale-minnow'))
    assert.ok(!has(privateWater, 'bridgeback-sturgeon'))
    assert.ok(!has(sharedWater, 'barebone-roach'))
    assert.ok(!has(sharedWater, 'oathscale-minnow'))
    assert.equal(sharedWater.regionOverrides.near_bank, 'grassy')
    assert.equal(sharedWater.regionOverrides.far_shore, 'industrial')
    for (const save of choices) {
      assert.ok(!eligiblePool(save, cards).includes(followup))
      assert.ok(!(save.flags.publicTrust && save.flags.waterMonopoly))
    }
  }
}

// Estrangement is not automatically a reconciliation. Each decree has its
// own political cost, and only an actual blessing unlocks the family petition.
{
  const defiance = arc('child-elopes').steps.find(
    (step) => step.id === 'elope-defiance',
  )!
  const wedding = allDeckCards(C).find(
    (card) => card.id === 'wedding-reckoning',
  )!
  const paths = ['relent', 'recognize-marriage', 'stew'] as const
  for (const path of paths) {
    const save = runQuest('child-elopes', ['forbid', path])
    const reunited = path !== 'stew'
    assert.equal(Boolean(save.flags.weddingCompleted), reunited)
    assert.equal(Boolean(save.flags.blessedMatch), reunited)
    assert.equal(
      eligiblePool({ ...save, turnCount: 30 }, [wedding]).includes(wedding),
      reunited,
    )
    assert.ok(defiance.choices.find((choice) => choice.id === path)?.result)
  }
  const recalled = runQuest('child-elopes', ['forbid', 'relent'])
  const invited = runQuest('child-elopes', ['forbid', 'recognize-marriage'])
  assert.ok(invited.kingdomHealth.order < recalled.kingdomHealth.order)
  assert.ok(invited.kingdomHealth.treasury < recalled.kingdomHealth.treasury)
}

// Full ending witnesses use the same per-cast narrative seed and daily
// proclamations as the interactive store. No slider, flag, or turn injection.
{
  const policies: Record<string, Partial<Record<AxisKey, number>>> = {
    'druid-utopia': { nature: 4, joy: 3 },
    'warlock-metropolis': { prosperity: 5, treasury: 1 },
    'thistlewood-empire': { treasury: 5, prosperity: 4 },
    'fishers-peace': { joy: 4, order: -5 },
  }

  function playEnding(target: string, seed: string, roundTrip = false) {
    const weights = policies[target]!
    let save = createRun(C, {
      saveId: 'ending-witness',
      name: 'Ending witness',
      seed,
      rulerName: 'Mo',
      stamp: 'T0',
    })
    const actions: string[] = []
    const policyRng = makeRng(`${seed}:policy`)
    for (let cast = 0; cast < 240; cast++) {
      const proclamation = pendingProclamation(save)
      if (proclamation) {
        actions.push(`hear:${proclamation.event.key}`)
        save = hearProclamation(save)
      }
      const turn = takeTurn(C, save, makeRng(`${seed}:${save.turnCount}`))
      save = turn.save
      actions.push(`cast:${turn.catch.fishSlug}`)
      if (turn.card) {
        const card = turn.card
        const ranked = card.choices
          .filter((choice) => !choice.requeue)
          .map((choice) => ({
            choice,
            next: resolveChoice(save, card, choice),
            noise: policyRng.next() * 6,
          }))
          .map((option) => ({
            ...option,
            score:
              option.noise +
              Object.entries(weights).reduce(
                (sum, [axis, weight]) =>
                  sum +
                  (option.next.kingdomHealth[axis as AxisKey] -
                    save.kingdomHealth[axis as AxisKey]) *
                    weight,
                0,
              ),
          }))
          .sort((a, b) => b.score - a.score)
        const selected = ranked[0]
        assert.ok(selected, `${card.id} has a resolving choice`)
        save = selected.next
        actions.push(`choose:${card.id}:${selected.choice.id}`)
      }
      const offer = eligibleEnding(C, save)
      if (offer === target) {
        actions.push(`accept:${offer}`)
        applyEffect(save, { ending: offer })
        assert.equal(save.status, 'COMPLETE')
        assert.equal(save.endingKey, target)
        return { seed, actions, save }
      }
      if (offer) {
        actions.push(`decline:${offer}`)
        save.flags[dismissedFinaleFlag(offer)] = true
      }
      if (roundTrip) save = JSON.parse(JSON.stringify(save)) as RunSave
    }
    return null
  }

  assert.deepEqual(
    Object.keys(policies).sort(),
    C.endings.map((ending) => ending.outcomeKey).sort(),
    'Every authored ending needs a policy and a real route witness',
  )
  for (const ending of C.endings) {
    const target = ending.outcomeKey
    let witness: ReturnType<typeof playEnding> = null
    for (let i = 0; i < 96 && !witness; i++) {
      witness = playEnding(target, `ending-${target}-${i}`)
    }
    assert.ok(witness, `No legal ending witness for ${target}`)
    assert.deepEqual(
      playEnding(target, witness.seed, true),
      witness,
      'Save serialization must preserve the entire route',
    )
    console.log(
      `Ending witness ${target}: ${witness.seed}, ${witness.save.turnCount} casts`,
    )
    console.log(JSON.stringify(witness.actions))
  }
}

console.log('ruler-hooked QUESTS self-test: ALL PASS')
