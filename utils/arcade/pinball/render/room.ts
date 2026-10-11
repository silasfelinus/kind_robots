// /utils/arcade/pinball/render/room.ts
//
// The machine and the room it stands in (conductor kind-pinball/t-020).
// Silas, 2026-10-09: "splash background filler instead of blank screen". A
// wide screen showed the table as a lit column in black; FX3 stands its
// table in a lit room. This builds, around the playfield:
//
//   the cabinet: side panels with painted side art, the lockdown bar, the
//     front panel (coin door, start button), the legs, and a backglass of the
//     game's title art over the DMD;
//   the room: a tiled floor that takes the lamplight, a back wall with neon
//     and posters of the other Kind Robots arcade games, neighbouring
//     cabinets glowing with those games' title screens, and pendant lamps
//     each throwing a pool of light on the floor.
//
// None of it has a collider; the physics is the same with it or without.
// The cabinet hangs off the pitched table root; the room stands upright in
// the world. Light pools are additive decals rather than lights, so the low
// tier pays almost nothing; the high tier adds two spotlights.

import * as THREE from 'three'
import type { TableDef, Vec3 } from '../types'
import { artBounds } from './materials'
import type { QualityTier } from './quality'

type Track = <T extends { dispose(): void }>(resource: T) => T

/** Where the floor is, in the world, below the playfield's front edge. */
const FLOOR_Y = -1.0
/** The cabinet's depth below the playfield, and its sides' height above it. */
const CABINET_BELOW = 0.3
const CABINET_ABOVE = 0.13
const SIDE_THICK = 0.03
/** Neighbouring cabinets: their offsets either side, and how far back. */
const NEIGHBOURS: Array<{ x: number; z: number; yaw: number }> = [
  { x: -1.1, z: -0.5, yaw: 0.14 },
  { x: 1.1, z: -0.5, yaw: -0.14 },
  { x: -2.2, z: -0.8, yaw: 0.26 },
  { x: 2.2, z: -0.8, yaw: -0.26 },
]
const NEON = [0xf472b6, 0x22d3ee, 0xfacc15, 0xa78bfa]

/** A canvas to paint into, or null where there is no DOM (tests). */
function canvas(w: number, h: number): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c.getContext('2d')
}

export class Room {
  /** The room, upright in the world. */
  readonly world = new THREE.Group()
  /** The cabinet body, in table space (pitched with the playfield). */
  readonly cabinet = new THREE.Group()
  /** The backglass, which hides with the backbox when the room camera looks in. */
  readonly backglass: THREE.Mesh | null = null
  private spots: THREE.SpotLight[] = []
  private track: Track
  private loader: THREE.TextureLoader | null

  constructor(
    table: TableDef,
    track: Track,
    pitch: number,
    art: {
      backglass?: string
      backglassFallback?: string
      posters?: readonly string[]
    } = {},
  ) {
    this.track = track
    this.loader =
      typeof Image === 'undefined' ? null : new THREE.TextureLoader()
    const b = artBounds(table)
    const front = b.z1 + 0.06
    const back = b.z0 - 0.02
    const left = b.x0 - SIDE_THICK / 2
    const right = b.x1 + SIDE_THICK / 2
    this.buildCabinet(b, front, back, left, right, art.backglass)
    this.backglass = this.buildBackglass(
      table,
      b,
      art.backglass,
      art.backglassFallback,
    )
    this.buildLegs(pitch, front, back, left, right)
    this.buildRoom(art.posters ?? [], tableToWorld([0, 0, b.z0], pitch).z)
  }

  /** A texture loaded from the site's images (none in tests); fit to cover. */
  private image(
    src: string,
    aspect: number,
    fallback?: string,
    onLoad?: (texture: THREE.Texture) => void,
  ): THREE.Texture | null {
    if (!this.loader) return null
    // Cover the face: crop the image's longer side to the face's shape.
    const cover = (t: THREE.Texture) => {
      const img = t.image as { width: number; height: number }
      if (!img?.width) return
      const ratio = img.width / img.height / aspect
      if (ratio > 1) {
        t.repeat.set(1 / ratio, 1)
        t.offset.set((1 - 1 / ratio) / 2, 0)
      } else {
        t.repeat.set(1, ratio)
        t.offset.set(0, (1 - ratio) / 2)
      }
    }
    const loader = this.loader
    const texture = this.track(
      loader.load(
        src,
        (t) => {
          cover(t)
          onLoad?.(t)
        },
        undefined,
        () => {
          if (!fallback) return
          loader.load(fallback, (backup) => {
            texture.image = backup.image
            texture.needsUpdate = true
            cover(texture)
            backup.dispose()
          })
        },
      ),
    )
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }

