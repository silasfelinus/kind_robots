import assert from 'node:assert/strict'
import {
  WINDOW_SURPRISE_REWARDS,
  windowSurprise,
} from '../arcade/repairRampage/windowSurprises'

const kinds = new Set<string>()
for (let city = 1; city <= 25; city++) {
  let rewards = 0
  for (let tower = 0; tower < 4; tower++) {
    for (let index = 0; index < 33; index++) {
      const surprise = windowSurprise(city, tower, index)
      assert.equal(surprise, windowSurprise(city, tower, index))
      if (!surprise) continue
      kinds.add(surprise)
      rewards++
      const reward = WINDOW_SURPRISE_REWARDS[surprise]
      assert.ok(reward.charge > 0)
      assert.ok(reward.points > 0)
      assert.ok(reward.label.length > 0)
    }
  }
  assert.ok(rewards > 0, `Town ${city} has no window surprises`)
}
assert.deepEqual([...kinds].sort(), ['cake', 'snack', 'toolbox'])
console.log('Repair Rampage: deterministic window surprises across 25 towns')
