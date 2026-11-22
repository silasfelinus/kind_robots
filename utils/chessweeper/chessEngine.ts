export type ChessPosition = {
  b: string[]
  t: number
  c: number
  ep: number
  half: number
  full: number
}
export type ChessMove = [
  from: number,
  to: number,
  promotion: string,
  flag: string,
]

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const DIR: Record<string, number[]> = {
  n: [-33, -31, -18, -14, 14, 18, 31, 33],
  b: [-17, -15, 15, 17],
  r: [-16, -1, 1, 16],
  q: [-17, -16, -15, -1, 1, 15, 16, 17],
  k: [-17, -16, -15, -1, 1, 15, 16, 17],
}
const onBoard = (i: number) => i >= 0 && i < 128 && !(i & 0x88)
const colorOf = (p: string | undefined) =>
  !p || p === '.' ? 0 : p === p.toUpperCase() ? 1 : -1
const squareName = (i: number) => 'abcdefgh'[i & 7]! + (8 - (i >> 4))
const squareIdx = (s: string) =>
  (8 - Number(s[1])) * 16 + 'abcdefgh'.indexOf(s[0]!)
const moveKey = (m: ChessMove) => squareName(m[0]) + squareName(m[1]) + m[2]
const initialPosition = (): ChessPosition => {
  const parts = START_FEN.split(' '),
    board = Array(128).fill('.')
  parts[0]!.split('/').forEach((row, r) => {
    let f = 0
    for (const p of row) {
      if (p >= '1' && p <= '8') f += +p
      else board[r * 16 + f++] = p
    }
  })
  return { b: board, t: 1, c: 15, ep: -1, half: 0, full: 1 }
}
function underAttack(s: ChessPosition, target: number, by: number): boolean {
  for (let from = 0; from < 128; from++) {
    if (!onBoard(from) || colorOf(s.b[from]) !== by) continue
    const p = s.b[from]!.toLowerCase()
    if (p === 'p') {
      if (target === from - 16 * by - 1 || target === from - 16 * by + 1)
        return true
      continue
    }
    for (const dir of DIR[p] ?? []) {
      for (let to = from + dir; onBoard(to); to += dir) {
        if (to === target) return true
        if (s.b[to] !== '.' || p === 'n' || p === 'k') break
      }
    }
  }
  return false
}
const inCheck = (s: ChessPosition, side = s.t) =>
  underAttack(s, s.b.indexOf(side === 1 ? 'K' : 'k'), -side)
