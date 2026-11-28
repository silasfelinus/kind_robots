import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import brickBloom from '../arcade/games/brickBloom'
import { CONSERVATORY, CONSERVATORY_INDEX, HOUSES, houseProblems, houseWall, mirrorWall, nextTourPos } from '../arcade/brickBloom/houses'
import { freshSave, readBloomSave, resumable } from '../arcade/brickBloom/bench'
import type { BloomSave } from '../arcade/brickBloom/bench'
import { bossOf, spawnBoss, stepBoss, openBoss, hitBoss, thornWidth } from '../arcade/brickBloom/bosses'
import { emptyInput } from '../arcade/types'
assert.deepEqual(houseProblems(CONSERVATORY), [])
assert.equal(HOUSES.length, 5)
assert.equal(bossOf(CONSERVATORY_INDEX), 'thorn')
for (let mask = 0; mask < 16; mask++) {
  let pos = { house: CONSERVATORY_INDEX, wall: CONSERVATORY.start }
  for (let i = 0; i < 4; i++) pos = nextTourPos(pos, ((mask >> i) & 1) as 0 | 1)!
  assert.equal(houseWall(CONSERVATORY, pos.wall)?.vents, 'boss')
}
const wall = CONSERVATORY.walls[0]!
assert.deepEqual(mirrorWall(mirrorWall(wall)), wall)
const gold = HOUSES.map(h => h.id)
const legacy = { ...freshSave(gold), house: HOUSES.length, stage: 31 }
assert.equal(readBloomSave(legacy)?.champion, true)
assert.equal(resumable(readBloomSave(legacy)), false)
assert.equal(readBloomSave({ ...legacy, golden: [], secret: true }), null)
assert.equal(resumable(readBloomSave({ ...legacy, secret: true })), true)
const thorn = spawnBoss('thorn')
assert.equal(hitBoss(thorn), 'shielded')
const startX = thorn.x
stepBoss(thorn, 20, mulberry32(1))
assert.ok(thorn.x < startX)
openBoss(thorn)
assert.equal(thorn.phase, 2)
assert.equal(thornWidth(thorn), 36)
for (let n = 0; n < 7; n++) { thorn.hurt = 0; hitBoss(thorn) }
assert.ok(thorn.defeated)
type Probe = {
  save: BloomSave
  credits: string | null
  tourMenu: boolean
  tourChoices: string[]
  tour: { house: number; wall: string } | null
  secondBloom: boolean
  bed: number[]
  speed: number
  boss: ReturnType<typeof spawnBoss> | null
  startTour(second: boolean, secret?: boolean): void
  startBoss(stage: number, house: number): void
  afterClear(): void
  update(input: ReturnType<typeof emptyInput>): void
}
const make = (resume?: BloomSave) => brickBloom.create({
  rng: mulberry32(7), sound: { play: () => {} }, demo: false, hiScore: 0, resume, selectScreen: true,
}) as unknown as Probe
const locked = make()
locked.startTour(false, true)
assert.equal(locked.tour?.house, 0)
const game = make(legacy)
assert.ok(game.tourChoices.includes('secret') && game.tourChoices.includes('second'))
game.startTour(true)
assert.equal(game.secondBloom, true)
assert.ok(game.bed.every(v => v === 0))
assert.ok(game.speed > make().speed)
game.startTour(false, true)
assert.equal(game.tour?.house, CONSERVATORY_INDEX)
assert.equal(game.save.secret, true)
assert.ok(resumable(readBloomSave(game.save)))
game.startBoss(36, CONSERVATORY_INDEX)
assert.equal(game.boss?.id, 'thorn')
game.boss!.defeated = true
game.afterClear()
assert.equal(game.credits, 'true')
assert.equal(game.save.trueChampion, true)
assert.equal(game.save.secret, undefined)
assert.equal(resumable(readBloomSave(game.save)), false)
const press = emptyInput()
press.pressed.a = true
game.update(press)
assert.equal(game.tourMenu, true)
console.log('Brick Bloom Conservatory, Thorn, endings and Second Bloom: ok')
