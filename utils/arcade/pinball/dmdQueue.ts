// /utils/arcade/pinball/dmdQueue.ts
//
// The DMD scene queue (conductor kind-pinball/t-006): which scene the dot
// display shows, and for how long. Pure and clocked in milliseconds, so the
// whole display can be tested without WebGL or a canvas.
//
// Every scene has a priority, a duration and a minimum display time. A
// higher-priority scene takes the display once the current one has had its
// minimum; anything else waits its turn, and celebrations that wait too long
// are dropped rather than played late. A tilt or game over shows at once.
// Gameplay timers (a mode countdown)
// outrank celebrations: a jackpot may interrupt one only briefly, and the
// timer comes back afterwards where it was. With nothing to show, the score
// is up (the idle scene, which anything may interrupt).

export type DmdSceneId =
  | 'message'
  | 'ball'
  | 'skill-shot'
  | 'lock'
  | 'mode-intro'
  | 'mode-total'
  | 'bonus'
  | 'match'
  | 'multiball'
  | 'extra-ball'
  | 'wizard'
  | 'jackpot'
  | 'super-jackpot'
  | 'mode-timer'
  | 'tilt-warning'
  | 'tilt'
  | 'game-over'

/** What a scene is asked to show. */
export type DmdRequest = {
  scene: DmdSceneId
  text?: string
  sub?: string
  /** A score, award, countdown (seconds) or match number. */
  value?: number
  /** Bonus count lines. */
  items?: ReadonlyArray<{ label: string; value: number }>
  /** Overrides the scene's own duration. */
  ms?: number
}

export type DmdSceneSpec = {
  priority: number
  /** How long it shows; Infinity until cleared. */
  durationMs: number
  /** No equal-or-lower scene, and no higher one, takes over before this. */
  minMs: number
  /** Preempted, it waits and resumes where it was instead of being dropped. */
  resumable?: boolean
  /** A gameplay timer: celebrations only interrupt it briefly. */
  timer?: boolean
  /** Shows at once, whatever is up has had its minimum or not (a tilt). */
  urgent?: boolean
}

const PERSISTENT = Number.POSITIVE_INFINITY

export const DMD_SCENES: Record<DmdSceneId, DmdSceneSpec> = {
  message: { priority: 30, durationMs: 1800, minMs: 500 },
  ball: { priority: 40, durationMs: 1500, minMs: 800 },
  'skill-shot': { priority: 50, durationMs: 2000, minMs: 800 },
  lock: { priority: 55, durationMs: 2000, minMs: 800 },
  'mode-intro': { priority: 60, durationMs: 2200, minMs: 1000 },
  'mode-total': { priority: 60, durationMs: 2000, minMs: 800 },
  bonus: { priority: 65, durationMs: 4000, minMs: 4000 },
  match: { priority: 65, durationMs: 3000, minMs: 3000 },
  multiball: { priority: 70, durationMs: 2500, minMs: 1000 },
  'extra-ball': { priority: 75, durationMs: 2500, minMs: 1000 },
  wizard: { priority: 75, durationMs: 3000, minMs: 1500 },
  jackpot: { priority: 80, durationMs: 2000, minMs: 600 },
  'super-jackpot': { priority: 85, durationMs: 2500, minMs: 800 },
  'mode-timer': {
    priority: 90,
    durationMs: PERSISTENT,
    minMs: 0,
    resumable: true,
    timer: true,
  },
  'tilt-warning': { priority: 95, durationMs: 1200, minMs: 600, urgent: true },
  tilt: { priority: 100, durationMs: PERSISTENT, minMs: 0, urgent: true },
  'game-over': { priority: 100, durationMs: 4000, minMs: 4000, urgent: true },
}

/** A celebration at or above this priority may briefly interrupt a timer. */
export const TIMER_INTERRUPT_PRIORITY = 70
/** ...for at most this long, then the timer is back. */
export const TIMER_INTERRUPT_MS = 1000
/** A scene that waited this long without showing is dropped (it is stale). */
export const MAX_WAIT_MS = 3000
/** Ms per bonus line, and the total's hold after the last one. */
export const BONUS_LINE_MS = 600
export const BONUS_TOTAL_MS = 1500