function makePosition(s: ChessPosition, m: ChessMove): ChessPosition {
  const [from, to, promo, flag] = m,
    b = s.b.slice(),
    p = b[from],
    target = b[to]
  let c = s.c
  b[from] = '.'
  b[to] = promo ? (s.t === 1 ? promo.toUpperCase() : promo) : p!
  if (flag === 'ep') b[to + 16 * s.t] = '.'
  if (flag === 'castle') {
    const rookFrom = to > from ? from + 3 : from - 4,
      rookTo = to > from ? from + 1 : from - 1
    b[rookTo] = b[rookFrom]!
    b[rookFrom] = '.'
  }
  if (p === 'K') c &= ~3
  if (p === 'k') c &= ~12
  const rookBits: Record<number, number> = { 119: 1, 112: 2, 7: 4, 0: 8 }
  if (p!.toLowerCase() === 'r') c &= ~(rookBits[from] || 0)
  if (target!.toLowerCase() === 'r') c &= ~(rookBits[to] || 0)
  return {
    b,
    t: -s.t,
    c,
    ep:
      p!.toLowerCase() === 'p' && Math.abs(to - from) === 32
        ? (to + from) / 2
        : -1,
    half:
      p!.toLowerCase() === 'p' || target !== '.' || flag === 'ep'
        ? 0
        : s.half + 1,
    full: s.full + (s.t === -1 ? 1 : 0),
  }
}
function pseudoMoves(s: ChessPosition): ChessMove[] {
  const result: ChessMove[] = []
  for (let from = 0; from < 128; from++) {
    if (!onBoard(from) || colorOf(s.b[from]) !== s.t) continue
    const p = s.b[from]!.toLowerCase()
    const add = (to: number, flag = '') => {
      if (s.b[to]!.toLowerCase() === 'k') return // Kings cannot be captured.
      if (p === 'p' && (to >> 4 === 0 || to >> 4 === 7)) {
        for (const promote of ['q', 'r', 'b', 'n'])
          result.push([from, to, promote, flag])
      } else result.push([from, to, '', flag])
    }
    if (p === 'p') {
      const to = from - 16 * s.t
      if (onBoard(to) && s.b[to] === '.') {
        add(to)
        const double = to - 16 * s.t
        if (from >> 4 === (s.t === 1 ? 6 : 1) && s.b[double] === '.')
          add(double)
      }
      for (const delta of [-1, 1]) {
        const target = to + delta
        if (!onBoard(target)) continue
        if (colorOf(s.b[target]) === -s.t) add(target)
        else if (
          target === s.ep &&
          s.b[target] === '.' &&
          s.b[target + 16 * s.t] === (s.t === 1 ? 'p' : 'P')
        )
          add(target, 'ep')
      }
    } else {
      for (const dir of DIR[p]!)
        for (let to = from + dir; onBoard(to); to += dir) {
          if (colorOf(s.b[to]) === s.t) break
          add(to)
          if (s.b[to] !== '.' || p === 'n' || p === 'k') break
        }
      const home = s.t === 1 ? 116 : 4,
        rook = s.t === 1 ? 'R' : 'r',
        bits = s.t === 1 ? [1, 2] : [4, 8]
      if (p === 'k' && from === home && !inCheck(s)) {
        if (
          s.c & bits[0]! &&
          s.b[from + 3] === rook &&
          s.b[from + 1] === '.' &&
          s.b[from + 2] === '.' &&
          !underAttack(s, from + 1, -s.t) &&
          !underAttack(s, from + 2, -s.t)
        )
          add(from + 2, 'castle')
        if (
          s.c & bits[1]! &&
          s.b[from - 4] === rook &&
          s.b[from - 1] === '.' &&
          s.b[from - 2] === '.' &&
          s.b[from - 3] === '.' &&
          !underAttack(s, from - 1, -s.t) &&
          !underAttack(s, from - 2, -s.t)
        )
          add(from - 2, 'castle')
      }
    }
  }
  return result
}
const legalMoves = (s: ChessPosition): ChessMove[] =>
  pseudoMoves(s).filter((m) => !inCheck(makePosition(s, m), s.t))
function notation(s: ChessPosition, m: ChessMove): string {
  const [from, to, promote, flag] = m,
    p = s.b[from]!.toUpperCase(),
    capture = s.b[to] !== '.' || flag === 'ep'
  let str = ''
  if (flag === 'castle') str = to > from ? 'O-O' : 'O-O-O'
  else {
    if (p !== 'P') {
      str = p
      const others = legalMoves(s).filter(
        (x) => x[0] !== from && x[1] === to && s.b[x[0]] === s.b[from],
      )
      if (others.length)
        str += !others.some((x) => (x[0] & 7) === (from & 7))
          ? squareName(from)[0]
          : !others.some((x) => x[0] >> 4 === from >> 4)
            ? squareName(from)[1]
            : squareName(from)
    } else if (capture) str = squareName(from)[0]!
    str +=
      (capture ? 'x' : '') +
      squareName(to) +
      (promote ? '=' + promote.toUpperCase() : '')
  }
  const next = makePosition(s, m)
  return str + (inCheck(next) ? (legalMoves(next).length ? '+' : '#') : '')
}
function repetitionKey(s: ChessPosition): string {
  const epRelevant = s.ep >= 0 && legalMoves(s).some((m) => m[3] === 'ep')
  return s.b.join('') + '/' + s.t + '/' + s.c + '/' + (epRelevant ? s.ep : -1)
}
function drawByMaterial(s: ChessPosition): boolean {
  const remaining: Array<[string, number]> = []
  for (let i = 0; i < 128; i++)
    if (onBoard(i) && s.b[i] !== '.' && s.b[i]!.toLowerCase() !== 'k')
      remaining.push([s.b[i]!.toLowerCase(), ((i >> 4) + (i & 7)) % 2])
  return (
    remaining.length === 0 ||
    (remaining.length === 1 && ['b', 'n'].includes(remaining[0]![0])) ||
    (remaining.length > 0 &&
      remaining.every((p) => p[0] === 'b') &&
      new Set(remaining.map((p) => p[1])).size === 1)
  )
}

export {
  onBoard,
  colorOf,
  squareName,
  squareIdx,
  moveKey,
  initialPosition,
  underAttack,
  inCheck,
  makePosition,
  pseudoMoves,
  legalMoves,
  notation,
  repetitionKey,
  drawByMaterial,
}
