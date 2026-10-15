// Ribbon Riders wrap topology (conductor kr-arcade/t-150): the wrap-up's flood on shapes whose
// captured cells are written out from the authored shape (a rectangle's width x height, laid out
// across a seam), never copied from the flood fill. Covers the toroidal seams, wall and pillar
// sides, the road-ahead and teammate exclusions, and the exact 160-cell limit versus the Bow's
// doubled 320.
import assert from 'node:assert/strict'
import { WRAP_LIMIT } from '../arcade/games/ribbonRiders'
import { GRID, idx, type Dir } from '../arcade/ribbonRiders/grid'
import { findWraps } from '../arcade/ribbonRiders/wrap'

type Rect = { x: number; y: number; w: number; h: number }

const mod = (v: number) => ((v % GRID) + GRID) % GRID

/** The cells of a rectangle, wrapped back onto the board when it runs over a seam. */
function rectCells(r: Rect): Set<number> {
  const out = new Set<number>()
  for (let dy = 0; dy < r.h; dy++)
    for (let dx = 0; dx < r.w; dx++) out.add(idx(mod(r.x + dx), mod(r.y + dy)))
  return out
}

/** The one-cell ring of ribbon round the interior rectangle, wrapped onto the board. */
function ringCells(inner: Rect): Set<number> {
  const out = new Set<number>()
  for (let dy = -1; dy <= inner.h; dy++)
    for (let dx = -1; dx <= inner.w; dx++) {
      if (dx >= 0 && dx < inner.w && dy >= 0 && dy < inner.h) continue
      out.add(idx(mod(inner.x + dx), mod(inner.y + dy)))
    }
  return out
}

const sorted = (s: Iterable<number>) => [...s].sort((a, b) => a - b)

type Extra = Partial<Parameters<typeof findWraps>[0]>
function query(
  walls: Set<number>,
  at: { x: number; y: number },
  dir: Dir,
  limit: number,
  extra: Extra = {},
) {
  return findWraps({
    x: at.x,
    y: at.y,
    dir,
    limit,
    side: (cx, cy) =>
      cx < 0 || cy < 0 || cx >= GRID || cy >= GRID || walls.has(idx(cx, cy)),
    ...extra,
  })
}

// --- a pocket whose closing cell sits beside a seam wraps only when that seam wraps --------------
const seamCases: Array<{
  name: string
  inner: Rect
  lay: { x: number; y: number }
  dir: Dir
  wrapX: boolean
  wrapY: boolean
}> = [
  // The closing cell is the right-edge column; the pocket starts across the seam at x = 0.
  {
    name: 'horizontal seam',
    inner: { x: 0, y: 20, w: 4, h: 3 },
    lay: { x: GRID - 1, y: 21 },
    dir: 0,
    wrapX: true,
    wrapY: false,
  },
  // The closing cell is the bottom-edge row; the pocket starts across the seam at y = 0.
  {
    name: 'vertical seam',
    inner: { x: 20, y: 0, w: 3, h: 4 },
    lay: { x: 21, y: GRID - 1 },
    dir: 1,
    wrapX: false,
    wrapY: true,
  },
  // A pocket in the very corner, reached across the horizontal seam.
  {
    name: 'corner',
    inner: { x: 0, y: 0, w: 4, h: 4 },
    lay: { x: GRID - 1, y: 1 },
    dir: 0,
    wrapX: true,
    wrapY: true,
  },
]
for (const c of seamCases) {
  const ring = ringCells(c.inner)
  const expected = sorted(rectCells(c.inner))
  assert.equal(
    expected.length,
    c.inner.w * c.inner.h,
    `${c.name}: authored size`,
  )
  assert.ok(
    ring.has(idx(c.lay.x, c.lay.y)),
    `${c.name}: the closing cell is on the ring`,
  )
  const open = query(ring, c.lay, c.dir, WRAP_LIMIT, {
    wrapX: c.wrapX,
    wrapY: c.wrapY,
  })
  assert.equal(open.length, 1, `${c.name}: wraps once with the seam open`)
  assert.deepEqual(
    sorted(open[0]!),
    expected,
    `${c.name}: caught exactly the pocket`,
  )
  // With the seam shut the pocket is out of the closing cell's reach, and its other neighbour is
  // the open arena, far past the limit: nothing wraps.
  assert.equal(
    query(ring, c.lay, c.dir, WRAP_LIMIT).length,
    0,
    `${c.name}: seam off, nothing wraps`,
  )
}

// A pocket wholly on one side of a seam closes the same with or without wrapping edges.
{
  const inner: Rect = { x: 2, y: 2, w: 5, h: 4 }
  const ring = ringCells(inner)
  const lay = { x: 3, y: 1 }
  const want = sorted(rectCells(inner))
  const plain = query(ring, lay, 3, WRAP_LIMIT)
  const seamed = query(ring, lay, 3, WRAP_LIMIT, { wrapX: true, wrapY: true })
  assert.deepEqual(plain.map(sorted), [want])
  assert.deepEqual(
    seamed.map(sorted),
    [want],
    'seams do not leak a closed ring',
  )
}

