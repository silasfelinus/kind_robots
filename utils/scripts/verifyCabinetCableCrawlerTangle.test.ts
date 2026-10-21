// /utils/scripts/verifyCabinetCableCrawlerTangle.test.ts
//
// Cable Crawler depth pass, slice 5 part 2 (conductor kr-arcade/t-068): the Tangle rules. 2-4 cables,
// bodies are walls, plug against plug is a pause and never a knockout, Team shares a battery,
// Race crowns the most sparks. The rules module only; the game does not seat players yet.
//
//   npx tsx utils/scripts/verifyCabinetCableCrawlerTangle.test.ts

import assert from 'node:assert/strict'
import { COMPONENTS } from '../arcade/cableCrawler/components'
import { COLS, parseMaze } from '../arcade/cableCrawler/mazes'
import {
  TANGLE_BLURBS,
  TANGLE_KINDS,
  TANGLE_MAX,
  TANGLE_MIN,
  TANGLE_NAMES,
  raceBanner,
  raceWinners,
  resolveTangle,
  tangleSeats,
  tangleSpawns,
  teamCharge,
} from '../arcade/cableCrawler/tangle'

{
  assert.deepEqual([...TANGLE_KINDS], ['team', 'race'])
  for (const k of TANGLE_KINDS) {
    assert.ok(TANGLE_NAMES[k] && TANGLE_BLURBS[k])
    assert.ok(TANGLE_NAMES[k] === TANGLE_NAMES[k].toUpperCase())
  }
  assert.equal(tangleSeats(1), TANGLE_MIN)
  assert.equal(tangleSeats(3.7), 3)
  assert.equal(tangleSeats(9), TANGLE_MAX)
  assert.equal(tangleSeats(NaN), TANGLE_MIN)
}

{
  const maze = parseMaze(COMPONENTS[0]!.mazes[0]!)
  for (let n = TANGLE_MIN; n <= TANGLE_MAX; n++) {
    const spawns = tangleSpawns(maze.walls, maze.start, n)
    assert.equal(spawns.length, n, `${n} seats get ${n} spawns`)
    assert.equal(spawns[0], maze.start, 'player 1 starts at the maze start')
    assert.equal(new Set(spawns).size, n, 'no two plugs share a cell')
    for (const k of spawns) assert.ok(!maze.walls[k], 'spawns are open cells')
    assert.deepEqual(spawns, tangleSpawns(maze.walls, maze.start, n), 'stable')
  }
}

{
  const open = new Array<boolean>(COLS * 19).fill(false)
  const set = (...c: number[]) => new Set(c)
  const a = 100
  const b = a + 2
  const mid = a + 1
  const bump = resolveTangle(open, [a, b], [mid, mid], [set(a), set(b)])
  assert.deepEqual(bump, ['bump', 'bump'], 'two plugs after one cell pause')

  const swap = resolveTangle(open, [a, a + 1], [a + 1, a], [set(a), set(a + 1)])
  assert.deepEqual(swap, ['bump', 'bump'], 'swapping places is a pause too')

  const free = resolveTangle(open, [a, b], [a - 1, b + 1], [set(a), set(b)])
  assert.deepEqual(free, ['move', 'move'])

  const walled = open.slice()
  walled[a - 1] = true
  const wall = resolveTangle(walled, [a, b], [a - 1, b + 1], [set(a), set(b)])
  assert.deepEqual(wall, ['blocked', 'move'])

  const body = resolveTangle(
    open,
    [a, b],
    [b - 1, b + 1],
    [set(a), set(b, b - 1)],
  )
  assert.deepEqual(body, ['blocked', 'move'], 'another cable is a wall')

  const paused = resolveTangle(open, [a, b], [-1, b + 1], [set(a), set(b)])
  assert.deepEqual(paused, ['blocked', 'move'], 'a paused plug stays')

  const into = resolveTangle(open, [a, b], [-1, a], [set(a), set(b)])
  assert.equal(into[1], 'blocked', 'nobody pushes through a waiting plug')
}

{
  assert.deepEqual(raceWinners([3, 7, 7]), [1, 2])
  assert.deepEqual(raceWinners([0, 0]), [])
  assert.equal(raceBanner([3, 9]), 'P2 WINS  9 SPARKS')
  assert.equal(raceBanner([4, 4, 1]), 'TIE  P1 P2')
  assert.equal(raceBanner([0, 0]), 'NO SPARKS EATEN')
  assert.equal(teamCharge(5, 3, 6), 6, 'the shared battery caps')
  assert.equal(teamCharge(1, -4, 6), 0, 'and floors')
}

console.log('verifyCabinetCableCrawlerTangle: ok')
