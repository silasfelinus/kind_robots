// /utils/arcade/pinball/render/croc.ts
//
// The River Croc (conductor zuzu-pinball/t-015, redrawn for t-019): Zuzu's
// toy on the left bank, the table's signature piece. Scenery only: the
// physics has the mouth's scoop and its jaw gate, and the rules decide the
// phase. He is drawn from generated art, in the house style of the Zuzu
// concept art: the Arthemy key image Silas picked, its Kontext phase poses
// and the WAN clips between them, cut out and packed into one atlas
// (tables/zuzuLastBell/crocSprite.ts, baked by conductor's
// projects/zuzu-pinball/tools/croc_atlas.py). The art looks straight down,
// so he lies in the painted pond as an animated card, his snout at the
// scoop, and each phase plays its clips:
//
//   submerged   he sinks, then lurks with only his eyes up
//   rising      he surges up out of the water
//   open        jaws wide, breathing, waiting for the ball
//   captured    the jaws snap shut on it
//   death-roll  he rolls in a churn of foam
//   spit        he flings his jaws open and spits it back
//
// A glowing ring round his snout is the shot's aim cue: brighter when an
// orbit has lit him (hungry), churning while the Watering Hole runs. With
// reduced motion each phase holds one still and the ring holds steady.
//
// Every geometry, material and texture goes through the scene's track().

import * as THREE from 'three'
import type { AnimatronicDef, CrocSprite } from '../types'
import type { AnimatronicPose } from '../rules/ruleset'

type Track = <T extends { dispose(): void }>(resource: T) => T

/** One animation frame, seconds. */
const DT = 1 / 60
/** How fast the ring's glow follows the phase. */
const EASE = 0.22
/** The card's height above the playfield: on the water, under the ball. */
const CARD_Y = 0.0025
/** The card's side when the table gives none, metres. */
const SIZE = 0.18
/** Where his snout tip sits on the card, from its centre (fraction of the side, down the table). */
const SNOUT = 0.47
const WATER = 0x3fbfb0
/** The card's tint: the art's own colours, a shade down for the tone mapping. */
const SHADE = 0xc8c8c8

/** The clips each phase plays, in order; the last one loops or holds. */
const PLAYS: Record<string, readonly string[]> = {
  submerged: ['sink', 'lurk'],
  rising: ['rise'],
  open: ['open'],
  captured: ['snap'],
  'death-roll': ['roll'],
  spit: ['spit'],
}

export class CrocToy {
  readonly group = new THREE.Group()
  private sprite: CrocSprite | null
  private texture: THREE.Texture | null = null
  private ring: THREE.Mesh
  private ringMaterial: THREE.MeshStandardMaterial
  private pose: AnimatronicPose = { phase: 'open', age: 0 }
  private lastPhase = ''
  /** Seconds since the phase began, by our own frames. */
  private clock = 0
  private shown = -1
  private glow = 1
  private stir = 0
  private frameCount = 0
  private readonly still: boolean

