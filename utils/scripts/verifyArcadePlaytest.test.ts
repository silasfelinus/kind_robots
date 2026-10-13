import assert from 'node:assert/strict'
import { levelCurve } from '../arcade/curve'
import { ARCADE_BLURB_MAX, shortArcadeBlurb } from '../arcade/games'
import { DROP_SPRITES, GLOOM_CURVES } from '../arcade/games/gloomInvaders'
import { readGamepad, readGhostTrailPad, readPinballPad } from '../arcade/input'
import { deflects, newCrasher } from '../arcade/prizeShow/roster'
import { STAGE_1_ACTS } from '../arcade/ghostTrail/acts/stage1'
import { FOES } from '../arcade/ghostTrail/foes'
import { waveCount } from '../arcade/prizeShow/season'
import { FIGHTERS } from '../zuzuShowdown/fighters'
import {
  showtimeFighter,
  SHOWDOWN_DAMAGE_SCALE,
} from '../zuzuShowdown/combatTuning'
import { fightPadSlots } from '../zuzuShowdown/input'

const pad = {
  axes: [0, 0, 0, 0],
  buttons: Array.from({ length: 16 }, (_, i) => {
    return {
      pressed: i === 0,
      touched: i === 0,
      value: i === 0 ? 1 : 0,
    }
  }),
}
const otherPad = {
  ...pad,
  buttons: pad.buttons.map((_, i) => ({
    pressed: i === 1,
    touched: i === 1,
    value: i === 1 ? 1 : 0,
  })),
}
assert.equal(readGamepad(pad).a, true)
assert.equal(readGhostTrailPad(pad).a, false)
assert.equal(readGhostTrailPad(pad).b, true)
assert.equal(readGhostTrailPad(otherPad).a, true)

const early = levelCurve(1, GLOOM_CURVES.march)
const later = levelCurve(3, GLOOM_CURVES.march)
assert.equal(early, 20)
assert.ok(later < early)

const mobWave = { at: 0, kind: 'grabber', count: 3, doors: 'far' } as const
const fixedWave = {
  at: 0,
  kind: 'tank',
  count: 1,
  doors: 'far',
  fixed: true,
} as const
assert.equal(waveCount(mobWave, 1), 6)
assert.equal(waveCount(fixedWave, 1), 1)

const tank = newCrasher('tank', 100, 100, '#aaaaaa', 0)
tank.face = Math.PI / 2
assert.equal(tank.armorHitsLeft, 4)
for (let n = 0; n < 4; n++) {
  assert.ok(deflects(tank, 0, -1))
  tank.armorHitsLeft -= 1
}
const ordinary = newCrasher('grabber', 10, 10, '#aaaaaa', 0)
assert.equal(deflects(tank, 0, -1), false)
assert.equal(deflects(ordinary, 0, -1), false)

const longBlurb = 'A robot adventure in a lively world. '.repeat(40)
const shortened = shortArcadeBlurb(longBlurb)
assert.ok(shortened.length <= ARCADE_BLURB_MAX)
assert.ok(shortened.endsWith('…'))
assert.equal(shortArcadeBlurb('Short.'), 'Short.')

assert.deepEqual(fightPadSlots([2, 4]), [2, 4])
assert.deepEqual(fightPadSlots([3]), [3, -1])
assert.deepEqual(fightPadSlots([]), [-1, -1])

const fighter = FIGHTERS[0]!
const tuned = showtimeFighter(fighter)
assert.equal(tuned.throwDamage, fighter.throwDamage * SHOWDOWN_DAMAGE_SCALE)
for (const [id, move] of Object.entries(fighter.moves)) {
  const actual = tuned.moves[id as keyof typeof tuned.moves]
  assert.equal(actual.damage, move.damage * SHOWDOWN_DAMAGE_SCALE)
  assert.equal(actual.startup, move.startup)
}
for (const [i, special] of fighter.specials.entries()) {
  const actual = tuned.specials[i]!
  assert.equal(actual.move.damage, special.move.damage * SHOWDOWN_DAMAGE_SCALE)
}
assert.equal(FIGHTERS[0]!.throwDamage, fighter.throwDamage)

const stage1 = STAGE_1_ACTS[0]!
const beginning = stage1.ledges.filter((ledge) => ledge.x < 1370)
const middle = beginning.filter((ledge) => ledge.y >= 160 && ledge.y <= 176)
const upper = beginning.filter((ledge) => ledge.y <= 140)
assert.ok(
  middle.length >= 6,
  'a continuous middle path starts before the first foe',
)
assert.ok(upper.length >= 6, 'a distinct upper path runs above the awnings')
assert.ok(
  stage1.ground.some(([start, end]) => start <= 400 && end > 400) &&
    stage1.ground.some(([start, end]) => start <= 1000 && end > 1000),
  'street-level path remains available on both sides of the first pit',
)
for (const lane of [middle, upper]) {
  const platforms = [...lane].sort((a, b) => a.x - b.x)
  for (let i = 1; i < platforms.length; i++) {
    const gap = platforms[i]!.x - (platforms[i - 1]!.x + platforms[i - 1]!.w)
    assert.ok(gap <= 30, 'each upper path has jumps within horizontal reach')
  }
}
assert.ok(FOES.hyena.hp >= 4, 'bone coyotes survive even a heavy katana hit')
assert.ok(DROP_SPRITES[0]!.width >= 7)
assert.ok(DROP_SPRITES[0]!.height >= 9)

function controller(button: number | null, axes = [0, 0, 0, 0]) {
  return {
    axes,
    buttons: Array.from({ length: 16 }, (_, i) => ({
      pressed: i === button,
      touched: i === button,
      value: i === button ? 1 : 0,
    })),
  }
}
for (const button of [4, 6, 2]) {
  const frame = readPinballPad(controller(button))
  assert.equal(frame.left, true, 'left shoulder, trigger or face X fires left')
  assert.equal(frame.right, false, 'left flipper never energizes right')
  assert.equal(
    frame.a,
    false,
    'left flipper never triggers generic both action',
  )
}
for (const button of [5, 7, 1]) {
  const frame = readPinballPad(controller(button))
  assert.equal(
    frame.right,
    true,
    'right shoulder, trigger or face B fires right',
  )
  assert.equal(frame.left, false, 'right flipper never energizes left')
}
assert.equal(readPinballPad(controller(null, [0, 0.9, 0, 0])).down, true)
assert.equal(readPinballPad(controller(null, [0, 0, 0, 0.9])).down, true)
assert.equal(readPinballPad(controller(null)).down, false)
assert.equal(readPinballPad(controller(0)).a, true, 'A launches on the plunger')

console.log('verifyArcadePlaytest: ok')
