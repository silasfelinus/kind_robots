// /utils/arcade/butterflyBlaster/puddle.ts
//
// Boss 2, Old Puddle (conductor kr-arcade/t-057, CABINETS.md section 6 "Moon 2"): a living
// overflow from Market Town's rain barrel, spreading along the ground with a grumpy face and
// three spouting mouths.
//
//   Phase 1  lily pads turn over its three mouths, and the mouths burp up wrigglers. Sparkle
//            whichever mouth the pads leave open; a pad just soaks a sparkle up.
//   Phase 2  it rains. Every drop that lands becomes a new mini-pool, and wrigglers rise from
//            them. Sparkle its two bubble eyes while you dodge the drops.
//   Phase 3  it rears up as a water spout and sweeps the sky. Catch AMI's lantern lure: the spout
//            chases the lantern, so carry it into the first sunbeam of dawn, and the sun dries
//            the spout out.

import { drawText } from '../font'
import { INK, RAMPS, glow, rgba, shadedOrb } from '../snes'
import type { Boss, BossHost } from './hum'
import { GROUND, SKY, W, wrapDist } from './sky'
import type { Point } from './sky'

export const PUDDLE = {
  mouths: [96, 176, 384] as readonly number[],
  mouthHp: 5,
  mouthR: 11,
  /** The pads turn to a new open mouth this often. */
  turn: 170,
  burp: 210,
  eyeHp: 8,
  eyeR: 10,
  rainEvery: 22,
  dropSpeed: 2.6,
  pools: 6,
  spoutW: 30,
  spoutSpeed: 1.3,
  /** The spout dries out after this long in the sunbeam. */
  dry: 80,
  sunW: 44,
  lureEvery: 300,
} as const

type Drop = { x: number; y: number }

export class Puddle implements Boss {
  readonly name = 'OLD PUDDLE'
  phase: 1 | 2 | 3 = 1
  t = 0
  /** Which mouth the pads leave open. */
  open = 0
  mouths: number[] = PUDDLE.mouths.map(() => PUDDLE.mouthHp)
  eyes = [PUDDLE.eyeHp, PUDDLE.eyeHp]
  drops: Drop[] = []
  pools = 0
  spoutX = W / 2
  spoutDir = 1
  sunX = 60
  drying = 0
  sinceLure = 0
  flash = 0
  exit = 0
  defeated = false

  get done() {
    return this.defeated && this.exit > 150
  }

  get health() {
    if (this.defeated) return 0
    if (this.phase === 1)
      return (
        2 / 3 +
        this.mouths.reduce((a, b) => a + b, 0) / (PUDDLE.mouthHp * 3) / 3
      )
    if (this.phase === 2)
      return 1 / 3 + (this.eyes[0]! + this.eyes[1]!) / (PUDDLE.eyeHp * 2) / 3
    return (1 - this.drying / PUDDLE.dry) / 3
  }

  get hint() {
    if (this.defeated) return 'DRIED OUT!'
    if (this.phase === 1) return 'SPARKLE THE MOUTH THE PADS LEAVE OPEN'
    if (this.phase === 2) return 'SPARKLE ITS BUBBLE EYES, DODGE THE RAIN'
    return 'CARRY THE LANTERN INTO THE SUNBEAM'
  }

  /** The hump of its body (eyes and face) sits here. */
  private get hump(): Point {
    return { x: W / 2, y: GROUND - 20 }
  }

  private eyeAt(i: number): Point {
    return { x: this.hump.x + (i ? 22 : -22), y: this.hump.y - 12 }
  }

  update(host: BossHost) {
    this.t++
    if (this.flash > 0) this.flash--
    if (this.defeated) {
      this.exit++
      return
    }
    if (this.phase === 1) {
      if (this.t % PUDDLE.turn === 0) {
        // The pads turn on to the next mouth still spouting.
        for (let k = 1; k <= 3; k++) {
          const next = (this.open + k) % 3
          if (this.mouths[next]! > 0) {
            this.open = next
            break
          }
        }
        host.sound('blip')
      }
      if (this.t % PUDDLE.burp === 0) {
        const live = this.mouths
          .map((hp, i) => (hp > 0 ? i : -1))
          .filter((i) => i >= 0)
        const i = live[Math.floor(host.rng() * live.length)]
        if (i !== undefined)
          host.spawnPest('wriggler', { x: PUDDLE.mouths[i]!, y: GROUND - 10 })
      }
      return
    }
    if (this.phase === 2) {
      if (this.t % PUDDLE.rainEvery === 0)
        this.drops.push({ x: 10 + host.rng() * (W - 20), y: -6 })
      for (const d of this.drops) d.y += PUDDLE.dropSpeed
      for (const d of this.drops.filter((d) => d.y >= GROUND - 2)) {
        if (this.pools < PUDDLE.pools && host.rng() < 0.35) {
          this.pools++
          host.addPool({ x: d.x, y: GROUND + 4 })
        }
      }
      this.drops = this.drops.filter((d) => d.y < GROUND - 2)
      return
    }
    // Phase 3: the spout chases AMI's lantern, or sweeps the sky.
    const lure = host.lure()
    this.sinceLure++
    if (!lure && this.sinceLure > PUDDLE.lureEvery) {
      this.sinceLure = 0
      host.dropKit('lure')
    }
    if (lure) {
      this.sinceLure = 0
      const dx = lure.x - this.spoutX
      this.spoutX +=
        Math.sign(dx) * Math.min(Math.abs(dx), PUDDLE.spoutSpeed * 1.2)
    } else {
      this.spoutX += this.spoutDir * PUDDLE.spoutSpeed
      if (this.spoutX < 30 || this.spoutX > W - 30) this.spoutDir *= -1
    }
    this.spoutX = Math.max(16, Math.min(W - 16, this.spoutX))
    if (Math.abs(this.spoutX - this.sunX) < PUDDLE.sunW / 2) {
      if (++this.drying >= PUDDLE.dry) {
        this.defeated = true
        host.score(15_000, { x: this.spoutX, y: GROUND - 60 }, 'DRIED OUT')
        host.sound('extra')
        host.burst({ x: this.spoutX, y: GROUND - 60 }, 40)
      }
    } else if (this.drying > 0) {
      this.drying--
    }
  }

