import assert from 'node:assert/strict'
import { PlumberRun } from '../arcade/games/savePlumberPreview'
import {
  PLUMBER_POWERS,
  readPlumberFile,
  readPlumberSlot,
} from '../arcade/games/savePlumberSave'
import { emptyInput, type ArcadeButton } from '../arcade/types'

const slot = {
  heroine: 7,
  stage: 0,
  node: '1-1',
  score: 100,
  lives: 3,
  tokens: 0,
}
const options = (resume?: unknown) => ({
  rng: () => 0.5,
  sound: { play() {} },
  demo: false,
  hiScore: 0,
  resume,
})
const file = {
  v: 3,
  active: 0,
  slots: [
    { ...slot, power: 'springstep', reserve: 'tidecoat' },
    { ...slot, power: 'ballast', reserve: 'sailwing' },
    null,
  ],
  endlessBest: 0,
}

function press(run: PlumberRun, button: ArcadeButton) {
  const input = emptyInput()
  input.pressed[button] = true
  run.update(input)
}

function continueFile(resume: unknown, next = false) {
  const run = new PlumberRun(options(resume))
  press(run, 'start')
  if (next) press(run, 'down')
  press(run, 'a')
  assert.equal(run.mode, 'map')
  return run
}

for (const power of PLUMBER_POWERS) {
  const decoded = readPlumberSlot({ ...slot, power, reserve: power })!
  assert.equal(decoded.power, power)
  assert.equal(decoded.reserve, power)
}
const old = readPlumberSlot(slot)!
assert.equal(old.power, undefined)
assert.equal(old.reserve, undefined)
const invalid = readPlumberSlot({
  ...slot,
  power: 'unknown-power',
  reserve: { kind: 'tidecoat' },
})!
assert.equal(invalid.power, undefined)
assert.equal(invalid.reserve, undefined)

const run = continueFile(file)
assert.equal(run.power, 'springstep')
assert.equal(run.reserve, 'tidecoat')
press(run, 'y')
assert.equal(run.power, 'tidecoat')
assert.equal(run.reserve, 'springstep')
const saved = readPlumberFile(run.save)
assert.equal(saved.slots[0]!.power, 'tidecoat')
assert.equal(saved.slots[0]!.reserve, 'springstep')
assert.equal(saved.slots[1]!.power, 'ballast')
assert.equal(saved.slots[1]!.reserve, 'sailwing')

const restored = continueFile(JSON.parse(JSON.stringify(saved)))
assert.equal(restored.power, 'tidecoat')
assert.equal(restored.reserve, 'springstep')
press(restored, 'y')
assert.equal(restored.power, 'springstep')
assert.equal(restored.reserve, 'tidecoat')
press(restored, 'a')
assert.equal(restored.mode, 'intro')
press(restored, 'a')
assert.equal(restored.mode, 'play')
assert.equal(restored.power, 'springstep')
assert.equal(restored.reserve, 'tidecoat')

const second = continueFile(saved, true)
assert.equal(second.power, 'ballast')
assert.equal(second.reserve, 'sailwing')
const spareOnly = continueFile({
  ...file,
  slots: [{ ...slot, reserve: 'tidecoat' }, null, null],
})
press(spareOnly, 'y')
assert.equal(spareOnly.power, 'tidecoat')
assert.equal(spareOnly.reserve, null)
press(spareOnly, 'y')
assert.equal(spareOnly.power, 'tidecoat')
assert.equal(spareOnly.reserve, null)
assert.equal(readPlumberFile(spareOnly.save).slots[0]!.reserve, undefined)

const fresh = new PlumberRun(options(file))
press(fresh, 'start')
press(fresh, 'down')
press(fresh, 'down')
press(fresh, 'a')
assert.equal(fresh.mode, 'select')
press(fresh, 'a')
press(fresh, 'a')
press(fresh, 'start')
assert.equal(fresh.mode, 'map')
assert.equal(fresh.power, null)
assert.equal(fresh.reserve, null)
assert.equal(readPlumberFile(fresh.save).slots[0]!.power, 'springstep')

const endless = new PlumberRun(options(file), { endless: true })
assert.equal(endless.power, null)
assert.equal(endless.reserve, null)
assert.equal(readPlumberFile(endless.save).slots[0]!.power, 'springstep')
const demo = new PlumberRun(options(file), { autopilot: true, stage: 0 })
assert.equal(demo.power, null)
assert.equal(demo.reserve, null)

console.log('Save the Plumber map inventory: OK')
