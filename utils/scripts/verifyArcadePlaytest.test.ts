import assert from 'node:assert/strict'
import { levelCurve } from '../arcade/curve'
import { ARCADE_BLURB_MAX, shortArcadeBlurb } from '../arcade/games'
import { GLOOM_CURVES } from '../arcade/games/gloomInvaders'
import { readGamepad, readGhostTrailPad } from '../arcade/input'
import { deflects, newCrasher } from '../arcade/prizeShow/roster'
import { waveCount } from '../arcade/prizeShow/season'
import { FIGHTERS } from '../zuzuShowdown/fighters'
import { showtimeFighter, SHOWDOWN_DAMAGE_SCALE } from '../zuzuShowdown/combatTuning'
import { fightPadSlots } from '../zuzuShowdown/input'

const pad = {
  buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: i === 0, touched: i === 0, value: i === 0 ? 1 : 0 })),
  axes: [0, 0, 0, 0],
}
assert.equal(readGamepad(pad).a, true)
assert.equal(readGhostTrailPad(pad).a, false)
assert.equal(readGhostTrailPad(pad).b, true)
assert.equal(readGhostTrailPad({ ...pad, buttons: pad.buttons.map((_, i) => ({ pressed: i === 1, touched: i === 1, value: i === 1 ? 1 : 0 })) }).a, true)

assert.equal(levelCurve(1, GLOOM_CURVES.march), 20)
assert.ok(levelCurve(3, GLOOM_CURVES.march) < levelCurve(1, GLOOM_CURVES.march))
assert.equal(waveCount({ at: 0, kind: 'grabber', count: 3, doors: 'far' }, 1), 6)
assert.equal(waveCount({ at: 0, kind: 'tank', count: 1, doors: 'far', fixed: true }, 1), 1)

const tank = newCrasher('tank', 100, 100, '#aaaaaa', 0)
tank.face = Math.PI / 2
assert.equal(tank.armorHitsLeft, 4)
for (let n = 0; n < 4; n++) {
  assert.ok(deflects(tank, 0, -1))
  tank.armorHitsLeft -= 1
}
assert.equal(deflects(tank, 0, -1), false)
assert.equal(deflects(newCrasher('grabber', 10, 10, '#aaaaaa', 0), 0, -1), false)

const longBlurb = 'A robot adventure in a lively world. '.repeat(40)
assert.ok(shortArcadeBlurb(longBlurb).length <= ARCADE_BLURB_MAX)
assert.ok(shortArcadeBlurb(longBlurb).endsWith('…'))
assert.equal(shortArcadeBlurb('Short.'), 'Short.')

assert.deepEqual(fightPadSlots([2, 4]), [2, 4])
assert.deepEqual(fightPadSlots([3]), [3, -1])
assert.deepEqual(fightPadSlots([]), [-1, -1])

const fighter = FIGHTERS[0]!
const tuned = showtimeFighter(fighter)
assert.equal(tuned.throwDamage, fighter.throwDamage * SHOWDOWN_DAMAGE_SCALE)
for (const [id, move] of Object.entries(fighter.moves)) {
  assert.equal(tuned.moves[id as keyof typeof tuned.moves].damage, move.damage * SHOWDOWN_DAMAGE_SCALE)
  assert.equal(tuned.moves[id as keyof typeof tuned.moves].startup, move.startup)
}
for (const [i, special] of fighter.specials.entries()) {
  assert.equal(tuned.specials[i]!.move.damage, special.move.damage * SHOWDOWN_DAMAGE_SCALE)
}
assert.equal(FIGHTERS[0]!.throwDamage, fighter.throwDamage, 'the canonical kit is unchanged')
console.log('verifyArcadePlaytest: ok')