export type DmdShowing = {
  request: DmdRequest
  spec: DmdSceneSpec
  /** Ms this scene has been on the display. */
  elapsed: number
  /** How long it shows this time (a timer interrupt is clamped). */
  durationMs: number
  /** Queue clock when it was requested, and the order it was. */
  queuedAt: number
  seq: number
}

function durationFor(request: DmdRequest, spec: DmdSceneSpec): number {
  if (request.ms !== undefined) return request.ms
  if (request.scene === 'bonus')
    return (request.items?.length ?? 0) * BONUS_LINE_MS + BONUS_TOTAL_MS
  return spec.durationMs
}

export class DmdQueue {
  /** Queue clock, ms. */
  now = 0
  private current: DmdShowing | null = null
  /** Requested scenes waiting, and preempted resumable ones. */
  private waiting: DmdShowing[] = []
  private seq = 0

  /** The scene on the display, or null for the idle score. */
  get showing(): DmdShowing | null {
    return this.current
  }

  /** Every scene waiting its turn (for tests). */
  get pending(): readonly DmdShowing[] {
    return this.waiting
  }

  push(request: DmdRequest) {
    const spec = DMD_SCENES[request.scene]
    // A timer already up or waiting takes the new numbers in place.
    if (spec.timer) {
      const same = [this.current, ...this.waiting].find(
        (s) => s?.request.scene === request.scene,
      )
      if (same) {
        same.request = request
        return
      }
    }
    this.waiting.push({
      request,
      spec,
      elapsed: 0,
      durationMs: durationFor(request, spec),
      queuedAt: this.now,
      seq: this.seq++,
    })
    this.settle()
  }

  /** Take a scene off the display and out of the queue (a mode ends, a tilt clears). */
  clear(scene: DmdSceneId) {
    this.waiting = this.waiting.filter((s) => s.request.scene !== scene)
    if (this.current?.request.scene === scene) this.current = null
    this.settle()
  }

  /** Everything off: a new game. */
  reset() {
    this.current = null
    this.waiting = []
  }

  tick(ms: number) {
    this.now += ms
    if (this.current) {
      this.current.elapsed += ms
      if (this.current.elapsed >= this.current.durationMs) this.current = null
    }
    this.waiting = this.waiting.filter(
      (s) => s.spec.resumable || this.now - s.queuedAt < MAX_WAIT_MS,
    )
    this.settle()
  }

  private best(): DmdShowing | undefined {
    let best: DmdShowing | undefined
    for (const s of this.waiting) {
      if (
        !best ||
        s.spec.priority > best.spec.priority ||
        (s.spec.priority === best.spec.priority && s.seq < best.seq)
      )
        best = s
    }
    return best
  }

  /** May `next` take the display from what is showing now? */
  private mayPreempt(next: DmdShowing): boolean {
    const now = this.current
    if (!now) return true
    if (next.spec.urgent) return next.spec.priority > now.spec.priority
    if (now.elapsed < now.spec.minMs) return false
    if (now.spec.timer && !next.spec.timer)
      return next.spec.priority >= TIMER_INTERRUPT_PRIORITY
    return next.spec.priority > now.spec.priority
  }

  /** Put the right scene up. */
  private settle() {
    const next = this.best()
    if (!next || !this.mayPreempt(next)) return
    this.waiting = this.waiting.filter((s) => s !== next)
    const was = this.current
    if (was?.spec.resumable) this.waiting.push(was)
    // While a timer is anywhere underneath, no celebration holds the display
    // for long: the countdown is what the player needs. What outranks the
    // timer itself (a tilt, game over) keeps its own length.
    const timer = this.waiting.find((s) => s.spec.timer)
    if (timer && next.spec.priority < timer.spec.priority)
      next.durationMs =
        Math.min(next.durationMs - next.elapsed, TIMER_INTERRUPT_MS) +
        next.elapsed
    this.current = next
  }
}
