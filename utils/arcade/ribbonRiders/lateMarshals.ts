import { INK, RAMPS, bevel, glow, shadedOrb } from '../snes'
import { ARENA_Y, CELL, GRID, idx } from './grid'
import type { Marshal, MarshalHost } from './marshals'

const hub = (cx: number, cy: number): number[] => {
  const cells: number[] = []
  for (let y = cy - 1; y <= cy + 1; y++)
    for (let x = cx - 1; x <= cx + 1; x++) cells.push(idx(x, y))
  return cells
}

const paintCells = (
  dyn: Uint8Array,
  cells: readonly number[],
  kind: number,
) => {
  for (const i of cells) dyn[i] = kind
}

const drawCells = (
  g: CanvasRenderingContext2D,
  cells: readonly number[],
  colour: string,
  alpha = 0.6,
) => {
  g.fillStyle = colour
  g.globalAlpha = alpha
  for (const i of cells)
    g.fillRect(
      (i % GRID) * CELL,
      ARENA_Y + Math.floor(i / GRID) * CELL,
      CELL,
      CELL,
    )
  g.globalAlpha = 1
}

const CAR_X = [10, 17, 24, 31, 38] as const
const CAR_Y = 14
const LOOSE_CAR_Y = 18
const ENGINE_Y = 24

/**
 * Five separate coaches, a timed switching yard, then an engine that writes a maze.
 * Each coach must be wrapped; only the last coach advances to the track phase.
 */
export class ClockworkConductor implements Marshal {
  readonly kind = 'conductor'
  readonly name = 'THE CLOCKWORK CONDUCTOR'
  readonly limit = 420
  phase = 1
  hits = 0
  defeated = false
  coaches = 0
  coachLoose = false
  engineX = 12
  private ticks = 0
  private lastBeat = -1
  private trail: number[] = []

  constructor(private host: MarshalHost) {}

  private coach(): number[] {
    return hub(CAR_X[Math.min(this.coaches, CAR_X.length - 1)]!, LOOSE_CAR_Y)
  }

  private tracks(beat = this.host.beat()): number[] {
    const active = beat % 4 < 2
    const cells: number[] = []
    for (let x = 5; x <= 42; x++) {
      if (x >= 20 && x <= 28) continue
      cells.push(idx(x, active ? 19 : 29))
    }
    return cells
  }

  private engine(): number[] {
    return hub(this.engineX, ENGINE_Y)
  }

  update() {
    if (this.defeated) return
    this.ticks++
    const beat = this.host.beat()
    if (beat !== this.lastBeat) {
      this.lastBeat = beat
      this.host.sfx('blip')
      if (this.phase === 1 && !this.coachLoose) {
        this.coachLoose = true
        for (const i of this.coach()) {
          this.host.bumpAt(i)
          this.host.clearCell(i)
        }
        this.host.say('A COACH UNCOUPLES!', 'WRAP THE GLOWING CAR')
      }
      if (this.phase === 2) {
        for (const i of this.tracks()) {
          this.host.bumpAt(i)
          this.host.clearCell(i)
        }
      }
    }
    if (this.phase !== 3 || this.ticks % 14 !== 0) return
    const next = 12 + (Math.floor(this.ticks / 14) % 25)
    this.trail.push(idx(this.engineX, ENGINE_Y))
    if (this.trail.length > 18) this.trail.shift()
    this.engineX = next
    for (const i of this.engine()) {
      this.host.bumpAt(i)
      this.host.clearCell(i)
    }
  }

  paint(dyn: Uint8Array) {
    if (this.defeated) return
    if (this.phase === 1) {
      for (let k = this.coaches; k < CAR_X.length; k++) {
        const loose = k === this.coaches && this.coachLoose
        paintCells(
          dyn,
          hub(CAR_X[k]!, loose ? LOOSE_CAR_Y : CAR_Y),
          loose ? 2 : 1,
        )
      }
    } else if (this.phase === 2) {
      paintCells(dyn, this.tracks(), 1)
      paintCells(dyn, hub(24, 24), 2)
    } else {
      paintCells(dyn, this.trail, 1)
      paintCells(dyn, this.engine(), 2)
    }
  }

