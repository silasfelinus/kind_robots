import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { create } from '../arcade/games/repairRampage'
import type { RepairTool } from '../arcade/repairRampage/powerups'
import type { WindowSurprise } from '../arcade/repairRampage/windowSurprises'
import { emptyInput } from '../arcade/types'

type TestTower = {
  windows: boolean[]
  surprises: WindowSurprise[]
  powered: boolean
  rows: number
}

type TestGame = {
  readonly lives: number
  readonly over: boolean
  charge: number
  tools: RepairTool[]
  protection: RepairTool | null
  rollerTicks: number
  reserveGrace: number
  mode: 'ground' | 'climb' | 'fall'
  tower: number
  row: number
  col: number
  x: number
  y: number
  vy: number
  fallFrom: number
  towers: TestTower[]
  activateTool(): void
  repairWindow(row: number, col: number): void
  fall(): void
  flash(drone: {
    x: number
    y: number
    dir: 1 | -1
    speed: number
    warn: number
    flashed: boolean
    leaving: boolean
  }): void
  update(input: ReturnType<typeof emptyInput>): void
}

function newGame(seed: number): TestGame {
  return create({
    rng: mulberry32(seed),
    demo: false,
    hiScore: 0,
    sound: { play: () => undefined },
  }) as unknown as TestGame
}

{
  const game = newGame(5)
  assert.equal(game.lives, 4)
  for (let remaining = 3; remaining >= 0; remaining--) {
    game.charge = 0
    game.update(emptyInput())
    assert.equal(game.lives, remaining)
    assert.equal(game.over, remaining === 0)
    if (remaining > 0) {
      assert.equal(game.charge, 100)
      assert.equal(game.mode, 'ground')
      assert.ok(game.reserveGrace > 0)
    }
  }
}

{
  const game = newGame(10)
  const tower = game.towers[0]!
  tower.windows.fill(true)
  tower.surprises.fill(null)
  for (const index of [0, 1, 3, 4]) tower.windows[index] = false
  tower.powered = false
  game.tower = 0
  game.row = 0
  game.col = 0
  game.mode = 'climb'
  game.tools = ['super-wrench']
  game.activateTool()
  assert.ok([0, 1, 3, 4].every((index) => tower.windows[index]))
  assert.equal(tower.powered, true)
  assert.equal(game.tools.length, 0)
}

{
  const game = newGame(11)
  const tower = game.towers[0]!
  tower.windows[2] = false
  tower.surprises[2] = null
  game.tower = 0
  game.row = 0
  game.col = 2
  game.mode = 'climb'
  game.tools = ['paint-roller']
  game.activateTool()
  assert.equal(game.rollerTicks, 300)
  game.update(emptyInput())
  assert.equal(tower.windows[2], true)
}

{
  const game = newGame(12)
  game.mode = 'climb'
  game.tower = 0
  game.row = 0
  game.col = 0
  game.tools = ['rocket-boots']
  const controls = emptyInput()
  controls.pressed.b = true
  game.update(controls)
  assert.equal(game.row, 3)
  assert.equal(game.tools.length, 0)
}

{
  const game = newGame(13)
  game.tools = ['hard-hat']
  game.activateTool()
  assert.equal(game.protection, 'hard-hat')
  game.mode = 'fall'
  game.fallFrom = 110
  game.y = 220
  game.vy = 5
  const before = game.charge
  game.fall()
  assert.equal(game.charge, before)
  assert.equal(game.protection, null)
}

{
  const game = newGame(14)
  game.tools = ['umbrella']
  game.activateTool()
  game.x = 100
  game.y = 150
  const before = game.charge
  game.flash({
    x: 50,
    y: 136,
    dir: 1,
    speed: 1,
    warn: 0,
    flashed: false,
    leaving: false,
  })
  assert.equal(game.charge, before)
  assert.equal(game.protection, null)
}

{
  const game = newGame(15)
  game.tools = ['rubber-gloves']
  game.activateTool()
  game.mode = 'climb'
  game.tower = 0
  const tower = game.towers[0]!
  tower.windows[0] = false
  tower.surprises[0] = 'sparky-wire'
  const before = game.charge
  game.repairWindow(0, 0)
  assert.ok(game.charge >= before)
  assert.equal(game.protection, null)
}
console.log('Repair Rampage: six tools and three robots pass scripted gameplay')
