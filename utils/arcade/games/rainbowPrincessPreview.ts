import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'
import {
  PINKWAKE,
  pinkwakeDialogue,
  pinkwakeScene,
  pinkwakeSpawn,
  pinkwakeStage,
  type PinkwakeEnemy,
} from './rainbowPinkwake'
import {
  BOSS_MAX_HP,
  bossTelegraph,
  createPinkwakeBoss,
  stepPinkwakeBoss,
  type PinkwakeBoss,
} from './rainbowPinkwakeBoss'
import {
  addCoopSeats,
  availableCoopTargets,
  coopEnemyHealth,
  haloRevive,
} from './rainbowLocalCoop'
import { enemyBulletContact } from './rainbowHitGeometry'
import {
  drawRainbowBossSprite,
  drawRainbowCommsPortrait,
  drawRainbowEnemySprite,
  drawRainbowPickupSprite,
  drawRainbowShipSprite,
} from './rainbowGameArt'
import {
  MOONJELLY,
  moonjellyDialogue,
  moonjellyScene,
  moonjellySpawn,
  moonjellyStage,
  type MoonjellyEnemy,
} from './rainbowMoonjelly'
import {
  AURELIA_MAX_HP,
  createMoonjellyBoss,
  moonjellyBossWarning,
  stepMoonjellyBoss,
  type MoonjellyBoss,
} from './rainbowMoonjellyBoss'

const W = 480
const H = 270
const SPEED = 2.6
const FOCUS_SPEED = SPEED * 0.55
const CORE_RADIUS = 4
const GRAZE_RADIUS = 15
const PILOT_COLORS = ['#ffd2ef', '#b8f8ff', '#ffe99f', '#b9a9ff'] as const
const SHIP_NAMES = ['PETAL', 'PRISM', 'HALO', 'COMET'] as const
const BURST_FRAMES = 42
/** HUD text clears the cabinet's corner chips (close/fullscreen left, pause right). */
const HUD_LEFT = 44
const HUD_RIGHT = W - 26

type Ship = {
  x: number
  y: number
  shield: number
  cooldown: number
  invulnerable: number
  power: number
  charge: number
  graze: number
  lives: number
  focus: boolean
}
type Shot = {
  x: number
  y: number
  vx: number
  vy: number
  seat: number
  damage: number
}
type Reef = {
  x: number
  y: number
  phase: number
  health: number
  kind: PinkwakeEnemy | MoonjellyEnemy
  fired: boolean
}
type EnemyShot = {
  x: number
  y: number
  vx: number
  vy: number
  grazed: number
}
type Pickup = { x: number; y: number; kind: 'power' | 'shield' | 'charge' }

export type RainbowCombatSnapshot = {
  tick: number
  score: number
  ships: ReadonlyArray<Readonly<Ship>>
  shots: ReadonlyArray<Readonly<Shot>>
  enemies: ReadonlyArray<Readonly<Reef>>
  enemyShots: ReadonlyArray<Readonly<EnemyShot>>
  pickups: ReadonlyArray<Readonly<Pickup>>
  act: 'S01' | 'S02'
  stage: ReturnType<typeof pinkwakeStage> | ReturnType<typeof moonjellyStage>
  sceneId:
    | 'A01.OPEN'
    | 'A01.TURN'
    | 'A01.AFTER'
    | 'A02.OPEN'
    | 'A02.TURN'
    | 'A02.AFTER'
    | null
  boss: Readonly<PinkwakeBoss> | null
  moonBoss: Readonly<MoonjellyBoss> | null
  rescuedNemi: boolean
  actTwoFrame: number
  rescuedStation: boolean
  defeatedAt: number | null
  activePlayers: number
}