  constructor(
    def: AnimatronicDef,
    track: Track,
    options: { reducedMotion?: boolean } = {},
  ) {
    this.still = options.reducedMotion ?? false
    this.sprite = def.sprite ?? null
    const size = def.size ?? SIZE
    this.group.position.set(def.at[0], def.at[1], def.at[2])
    this.group.rotation.y = def.yaw ?? 0
    this.group.scale.setScalar(def.scale ?? 1)

    // The card: flat on the water, the picture's top up the table.
    const card = new THREE.PlaneGeometry(size, size)
    card.rotateX(-Math.PI / 2)
    const loader =
      typeof Image === 'undefined' || !this.sprite
        ? null
        : new THREE.TextureLoader()
    if (loader && this.sprite) {
      const texture = track(loader.load(this.sprite.src))
      texture.colorSpace = THREE.SRGBColorSpace
      texture.repeat.set(1 / this.sprite.cols, 1 / this.sprite.rows)
      this.texture = texture
    }
    // Unlit: the art carries its own inked light and shade, which the
    // table's lamps would only wash out; a touch under white so the
    // tone mapping keeps his colours where the artist put them.
    const art = track(
      new THREE.MeshBasicMaterial({
        map: this.texture,
        color: SHADE,
        transparent: true,
        alphaTest: 0.02,
        depthWrite: false,
        visible: Boolean(this.texture),
      }),
    )
    const mesh = new THREE.Mesh(track(card), art)
    mesh.position.y = CARD_Y
    mesh.renderOrder = 3
    this.group.add(mesh)

    // The aim cue: a glowing ring round his snout, just under the card.
    this.ringMaterial = track(
      new THREE.MeshStandardMaterial({
        color: WATER,
        emissive: WATER,
        emissiveIntensity: 1,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      }),
    )
    this.ring = new THREE.Mesh(
      track(new THREE.TorusGeometry(size * 0.16, 0.002, 8, 40)),
      this.ringMaterial,
    )
    this.ring.rotation.x = -Math.PI / 2
    this.ring.position.set(0, CARD_Y - 0.0008, size * (SNOUT - 0.08))
    this.ring.renderOrder = 2
    this.group.add(this.ring)
  }

  setPose(pose: AnimatronicPose) {
    if (pose.phase !== this.lastPhase) this.clock = 0
    this.pose = pose
    this.lastPhase = pose.phase
  }

  /**
   * The balls on the table. The drawn croc looks where his art looks; kept
   * so the scene can hand every toy the balls.
   */
  watch(
    _balls: ReadonlyArray<{
      position: readonly [number, number, number]
      captured?: boolean
    }>,
  ) {}

  /** One frame toward the pose. */
  animate() {
    this.frameCount++
    const { phase, cue } = this.pose
    this.show(this.frameFor(phase, this.clock))
    this.clock += DT

    const hungry = cue === 'hungry'
    const swell = (rate: number) =>
      this.still ? 0 : Math.sin(this.frameCount * rate)
    const glow =
      phase === 'submerged'
        ? 0.2
        : phase === 'death-roll'
          ? this.still
            ? 3.2
            : 2.6
          : phase === 'captured'
            ? 2.2
            : (hungry ? 1.8 : 1) + 0.5 * swell(0.12)
    const stir = hungry ? 1 : cue === 'watering-hole' ? 0.5 : 0
    this.glow += (glow - this.glow) * EASE
    this.stir += (stir - this.stir) * EASE
    this.ringMaterial.emissiveIntensity =
      0.25 + this.glow * 0.35 + this.stir * (0.9 + 0.4 * swell(0.3))
    this.ring.scale.setScalar(
      (phase === 'death-roll' ? 1.25 : 1) +
        this.stir * (0.12 + 0.04 * swell(0.3)),
    )
  }

  /** The atlas frame a phase shows `t` seconds in. */
  private frameFor(phase: string, t: number): number {
    const sprite = this.sprite
    if (!sprite) return -1
    const hold = sprite.holds[phase] ?? sprite.holds.open ?? 0
    if (this.still) return hold
    const clips = (PLAYS[phase] ?? [])
      .map((name) => sprite.clips[name])
      .filter((clip) => clip !== undefined)
    let left = t
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i]!
      const length = clip.count / clip.fps
      const lastClip = i === clips.length - 1
      if (left < length || lastClip) {
        let k = Math.floor(left * clip.fps)
        k = clip.loop ? k % clip.count : Math.min(k, clip.count - 1)
        return clip.first + k
      }
      left -= length
    }
    return hold
  }

  private show(index: number) {
    if (index === this.shown) return
    this.shown = index
    const sprite = this.sprite
    if (!sprite || !this.texture || index < 0) return
    const col = index % sprite.cols
    const row = Math.floor(index / sprite.cols)
    this.texture.offset.set(col / sprite.cols, 1 - (row + 1) / sprite.rows)
  }

  /** The atlas frame on show (for tests). */
  get frame(): number {
    return this.shown
  }

  /** The waterline cue's glow (for tests). */
  get waterline(): number {
    return this.ringMaterial.emissiveIntensity
  }
}