  targets(): number[] {
    if (this.defeated) return []
    if (this.phase === 1) return this.coachLoose ? this.coach() : []
    return this.phase === 2 ? hub(24, 24) : this.engine()
  }

  danger(): number[] {
    if (this.defeated) return []
    if (this.phase === 1 && !this.coachLoose) return this.coach()
    if (this.phase === 2) return this.tracks(this.host.beat() + 1)
    if (this.phase === 3) return hub(Math.min(38, this.engineX + 1), ENGINE_Y)
    return []
  }

  wrapped(region: ReadonlySet<number>): boolean {
    if (!this.targets().some((i) => region.has(i))) return false
    this.host.sfx('level')
    for (const i of this.targets()) this.host.burst(i, true)
    if (this.phase === 1) {
      this.coaches++
      this.coachLoose = false
      if (this.coaches < CAR_X.length) {
        this.host.say(
          'COACH WRAPPED!',
          `${CAR_X.length - this.coaches} LEFT · WAIT FOR THE CHIME`,
        )
        return true
      }
      this.phase = 2
      this.hits = 1
      this.host.say('ALL COACHES WRAPPED!', 'THE TRACKS SWITCH ON THE CHIME')
    } else if (this.phase === 2) {
      this.phase = 3
      this.hits = 2
      this.ticks = 0
      this.host.say('THE ENGINE BREAKS FREE!', 'CLOSE THE LAST LOOP')
    } else {
      this.hits = 3
      this.defeated = true
      this.host.say('THE CONDUCTOR TAKES A BOW!', 'THE BAZAAR IS YOURS')
    }
    return true
  }

  rivalWrapped() {}

  render(g: CanvasRenderingContext2D, tick: number) {
    if (this.defeated) return
    if (this.phase === 2) drawCells(g, this.tracks(), RAMPS.gold[3])
    if (this.phase === 3) drawCells(g, this.trail, RAMPS.purple[3])
    const centers =
      this.phase === 1
        ? CAR_X.slice(this.coaches).map((x, i) => [
            x,
            i === 0 && this.coachLoose ? LOOSE_CAR_Y : CAR_Y,
          ])
        : [[this.phase === 2 ? 24 : this.engineX, ENGINE_Y]]
    for (const [x, y] of centers) {
      const px = x! * CELL - CELL
      const py = ARENA_Y + y! * CELL - CELL
      bevel(g, px, py, CELL * 3, CELL * 3, RAMPS.gold, {
        depth: 2,
        outline: INK,
      })
      const active =
        this.phase !== 1 || (this.coachLoose && x === CAR_X[this.coaches])
      if (active) glow(g, px + 9, py + 9, 16, RAMPS.ember[3], 0.5)
      shadedOrb(
        g,
        px + 9,
        py + 9,
        4,
        active ? (tick % 16 < 8 ? RAMPS.ember : RAMPS.gold) : RAMPS.steel,
      )
    }
  }
}

/**
 * The Loom Spinner first throws horizontal shuttles, then weaves a grid.
 * In phase three four short shuttle threads unravel. Capture each thread before the hub opens.
 */
export class LoomSpinner implements Marshal {
  readonly kind = 'loom'
  readonly name = 'THE LOOM SPINNER'
  readonly limit = 420
  phase = 1
  hits = 0
  defeated = false
  private lastBeat = -1
  private constCenter = hub(24, 24)
  private captured = new Set<number>()

  constructor(private host: MarshalHost) {}

  /** The unravelled shuttles can be claimed individually by closing a loop around them. */
  threadKnots(): number[][] {
    if (this.phase !== 3 || this.defeated) return []
    return [
      [12, 12],
      [36, 12],
      [12, 36],
      [36, 36],
    ]
      .map(([x, y]) => Array.from({ length: 5 }, (_, j) => idx(x! - 2 + j, y!)))
      .filter((_, i) => !this.captured.has(i))
  }