/** The preview's deterministic 60 Hz combat layer; stages and bosses are separate work. */
export function createRainbowPrincessPreview(
  options: ArcadeGameOptions,
): ArcadeGameInstance & { readonly snapshot: RainbowCombatSnapshot } {
  const count = Math.max(1, Math.min(4, options.players ?? 1))
  let activePlayers = count
  const createShip = (seat: number): Ship => ({
    x: 65,
    y: 80 + seat * 32,
    shield: 3,
    cooldown: 0,
    invulnerable: 120,
    power: 1,
    charge: 0,
    graze: 0,
    lives: 3,
    focus: false,
  })
  const ships: Ship[] = Array.from({ length: count }, (_, seat) =>
    createShip(seat),
  )
  const shots: Shot[] = []
  const reefs: Reef[] = []
  const enemyShots: EnemyShot[] = []
  const pickups: Pickup[] = []
  let tick = 0
  let score = 0
  let over = false
  let clearCount = 0
  let supers = 0
  const bursts: Array<{ seat: number; x: number; y: number; age: number }> = []
  let boss: PinkwakeBoss | null = null
  let defeatedAt: number | null = null
  let rescuedStation = false
  let station: { x: number; y: number } | null = null
  let moonStart: number | null = null
  let moonBoss: MoonjellyBoss | null = null
  let moonDefeatedFrame: number | null = null
  let rescuedNemi = false
  let nemi: { x: number; y: number } | null = null
  function moonFrame() {
    return moonStart === null ? 0 : tick - moonStart
  }

  function defeatMoonBoss() {
    if (!moonBoss || moonDefeatedFrame !== null) return
    moonBoss = null
    moonDefeatedFrame = moonFrame()
    reefs.length = 0
    enemyShots.length = 0
    score += 3500
    for (const ship of ships.slice(0, activePlayers)) {
      ship.invulnerable = Math.max(ship.invulnerable, 240)
    }
    options.sound.play('level')
  }

  function setPlayers(requested: number) {
    activePlayers = addCoopSeats(ships, requested, createShip)
    for (let i = shots.length - 1; i >= 0; i--) {
      if (shots[i]!.seat >= activePlayers) shots.splice(i, 1)
    }
  }

  function spawn(kind: PinkwakeEnemy | MoonjellyEnemy) {
    reefs.push({
      x: W + 18,
      y: 40 + options.rng() * (H - 80),
      phase: options.rng() * Math.PI * 2,
      health: coopEnemyHealth(
        kind === 'picket'
          ? 2
          : kind === 'spiral'
            ? 3
            : kind === 'anchor'
              ? 4
              : kind === 'lantern'
                ? 3
                : kind === 'relay'
                  ? 4
                  : kind === 'skimmer'
                    ? 3
                    : kind === 'coral'
                      ? 6
                      : 5,
        activePlayers,
      ),
      kind,
      fired: false,
    })
  }

  function defeatBoss() {
    if (!boss || defeatedAt !== null) return
    boss = null
    defeatedAt = tick
    enemyShots.length = 0
    reefs.length = 0
    score += 2500
    for (const ship of ships.slice(0, activePlayers))
      ship.invulnerable = Math.max(ship.invulnerable, 210)
    options.sound.play('level')
  }

  function fire(ship: Ship, seat: number) {
    const power = ship.power
    const speed = seat === 1 ? 10 : seat === 3 ? 9 : 8
    const damage = seat === 1 ? 2 : 1
    shots.push({ x: ship.x + 15, y: ship.y, vx: speed, vy: 0, seat, damage })
    if (!ship.focus && power >= 2) {
      const spread = seat === 0 ? 1.8 : 1.1
      shots.push({
        x: ship.x + 12,
        y: ship.y - 3,
        vx: 7.4,
        vy: -spread,
        seat,
        damage: 1,
      })
      shots.push({
        x: ship.x + 12,
        y: ship.y + 3,
        vx: 7.4,
        vy: spread,
        seat,
        damage: 1,
      })
    }
    if (power >= 3 && (seat === 2 || seat === 3)) {
      shots.push({
        x: ship.x + 10,
        y: ship.y - 10,
        vx: 8,
        vy: 0,
        seat,
        damage: 1,
      })
      shots.push({
        x: ship.x + 10,
        y: ship.y + 10,
        vx: 8,
        vy: 0,
        seat,
        damage: 1,
      })
    }
    ship.cooldown = ship.focus ? 8 : seat === 3 ? 7 : 11
  }

  function superAttack(seat: number) {
    const ship = ships[seat]!
    if (ship.charge < 100) return
    ship.charge = 0
    supers++
    bursts.push({ seat, x: ship.x, y: ship.y, age: 0 })
    enemyShots.length = 0
    if (boss && boss.frame > 85) {
      boss.hp -= seat === 1 ? 28 : 20
      if (boss.hp <= 0) defeatBoss()
    }
    if (moonBoss && moonBoss.frame > 85) {
      moonBoss.hp -= seat === 1 ? 28 : 20
      if (moonBoss.hp <= 0) defeatMoonBoss()
    }
    for (let i = reefs.length - 1; i >= 0; i--) {
      const reef = reefs[i]!
      if (seat === 1 && reef.x < ship.x) continue
      reef.health -= seat === 1 ? 8 : 5
      if (reef.health <= 0) defeat(i, seat)
    }
    if (seat === 2) {
      haloRevive(ships, activePlayers, seat)
      for (const ally of ships.slice(0, activePlayers)) {
        ally.shield = Math.min(3, ally.shield + 1)
        ally.invulnerable = Math.max(ally.invulnerable, 60)
      }
    }
    options.sound.play('extra')
  }

  function defeat(index: number, seat: number) {
    const reef = reefs[index]!
    reefs.splice(index, 1)
    score += reef.kind === 'urchin' ? 250 : 125
    clearCount++
    const ship = ships[seat]!
    ship.charge = Math.min(
      100,
      ship.charge + (reef.kind === 'urchin' ? 24 : 12),
    )
    if (clearCount % 3 === 0) {
      const kinds: Pickup['kind'][] = ['power', 'shield', 'charge']
      pickups.push({
        x: reef.x,
        y: reef.y,
        kind: kinds[(clearCount / 3 - 1) % 3]!,
      })
    }
    options.sound.play('pop')
  }

  function fireEnemy(reef: Reef) {
    const active = availableCoopTargets(ships, activePlayers)
    if (!active.length) return
    const target = active.reduce(
      (best, ship) =>
        Math.abs(ship.y - reef.y) < Math.abs(best.y - reef.y) ? ship : best,
      active[0]!,
    )
    const dx = target.x - reef.x
    const dy = target.y - reef.y
    const length = Math.hypot(dx, dy) || 1
    const vx = (dx / length) * 2.15
    const vy = (dy / length) * 2.15
    enemyShots.push({ x: reef.x - 8, y: reef.y, vx, vy, grazed: 0 })
    if (reef.kind === 'lantern') {
      const theta = Math.atan2(vy, vx)
      for (const spread of [-0.6, -0.3, 0.3, 0.6]) {
        enemyShots.push({
          x: reef.x - 8,
          y: reef.y,
          vx: Math.cos(theta + spread) * 1.65,
          vy: Math.sin(theta + spread) * 1.65,
          grazed: 0,
        })
      }
    } else if (reef.kind === 'relay') {
      enemyShots.push({
        x: reef.x - 8,
        y: reef.y,
        vx: vx * 0.7,
        vy: vy * 0.7 + 0.85,
        grazed: 0,
      })
    } else if (reef.kind === 'skimmer') {
      enemyShots.push({
        x: reef.x - 8,
        y: reef.y - 11,
        vx: -1.25,
        vy: 1.1,
        grazed: 0,
      })
    } else if (reef.kind === 'coral') {
      enemyShots.push({
        x: reef.x - 8,
        y: reef.y + 13,
        vx: -1.35,
        vy: -0.8,
        grazed: 0,
      })
    }
    if (reef.kind === 'spiral') {
      for (const offset of [-0.45, 0.45]) {
        const angle = Math.atan2(vy, vx) + offset
        enemyShots.push({
          x: reef.x - 8,
          y: reef.y,
          vx: Math.cos(angle) * 1.7,
          vy: Math.sin(angle) * 1.7,
          grazed: 0,
        })
      }
    }
    if (reef.kind === 'anchor') {
      enemyShots.push({ x: reef.x - 8, y: reef.y, vx: -0.75, vy: 0, grazed: 0 })
    }
    if (reef.kind === 'urchin') {
      enemyShots.push({
        x: reef.x - 8,
        y: reef.y,
        vx: vx * 0.9 - vy * 0.4,
        vy: vy * 0.9 + vx * 0.4,
        grazed: 0,
      })
      enemyShots.push({
        x: reef.x - 8,
        y: reef.y,
        vx: vx * 0.9 + vy * 0.4,
        vy: vy * 0.9 - vx * 0.4,
        grazed: 0,
      })
    }
  }

  function hitShip(ship: Ship) {
    // The attract-mode flythrough must be able to reach its authored boss and
    // second Act rather than silently losing every autonomous pilot.
    if (options.demo || ship.invulnerable > 0) return
    ship.invulnerable = 90
    ship.shield--
    if (ship.shield <= 0) {
      ship.lives--
      ship.shield = 3
      ship.power = Math.max(1, ship.power - 1)
      if (
        !options.demo &&
        ships.slice(0, activePlayers).every((candidate) => candidate.lives <= 0)
      )
        over = true
    }
    options.sound.play('pop')
  }

  function update(input: InputFrame, seated = [input]) {
    if (over) return
    tick++
    for (let i = bursts.length - 1; i >= 0; i--)
      if (++bursts[i]!.age > BURST_FRAMES) bursts.splice(i, 1)
    if (
      moonStart === null &&
      defeatedAt !== null &&
      tick - defeatedAt >= PINKWAKE.aftermathFrames
    ) {
      moonStart = tick
      shots.length = 0
      pickups.length = 0
      station = null
    }
    if (moonStart === null) {
      const stage = pinkwakeStage(tick, defeatedAt)
      if (stage === 'waves') {
        const kind = pinkwakeSpawn(tick)
        if (kind) spawn(kind)
        if (tick === 2520) station = { x: W + 18, y: 190 }
      } else if (stage === 'turn' && tick === PINKWAKE.turnStarts) {
        reefs.length = 0
        enemyShots.length = 0
      } else if (stage === 'boss' && !boss) {
        boss = createPinkwakeBoss()
      }
    } else {
      const frame = moonFrame()
      const stage = moonjellyStage(frame, moonDefeatedFrame)
      if (stage === 'waves' || stage === 'remix') {
        const kind = moonjellySpawn(frame)
        if (kind) spawn(kind)
        if (frame === MOONJELLY.nemiAppears) {
          nemi = { x: W + 16, y: 158 }
        }
      } else if (
        (stage === 'turn' && frame === MOONJELLY.turnStarts) ||
        (stage === 'approach' && frame === MOONJELLY.approachStarts)
      ) {
        reefs.length = 0
        enemyShots.length = 0
      } else if (stage === 'boss' && !moonBoss && moonDefeatedFrame === null) {
        moonBoss = createMoonjellyBoss()
      }
    }

    for (let seat = 0; seat < activePlayers; seat++) {
      const ship = ships[seat]!
      const keys = seated[seat] ?? (options.demo || seat === 0 ? input : null)
      if (!keys) continue
      if (ship.lives <= 0) continue
      ship.focus = !options.demo && keys.held.b
      if (options.demo) {
        ship.y = 135 + Math.sin(tick / 33 + seat) * 56
      } else {
        const dx = Number(keys.held.right) - Number(keys.held.left)
        const dy = Number(keys.held.down) - Number(keys.held.up)
        const length = Math.hypot(dx, dy) || 1
        const speed = ship.focus ? FOCUS_SPEED : SPEED
        ship.x = Math.max(20, Math.min(W - 40, ship.x + (dx / length) * speed))
        ship.y = Math.max(34, Math.min(H - 25, ship.y + (dy / length) * speed))
      }
      if (ship.cooldown > 0) ship.cooldown--
      if (ship.invulnerable > 0) ship.invulnerable--
      if ((options.demo || keys.held.a) && ship.cooldown === 0) fire(ship, seat)
      if (!options.demo && keys.pressed.b) superAttack(seat)
    }

    for (const shot of shots) {
      shot.x += shot.vx
      shot.y += shot.vy
    }
    for (const reef of reefs) {
      reef.x -=
        reef.kind === 'anchor'
          ? 0.65
          : reef.kind === 'coral'
            ? 0.8
            : reef.kind === 'urchin'
              ? 0.9
              : 1.25
      reef.y +=
        Math.sin(tick / (reef.kind === 'spiral' ? 14 : 24) + reef.phase) *
        (reef.kind === 'spiral' ? 1.3 : 0.55)
      if (!reef.fired && reef.x < W - 50) {
        reef.fired = true
        fireEnemy(reef)
      }
    }
    if (boss) {
      enemyShots.push(...stepPinkwakeBoss(boss, ships.slice(0, activePlayers)))
    }
    if (moonBoss) {
      enemyShots.push(
        ...stepMoonjellyBoss(moonBoss, ships.slice(0, activePlayers)),
      )
    }
    if (nemi) {
      nemi.x -= 0.95
      if (nemi.x < -16) nemi = null
      else if (
        ships
          .slice(0, activePlayers)
          .some(
            (ship) =>
              ship.lives > 0 &&
              Math.hypot(ship.x - nemi!.x, ship.y - nemi!.y) < 24,
          )
      ) {
        nemi = null
        rescuedNemi = true
        score += 750
        for (const ship of ships.slice(0, activePlayers)) {
          ship.charge = Math.min(100, ship.charge + 20)
        }
        options.sound.play('pickup')
      }
    }
    if (station) {
      station.x -= 0.75
      if (station.x < -18) station = null
      else if (
        ships
          .slice(0, activePlayers)
          .some(
            (ship) =>
              ship.lives > 0 &&
              Math.hypot(ship.x - station!.x, ship.y - station!.y) < 24,
          )
      ) {
        station = null
        rescuedStation = true
        score += 500
        for (const ship of ships.slice(0, activePlayers))
          ship.shield = Math.min(3, ship.shield + 1)
        options.sound.play('pickup')
      }
    }
    for (const bullet of enemyShots) {
      bullet.x += bullet.vx
      bullet.y += bullet.vy
    }
    for (const pickup of pickups) pickup.x -= 0.8

    for (let si = shots.length - 1; si >= 0; si--) {
      const shot = shots[si]!
      if (shot.x > W + 15 || shot.y < 25 || shot.y > H + 10) {
        shots.splice(si, 1)
        continue
      }
      const hitIndex = reefs.findIndex(
        (reef) =>
          Math.abs(reef.x - shot.x) < 14 && Math.abs(reef.y - shot.y) < 13,
      )
      if (hitIndex >= 0) {
        shots.splice(si, 1)
        reefs[hitIndex]!.health -= shot.damage
        if (reefs[hitIndex]!.health <= 0) defeat(hitIndex, shot.seat)
        continue
      }
      if (
        boss &&
        boss.frame > 85 &&
        Math.hypot(shot.x - (boss.x - 17), shot.y - boss.y) < 37
      ) {
        shots.splice(si, 1)
        boss.hp -= shot.damage
        if (boss.hp <= 0) defeatBoss()
      }
      if (
        moonBoss &&
        moonBoss.frame > 85 &&
        Math.hypot(shot.x - (moonBoss.x - 17), shot.y - moonBoss.y) < 43
      ) {
        shots.splice(si, 1)
        moonBoss.hp -= shot.damage
        if (moonBoss.hp <= 0) defeatMoonBoss()
      }
    }

    for (let ei = reefs.length - 1; ei >= 0; ei--) {
      const reef = reefs[ei]!
      if (reef.x < -25) {
        reefs.splice(ei, 1)
        continue
      }
      const ship = ships
        .slice(0, activePlayers)
        .find(
          (candidate) =>
            candidate.lives > 0 &&
            candidate.invulnerable === 0 &&
            Math.hypot(candidate.x - reef.x, candidate.y - reef.y) <
              CORE_RADIUS + 10,
        )
      if (ship) {
        reefs.splice(ei, 1)
        hitShip(ship)
      }
    }

    for (let bi = enemyShots.length - 1; bi >= 0; bi--) {
      const bullet = enemyShots[bi]!
      if (
        bullet.x < -12 ||
        bullet.x > W + 12 ||
        bullet.y < 22 ||
        bullet.y > H + 12
      ) {
        enemyShots.splice(bi, 1)
        continue
      }
      let consumed = false
      for (let seat = 0; seat < activePlayers; seat++) {
        const ship = ships[seat]!
        if (ship.lives <= 0) continue
        const distance = Math.hypot(ship.x - bullet.x, ship.y - bullet.y)
        const contact = enemyBulletContact(
          distance,
          ship.invulnerable > 0,
          CORE_RADIUS + 3,
          GRAZE_RADIUS,
        )
        if (contact === 'hit') {
          hitShip(ship)
          enemyShots.splice(bi, 1)
          consumed = true
          break
        }
        if (contact === 'protected') {
          bullet.grazed |= 1 << seat
          continue
        }
        if (contact === 'graze' && (bullet.grazed & (1 << seat)) === 0) {
          bullet.grazed |= 1 << seat
          ship.graze++
          ship.charge = Math.min(100, ship.charge + 2)
          score += 5
        }
      }
      if (consumed) continue
    }

    for (let pi = pickups.length - 1; pi >= 0; pi--) {
      const pickup = pickups[pi]!
      if (pickup.x < -15) {
        pickups.splice(pi, 1)
        continue
      }
      const ship = ships
        .slice(0, activePlayers)
        .find(
          (candidate) =>
            candidate.lives > 0 &&
            Math.hypot(candidate.x - pickup.x, candidate.y - pickup.y) < 18,
        )
      if (!ship) continue
      pickups.splice(pi, 1)
      if (pickup.kind === 'power') ship.power = Math.min(3, ship.power + 1)
      else if (pickup.kind === 'shield')
        ship.shield = Math.min(3, ship.shield + 1)
      else ship.charge = Math.min(100, ship.charge + 35)
      score += 25
      options.sound.play('pickup')
    }
  }

  return {
    get score() {
      return score
    },
    get level() {
      return moonStart === null ? 1 : 2
    },
    get lives() {
      return ships
        .slice(0, activePlayers)
        .reduce((total, ship) => total + Math.max(0, ship.lives), 0)
    },
    get over() {
      return over
    },
    setPlayers,
    get snapshot(): RainbowCombatSnapshot {
      return {
        tick,
        score,
        ships: ships.slice(0, activePlayers).map((ship) => ({ ...ship })),
        activePlayers,
        shots: shots.map((shot) => ({ ...shot })),
        enemies: reefs.map((reef) => ({ ...reef })),
        enemyShots: enemyShots.map((bullet) => ({ ...bullet })),
        pickups: pickups.map((pickup) => ({ ...pickup })),
        act: moonStart === null ? 'S01' : 'S02',
        stage:
          moonStart === null
            ? pinkwakeStage(tick, defeatedAt)
            : moonjellyStage(moonFrame(), moonDefeatedFrame),
        sceneId:
          moonStart === null
            ? (pinkwakeScene(tick, defeatedAt)?.id ?? null)
            : (moonjellyScene(moonFrame(), moonDefeatedFrame)?.id ?? null),
        boss: boss ? { ...boss } : null,
        moonBoss: moonBoss ? { ...moonBoss } : null,
        rescuedNemi,
        actTwoFrame: moonFrame(),
        rescuedStation,
        defeatedAt,
      }
    },
    update,
    render(g: CanvasRenderingContext2D) {
      const sky = g.createLinearGradient(0, 0, 0, H)
      sky.addColorStop(0, moonStart === null ? '#100d40' : '#072f50')
      sky.addColorStop(0.55, moonStart === null ? '#6d427e' : '#357a91')
      sky.addColorStop(1, moonStart === null ? '#ed9dbb' : '#ae9fe3')
      g.fillStyle = sky
      g.fillRect(0, 0, W, H)
      for (let plane = 0; plane < 4; plane++) {
        g.fillStyle = ['#f2d6ff88', '#9ffffa44', '#fff5c444', '#ffe6f277'][
          plane
        ]!
        const speed = [0.15, 0.34, 0.72, 1.3][plane]!
        for (let i = 0; i < 16; i++) {
          const x =
            (((i * (47 + plane * 8) - tick * speed) % (W + 65)) + W + 65) %
            (W + 65)
          const y = 36 + ((i * 73 + plane * 29) % (H - 65))
          g.beginPath()
          g.ellipse(x, y, 2 + plane * 1.5, 1.3 + plane, 0, 0, Math.PI * 2)
          g.fill()
        }
      }
      g.fillStyle = '#f6c4e655'
      for (let i = 0; i < 6; i++) {
        const x = ((((i * 108 - tick * 0.28) % 640) + 640) % 640) - 60
        g.beginPath()
        g.ellipse(x, 244 + Math.sin(i) * 12, 56, 25, 0, 0, Math.PI * 2)
        g.fill()
      }
      if (moonStart !== null) {
        for (let plane = 0; plane < 4; plane++) {
          const speed = 0.12 + plane * 0.21
          g.lineWidth = 1 + plane * 0.8
          g.strokeStyle = ['#f1b9fc55', '#a6ffe766', '#ecdbff88', '#bdf9ff99'][
            plane
          ]!
          g.fillStyle = ['#ebbeff25', '#b8ffef30', '#d1d0ff38', '#bbf6ff48'][
            plane
          ]!
          for (let i = 0; i < 6; i++) {
            const x =
              ((((i * 111 - moonFrame() * speed) % 650) + 650) % 650) - 42
            const y = 45 + ((i * 73 + plane * 39) % 170)
            g.beginPath()
            g.ellipse(
              x,
              y,
              18 + plane * 5,
              9 + plane * 2,
              0,
              Math.PI,
              2 * Math.PI,
            )
            g.fill()
            g.stroke()
            for (let arm = -2; arm <= 2; arm++) {
              g.beginPath()
              g.moveTo(x + arm * 6, y)
              g.quadraticCurveTo(
                x + arm * 7 + Math.sin(moonFrame() / 45 + i + arm) * 6,
                y + 21,
                x + arm * 8,
                y + 29 + plane * 4,
              )
              g.stroke()
            }
          }
        }
      }
      for (const reef of reefs) {
        g.save()
        g.translate(reef.x, reef.y)
        g.shadowColor = reef.kind === 'urchin' ? '#ffe38a' : '#ffa3e6'
        g.shadowBlur = 12
        g.fillStyle =
          reef.kind === 'urchin'
            ? '#ffd38a'
            : reef.kind === 'anchor'
              ? '#ffb3d1'
              : reef.kind === 'spiral'
                ? '#94e7ff'
                : reef.kind === 'lantern'
                  ? '#afffea'
                  : reef.kind === 'relay'
                    ? '#f9a8e9'
                    : reef.kind === 'skimmer'
                      ? '#f9e7af'
                      : reef.kind === 'coral'
                        ? '#e4c0ff'
                        : '#d09ffd'
        if (!drawRainbowEnemySprite(g, reef.kind)) {
          g.beginPath()
          g.ellipse(
            0,
            0,
            reef.kind === 'urchin' ? 14 : 16,
            10,
            0,
            0,
            Math.PI * 2,
          )
          g.fill()
          g.fillStyle = '#fce7ff'
          g.beginPath()
          g.ellipse(-6, -2, 6, 4, 0, 0, Math.PI * 2)
          g.fill()
          g.strokeStyle = '#b5fbff'
          g.lineWidth = 3
          g.beginPath()
          g.moveTo(9, -5)
          g.quadraticCurveTo(23, -15, 17, -22)
          g.stroke()
        }
        g.restore()
      }
      if (nemi) {
        g.save()
        g.translate(nemi.x, nemi.y)
        g.shadowColor = '#a7ffdf'
        g.shadowBlur = 18
        g.fillStyle = '#173f53'
        g.strokeStyle = '#e0ffbc'
        g.lineWidth = 3
        g.beginPath()
        g.arc(0, 0, 15, 0, 2 * Math.PI)
        g.fill()
        g.stroke()
        g.shadowBlur = 0
        g.fillStyle = '#f1ffda'
        g.font = 'bold 9px monospace'
        g.textAlign = 'center'
        g.fillText('NEMI', 0, 3)
        g.restore()
      }
      if (station) {
        g.save()
        g.translate(station.x, station.y)
        g.strokeStyle = '#b3ffdf'
        g.fillStyle = '#163b46'
        g.lineWidth = 3
        g.beginPath()
        g.arc(0, 0, 16, 0, Math.PI * 2)
        g.fill()
        g.stroke()
        g.font = 'bold 9px monospace'
        g.fillStyle = '#b3ffdf'
        g.textAlign = 'center'
        g.fillText('SOS', 0, 3)
        g.restore()
      }
      if (boss) {
        g.save()
        g.translate(boss.x, boss.y)
        const glow = bossTelegraph(boss)
        g.shadowColor = glow ? '#fff7a7' : '#ffaff1'
        g.shadowBlur = glow ? 25 : 9
        // The painted seahorse carries the escape pod in its coil; the vector body carries it at its belly.
        const painted = drawRainbowBossSprite(g, 'b01', boss.phase, -10, 0, 116)
        const pod = painted ? { x: 23, y: 2, rx: 11, ry: 13 } : null
        if (painted) {
          g.shadowBlur = 0
          if (glow) {
            g.strokeStyle = '#fffbb6'
            g.lineWidth = 3
            g.globalAlpha = 0.55 + 0.45 * Math.sin(boss.frame / 3)
            g.beginPath()
            g.arc(-17, 0, 41, 0, Math.PI * 2)
            g.stroke()
            g.globalAlpha = 1
          }
        } else {
          g.fillStyle = boss.phase === 3 ? '#c791ff' : '#ffd0ef'
          g.beginPath()
          g.ellipse(0, 0, 38, 49, -0.2, 0, Math.PI * 2)
          g.fill()
          g.strokeStyle = glow ? '#fffbb6' : '#724aab'
          g.lineWidth = glow ? 5 : 3
          g.beginPath()
          g.moveTo(12, -32)
          g.quadraticCurveTo(-54, -72, -41, -22)
          g.quadraticCurveTo(-12, 1, -30, 42)
          g.quadraticCurveTo(-10, 70, 15, 40)
          g.stroke()
          g.shadowBlur = 0
          g.fillStyle = '#3d205a'
          g.beginPath()
          g.arc(-16, -19, 6, 0, Math.PI * 2)
          g.fill()
        }
        const {
          x: podX,
          y: podY,
          rx,
          ry,
        } = pod ?? {
          x: -9,
          y: 16,
          rx: 13,
          ry: 19,
        }
        g.fillStyle = '#e2fff6'
        g.beginPath()
        g.ellipse(podX, podY, rx, ry, -0.1, 0, Math.PI * 2)
        g.fill()
        g.strokeStyle = '#5bdac8'
        g.lineWidth = 2
        g.stroke()
        g.fillStyle = '#3d8b94'
        g.font = `bold ${painted ? 7 : 9}px monospace`
        g.textAlign = 'center'
        g.fillText('POD', podX, podY + (painted ? 2 : 3))
        g.restore()
        g.fillStyle = '#240c42'
        g.fillRect(148, 30, 184, 14)
        g.fillStyle = '#ffb9e6'
        g.fillRect(150, 32, 180 * Math.max(0, boss.hp / BOSS_MAX_HP), 10)
        g.strokeStyle = '#fff7cf'
        g.lineWidth = 1
        g.strokeRect(148, 30, 184, 14)
        g.fillStyle = '#fff7cf'
        g.textAlign = 'center'
        g.font = 'bold 8px monospace'
        g.fillText('B01 PEARL SEAHORSE', 240, 53)
        g.textAlign = 'left'
      }
      if (moonBoss) {
        const warn = moonjellyBossWarning(moonBoss)
        g.save()
        g.translate(moonBoss.x, moonBoss.y)
        g.shadowColor = warn ? '#fff49c' : '#affff7'
        g.shadowBlur = warn ? 25 : 12
        if (
          drawRainbowBossSprite(
            g,
            'b02',
            moonBoss.phase,
            -10,
            4 + Math.sin(moonBoss.frame / 24) * 2,
            102,
          )
        ) {
          g.shadowBlur = 0
          if (warn) {
            g.strokeStyle = '#fff3a2'
            g.lineWidth = 3
            g.globalAlpha = 0.55 + 0.45 * Math.sin(moonBoss.frame / 3)
            g.beginPath()
            g.arc(-17, 0, 47, 0, Math.PI * 2)
            g.stroke()
            g.globalAlpha = 1
          }
        } else {
          g.fillStyle = '#b4f4f1b8'
          g.strokeStyle = warn ? '#fff3a2' : '#c5f7ff'
          g.lineWidth = warn ? 5 : 3
          g.beginPath()
          g.ellipse(0, -9, 42, 38, 0, Math.PI, 2 * Math.PI)
          g.fill()
          g.stroke()
          g.shadowBlur = 0
          for (let arm = -3; arm <= 3; arm++) {
            g.beginPath()
            g.moveTo(arm * 10, -8)
            g.quadraticCurveTo(
              arm * 14 + Math.sin(moonBoss.frame / 24 + arm) * 8,
              41,
              arm * 9,
              55,
            )
            g.stroke()
          }
          g.fillStyle = '#edffff'
          g.beginPath()
          g.arc(-11, -23, 7, 0, 2 * Math.PI)
          g.fill()
        }
        g.restore()
        g.fillStyle = '#1d2750'
        g.fillRect(148, 30, 184, 14)
        g.fillStyle = '#c2fff4'
        g.fillRect(150, 32, 180 * Math.max(0, moonBoss.hp / AURELIA_MAX_HP), 10)
        g.strokeStyle = '#fff4c4'
        g.lineWidth = 1
        g.strokeRect(148, 30, 184, 14)
        g.textAlign = 'center'
        g.font = 'bold 8px monospace'
        g.fillStyle = '#fff4c4'
        g.fillText('B02 AURELIA ARRAY', 240, 53)
        g.textAlign = 'left'
      }
      for (const bullet of enemyShots) {
        g.fillStyle = '#1b163e'
        g.beginPath()
        g.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2)
        g.fill()
        g.strokeStyle = '#fff5b3'
        g.lineWidth = 2
        g.stroke()
      }
      for (const pickup of pickups) {
        if (drawRainbowPickupSprite(g, pickup.kind, pickup.x, pickup.y))
          continue
        g.fillStyle =
          pickup.kind === 'power'
            ? '#a5f3fc'
            : pickup.kind === 'shield'
              ? '#f9a8d4'
              : '#fde68a'
        g.beginPath()
        g.arc(pickup.x, pickup.y, 9, 0, Math.PI * 2)
        g.fill()
        g.fillStyle = '#21133b'
        g.font = 'bold 10px sans-serif'
        g.textAlign = 'center'
        g.fillText(
          pickup.kind === 'power' ? 'P' : pickup.kind === 'shield' ? 'S' : '★',
          pickup.x,
          pickup.y + 4,
        )
        g.textAlign = 'left'
      }
      for (const shot of shots) {
        g.fillStyle = PILOT_COLORS[shot.seat]!
        g.fillRect(shot.x, shot.y - 2, 12, 4)
        g.fillStyle = '#fff'
        g.fillRect(shot.x + 8, shot.y - 1, 5, 2)
      }
      for (let seat = 0; seat < activePlayers; seat++) {
        const ship = ships[seat]!
        if (
          ship.lives <= 0 ||
          (ship.invulnerable && Math.floor(tick / 6) % 2 === 0)
        )
          continue
        g.save()
        g.translate(ship.x, ship.y)
        g.shadowColor = PILOT_COLORS[seat]!
        g.shadowBlur = 10
        if (!drawRainbowShipSprite(g, seat)) {
          g.fillStyle = PILOT_COLORS[seat]!
          g.shadowBlur = 15
          g.beginPath()
          g.moveTo(16, 0)
          g.lineTo(-13, -11)
          g.lineTo(-6, 0)
          g.lineTo(-13, 11)
          g.closePath()
          g.fill()
          g.strokeStyle = '#fff7fc'
          g.lineWidth = 2
          g.stroke()
        }
        g.shadowBlur = 0
        g.fillStyle = '#44235c'
        g.fillRect(-3, -3, 6, 6)
        g.strokeStyle = PILOT_COLORS[seat]!
        g.lineWidth = 1
        g.strokeRect(-3, -3, 6, 6)
        if (ship.focus) {
          g.strokeStyle = '#fff'
          g.beginPath()
          g.arc(0, 0, CORE_RADIUS, 0, Math.PI * 2)
          g.stroke()
        }
        g.strokeStyle = '#fff'
        g.font = 'bold 9px sans-serif'
        g.strokeText(String(seat + 1), -3, -17)
        if (ship.charge >= 100 && Math.floor(tick / 10) % 2 === 0) {
          g.fillStyle = PILOT_COLORS[seat]!
          g.font = 'bold 7px monospace'
          g.textAlign = 'center'
          g.fillText('SUPER READY · TAP B', 0, 24)
          g.textAlign = 'left'
        }
        g.restore()
      }
      for (const burst of bursts) {
        const t = burst.age / BURST_FRAMES
        const fade = 1 - t
        const color = PILOT_COLORS[burst.seat]!
        g.save()
        if (burst.age < 8) {
          g.globalAlpha = (8 - burst.age) / 16
          g.fillStyle = color
          g.fillRect(0, 0, W, H)
        }
        g.globalAlpha = fade
        g.strokeStyle = color
        g.fillStyle = color
        g.shadowColor = color
        g.shadowBlur = 18
        if (burst.seat === 0) {
          const r = 20 + t * 170
          for (let petal = 0; petal < 8; petal++) {
            const a = (petal / 8) * Math.PI * 2 + t * 1.5
            g.beginPath()
            g.ellipse(
              burst.x + Math.cos(a) * r,
              burst.y + Math.sin(a) * r,
              14 * fade + 4,
              6 * fade + 2,
              a,
              0,
              Math.PI * 2,
            )
            g.fill()
          }
        } else if (burst.seat === 1) {
          const half = 22 * fade + 2
          g.fillRect(burst.x, burst.y - half, W - burst.x, half * 2)
          g.fillStyle = '#ffffff'
          g.fillRect(burst.x, burst.y - half / 3, W - burst.x, (half * 2) / 3)
        } else if (burst.seat === 2) {
          g.lineWidth = 4 * fade + 1
          for (const scale of [1, 0.6]) {
            g.beginPath()
            g.arc(burst.x, burst.y, (24 + t * 140) * scale, 0, Math.PI * 2)
            g.stroke()
          }
        } else {
          for (let comet = 0; comet < 7; comet++) {
            const y = burst.y + (comet - 3) * 18
            const x = burst.x + t * (W - burst.x + 60) - comet * 6
            g.beginPath()
            g.moveTo(x, y)
            g.lineTo(x - 46, y - 3)
            g.lineTo(x - 46, y + 3)
            g.closePath()
            g.fill()
          }
        }
        g.restore()
      }
      g.fillStyle = '#180d38e8'
      g.fillRect(0, 0, W, 29)
      g.fillStyle = '#ffe7f5'
      g.font = 'bold 10px monospace'
      g.fillText(
        moonStart === null ? 'ACT I / PINKWAKE' : 'ACT II / MOONJELLY',
        HUD_LEFT,
        12,
      )
      g.font = '9px monospace'
      g.fillText('A FIRE · HOLD B FOCUS · TAP B AT 100% = SUPER', HUD_LEFT, 24)
      g.textAlign = 'right'
      g.fillText(`SHOALS ${clearCount}  ·  NOVAS ${supers}`, HUD_RIGHT, 12)
      if (activePlayers > 1) {
        g.fillStyle = '#180d38e8'
        g.fillRect(HUD_RIGHT - 150, 29, 158, (activePlayers - 1) * 10 + 4)
      }
      for (let seat = 0; seat < activePlayers; seat++) {
        const ship = ships[seat]!
        g.fillStyle = PILOT_COLORS[seat]!
        g.fillText(
          `${SHIP_NAMES[seat]} ${ship.lives}♥ ${ship.shield}◇ P${ship.power} ${ship.charge}%`,
          HUD_RIGHT,
          24 + seat * 10,
        )
      }
      g.textAlign = 'left'
      const scene =
        moonStart === null
          ? pinkwakeScene(tick, defeatedAt)
          : moonjellyScene(moonFrame(), moonDefeatedFrame)
      const dialogue = scene
        ? moonStart === null
          ? pinkwakeDialogue(
              scene.id as 'A01.OPEN' | 'A01.TURN' | 'A01.AFTER',
              scene.elapsed,
              activePlayers,
              rescuedStation,
            )
          : moonjellyDialogue(
              scene.id as 'A02.OPEN' | 'A02.TURN' | 'A02.AFTER',
              scene.elapsed,
              activePlayers,
              rescuedNemi,
            )
        : null
      const commsTop = 33 + Math.max(0, activePlayers - 1) * 10
      if (dialogue) {
        g.fillStyle = '#160b34e8'
        g.fillRect(15, commsTop, W - 30, 51)
        g.strokeStyle = '#ffe2fa'
        g.lineWidth = 1
        g.strokeRect(15, commsTop, W - 30, 51)
        const portrait = drawRainbowCommsPortrait(
          g,
          dialogue.speaker,
          19,
          commsTop + 4,
          43,
        )
        if (portrait) {
          g.strokeStyle = '#aef6f0'
          g.strokeRect(19, commsTop + 4, 43, 43)
        }
        const textX = portrait ? 70 : 24
        const wrap = portrait ? 57 : 65
        g.fillStyle = '#aef6f0'
        g.font = 'bold 10px monospace'
        g.fillText(
          `${scene!.id} / ${dialogue.speaker.toUpperCase()}`,
          textX,
          commsTop + 16,
        )
        const words = dialogue.text.split(' ')
        const lines = ['']
        for (const word of words) {
          const i = lines.length - 1
          if (lines[i]!.length + word.length + 1 > wrap) lines.push(word)
          else lines[i] = (lines[i] ? lines[i] + ' ' : '') + word
        }
        g.fillStyle = '#fff4fa'
        g.font = '9px monospace'
        for (let line = 0; line < Math.min(lines.length, 2); line++) {
          g.fillText(lines[line]!, textX, commsTop + 30 + line * 12)
        }
      } else if (
        moonDefeatedFrame !== null &&
        moonFrame() - moonDefeatedFrame >= MOONJELLY.aftermathFrames
      ) {
        g.fillStyle = '#180d38d9'
        g.fillRect(48, commsTop, W - 96, 33)
        g.fillStyle = '#c7ffe6'
        g.textAlign = 'center'
        g.font = 'bold 11px monospace'
        g.fillText('AURELIA FREED · ACT II PREVIEW CLEAR', W / 2, commsTop + 19)
        g.font = '8px monospace'
        g.fillText(
          'Safe transit to Chromatic Trench · Act III in production',
          W / 2,
          commsTop + 30,
        )
        g.textAlign = 'left'
      } else if (moonStart === null && defeatedAt !== null) {
        g.fillStyle = '#180d38d9'
        g.fillRect(65, commsTop, W - 130, 33)
        g.fillStyle = '#c7ffe6'
        g.textAlign = 'center'
        g.font = 'bold 11px monospace'
        g.fillText('POD RESCUED · ACT I PREVIEW CLEAR', W / 2, commsTop + 19)
        g.font = '8px monospace'
        g.fillText(
          'Moonjelly Fields incoming: shields and power persist',
          W / 2,
          commsTop + 30,
        )
        g.textAlign = 'left'
      }
    },
  }
}

const module: ArcadeGameModule = { create: createRainbowPrincessPreview }
export default module
export const create = createRainbowPrincessPreview