  shot(at: Point, host: BossHost): boolean {
    if (this.defeated) return false
    if (this.phase === 1) {
      const i = PUDDLE.mouths.findIndex(
        (x, k) =>
          this.mouths[k]! > 0 &&
          wrapDist(at, { x, y: GROUND - 10 }) < PUDDLE.mouthR,
      )
      if (i < 0) return false
      if (i !== this.open) {
        host.sound('blip')
        return true
      }
      this.mouths[i]!--
      this.flash = 6
      host.sound('pop')
      host.score(150, at)
      if (this.mouths[i] === 0) {
        host.burst({ x: PUDDLE.mouths[i]!, y: GROUND - 10 }, 14)
        if (this.mouths.every((m) => m <= 0)) {
          this.phase = 2
          host.sound('boom')
        } else {
          this.open = this.mouths.findIndex((m) => m > 0)
        }
      }
      return true
    }
    if (this.phase === 2) {
      const i = [0, 1].find(
        (k) => this.eyes[k]! > 0 && wrapDist(at, this.eyeAt(k)) < PUDDLE.eyeR,
      )
      if (i === undefined) return false
      this.eyes[i]!--
      this.flash = 6
      host.sound('pop')
      host.score(150, at)
      if (this.eyes.every((e) => e <= 0)) {
        this.phase = 3
        this.drops = []
        this.spoutX = this.hump.x
        // The first sunbeam of dawn breaks on the far side from where the spout rises.
        this.sunX = host.rng() < 0.5 ? 60 : W - 60
        this.sinceLure = PUDDLE.lureEvery
        host.sound('boom')
      }
      return true
    }
    return false
  }

  lasso(): boolean {
    return false
  }

  touches(at: Point, r: number): boolean {
    if (this.defeated) return false
    if (
      this.phase === 2 &&
      this.drops.some((d) => Math.hypot(d.x - at.x, d.y - at.y) < 5 + r)
    )
      return true
    if (this.phase === 3)
      return (
        Math.abs(at.x - this.spoutX) < PUDDLE.spoutW / 2 + r - 4 && at.y > 54
      )
    // The puddle's body along the ground.
    return at.y > GROUND - 26 && Math.abs(at.x - this.hump.x) < 150
  }

  threats() {
    if (this.phase === 2)
      return this.drops.map((d) => ({ at: { x: d.x, y: d.y }, r: 5 }))
    if (this.phase === 3)
      return [
        {
          at: { x: this.spoutX, y: Math.max(60, Math.min(SKY - 30, 200)) },
          r: PUDDLE.spoutW,
        },
      ]
    return [{ at: this.hump, r: 40 }]
  }

  targets(): Point[] {
    if (this.phase === 1)
      return [{ x: PUDDLE.mouths[this.open]!, y: GROUND - 10 }]
    if (this.phase === 2)
      return [0, 1].filter((k) => this.eyes[k]! > 0).map((k) => this.eyeAt(k))
    return []
  }

  lassoMark(): Point | null {
    return null
  }

  goal(host: BossHost): Point | null {
    if (this.phase !== 3 || this.defeated) return null
    const lure = host.lure()
    return lure?.carried ? { x: this.sunX, y: 140 } : null
  }

