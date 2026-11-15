import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import {
  bundleCabinetFixture,
  openCabinet,
  wait,
} from './arcadeCabinetFixture.mjs'

// Conductor kr-arcade t-150 (the part left open after kind_robots#3701): Ribbon Riders wraps closed by
// steering through the actual cabinet, with the cabinet's own keyboard input only, and the real
// renderer's picture of a wrap across the Pier Loop's seam. Each shape is authored as a rectangle,
// and the expected cells are written out from it, never read from the game's flood fill. Staged per
// shape (explicitly): the round is set (the Old Square, or the Pier Loop found by its id), the rivals
// are benched, and the closing wall and pickups held off, so only the rider's own ribbon makes the
// loop. Synthetic input in headless Chromium: not human pacing, device or deployment evidence.
// RIBBON_SEAM_SHOTS=<dir> saves the seam's before/after canvas pictures.

const SLUG = 'ribbon-riders'
const GRID = 48
const CELL = 6
const ARENA_Y = 24
const LOGICAL_W = 288
const WRAP_LIMIT = 160
const UP = 0
const RIGHT = 1
const DOWN = 2
const LEFT = 3
const KEYS = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft']

const fixture = await bundleCabinetFixture()
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
})
const shots = process.env.RIBBON_SEAM_SHOTS
if (shots) mkdirSync(shots, { recursive: true })

const mod = (v) => ((v % GRID) + GRID) % GRID
const idx = (x, y) => y * GRID + x
/** The cells of an authored rectangle, laid back onto the board across a seam. */
function rectCells({ x, y, w, h }) {
  const out = []
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++) out.push(idx(mod(x + dx), mod(y + dy)))
  return out.sort((a, b) => a - b)
}

/** The rider, the round and the wraps so far, as plain data. */
function ribbon(page) {
  return page.evaluate(() => {
    const game = (window.__ribbons ?? [])
      .filter((entry) => !entry.demo)
      .at(-1)?.game
    if (!game) return null
    const p = game.bikes[0]
    return {
      arena: game.arena.spec.id,
      x: p.x,
      y: p.y,
      dir: p.dir,
      alive: p.alive,
      ready: game.ready,
      lives: game.lives,
      wraps: game.wraps.map((w) => [...w.cells].sort((a, b) => a - b)),
    }
  })
}

/**
 * Explicit staging: start the round whose arena has this id (rounds are searched, so a reordered
 * or longer circuit still finds it), bench the rivals, hold off the closing wall and the pickups.
 */
function stageRound(page, arenaId) {
  return page.evaluate((id) => {
    const game = window.__ribbons.filter((entry) => !entry.demo).at(-1).game
    let round = 1
    for (; round < 64; round++) {
      game.startRound(round)
      if (game.arena.spec.id === id) break
    }
    if (game.arena.spec.id !== id) throw new Error(`no arena ${id}`)
    // Rivals held where they start (the Freeze pickup's own rule), so the round stays open.
    game.freeze = 1e9
    game.shrinkTimer = Infinity
    game.pickupTimer = Infinity
    game.pickups = []
    return round
  }, arenaId)
}

/**
 * Ride the rider through `turns` with the arrow keys: at each turn's cell, hold the new heading
 * until the bike has taken it. Returns the state after the last turn.
 */
async function ride(page, turns, { onTurned } = {}) {
  const trail = []
  for (const [i, turn] of turns.entries()) {
    const deadline = Date.now() + 20_000
    let s = await ribbon(page)
    while (s.x !== turn.x || s.y !== turn.y) {
      const at = `${s.x},${s.y}/${s.dir}`
      if (trail.at(-1) !== at) trail.push(at)
      assert.ok(
        s.alive,
        `the rider is still riding before turn ${i} (trail ${trail.slice(-8).join(' ')})`,
      )
      assert.ok(
        Date.now() < deadline,
        `reached turn ${i} at ${turn.x},${turn.y}`,
      )
      await wait(4)
      s = await ribbon(page)
    }
    await page.keyboard.down(KEYS[turn.dir])
    while (s.dir !== turn.dir) {
      assert.ok(
        s.x === turn.x && s.y === turn.y,
        `turn ${i} taken at ${turn.x},${turn.y} (rider at ${s.x},${s.y})`,
      )
      await wait(4)
      s = await ribbon(page)
    }
    await page.keyboard.up(KEYS[turn.dir])
    if (onTurned) await onTurned(i)
  }
  return ribbon(page)
}

/**
 * A rectangle closed against the rider's own spawn column on the Old Square: up the spawn column,
 * right along the top, down the far side and back along the spawn row, closing beside the first
 * cell, then away downward and right so the rider rides on.
 */