// A gap in a ring that straddles the seam leaves the pocket open to the whole board.
{
  const inner: Rect = { x: 0, y: 20, w: 4, h: 3 }
  const ring = ringCells(inner)
  ring.delete(idx(2, 19)) // a gap in the top edge
  const lay = { x: GRID - 1, y: 21 }
  assert.equal(query(ring, lay, 0, WRAP_LIMIT, { wrapX: true }).length, 0)
}

// --- wall and pillar sides -----------------------------------------------------------------------
{
  // A 6 x 5 pocket in the top-left corner: the board edge is two of its sides, ribbon the rest.
  const walls = new Set<number>()
  for (let x = 0; x <= 6; x++) walls.add(idx(x, 5))
  for (let y = 0; y <= 5; y++) walls.add(idx(6, y))
  const lay = { x: 3, y: 5 }
  const got = query(walls, lay, 1, WRAP_LIMIT)
  assert.deepEqual(
    got.map(sorted),
    [sorted(rectCells({ x: 0, y: 0, w: 6, h: 5 }))],
    'the arena wall counts as a side',
  )
  // On a wrapping board there is no wall to lean on: the flood leaks round the edge.
  assert.equal(
    query(walls, lay, 1, WRAP_LIMIT, { wrapX: true, wrapY: true }).length,
    0,
    'a wrapping board has no wall to lean on',
  )
}
{
  // Four sides (pillars and ribbon alike) close a one-cell pocket.
  const sides = new Set([idx(19, 20), idx(21, 20), idx(20, 19), idx(20, 21)])
  assert.deepEqual(query(sides, { x: 20, y: 21 }, 2, WRAP_LIMIT).map(sorted), [
    [idx(20, 20)],
  ])
}

// --- the road ahead and teammate exclusions ------------------------------------------------------
{
  const inner: Rect = { x: 10, y: 10, w: 5, h: 5 }
  const ring = ringCells(inner)
  const pocket = sorted(rectCells(inner))
  const lay = { x: 12, y: 9 } // the ring's top edge
  // Heading along the edge, the pocket is beside the rider, not ahead: it wraps.
  assert.deepEqual(query(ring, lay, 3, WRAP_LIMIT).map(sorted), [pocket])
  // Heading down into the pocket, it is the road ahead and stays open.
  assert.equal(
    query(ring, lay, 2, WRAP_LIMIT).length,
    0,
    'the road ahead is never wrapped',
  )
  // A teammate anywhere inside the region leaves it open; one outside does not.
  for (const c of [idx(10, 10), idx(12, 12), idx(14, 14)])
    assert.equal(
      query(ring, lay, 3, WRAP_LIMIT, { forbid: (i) => i === c }).length,
      0,
      'a teammate inside leaves the loop open',
    )
  assert.equal(
    query(ring, lay, 3, WRAP_LIMIT, { forbid: (i) => i === idx(30, 30) })
      .length,
    1,
    'a teammate outside does not',
  )
}

// --- the exact size boundary: 160 cells wrap, 161 do not, a Bow doubles it -----------------------
{
  assert.equal(WRAP_LIMIT, 160, 'the authored limit')
  const shapes: Array<[number, number, number]> = [
    [16, 10, 160],
    [10, 16, 160],
    [20, 8, 160],
    [7, 23, 161],
    [23, 7, 161],
    [17, 10, 170],
  ]
  for (const [w, h, cells] of shapes) {
    assert.equal(w * h, cells, 'authored area')
    const inner: Rect = { x: 5, y: 5, w, h }
    const ring = ringCells(inner)
    const lay = { x: 6, y: 4 }
    const want = sorted(rectCells(inner))
    const normal = query(ring, lay, 3, WRAP_LIMIT)
    const bow = query(ring, lay, 3, WRAP_LIMIT * 2)
    if (cells <= WRAP_LIMIT)
      assert.deepEqual(
        normal.map(sorted),
        [want],
        `${w}x${h} wraps at the limit`,
      )
    else assert.equal(normal.length, 0, `${w}x${h} is past the limit`)
    assert.deepEqual(bow.map(sorted), [want], `${w}x${h} wraps with a Bow`)
  }
  // Under a Bow, 320 wraps and 322 or more do not.
  const doubled: Array<[number, number, number]> = [
    [16, 20, 320],
    [8, 40, 320],
    [7, 46, 322],
    [19, 17, 323],
  ]
  for (const [w, h, cells] of doubled) {
    assert.equal(w * h, cells, 'authored area')
    const got = query(
      ringCells({ x: 1, y: 1, w, h }),
      { x: 2, y: 0 },
      3,
      WRAP_LIMIT * 2,
    )
    assert.equal(
      got.length,
      cells <= WRAP_LIMIT * 2 ? 1 : 0,
      `${w}x${h} under a Bow`,
    )
  }
}

console.log('ribbon riders wrap topology ok')
