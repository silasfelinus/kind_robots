// utils/rulerHooked/game.selftest.ts
//
// Headless behavioral test of the whole game loop (content + newGame + loop +
// save), run via `npx tsx`. Proves the core PoC criteria plus the first full-game
// fishing slice: real deterministic catches, persistent Fishopedia, region
// recomposition, narrative arcs, and multi-slot save/load.

import assert from 'node:assert/strict'
import { RULER_HOOKED_CONTENT as C } from '~/utils/rulerHooked/content'
import { createRun } from '~/utils/rulerHooked/newGame'
import { takeTurn, eligibleEnding, findArcStep } from '~/utils/rulerHooked/loop'
import { resolveChoice } from '~/utils/rulerHooked/applyEffects'
import { resolveScene } from '~/utils/rulerHooked/compositor'
import { makeRng } from '~/utils/rulerHooked/seed'
import {
  loadIndex, loadSave, writeSave, renameSlot, deleteSlot, makeSaveId,
} from '~/utils/rulerHooked/save'
import type { RunSave } from '~/types/ruler-hooked'

// --- localStorage shim for node -------------------------------------------
const backingStore = new Map<string, string>()
{
  ;(globalThis as unknown as { window: unknown }).window = {
    localStorage: {
      getItem: (k: string) => (backingStore.has(k) ? backingStore.get(k)! : null),
      setItem: (k: string, v: string) => void backingStore.set(k, v),
      removeItem: (k: string) => void backingStore.delete(k),
    },
  }
}

const fresh = (id = 'sv_a'): RunSave =>
  createRun(C, { saveId: id, name: 'Test Reign', seed: 'mo-4820', rulerName: 'Mo', honorific: 'Queen', stamp: 'T0' })

// 1. New game is well-formed and ready to catalogue fish
{
  const s = fresh()
  assert.equal(s.turnCount, 0)
  assert.equal(s.status, 'ACTIVE')
  assert.equal(s.schemaVersion, 4)
  assert.equal(s.kingdomHealth.nature, 50)
  assert.equal(s.contentVersion, C.contentVersion)
  assert.deepEqual(s.fishopedia, {})
}

// 2. Turn loop is deterministic, advances turnCount, and lands a real species
{
  const a = takeTurn(C, fresh(), makeRng('run-1'))
  const b = takeTurn(C, fresh(), makeRng('run-1'))
  assert.equal(a.save.turnCount, 1)
  assert.equal(a.card?.id ?? null, b.card?.id ?? null, 'same seed -> same card outcome')
  assert.deepEqual(a.catch, b.catch, 'same seed -> same fish specimen')
  assert.equal(a.catch.fishSlug, 'parlour-rustfish', 'neutral starting lake has its baseline species')
  assert.equal(a.save.counters.fishCaught, 1, 'a cast lands one fish')
  assert.equal(a.save.fishopedia['parlour-rustfish']?.countCaught, 1, 'catch persists to Fishopedia')
}

// 2b. Fish randomness is isolated from the narrative draw stream
{
  const a = fresh('sv_rng_a')
  const b = fresh('sv_rng_b')
  a.seed = 'fish-world-alpha'
  b.seed = 'fish-world-beta'
  const turnA = takeTurn(C, a, makeRng('same-narrative-stream'))
  const turnB = takeTurn(C, b, makeRng('same-narrative-stream'))
  assert.equal(
    turnA.card?.id ?? null,
    turnB.card?.id ?? null,
    'changing the fish RNG seed cannot change the kingdom card draw',
  )
}