  render(g: CanvasRenderingContext2D, tick: number) {
    const hump = this.hump
    if (this.phase === 3 && !this.defeated) {
      // The first sunbeam of dawn, slanting down.
      g.save()
      const beam = g.createLinearGradient(0, 0, 0, GROUND)
      beam.addColorStop(0, rgba(RAMPS.gold[4], 0.05))
      beam.addColorStop(1, rgba(RAMPS.gold[3], 0.4))
      g.fillStyle = beam
      g.fillRect(this.sunX - PUDDLE.sunW / 2, 0, PUDDLE.sunW, GROUND)
      g.restore()
      glow(g, this.sunX, GROUND - 20, 50, RAMPS.gold[3], 0.4)
      // The spout: a twisting column of water with a face at its crown.
      const x = this.spoutX
      const dry = this.drying / PUDDLE.dry
      for (let y = GROUND; y > 56; y -= 6) {
        const wob = Math.sin(tick / 6 + y / 14) * 4
        const w = PUDDLE.spoutW / 2 - (GROUND - y) / 40
        g.fillStyle = INK
        g.fillRect(Math.round(x + wob - w - 1), y - 6, Math.round(w * 2 + 2), 6)
        g.fillStyle =
          dry > 0.5
            ? RAMPS.cream[2]
            : (y / 6) % 2
              ? RAMPS.water[2]
              : RAMPS.water[3]
        g.fillRect(Math.round(x + wob - w), y - 6, Math.round(w * 2), 6)
      }
      this.face(g, x, 62, 1, tick)
      if (dry > 0) {
        drawText(g, 'DRYING!', x, 34, {
          align: 'center',
          color: RAMPS.gold[4],
          outline: INK,
        })
      }
      return
    }
    if (this.defeated) {
      drawText(g, 'POP! ALL DRIED UP', hump.x, GROUND - 70, {
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
      })
      return
    }
    // The overflow along the ground, a hump in the middle with its face.
    g.fillStyle = INK
    g.beginPath()
    g.ellipse(hump.x, GROUND + 2, 158, 14, 0, Math.PI, 0)
    g.fill()
    g.fillStyle = RAMPS.water[1]
    g.beginPath()
    g.ellipse(hump.x, GROUND + 2, 156, 12, 0, Math.PI, 0)
    g.fill()
    shadedOrb(g, hump.x, hump.y + 6, 30, RAMPS.water, { glint: true })
    this.face(g, hump.x, hump.y, 1, tick)
    if (this.phase === 2) {
      for (const k of [0, 1]) {
        const e = this.eyeAt(k)
        if (this.eyes[k]! <= 0) continue
        shadedOrb(
          g,
          e.x,
          e.y,
          PUDDLE.eyeR - 2,
          this.flash ? RAMPS.ember : RAMPS.water,
          {
            glint: true,
          },
        )
        g.fillStyle = INK
        g.fillRect(Math.round(e.x) - 1, Math.round(e.y) - 1, 3, 3)
      }
      for (const d of this.drops) {
        glow(g, d.x, d.y, 8, RAMPS.water[3], 0.5)
        shadedOrb(g, d.x, d.y, 3.5, RAMPS.water, { glint: false })
      }
    }
    if (this.phase === 1) {
      PUDDLE.mouths.forEach((x, i) => {
        const y = GROUND - 10
        if (this.mouths[i]! <= 0) return
        // The mouth: a gurgling ring of water.
        g.fillStyle = INK
        g.beginPath()
        g.ellipse(x, y, 12, 7, 0, 0, Math.PI * 2)
        g.fill()
        g.fillStyle = i === this.open ? RAMPS.water[3] : RAMPS.water[1]
        g.beginPath()
        g.ellipse(x, y, 10, 5, 0, 0, Math.PI * 2)
        g.fill()
        if (i !== this.open) {
          // A lily pad over it, with its notch and a flower.
          const spin = tick / 40 + i
          g.fillStyle = INK
          g.beginPath()
          g.arc(x, y - 2, 14, spin, spin + Math.PI * 1.8)
          g.lineTo(x, y - 2)
          g.fill()
          g.fillStyle = RAMPS.leaf[2]
          g.beginPath()
          g.arc(x, y - 2, 12, spin, spin + Math.PI * 1.8)
          g.lineTo(x, y - 2)
          g.fill()
          shadedOrb(g, x + 3, y - 5, 3, RAMPS.pink, { glint: false })
        } else if (Math.floor(tick / 10) % 2 === 0) {
          drawText(g, 'OPEN', x, y - 22, {
            align: 'center',
            color: RAMPS.water[4],
            outline: INK,
          })
        }
      })
    }
  }

  /** A grumpy cartoon face: two eyes and a wobbly frown. */
  private face(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    s: number,
    tick: number,
  ) {
    g.save()
    g.translate(Math.round(x), Math.round(y))
    g.scale(s, s)
    g.fillStyle = '#ffffff'
    g.fillRect(-12, -6, 7, 6)
    g.fillRect(5, -6, 7, 6)
    g.fillStyle = INK
    g.fillRect(-10, -4, 3, 3)
    g.fillRect(7, -4, 3, 3)
    g.fillRect(-13, -9, 8, 2)
    g.fillRect(5, -9, 8, 2)
    const wob = Math.round(Math.sin(tick / 8))
    g.fillRect(-6, 6 + wob, 12, 2)
    g.fillRect(-8, 8 + wob, 2, 2)
    g.fillRect(6, 8 + wob, 2, 2)
    g.restore()
  }
}
