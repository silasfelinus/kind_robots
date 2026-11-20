import assert from 'node:assert/strict'
import {
  rainbowSeaLogbook,
  type RainbowSave,
} from '../arcade/games/rainbowLoadouts'

// The Seas gallery must not invent medals or unlock unexplored Acts.
const empty = rainbowSeaLogbook(null, [])
assert.equal(empty.length, 8)
assert.equal(empty[0]?.label, 'DISCOVERED')
assert.equal(empty[1]?.label, 'UNDISCOVERED')
assert.equal(empty.filter((sea) => sea.explored).length, 1)

const save = {
  checkpoint: { act: 4 },
  medals: { 1: 'gold', 2: 'silver', 3: 'bronze' },
} as RainbowSave
const progress = rainbowSeaLogbook(save, [])
assert.deepEqual(
  progress.map((sea) => sea.label),
  [
    'GOLD MEDAL',
    'SILVER MEDAL',
    'BRONZE MEDAL',
    'IN FLIGHT',
    'UNDISCOVERED',
    'UNDISCOVERED',
    'UNDISCOVERED',
    'UNDISCOVERED',
  ],
)
assert.equal(rainbowSeaLogbook(null, ['first-light'])[1]?.explored, true)
assert.equal(rainbowSeaLogbook(null, ['first-light'])[2]?.explored, false)
console.log('rainbow seas logbook: ok (locked Acts, medals, and current flight)')
