import assert from 'node:assert/strict'
import {
  REPAIR_TOOLS,
  REPAIR_TOOL_LABELS,
  toolboxTool,
} from '../arcade/repairRampage/powerups'
import { REPAIR_RAMPAGE_MUSIC } from '../arcade/repairRampage/music'
import { windowSurprise } from '../arcade/repairRampage/windowSurprises'
import { parseLoop } from '../arcade/sound'

const found = new Set<string>()
for (let city = 1; city <= 25; city++) {
  for (let tower = 0; tower < 4; tower++) {
    for (let index = 0; index < 33; index++) {
      if (windowSurprise(city, tower, index) !== 'toolbox') continue
      const tool = toolboxTool(city, tower, index)
      assert.equal(tool, toolboxTool(city, tower, index))
      found.add(tool)
      assert.ok(REPAIR_TOOL_LABELS[tool].length > 4)
    }
  }
}
assert.deepEqual([...found].sort(), [...REPAIR_TOOLS].sort())
const parsed = parseLoop(REPAIR_RAMPAGE_MUSIC)
assert.ok(parsed.length >= 16)
assert.ok(parsed.notes.length > 8)
assert.ok(parsed.notes.some((note) => note.noise))
console.log('Repair Rampage: six seeded tools and an original music loop')
