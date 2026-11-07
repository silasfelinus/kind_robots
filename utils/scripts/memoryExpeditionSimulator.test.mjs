import assert from 'node:assert/strict'
import test from 'node:test'
import { createExpedition, resolveExpeditionRoom } from './memoryExpeditionSimulator.mjs'

test('three floors have stable unique room identities and varied encounter budgets', () => {
  for (const seed of [0, 1, 42, 65535, 0xffffffff]) {
    const run = createExpedition(seed)
    assert.deepEqual(createExpedition(seed), run)
    assert.equal(run.floors.length, 3)
    const ids = run.floors.flatMap((floor) => floor.rooms.map((room) => room.id))
    assert.equal(new Set(ids).size, 18)
    for (const floor of run.floors) {
      assert.equal(floor.rooms.length, 6)
      assert.equal(new Set(floor.rooms.map((room) => room.kind)).size, 6)
    }
  }
})

test('room resolution is immutable, idempotent, and survives JSON save restoration', () => {
  const start = createExpedition(42)
  const once = resolveExpeditionRoom(start, 'f1-r1', 'spared')
  const restored = JSON.parse(JSON.stringify(once))
  const twice = resolveExpeditionRoom(restored, 'f1-r1', 'looted')
  assert.deepEqual(twice, restored)
  assert.equal(twice.events.length, 1)
  assert.equal(twice.floors[0].rooms[0].outcome, 'spared')
  assert.equal(start.events.length, 0)
  assert.equal(start.floors[0].rooms[0].status, 'unvisited')
})

test('forged room and invalid outcome never consume a room', () => {
  const run = createExpedition(42)
  for (const roomId of ['f0-r1', 'f4-r1', '__proto__']) {
    assert.throws(() => resolveExpeditionRoom(run, roomId, 'spared'))
  }
  for (const outcome of ['', 'Spared!', '__proto__', 7]) {
    assert.throws(() => resolveExpeditionRoom(run, 'f1-r1', outcome))
  }
  assert.equal(run.events.length, 0)
})

test('reject invalid seeds and incompatible save versions', () => {
  for (const seed of [-1, 1.5, Infinity, 0x100000000]) {
    assert.throws(() => createExpedition(seed))
  }
  assert.throws(() => resolveExpeditionRoom({ ...createExpedition(1), version: 2 }, 'f1-r1', 'spared'))
})
