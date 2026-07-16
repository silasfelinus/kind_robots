import assert from 'node:assert/strict'
import { makeRng, hashSeed } from '~/utils/rulerHooked/seed'
import { applyEffect, resolveChoice, cloneSave } from '~/utils/rulerHooked/applyEffects'
import { triggerHolds, effectiveWeight } from '~/utils/rulerHooked/triggers'
import { rampState, resolveScene, cycleTime, assetCandidates } from '~/utils/rulerHooked/compositor'
import { eligiblePool, weightedPick, selectCard, tickCooldowns } from '~/utils/rulerHooked/select'
import type { Card, RegionsManifest, RunSave } from '~/types/ruler-hooked'

function baseSave(): RunSave {
  return {
    schemaVersion: 3, saveId: 'sv_test', name: 'Test', dreamSlug: 'ruler-hooked',
    contentVersion: '2026.07', seed: 'mo-4820', status: 'ACTIVE',
    ruler: { name: 'Mo', honorific: 'Queen' },
    turnCount: 5, cyclePosition: 0,
    kingdomHealth: { nature: 90, prosperity: 40, treasury: 55, joy: 72, order: 48 },
    counters: { fishCaught: 3, warlockFavors: 0 },
    regionStates: {}, regionOverrides: {},
    deckState: { seenCardIds: [], activeArcs: {}, cooldowns: {}, drawBag: [] },
    inventory: { skills: [], items: [] },
    choiceLog: [], flags: {}, endingKey: null,
    createdAt: 'x', updatedAt: 'x',
  }
}

// 1. RNG determinism + resume
{
  assert.equal(hashSeed('mo'), hashSeed('mo'), 'hash stable')
  const a = makeRng('mo-4820'); const b = makeRng('mo-4820')
  const seqA = [a.next(), a.next(), a.next()]
  const seqB = [b.next(), b.next(), b.next()]
  assert.deepEqual(seqA, seqB, 'same seed -> same sequence')
  const c = makeRng('mo-4820'); c.next()
  const resumed = makeRng(0, c.state()) // resume from mid-stream state
  assert.equal(resumed.next(), a === b ? c.next() : c.next(), 'state resume continues stream')
  assert.notDeepEqual(makeRng('other').next(), seqA[0], 'different seed differs')
}

// 2. Reducer: additive + clamp, flags, override, ending, purity
{
  const s = baseSave()
  applyEffect(s, { sliders: { nature: +20, prosperity: -6 }, counters: { warlockFavors: +1 },
    flags: { set: ['metWarlock'] }, regionOverride: { far_shore: 'industrial' } })
  assert.equal(s.kingdomHealth.nature, 100, 'nature 90+20 clamps to 100')
  assert.equal(s.kingdomHealth.prosperity, 34, 'prosperity 40-6=34')
  assert.equal(s.counters.warlockFavors, 1, 'counter incremented')
  assert.equal(s.flags.metWarlock, true, 'flag set')
  assert.equal(s.regionOverrides.far_shore, 'industrial', 'region pinned')

  const before = baseSave()
  const card: Card = { id: 'warlock-druid-north', kind: 'interrupt', title: 'North Woods',
    choices: [{ id: 'develop', text: 'Build', effects: { sliders: { nature: -20 }, ending: undefined } }] }
  const after = resolveChoice(before, card, card.choices[0]!)
  assert.equal(before.kingdomHealth.nature, 90, 'input save NOT mutated (purity)')
  assert.equal(after.kingdomHealth.nature, 70, 'choice applied on clone')
  assert.equal(after.choiceLog.length, 1, 'choiceLog appended')
  assert.equal(after.choiceLog[0]!.cardId, 'warlock-druid-north')
  assert.ok(after.deckState.seenCardIds.includes('warlock-druid-north'), 'card marked seen')

  const fin = cloneSave(baseSave())
  applyEffect(fin, { ending: 'druid-utopia' })
  assert.equal(fin.status, 'COMPLETE', 'ending sets COMPLETE')
  assert.equal(fin.endingKey, 'druid-utopia')
}