function boxTurns(w, h) {
  const top = 40 - h
  return [
    { x: 24, y: top, dir: RIGHT },
    { x: 25 + w, y: top, dir: DOWN },
    { x: 25 + w, y: 41, dir: LEFT },
    { x: 25, y: 41, dir: DOWN },
    { x: 25, y: 43, dir: RIGHT },
  ]
}

/** The canvas pixel at the centre of a cell (the cabinet scales the logical screen evenly). */
function cellPixels(page, cells) {
  return page.evaluate(
    ({ cells, CELL, ARENA_Y, LOGICAL_W }) => {
      const canvas = document.querySelector('.cabinet-canvas')
      const k = canvas.width / LOGICAL_W
      const g = canvas.getContext('2d')
      return cells.map(([x, y]) => [
        ...g.getImageData(
          Math.floor((x * CELL + CELL / 2) * k),
          Math.floor((ARENA_Y + y * CELL + CELL / 2) * k),
          1,
          1,
        ).data,
      ])
    },
    { cells, CELL, ARENA_Y, LOGICAL_W },
  )
}

const summary = []
const { page, errors, context } = await openCabinet(browser, fixture, {
  slug: SLUG,
  width: 1440,
  height: 900,
})
try {
  await page.keyboard.press('Enter')
  await page.waitForFunction(() =>
    (window.__ribbons ?? []).some((entry) => !entry.demo),
  )

  // 1. Rectangles on the Old Square (no seams): 7 x 6, and the 160-cell limit (156 wraps, 169 not).
  for (const [w, h] of [
    [7, 6],
    [13, 12],
    [13, 13],
  ]) {
    await stageRound(page, 'square')
    const s = await ride(page, boxTurns(w, h))
    assert.ok(s.alive, `${w}x${h}: the rider rides on`)
    const want = rectCells({ x: 25, y: 41 - h, w, h })
    assert.equal(want.length, w * h, `${w}x${h}: authored area`)
    if (w * h <= WRAP_LIMIT) {
      assert.deepEqual(s.wraps, [want], `${w}x${h}: exactly the box wraps`)
    } else {
      assert.deepEqual(s.wraps, [], `${w}x${h}: past ${WRAP_LIMIT}, no wrap`)
    }
    summary.push(
      `${w}x${h}=${w * h} ${w * h <= WRAP_LIMIT ? 'wraps' : 'stays open'}`,
    )
  }

  // 2. Across the Pier Loop's seam: a 5 x 3 pocket at x 45..47 and 0..1, closed on the far side.
  {
    const round = await stageRound(page, 'pier')
    const seamCells = [
      [46, 40],
      [47, 40],
      [0, 40],
      [1, 40],
    ]
    let before = null
    const turns = [
      { x: 24, y: 38, dir: RIGHT },
      { x: 2, y: 38, dir: DOWN },
      { x: 2, y: 42, dir: LEFT },
      { x: 44, y: 42, dir: UP },
      { x: 44, y: 39, dir: LEFT },
      { x: 40, y: 39, dir: DOWN },
      { x: 40, y: 45, dir: RIGHT },
    ]
    // The "before" picture is taken on the long ride along the top row, well before any turn.
    const s = await ride(page, turns, {
      onTurned: async (i) => {
        if (i !== 0) return
        before = await cellPixels(page, seamCells)
        if (shots)
          await page
            .locator('.cabinet-canvas')
            .screenshot({ path: path.join(shots, 'ribbon-seam-before.png') })
      },
    })
    const want = rectCells({ x: 45, y: 39, w: 5, h: 3 })
    assert.equal(want.length, 15)
    assert.ok(
      want.includes(idx(47, 40)) && want.includes(idx(0, 40)),
      'the authored pocket straddles the seam',
    )
    assert.deepEqual(s.wraps, [want], 'the pocket wraps across the seam')
    await wait(120)
    const after = await cellPixels(page, seamCells)
    for (const [i, [x, y]] of seamCells.entries())
      assert.notDeepEqual(
        after[i],
        before[i],
        `the renderer paints the wrap at ${x},${y}, on both sides of the seam`,
      )
    if (shots)
      await page
        .locator('.cabinet-canvas')
        .screenshot({ path: path.join(shots, 'ribbon-seam-after.png') })
    summary.push(
      `Pier Loop (round ${round}) 5x3 across the seam, painted both sides`,
    )
  }
  assert.deepEqual(errors, [])
} finally {
  await context.close()
  await browser.close()
}
console.log(`ribbon riders wrap cabinet: ok (${summary.join('; ')})`)
