import assert from 'node:assert/strict'
import {
  HOUSE_ENTRY,
  houseExits,
  newHouseProgress,
  restoreHouseProgress,
  type HouseRoomId,
} from '../memoryDungeon/house'

const shortcuts = {
  ...newHouseProgress(),
  decisions: { 'HD-10': 'manifest', 'HD-26': 'testify' },
  visited: ['HD-01', 'HD-10', 'HD-25', 'HD-26', 'HD-34'] as HouseRoomId[],
}

assert.ok(houseExits('HD-10', shortcuts).includes('HD-25'))
assert.ok(houseExits('HD-26', shortcuts).includes('HD-34'))
assert.ok(!houseExits('HD-34', shortcuts).includes('HD-35'))

const resolved = {
  ...shortcuts,
  visited: [...shortcuts.visited, 'HD-32'] as HouseRoomId[],
  wardenPassed: true,
}
assert.ok(houseExits('HD-34', resolved).includes('HD-35'))

const forged = restoreHouseProgress({
  ...shortcuts,
  current: 'HD-35',
  visited: [...shortcuts.visited, 'HD-35', 'HD-36'],
  decisions: { ...shortcuts.decisions, 'HD-35': 'release' },
  ending: 'release',
  chimeClaimed: true,
})
assert.ok(forged)
assert.equal(forged!.current, HOUSE_ENTRY)
assert.ok(!forged!.visited.includes('HD-35'))
assert.ok(!forged!.visited.includes('HD-36'))
assert.equal(forged!.ending, null)
assert.equal(forged!.chimeClaimed, false)

const legitimate = restoreHouseProgress({
  ...resolved,
  current: 'HD-35',
  visited: [...resolved.visited, 'HD-33', 'HD-35'],
  decisions: { ...resolved.decisions, 'HD-35': 'renew' },
  ending: 'renew',
})
assert.ok(legitimate)
assert.equal(legitimate!.current, 'HD-35')
assert.equal(legitimate!.ending, 'renew')
assert.equal(legitimate!.wardenPassed, true)
