// utils/rulerHooked/game.selftest.ts
//
// Headless behavioral test of the whole game loop (content + newGame + loop +
// save), run via `npx tsx`. Proves the four DESIGN-BRIEF m2 exit criteria hold at
// the logic layer, independent of the Vue UI: playable fish→card→choice loop;
// regions recomposite in response to choices; the heir-elopes arc runs end to end;
// multi-slot save/load. A tiny localStorage shim lets the SaveStore run in node.

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
{
  const store = new Map<string, string>()
  ;(globalThis as unknown as { window: unknown }).window = {
    localStorage: {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  }
}

const fresh = (id = 'sv_a'): RunSave =>
  createRun(C, { saveId: id, name: 'Test Reign', seed: 'mo-4820', rulerName: 'Mo', honorific: 'Queen', stamp: 'T0' })

// 1. New game is well-formed
{
  const s = fresh()
  assert.equal(s.turnCount, 0)
  assert.equal(s.status, 'ACTIVE')
  assert.equal(s.kingdomHealth.nature, 50)
  assert.equal(s.contentVersion, C.contentVersion)
}

// 2. Turn loop is deterministic and advances turnCount
{
  const a = takeTurn(C, fresh(), makeRng('run-1'))
  const b = takeTurn(C, fresh(), makeRng('run-1'))
  assert.equal(a.save.turnCount, 1)
  assert.equal(a.card?.id ?? null, b.card?.id ?? null, 'same seed -> same turn outcome')
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
  // preserve is the opposite pole
  const preserved = resolveChoice(fresh(), card, card.choices.find((c) => c.id === 'preserve')!)
  assert.equal(resolveScene(preserved, C.regions).regionStates.far_shore, 'pristine', 'preserve pins far_shore pristine')
}

// 4. The heir-elopes arc runs end to end (exit criterion 3)
{
  // Force the arc active at its first step, then walk it via choices.
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

console.log('ruler-hooked GAME self-test: ALL PASS')
