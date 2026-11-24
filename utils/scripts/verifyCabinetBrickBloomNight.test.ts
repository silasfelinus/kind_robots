import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import {
  BOSS_SPECS,
  bossOf,
  gloomOpen,
  guardPhase,
  hitBoss,
  openBoss,
  spawnBoss,
  stepBoss,
} from '../arcade/brickBloom/bosses'
import {
  NIGHT_BLOOM,
  houseProblems,
  houseWall,
  houseKinds,
  nextTourPos,
} from '../arcade/brickBloom/houses'
import { GOLDEN_TOTAL, VAULTS, freshSave, readBloomSave } from '../arcade/brickBloom/bench'
import { richRoute } from '../arcade/brickBloom/map'
import brickBloom from '../arcade/games/brickBloom'
import { emptyInput } from '../arcade/types'

assert.deepEqual(houseProblems(NIGHT_BLOOM), [])
assert.equal(NIGHT_BLOOM.walls.length, 9)
assert.ok(houseKinds(NIGHT_BLOOM).has('lantern'))
assert.ok(houseKinds(NIGHT_BLOOM).has('glow'))
const vault = VAULTS[NIGHT_BLOOM.id]!
assert.ok(richRoute(NIGHT_BLOOM).includes(vault.wall))
assert.notEqual(houseWall(NIGHT_BLOOM, vault.wall)!.rows[vault.row]![vault.col], '.')
assert.equal(GOLDEN_TOTAL, 5)
assert.equal(bossOf(4), 'gloom-bloom')
assert.equal(BOSS_SPECS['gloom-bloom'].cells.filter((c) => c.guard).length, 4)
const saved = { ...freshSave(['night-bloom']), house: 4, stage: 25 }
assert.deepEqual(readBloomSave(saved), saved)

for (let mask = 0; mask < 16; mask++) {
  let pos = { house: 4, wall: NIGHT_BLOOM.start }
  for (let i = 0; i < 4; i++) {
    pos = nextTourPos(pos, ((mask >> i) & 1) as 0 | 1)!
    assert.equal(pos.house, 4)
  }
  assert.equal(houseWall(NIGHT_BLOOM, pos.wall)!.vents, 'boss')
}

{
  const b = spawnBoss('gloom-bloom')
  const rng = mulberry32(12)
  assert.ok(guardPhase(b))
  assert.equal(hitBoss(b), 'shielded')
  openBoss(b)
  assert.equal(b.phase, 2)
  assert.equal(gloomOpen(b), false)
  assert.equal(hitBoss(b), 'shielded')
  for (let i = 0; i < 90; i++) stepBoss(b, 128, rng)
  assert.equal(gloomOpen(b), true)
  for (let i = 0; i < 5; i++) {
    b.hurt = 0
    assert.equal(hitBoss(b), i === 4 ? 'phase' : 'hit')
  }
  assert.equal(b.phase, 3)
  for (let i = 0; i < 120; i++) stepBoss(b, 128, rng)
  assert.equal(b.shots.filter((s) => s.kind === 'gloom').length, 2)
  for (let i = 0; i < 6; i++) {
    b.hurt = 0
    assert.equal(hitBoss(b), i === 5 ? 'defeated' : 'hit')
  }
  assert.ok(b.defeated)
  assert.equal(b.shots.length, 0)
}

{
  const instance = brickBloom.create({
    rng: mulberry32(3),
    sound: { play: () => {} },
    demo: false,
    hiScore: 0,
    resume: saved,
  })
  const g = instance as unknown as {
    tour: { house: number; wall: string } | null
    card: unknown
    tick: number
    bricks: Array<{ kind: string; row: number; hp: number; guard?: boolean }>
    litRows: Map<number, number>
    boss: ReturnType<typeof spawnBoss> | null
    enterHouse(house: number): void
    startBoss(stage: number, house: number): void
    crack(b: { hp: number }): void
    bed: number[]
    paddleX: number
    updateBoss(): void
  }
  const press = emptyInput()
  press.pressed.a = true
  instance.update(press)
  g.enterHouse(4)
  g.card = null
  assert.equal(g.tour?.house, 4)
  const crate = g.bricks.find((b) => b.kind === 'glow')!
  g.crack(crate)
  assert.equal(g.litRows.get(crate.row), g.tick + 240)
  g.startBoss(30, 4)
  assert.equal(g.litRows.size, 0, 'light cannot leak from the previous wall')
  assert.equal(g.boss?.id, 'gloom-bloom')
  assert.equal(g.bricks.filter((b) => b.guard).length, 4)
  for (const b of g.bricks.filter((b) => b.guard)) {
    while (g.bricks.includes(b)) g.crack(b)
  }
  g.updateBoss()
  assert.equal(g.boss?.phase, 2)
  const boss = g.boss!
  boss.phase = 3
  boss.timer = 999
  g.bed.fill(3)
  g.paddleX = 20
  boss.shots = [{ kind: 'gloom', x: 128, y: 305, vx: 0, vy: 2 }]
  g.updateBoss()
  assert.ok(g.bed.some((n) => n < 3), 'an uncaught cloud smothers a plot')
}

console.log('Brick Bloom Night Bloom: authored routes, light, boss phases and bed attacks passed')