  private sideArt(): THREE.Texture | null {
    const g = canvas(512, 128)
    if (!g) return null
    // Night sky, a ribbon of village roofs, stars and a rainbow streak: the
    // table's own art direction on the cabinet's sides (no lettering).
    const sky = g.createLinearGradient(0, 0, 0, 128)
    sky.addColorStop(0, '#2e1065')
    sky.addColorStop(1, '#0b0620')
    g.fillStyle = sky
    g.fillRect(0, 0, 512, 128)
    const streak = g.createLinearGradient(0, 0, 512, 0)
    for (const [i, c] of [
      '#f472b6',
      '#fb923c',
      '#facc15',
      '#4ade80',
      '#22d3ee',
      '#a78bfa',
    ].entries())
      streak.addColorStop(i / 5, c)
    g.fillStyle = streak
    g.globalAlpha = 0.85
    g.fillRect(0, 70, 512, 6)
    g.globalAlpha = 1
    for (let i = 0; i < 70; i++) {
      g.fillStyle = `rgba(255,255,255,${0.3 + ((i * 37) % 7) / 10})`
      g.fillRect((i * 97) % 512, (i * 53) % 60, 2, 2)
    }
    g.fillStyle = '#120a2a'
    for (let x = 0; x < 512; x += 46) {
      const h = 18 + ((x * 7) % 14)
      g.fillRect(x, 128 - h, 34, h)
      g.beginPath()
      g.moveTo(x - 4, 128 - h)
      g.lineTo(x + 17, 128 - h - 14)
      g.lineTo(x + 38, 128 - h)
      g.fill()
      g.fillStyle = '#fbbf24'
      g.fillRect(x + 12, 128 - h + 6, 6, 6)
      g.fillStyle = '#120a2a'
    }
    const texture = this.track(new THREE.CanvasTexture(g.canvas))
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }

  private buildCabinet(
    b: { x0: number; x1: number; z0: number; z1: number },
    front: number,
    back: number,
    left: number,
    right: number,
    painted?: string,
  ) {
    const length = front - back
    const height = CABINET_BELOW + CABINET_ABOVE
    const midY = (CABINET_ABOVE - CABINET_BELOW) / 2
    const art = this.sideArt()
    const paint = this.track(
      new THREE.MeshStandardMaterial({
        color: art ? 0xffffff : 0x3b0764,
        map: art,
        roughness: 0.45,
        metalness: 0.1,
      }),
    )
    const trim = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xd4d4d8,
        metalness: 1,
        roughness: 0.25,
      }),
    )
    const black = this.track(
      new THREE.MeshStandardMaterial({ color: 0x0b0b12, roughness: 0.7 }),
    )
    const side = this.track(new THREE.BoxGeometry(SIDE_THICK, height, length))
    for (const x of [left - SIDE_THICK / 2, right + SIDE_THICK / 2]) {
      const panel = new THREE.Mesh(side, paint)
      panel.position.set(x, midY, (front + back) / 2)
      panel.castShadow = true
      this.cabinet.add(panel)
      // The chrome side rail along its top.
      const rail = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(SIDE_THICK + 0.004, 0.008, length)),
        trim,
      )
      rail.position.set(x, CABINET_ABOVE + 0.004, (front + back) / 2)
      this.cabinet.add(rail)
      // Chrome corner armour at each end of the side's top edge (t-030).
      for (const z of [front - 0.03, back + 0.03]) {
        const armour = new THREE.Mesh(
          this.track(new THREE.BoxGeometry(SIDE_THICK + 0.008, 0.06, 0.06)),
          trim,
        )
        armour.position.set(x, CABINET_ABOVE - 0.026, z)
        this.cabinet.add(armour)
      }
    }
    // The side art echoes the backglass once its painting loads (t-030),
    // as on a real machine; until then the painted night village stands.
    if (painted)
      this.image(painted, length / height, undefined, (texture) => {
        paint.map = texture
        paint.needsUpdate = true
      })
    const width = right - left + SIDE_THICK * 2
    // The lockdown bar over the front of the glass.
    const bar = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(width, 0.018, 0.05)),
      trim,
    )
    bar.position.set((left + right) / 2, CABINET_ABOVE + 0.004, front - 0.02)
    this.cabinet.add(bar)
    // The front panel, with its coin door and a glowing start button.
    const panel = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(width, height, 0.02)),
      black,
    )
    panel.position.set((left + right) / 2, midY, front + 0.01)
    this.cabinet.add(panel)
    const door = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.16, 0.16, 0.006)),
      trim,
    )
    door.position.set((left + right) / 2, -0.12, front + 0.022)
    this.cabinet.add(door)
    const slot = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x1f0a0a,
        emissive: 0xff3b30,
        emissiveIntensity: 1.6,
      }),
    )
    for (const dx of [-0.035, 0.035]) {
      const s = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(0.018, 0.04, 0.004)),
        slot,
      )
      s.position.set((left + right) / 2 + dx, -0.09, front + 0.026)
      this.cabinet.add(s)
    }
    const start = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(0.012, 0.012, 0.01, 20)),
      this.track(
        new THREE.MeshStandardMaterial({
          color: 0x14532d,
          emissive: 0x4ade80,
          emissiveIntensity: 2.2,
        }),
      ),
    )
    start.rotation.x = Math.PI / 2
    start.position.set(left + 0.04, 0.06, front + 0.024)
    this.cabinet.add(start)
    void b
  }

  private buildBackglass(
    table: TableDef,
    b: { x0: number; x1: number },
    src?: string,
    fallback?: string,
  ): THREE.Mesh | null {
    const backbox = table.occluders?.find((o) => o.id === 'backbox')
    const dmd = table.dmd
    if (!backbox || !dmd) return null
    const top = backbox.at[1] + backbox.half[1]
    const bottom = dmd.at[1] + dmd.width / 8 + 0.012
    const width = backbox.half[0] * 2 - 0.03
    const height = top - bottom - 0.012
    if (height <= 0.02) return null
    const face = backbox.at[2] + backbox.half[2] + 0.002
    const map = src ? this.image(src, width / height, fallback) : null
    const glass = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(width, height)),
      this.track(
        new THREE.MeshStandardMaterial({
          color: map ? 0xffffff : 0x4c1d95,
          map,
          emissive: 0xffffff,
          emissiveMap: map,
          emissiveIntensity: map ? 0.55 : 0,
          roughness: 0.3,
        }),
      ),
    )
    glass.position.set((b.x0 + b.x1) / 2, bottom + height / 2, face)
    this.cabinet.add(glass)
    return glass
  }

  /** Four legs from the cabinet's corners to the floor, upright in the world. */
  private buildLegs(
    pitch: number,
    front: number,
    back: number,
    left: number,
    right: number,
  ) {
    const chrome = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xa1a1aa,
        metalness: 1,
        roughness: 0.3,
      }),
    )
    for (const z of [front - 0.04, back + 0.06]) {
      for (const x of [left + 0.02, right - 0.02]) {
        const foot = tableToWorld([x, -CABINET_BELOW, z], pitch)
        const length = foot.y - FLOOR_Y
        if (length <= 0) continue
        const leg = new THREE.Mesh(
          this.track(new THREE.CylinderGeometry(0.016, 0.02, length, 12)),
          chrome,
        )
        leg.position.set(foot.x, FLOOR_Y + length / 2, foot.z)
        this.world.add(leg)
      }
    }
  }

  private buildRoom(posters: readonly string[], farZ: number) {
    // The floor: dark tiles that take the lamps' pools of light.
    const g = canvas(256, 256)
    let tiles: THREE.Texture | null = null
    if (g) {
      g.fillStyle = '#100a24'
      g.fillRect(0, 0, 256, 256)
      g.fillStyle = '#1a1036'
      g.fillRect(0, 0, 128, 128)
      g.fillRect(128, 128, 128, 128)
      tiles = this.track(new THREE.CanvasTexture(g.canvas))
      tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping
      tiles.repeat.set(8, 8)
      tiles.colorSpace = THREE.SRGBColorSpace
    }
    const floor = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(12, 12)),
      this.track(
        new THREE.MeshStandardMaterial({
          color: tiles ? 0xffffff : 0x140c2c,
          map: tiles,
          roughness: 0.35,
          metalness: 0.2,
        }),
      ),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.set(0, FLOOR_Y, -1)
    floor.receiveShadow = true
    this.world.add(floor)

    // The back wall, with neon along it and the other games' posters.
    const wall = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(12, 5)),
      this.track(
        new THREE.MeshStandardMaterial({ color: 0x2a1650, roughness: 0.9 }),
      ),
    )
    wall.position.set(0, FLOOR_Y + 2.5, -3)
    this.world.add(wall)
    NEON.forEach((color, i) => {
      const tube = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(2.6, 0.025, 0.025)),
        this.track(
          new THREE.MeshBasicMaterial({
            color: new THREE.Color(color).multiplyScalar(2.2),
          }),
        ),
      )
      tube.position.set((i - 1.5) * 2.8, FLOOR_Y + 2.35 + (i % 2) * 0.06, -2.97)
      this.world.add(tube)
    })
    posters.slice(0, 4).forEach((src, i) => {
      const map = this.image(src, 0.75)
      const poster = new THREE.Mesh(
        this.track(new THREE.PlaneGeometry(0.75, 1)),
        this.track(
          new THREE.MeshStandardMaterial({
            color: map ? 0xffffff : NEON[i % NEON.length],
            map,
            emissive: 0xffffff,
            emissiveMap: map,
            emissiveIntensity: map ? 0.35 : 0,
            roughness: 0.6,
          }),
        ),
      )
      poster.position.set((i - 1.5) * 1.6, FLOOR_Y + 1.7, -2.98)
      this.world.add(poster)
    })

    // Neighbouring cabinets, each showing another game's title screen.
    NEIGHBOURS.forEach((spot, i) => {
      const src = posters[(i + 4) % Math.max(1, posters.length)]
      this.world.add(this.neighbour(spot, src, NEON[i % NEON.length]!))
    })

    // A pendant lamp over each machine, and its pool of light on the floor.
    // This machine's hangs past the far end of its cabinet, clear of the
    // view down the table however long the table is.
    const pool = this.lightPool()
    for (const x of [0, ...NEIGHBOURS.map((n) => n.x)]) {
      const z = x === 0 ? farZ - 0.25 : NEIGHBOURS.find((n) => n.x === x)!.z
      const shade = new THREE.Mesh(
        this.track(new THREE.ConeGeometry(0.16, 0.12, 24, 1, true)),
        this.track(
          new THREE.MeshStandardMaterial({
            color: 0x1f1f2e,
            metalness: 0.6,
            roughness: 0.4,
            side: THREE.DoubleSide,
          }),
        ),
      )
      shade.position.set(x, FLOOR_Y + 2.1, z)
      const bulb = new THREE.Mesh(
        this.track(new THREE.CircleGeometry(0.15, 24)),
        this.track(new THREE.MeshBasicMaterial({ color: 0xfff1d6 })),
      )
      bulb.rotation.x = Math.PI / 2
      bulb.position.set(x, FLOOR_Y + 2.04, z)
      const cord = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(0.004, 0.004, 1)),
        this.track(new THREE.MeshBasicMaterial({ color: 0x050505 })),
      )
      cord.position.set(x, FLOOR_Y + 2.66, z)
      this.world.add(shade, bulb, cord)
      if (pool) {
        const decal = new THREE.Mesh(
          this.track(new THREE.PlaneGeometry(1.6, 1.6)),
          pool,
        )
        decal.rotation.x = -Math.PI / 2
        decal.position.set(x, FLOOR_Y + 0.002, z + 0.1)
        this.world.add(decal)
      }
      if (x !== 0) {
        const spot = new THREE.SpotLight(0xfff1d6, 6, 3.2, 0.6, 0.6, 1.5)
        spot.position.set(x, FLOOR_Y + 2.0, z)
        spot.target.position.set(x, FLOOR_Y, z)
        spot.visible = false
        this.world.add(spot, spot.target)
        this.spots.push(spot)
      }
    }
  }

  /** A soft round pool of warm light, drawn additively on the floor. */
  private lightPool(): THREE.MeshBasicMaterial | null {
    const g = canvas(128, 128)
    if (!g) return null
    const glow = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    glow.addColorStop(0, 'rgba(255,236,200,0.55)')
    glow.addColorStop(0.5, 'rgba(255,200,150,0.18)')
    glow.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = glow
    g.fillRect(0, 0, 128, 128)
    const map = this.track(new THREE.CanvasTexture(g.canvas))
    return this.track(
      new THREE.MeshBasicMaterial({
        map,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    )
  }

  private neighbour(
    spot: { x: number; z: number; yaw: number },
    src: string | undefined,
    accent: number,
  ): THREE.Group {
    const group = new THREE.Group()
    group.position.set(spot.x, FLOOR_Y, spot.z)
    group.rotation.y = spot.yaw
    const body = this.track(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(accent).multiplyScalar(0.25),
        roughness: 0.5,
        metalness: 0.2,
      }),
    )
    const dark = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x07060d,
        roughness: 0.15,
        metalness: 0.4,
      }),
    )
    // The body on its legs, its glass, and the backbox with a lit screen.
    const cab = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.62, 0.32, 1.1)),
      body,
    )
    cab.position.set(0, 0.86, 0)
    cab.rotation.x = 0.11
    // Its playfield, lit from within under the glass: the game's own art.
    const field = src ? this.image(src, 0.58 / 1.06) : null
    const glass = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.58, 0.006, 1.06)),
      field
        ? this.track(
            new THREE.MeshStandardMaterial({
              color: 0xffffff,
              map: field,
              emissive: 0xffffff,
              emissiveMap: field,
              emissiveIntensity: 0.45,
              roughness: 0.12,
              metalness: 0.1,
            }),
          )
        : dark,
    )
    glass.position.set(0, 1.03, 0)
    glass.rotation.x = 0.11
    const box = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.66, 0.7, 0.14)),
      body,
    )
    box.position.set(0, 1.38, -0.56)
    const map = src ? this.image(src, 0.58 / 0.5) : null
    const screen = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(0.58, 0.5)),
      this.track(
        new THREE.MeshBasicMaterial({
          color: map ? 0xffffff : new THREE.Color(accent).multiplyScalar(0.8),
          map,
        }),
      ),
    )
    screen.position.set(0, 1.4, -0.488)
    const marquee = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(0.6, 0.07)),
      this.track(
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(accent).multiplyScalar(1.8),
        }),
      ),
    )
    marquee.position.set(0, 1.69, -0.488)
    const legGeo = this.track(new THREE.CylinderGeometry(0.014, 0.018, 0.72))
    const chrome = this.track(
      new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 1 }),
    )
    for (const [x, z] of [
      [-0.27, 0.48],
      [0.27, 0.48],
      [-0.27, -0.48],
      [0.27, -0.48],
    ] as const) {
      const leg = new THREE.Mesh(legGeo, chrome)
      leg.position.set(x, 0.36, z)
      group.add(leg)
    }
    // Neon trim along the body's top edges and the backbox.
    const neon = this.track(
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(accent).multiplyScalar(2),
      }),
    )
    const edge = this.track(new THREE.BoxGeometry(0.012, 0.012, 1.1))
    for (const x of [-0.31, 0.31]) {
      const strip = new THREE.Mesh(edge, neon)
      strip.position.set(x, 1.02, 0)
      strip.rotation.x = 0.11
      group.add(strip)
    }
    const rim = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(0.68, 0.012, 0.012)),
      neon,
    )
    rim.position.set(0, 1.735, -0.49)
    group.add(cab, glass, box, screen, marquee, rim)
    return group
  }

  /** How many neighbour spotlights are on, for tests. */
  get spotsLit(): number {
    return this.spots.filter((spot) => spot.visible).length
  }

  /** Spotlights on the neighbours on the high tier only. */
  setTier(tier: QualityTier) {
    for (const spot of this.spots) spot.visible = tier === 'high'
  }

  /** The cabinet's backglass fades with the backbox (the room camera looks past it). */
  setBackglassOpacity(opacity: number) {
    if (!this.backglass) return
    this.backglass.visible = opacity > 0.5
  }
}

/** The world point under a table-space point. */
export function tableToWorld(at: Vec3, pitch: number): THREE.Vector3 {
  return new THREE.Vector3(...at).applyAxisAngle(
    new THREE.Vector3(1, 0, 0),
    pitch,
  )
}