// 3. Triggers
{
  const s = baseSave()
  assert.equal(triggerHolds(s, { minTurn: 3, requires: { sliders: { nature: { gte: 30 } } } }), true)
  assert.equal(triggerHolds(s, { minTurn: 99 }), false, 'minTurn gates on turnCount')
  s.flags.northWoodsSettled = true
  assert.equal(triggerHolds(s, { forbids: { flags: ['northWoodsSettled'] } }), false, 'forbids blocks')
  assert.equal(effectiveWeight(s, { weightBonus: { when: { sliders: { joy: { gte: 70 } } }, add: 4 } }, 1), 5)
}

// 4. Compositor
{
  assert.equal(rampState(0, ['wild', 'tended', 'logged', 'overbuilt']), 'wild')
  assert.equal(rampState(60, ['wild', 'tended', 'logged', 'overbuilt']), 'logged')
  assert.equal(rampState(100, ['wild', 'tended', 'logged', 'overbuilt']), 'overbuilt')
  const manifest: RegionsManifest = { regions: {
    treeline: { z: 2, driver: { slider: 'nature', ramp: ['wild', 'tended', 'logged', 'overbuilt'] }, states: [] },
    far_shore: { z: 1, states: ['pristine', 'industrial'] },
  } }
  const s = baseSave(); s.regionOverrides.far_shore = 'industrial'
  const scene = resolveScene(s, manifest)
  assert.equal(scene.regionStates.treeline, 'overbuilt', 'nature 90 -> overbuilt via ramp')
  assert.equal(scene.regionStates.far_shore, 'industrial', 'override wins over anything')
  assert.equal(cycleTime(0), 'day'); assert.equal(cycleTime(3), 'night')
  const cands = assetCandidates('treeline', 'wild', 'golden')
  assert.deepEqual(cands, [
    '/images/ruler-hooked/treeline-wild-golden.webp',
    '/images/ruler-hooked/treeline-wild-day.webp',
    '/images/ruler-hooked/treeline-wild.webp',
  ], 'golden falls back to day settle then base')
}

// 5. Selection determinism + gating
{
  const cards: Card[] = [
    { id: 'a', kind: 'interrupt', title: 'A', weight: 1, choices: [] },
    { id: 'b', kind: 'interrupt', title: 'B', weight: 3, choices: [] },
    { id: 'arc', kind: 'arc-step', title: 'Arc', choices: [] },
    { id: 'once', kind: 'ambient', title: 'Once', once: true, choices: [] },
  ]
  const s = baseSave()
  const pool = eligiblePool(s, cards)
  assert.ok(!pool.some((c) => c.kind === 'arc-step'), 'arc-step excluded from free draw')
  s.deckState.seenCardIds.push('once')
  assert.ok(!eligiblePool(s, cards).some((c) => c.id === 'once'), 'once+seen excluded')
  s.deckState.cooldowns.a = 2
  assert.ok(!eligiblePool(s, cards).some((c) => c.id === 'a'), 'cooldown excluded')
  tickCooldowns(s); assert.equal(s.deckState.cooldowns.a, 1, 'cooldown ticks down')

  // deterministic pick: same seed -> same choice
  const p1 = weightedPick(baseSave(), cards.filter((c) => c.kind === 'interrupt'), makeRng('seedX'))
  const p2 = weightedPick(baseSave(), cards.filter((c) => c.kind === 'interrupt'), makeRng('seedX'))
  assert.equal(p1?.id, p2?.id, 'weightedPick deterministic per seed')
  const s2 = baseSave()
  const r1 = selectCard(s2, cards, makeRng('t5'))
  const r2 = selectCard(s2, cards, makeRng('t5'))
  assert.equal(r1?.id ?? null, r2?.id ?? null, 'selectCard deterministic per seed (replay==reload)')
}

console.log('ruler-hooked engine self-test: ALL PASS')