// 3. The warlock/druid choice recomposites regions (exit criterion 2)
{
  const card = C.decks[0]!.cards.find((c) => c.id === 'warlock-druid-north')!
  const before = fresh()
  const beforeScene = resolveScene(before, C.regions)
  const develop = card.choices.find((c) => c.id === 'develop')!
  const after = resolveChoice(before, card, develop)
  const afterScene = resolveScene(after, C.regions)
  assert.equal(afterScene.regionStates.far_shore, 'industrial', 'develop pins far_shore industrial')
  assert.notEqual(afterScene.regionStates.treeline, beforeScene.regionStates.treeline, 'lower nature shifts treeline state')
  assert.ok(after.inventory.items.some((r) => r.slug === 'buildpermit-scroll'), 'reward granted')
  const preserved = resolveChoice(fresh(), card, card.choices.find((c) => c.id === 'preserve')!)
  assert.equal(resolveScene(preserved, C.regions).regionStates.far_shore, 'pristine', 'preserve pins far_shore pristine')
}

// 4. The heir-elopes arc runs end to end (exit criterion 3)
{
  let s = fresh()
  s.turnCount = 4
  s.deckState.activeArcs['child-elopes'] = { step: 'elope-1', flags: {} }
  const step1 = findArcStep(C, 'elope-1')!.card
  s = resolveChoice(s, step1, step1.choices.find((c) => c.id === 'bless')!)
  assert.equal(s.deckState.activeArcs['child-elopes']!.step, 'elope-blessing', 'bless advances to blessing branch')
  const step2 = findArcStep(C, 'elope-blessing')!.card
  s = resolveChoice(s, step2, step2.choices[0]!)
  assert.ok(!s.deckState.activeArcs['child-elopes'], 'welcome completes (removes) the arc')
  assert.ok(s.choiceLog.length === 2, 'both arc steps logged')
}

// 5. Endings are reachable (not forced)
{
  const s = fresh()
  assert.equal(eligibleEnding(C, s), null, 'no ending at neutral start')
  s.kingdomHealth.nature = 90
  s.kingdomHealth.joy = 70
  assert.equal(eligibleEnding(C, s), 'druid-utopia', 'nature+joy high -> utopia ending offered')
}

// 6. Multi-slot save/load (exit criterion 4)
{
  const idA = makeSaveId('T0', 'a')
  const idB = makeSaveId('T0', 'b')
  assert.notEqual(idA, idB, 'distinct save ids')
  const a = createRun(C, { saveId: idA, name: 'Reign A', seed: 's', rulerName: 'Mo', stamp: 'T0' })
  const b = createRun(C, { saveId: idB, name: 'Reign B', seed: 's', rulerName: 'Bo', stamp: 'T0' })
  a.turnCount = 7
  writeSave(a, 'T1')
  writeSave(b, 'T2')
  let idx = loadIndex()
  assert.equal(idx.slots.length, 2, 'two slots')
  assert.equal(idx.activeSaveId, idB, 'last write is active')
  const reloaded = loadSave(idA)
  assert.equal(reloaded?.turnCount, 7, 'slot A round-trips its state')
  renameSlot(idA, 'Mo the Lazy')
  assert.equal(loadIndex().slots.find((s) => s.saveId === idA)?.name, 'Mo the Lazy', 'rename persists')
  deleteSlot(idB)
  idx = loadIndex()
  assert.equal(idx.slots.length, 1, 'delete removes a slot')
  assert.equal(idx.activeSaveId, idA, 'active falls back after deleting the active slot')
}

// 7. A pre-Fishopedia schema-3 slot migrates rather than being discarded
{
  type LegacyRunSave = Omit<RunSave, 'fishopedia'> & { fishopedia?: RunSave['fishopedia'] }
  const old = fresh('sv_old') as LegacyRunSave
  old.schemaVersion = 3
  delete old.fishopedia
  backingStore.set('rulerHooked:save:sv_old', JSON.stringify(old))
  const migrated = loadSave('sv_old')
  assert.equal(migrated?.schemaVersion, 4, 'legacy slot is promoted to schema 4')
  assert.deepEqual(migrated?.fishopedia, {}, 'legacy slot receives an empty Fishopedia')
}

console.log('ruler-hooked GAME self-test: ALL PASS')