  threads(beat = this.host.beat()): number[] {
    if (this.defeated) return []
    if (this.phase === 3) return this.threadKnots().flat()
    const gap = 10 + (beat % 6) * 4
    const lines = this.phase === 1 ? [15, 31] : [13, 21, 29, 37]
    const cells: number[] = []
    for (const y of lines)
      for (let x = 5; x <= 42; x++)
        if (Math.abs(x - gap) > 3 && Math.abs(x - 24) > 2) cells.push(idx(x, y))
    if (this.phase === 2)
      for (const x of [13, 35])
        for (let y = 6; y <= 41; y++)
          if (Math.abs(y - (13 + (beat % 5) * 5)) > 3) cells.push(idx(x, y))
    return cells
  }

  update() {
    if (this.defeated) return
    const beat = this.host.beat()
    if (beat === this.lastBeat) return
    this.lastBeat = beat
    if (this.phase === 3) return
    this.host.sfx('warn')
    for (const i of this.threads()) {
      this.host.bumpAt(i)
      this.host.clearCell(i)
    }
  }

  paint(dyn: Uint8Array) {
    if (this.defeated) return
    const unravelled = this.phase === 3 && this.captured.size < 4
    paintCells(dyn, this.threads(), unravelled ? 2 : 1)
    paintCells(dyn, this.constCenter, unravelled ? 1 : 2)
  }

  targets(): number[] {
    if (this.defeated) return []
    if (this.phase === 3 && this.captured.size < 4)
      return this.threadKnots().flat()
    return this.constCenter
  }

  danger(): number[] {
    return this.phase === 3 || this.defeated
      ? []
      : this.threads(this.host.beat() + 1)
  }

  wrapped(region: ReadonlySet<number>): boolean {
    if (this.phase === 3 && this.captured.size < 4) {
      let hit = false
      const centers = [
        [12, 12],
        [36, 12],
        [12, 36],
        [36, 36],
      ]
      for (const [i, [x, y]] of centers.entries()) {
        if (this.captured.has(i)) continue
        const knot = Array.from({ length: 5 }, (_, j) => idx(x! - 2 + j, y!))
        if (!knot.every((cell) => region.has(cell))) continue
        this.captured.add(i)
        hit = true
        for (const cell of knot) this.host.burst(cell, true)
      }
      if (hit) {
        this.host.sfx('level')
        this.host.say(
          this.captured.size === 4 ? 'THE HEART IS OPEN!' : 'THREAD CLAIMED!',
          this.captured.size === 4
            ? 'WRAP THE LOOM'
            : `${this.captured.size}/4 SHUTTLES WRAPPED`,
        )
      }
      return hit
    }
    if (!this.targets().some((i) => region.has(i))) return false
    this.hits++
    for (const i of this.constCenter) this.host.burst(i, true)
    this.host.sfx('level')
    if (this.hits === 1) {
      this.phase = 2
      this.host.say('THE LOOM WEAVES A GRID!', 'FOLLOW THE MOVING GAP')
    } else if (this.hits === 2) {
      this.phase = 3
      this.host.say(
        'THE THREADS UNRAVEL!',
        'CLAIM FOUR SHUTTLES, THEN THE HEART',
      )
    } else {
      this.defeated = true
      this.host.say('THE STARS ARE WRAPPED!', 'THE LOOM BOWS')
    }
    return true
  }

  rivalWrapped() {}

  render(g: CanvasRenderingContext2D, tick: number) {
    if (this.defeated) return
    drawCells(
      g,
      this.threads(),
      this.phase === 3 ? RAMPS.gold[4] : RAMPS.sky[4],
      0.65,
    )
    const x = 23 * CELL
    const y = ARENA_Y + 23 * CELL
    bevel(g, x, y, CELL * 3, CELL * 3, RAMPS.purple, {
      depth: 2,
      outline: INK,
    })
    glow(g, x + 9, y + 9, 23, RAMPS.pink[3], 0.7)
    shadedOrb(g, x + 9, y + 9, 5, tick % 12 < 6 ? RAMPS.sky : RAMPS.pink)
  }
}
