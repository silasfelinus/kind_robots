'use strict'
var ChessweeperSeeded
;(function (ChessweeperSeeded) {
  function nextRandom(state) {
    const nextState = (state + 0x6d2b79f5) >>> 0
    let n = nextState
    n = Math.imul(n ^ (n >>> 15), n | 1)
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61)
    return { state: nextState, value: ((n ^ (n >>> 14)) >>> 0) / 4294967296 }
  }
  ChessweeperSeeded.nextRandom = nextRandom
  function nextInt(state, max) {
    if (!Number.isSafeInteger(max) || max < 1) {
      throw new RangeError('Random bound must be a positive integer')
    }
    const roll = nextRandom(state)
    return { state: roll.state, value: Math.floor(roll.value * max) }
  }
  ChessweeperSeeded.nextInt = nextInt
  function minefield(count, seed) {
    if (!Number.isInteger(count) || count < 0 || count > 32) {
      throw new RangeError('Mines must fit inside the middle four ranks')
    }
    const slots = Array.from(
      { length: 32 },
      (_, j) => (2 + (j >> 3)) * 16 + (j & 7),
    )
    let state = seed >>> 0
    for (let j = slots.length - 1; j > 0; j--) {
      const roll = nextInt(state, j + 1)
      state = roll.state
      ;[slots[j], slots[roll.value]] = [slots[roll.value], slots[j]]
    }
    return { mines: new Set(slots.slice(0, count)), state }
  }
  ChessweeperSeeded.minefield = minefield
  function firstProbeSafe(probed, mines, shown, state) {
    const shifted = new Set(mines)
    if (!shifted.has(probed)) return { mines: shifted, state, moved: false }
    const candidates = []
    for (let y = 2; y <= 5; y++) {
      for (let x = 0; x < 8; x++) {
        const index = y * 16 + x
        if (index !== probed && !shifted.has(index) && !shown.has(index)) {
          candidates.push(index)
        }
      }
    }
    if (!candidates.length) return { mines: shifted, state, moved: false }
    const roll = nextInt(state, candidates.length)
    shifted.delete(probed)
    shifted.add(candidates[roll.value])
    return { mines: shifted, state: roll.state, moved: true }
  }
  ChessweeperSeeded.firstProbeSafe = firstProbeSafe
  function stepDisc(disc) {
    let x = disc.x + disc.dx
    let y = disc.y + disc.dy
    let dx = disc.dx
    let dy = disc.dy
    if (x < 0 || x >= 8) {
      dx = -dx
      x = disc.x + dx
    }
    if (y < 0 || y >= 8) {
      dy = -dy
      y = disc.y + dy
    }
    return { ...disc, x, y, dx, dy }
  }
  ChessweeperSeeded.stepDisc = stepDisc
})(ChessweeperSeeded || (ChessweeperSeeded = {}))
