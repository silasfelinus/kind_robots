// utils/rulerHooked/incidents.selftest.ts
//
// The fifteen kingdom incidents added for ruler-hooked/t-052. Each one is
// reached through real choices from a fresh reign (no hand-set flags), stays
// locked until those choices are made, and every one of its choices resolves.
// Selection stays deterministic for a seed.

import assert from 'node:assert/strict'
import { RULER_HOOKED_CONTENT as C } from '~/utils/rulerHooked/content'
import { createRun } from '~/utils/rulerHooked/newGame'
import { resolveChoice } from '~/utils/rulerHooked/applyEffects'
import { eligiblePool } from '~/utils/rulerHooked/select'
import { allDeckCards, findArcStep, takeTurn } from '~/utils/rulerHooked/loop'
import { makeRng } from '~/utils/rulerHooked/seed'
import { CARD_PROMPTS } from '~/utils/rulerHooked/artPrompts'
import type { Card, RunSave } from '~/types/ruler-hooked'

const deck = allDeckCards(C)
const card = (id: string): Card =>
  deck.find((c) => c.id === id) ??
  findArcStep(C, id)?.card ??
  assert.fail(`no card ${id}`)

const fresh = (): RunSave =>
  createRun(C, {
    saveId: 'sv_inc',
    name: 'Incidents',
    seed: 'inc-1',
    rulerName: 'Mo',
    honorific: 'Queen',
    stamp: 'T0',
  })

function play(turn: number, path: [string, string][]): RunSave {
  let save = fresh()
  save.turnCount = turn
  for (const [cardId, choiceId] of path) {
    const c = card(cardId)
    const choice =
      c.choices.find((x) => x.id === choiceId) ??
      assert.fail(`${cardId} has no ${choiceId}`)
    save = resolveChoice(save, c, choice)
  }
  return save
}

const eligible = (save: RunSave, id: string) =>
  eligiblePool(save, deck).some((c) => c.id === id)

const WITNESS: Record<string, { turn: number; path: [string, string][] }> = {
  'vex-model-village': { turn: 8, path: [['warlock-druid-north', 'develop']] },
  'sela-tree-sit': {
    turn: 9,
    path: [
      ['warlock-druid-north', 'develop'],
      ['vex-model-village', 'approve-terraces'],
    ],
  },
  'lake-watch': { turn: 7, path: [] },
  'brack-lures': { turn: 9, path: [['smuggler-dock', 'allow-smuggling']] },
  'brack-trial': {
    turn: 10,
    path: [
      ['smuggler-dock', 'allow-smuggling'],
      ['brack-lures', 'tip-cordelia'],
    ],
  },
  'thistle-fish-exports': {
    turn: 12,
    path: [
      ['envoy-1', 'negotiate-generous'],
      ['envoy-generous', 'sign-generous'],
    ],
  },
  'fish-tithe': { turn: 6, path: [['tax-season', 'raise-taxes']] },
  'fen-satire': {
    turn: 6,
    path: [
      ['tax-season', 'raise-taxes'],
      ['elope-1', 'forbid'],
    ],
  },
  'mossy-price': {
    turn: 8,
    path: [
      ['bog-1', 'accept-hex'],
      ['bog-accept', 'complete-accept'],
    ],
  },
  'public-dock': { turn: 6, path: [['elope-1', 'bless']] },
  'vex-sela-truce': {
    turn: 12,
    path: [
      ['warlock-druid-north', 'develop'],
      ['vex-model-village', 'approve-terraces'],
      ['sela-tree-sit', 'halt-building'],
    ],
  },
  'quill-day-off': { turn: 15, path: [] },
  'nix-old-name': { turn: 12, path: [['nix-riddle', 'answer-honestly']] },
  'drowned-surface': { turn: 8, path: [['warlock-druid-north', 'develop']] },
  'heron-delegation': { turn: 5, path: [['warlock-druid-north', 'preserve']] },
}

assert.equal(Object.keys(WITNESS).length, 15)
for (const [id, { turn, path }] of Object.entries(WITNESS)) {
  const c = card(id)
  assert.ok(c.art && CARD_PROMPTS[id], `${id} has art and a prompt`)
  assert.ok(c.choices.length >= 2, `${id} offers a real choice`)
  assert.ok(!eligible(fresh(), id), `${id} is locked at the start of a reign`)
  if (path.length)
    assert.ok(!eligible(play(turn, []), id), `${id} needs its witness choices`)
  const ready = play(turn, path)
  assert.ok(eligible(ready, id), `${id} is reachable through real choices`)
  for (const choice of c.choices) {
    const after = resolveChoice(ready, c, choice)
    assert.ok(after.deckState.seenCardIds.includes(id))
    assert.ok(choice.result?.trim(), `${id}/${choice.id} has result text`)
    if (c.once) assert.ok(!eligible(after, id), `${id} fires once`)
  }
}

// Faction consequences carry through: the terraces overbuild the treeline, the
// last oak only matters once they exist, and the joint venture needs both sides.
{
  const built = play(9, [
    ['warlock-druid-north', 'develop'],
    ['vex-model-village', 'approve-terraces'],
  ])
  assert.equal(built.regionOverrides.treeline, 'overbuilt')
  const boutique = play(9, [
    ['warlock-druid-north', 'develop'],
    ['vex-model-village', 'orchard-terraces'],
  ])
  assert.ok(
    !eligible(boutique, 'sela-tree-sit'),
    'the tree-sit follows only the full build',
  )
  const onlyVex = play(12, [['warlock-druid-north', 'develop']])
  assert.ok(
    !eligible(onlyVex, 'vex-sela-truce'),
    'the joint venture needs a favour from each side',
  )
  const pearl = resolveChoice(
    play(12, [['nix-riddle', 'answer-honestly']]),
    card('nix-old-name'),
    card('nix-old-name').choices[0]!,
  )
  assert.ok(
    pearl.inventory.items.some((r) => r.slug === 'nix-pearl'),
    'restoring the name grants Nix’s Pearl',
  )
}

// Determinism: the same seed and the same policy produce the same reign.
function reign(seed: string): string[] {
  let save = createRun(C, {
    saveId: 'sv_d',
    name: 'D',
    seed,
    rulerName: 'Mo',
    honorific: 'Queen',
    stamp: 'T0',
  })
  const rng = makeRng(seed)
  const drawn: string[] = []
  for (let i = 0; i < 60; i++) {
    const turn = takeTurn(C, save, rng, 0.9)
    save = turn.save
    if (!turn.card) continue
    drawn.push(turn.card.id)
    save = resolveChoice(save, turn.card, turn.card.choices[0]!)
  }
  return drawn
}
assert.deepEqual(reign('inc-seed-7'), reign('inc-seed-7'))
const seen = new Set(
  ['inc-seed-1', 'inc-seed-2', 'inc-seed-3', 'inc-seed-4'].flatMap(reign),
)
const drawnNew = Object.keys(WITNESS).filter((id) => seen.has(id))
assert.ok(
  drawnNew.length >= 5,
  `seeded reigns draw the new incidents (${drawnNew.join(', ')})`,
)

console.log(
  `ruler-hooked INCIDENTS self-test: ALL PASS (${drawnNew.length}/15 drawn in four seeded reigns)`,
)
