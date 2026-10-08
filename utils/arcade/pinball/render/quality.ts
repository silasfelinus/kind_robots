// /utils/arcade/pinball/render/quality.ts
//
// Quality tiers for the pinball renderer (conductor kind-pinball/t-019).
// The tier is chosen from measured frame time, never from the user agent:
// the renderer starts at high and steps down while frames run slow, and
// tries one step up again only after a long run of full-rate frames. A tier
// that has been stepped down from is never retried in the same session, so
// a device on the edge does not flicker between two tiers.
//
// Every tier keeps the same geometry, rules and physics; only the cost of
// drawing them changes. Pure logic, so tests can drive it with fake timings.

export type QualityTier = 'high' | 'medium' | 'low'

export const QUALITY_TIERS: readonly QualityTier[] = ['high', 'medium', 'low']

export type TierSettings = {
  /** The highest device pixel ratio drawn at. */
  maxPixelRatio: number
  /** Shadow map size, or 0 for contact shadows only. */
  shadowMapSize: number
  /** Static scenery casts shadow-map shadows too (not only moving parts). */
  staticShadows: boolean
  /** Bloom buffer scale against the drawing buffer, or 0 for no bloom. */
  bloomScale: number
  /** Multisampling on the post-processing buffer. */
  samples: number
  /** Dynamic flasher lights in the pool (flashers past this glow only). */
  flasherLights: number
  /** GI point lights along the rails and slings. */
  giLights: number
  /** How dark the contact shadow under each ball is. */
  contactShadow: number
}

export const TIER_SETTINGS: Record<QualityTier, TierSettings> = {
  high: {
    maxPixelRatio: 2,
    shadowMapSize: 2048,
    staticShadows: true,
    bloomScale: 1,
    samples: 4,
    flasherLights: 4,
    giLights: 4,
    contactShadow: 0.35,
  },
  medium: {
    maxPixelRatio: 1.5,
    shadowMapSize: 1024,
    staticShadows: false,
    bloomScale: 0.5,
    samples: 2,
    flasherLights: 2,
    giLights: 2,
    contactShadow: 0.5,
  },
  low: {
    maxPixelRatio: 1,
    shadowMapSize: 0,
    staticShadows: false,
    bloomScale: 0,
    samples: 0,
    flasherLights: 0,
    giLights: 2,
    contactShadow: 0.65,
  },
}

/** Frames averaged before a judgement. */
const WINDOW = 60
/** Slower than this on average (ms, i.e. under ~50 FPS) steps down. */
const SLOW_MS = 20
/** Faster than this on average (ms) counts toward stepping up. */
const FAST_MS = 17.5
/** Full-rate frames in a row before one step up is tried (~10 s). */
const FAST_FRAMES = 600
/** Frames ignored after a change, while shaders compile and caches warm. */
const SETTLE_FRAMES = 90
/** A gap longer than this is a stall (tab hidden, GC), not a frame. */
const STALL_MS = 250

export class QualityGovernor {
  private current: QualityTier
  private samples: number[] = []
  private settle = SETTLE_FRAMES
  private fastRun = 0
  /** Tiers this session has stepped down from; they are not retried. */
  private failed = new Set<QualityTier>()
  private locked: boolean
  /** Every sample kept for stats (bounded). */
  private history: number[] = []

  constructor(start: QualityTier = 'high', locked = false) {
    this.current = start
    this.locked = locked
  }

  get tier(): QualityTier {
    return this.current
  }

  /** Pin a tier (tests, screenshots); null hands control back to timing. */
  force(tier: QualityTier | null) {
    if (tier) this.current = tier
    this.locked = tier !== null
    this.reset()
  }

  private reset() {
    this.samples = []
    this.settle = SETTLE_FRAMES
    this.fastRun = 0
  }

  /**
   * Record one frame's duration (ms). Returns the new tier when this frame
   * changed it, else null.
   */
  sample(ms: number): QualityTier | null {
    if (!(ms > 0) || ms > STALL_MS) return null
    this.history.push(ms)
    if (this.history.length > 600) this.history.shift()
    if (this.locked) return null
    if (this.settle > 0) {
      this.settle--
      return null
    }
    this.samples.push(ms)
    if (this.samples.length > WINDOW) this.samples.shift()
    if (this.samples.length < WINDOW) return null
    const average = this.samples.reduce((a, b) => a + b, 0) / WINDOW
    const index = QUALITY_TIERS.indexOf(this.current)
    if (average > SLOW_MS && index < QUALITY_TIERS.length - 1) {
      this.failed.add(this.current)
      this.current = QUALITY_TIERS[index + 1]!
      this.reset()
      return this.current
    }
    this.fastRun = average < FAST_MS ? this.fastRun + 1 : 0
    const higher = QUALITY_TIERS[index - 1]
    if (this.fastRun >= FAST_FRAMES && higher && !this.failed.has(higher)) {
      this.current = higher
      this.reset()
      return this.current
    }
    return null
  }

  /** Average and 95th-percentile frame time over the recent frames. */
  stats(): { averageMs: number; p95Ms: number; frames: number } {
    const n = this.history.length
    if (n === 0) return { averageMs: 0, p95Ms: 0, frames: 0 }
    const sorted = [...this.history].sort((a, b) => a - b)
    return {
      averageMs: this.history.reduce((a, b) => a + b, 0) / n,
      p95Ms: sorted[Math.min(n - 1, Math.floor(n * 0.95))]!,
      frames: n,
    }
  }
}
