import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'
import {
  PINKWAKE, pinkwakeDialogue, pinkwakeScene, pinkwakeSpawn, pinkwakeStage,
  type PinkwakeEnemy,
} from './rainbowPinkwake'
import {
  BOSS_MAX_HP, bossTelegraph, createPinkwakeBoss, stepPinkwakeBoss,
  type PinkwakeBoss,
} from './rainbowPinkwakeBoss'

const W = 480
const H = 270
const SPEED = 2.6
const FOCUS_SPEED = SPEED * 0.55
const CORE_RADIUS = 4
const GRAZE_RADIUS = 15
const PILOT_COLORS = ['#ffd2ef', '#b8f8ff', '#ffe99f', '#b9a9ff'] as const
const SHIP_NAMES = ['PETAL', 'PRISM', 'HALO', 'COMET'] as const

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
  kind: PinkwakeEnemy
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
  act: 'S01'
  stage: ReturnType<typeof pinkwakeStage>
  sceneId: 'A01.OPEN' | 'A01.TURN' | 'A01.AFTER' | null
  boss: Readonly<PinkwakeBoss> | null
  rescuedStation: boolean
  defeatedAt: number | null
}

/** The preview's deterministic 60 Hz combat layer; stages and bosses are separate work. */
export function createRainbowPrincessPreview(
  options: ArcadeGameOptions,
): ArcadeGameInstance & { readonly snapshot: RainbowCombatSnapshot } {
  const count = Math.max(1, Math.min(4, options.players ?? 1))
  const ships: Ship[] = Array.from({ length: count }, (_, seat) => ({
    x: 65,
    y: 80 + seat * (125 / count),
    shield: 3,
    cooldown: 0,
    invulnerable: 60,
    power: 1,
    charge: 0,
    graze: 0,
    lives: 3,
    focus: false,
  }))
  const shots: Shot[] = []
  const reefs: Reef[] = []
  const enemyShots: EnemyShot[] = []
  const pickups: Pickup[] = []
  let tick = 0
  let score = 0
  let over = false
  let clearCount = 0
  let supers = 0
  let boss: PinkwakeBoss | null = null
  let defeatedAt: number | null = null
  let rescuedStation = false
  let station: { x: number; y: number } | null = null

  function spawn(kind: PinkwakeEnemy) {
    reefs.push({
      x: W + 18,
      y: 40 + options.rng() * (H - 80),
      phase: options.rng() * Math.PI * 2,
      health: kind === 'picket' ? 2 : kind === 'spiral' ? 3 : kind === 'anchor' ? 4 : 5,
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
    for (const ship of ships) ship.invulnerable = Math.max(ship.invulnerable, 210)
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
    enemyShots.length = 0
    if (boss && boss.frame > 85) {
      boss.hp -= seat === 1 ? 28 : 20
      if (boss.hp <= 0) defeatBoss()
    }
    for (let i = reefs.length - 1; i >= 0; i--) {
      const reef = reefs[i]!
      if (seat === 1 && reef.x < ship.x) continue
      reef.health -= seat === 1 ? 8 : 5
      if (reef.health <= 0) defeat(i, seat)
    }
    if (seat === 2) {
      for (const ally of ships) {
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
    const target = ships.reduce(
      (best, ship) =>
        Math.abs(ship.y - reef.y) < Math.abs(best.y - reef.y) ? ship : best,
      ships[0]!,
    )
    const dx = target.x - reef.x
    const dy = target.y - reef.y
    const length = Math.hypot(dx, dy) || 1
    const vx = (dx / length) * 2.15
    const vy = (dy / length) * 2.15
    enemyShots.push({ x: reef.x - 8, y: reef.y, vx, vy, grazed: 0 })
    if (reef.kind === 'spiral') {
      for (const offset of [-0.45, 0.45]) {
        const angle = Math.atan2(vy, vx) + offset
        enemyShots.push({
          x: reef.x - 8, y: reef.y,
          vx: Math.cos(angle) * 1.7, vy: Math.sin(angle) * 1.7, grazed: 0,
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
    if (ship.invulnerable > 0) return
    ship.invulnerable = 90
    ship.shield--
    if (ship.shield <= 0) {
      ship.lives--
      ship.shield = 3
      ship.power = Math.max(1, ship.power - 1)
      if (!options.demo && ships.every((candidate) => candidate.lives <= 0))
        over = true
    }
    options.sound.play('pop')
  }

  function update(input: InputFrame, seated = [input]) {
    if (over) return
    tick++
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

    for (let seat = 0; seat < ships.length; seat++) {
      const ship = ships[seat]!
      const keys = seated[seat] ?? input
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
      reef.x -= reef.kind === 'anchor' ? 0.65 : reef.kind === 'urchin' ? 0.9 : 1.25
      reef.y += Math.sin(tick / (reef.kind === 'spiral' ? 14 : 24) + reef.phase) * (reef.kind === 'spiral' ? 1.3 : 0.55)
      if (!reef.fired && reef.x < W - 50) {
        reef.fired = true
        fireEnemy(reef)
      }
    }
    if (boss) {
      enemyShots.push(...stepPinkwakeBoss(boss, ships))
    }
    if (station) {
      station.x -= 0.75
      if (station.x < -18) station = null
      else if (
        ships.some((ship) => ship.lives > 0 &&
          Math.hypot(ship.x - station!.x, ship.y - station!.y) < 24)
      ) {
        station = null
        rescuedStation = true
        score += 500
        for (const ship of ships) ship.shield = Math.min(3, ship.shield + 1)
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
      if (boss && boss.frame > 85 &&
        Math.hypot(shot.x - (boss.x - 17), shot.y - boss.y) < 37) {
        shots.splice(si, 1)
        boss.hp -= shot.damage
        if (boss.hp <= 0) defeatBoss()
      }
    }

    for (let ei = reefs.length - 1; ei >= 0; ei--) {
      const reef = reefs[ei]!
      if (reef.x < -25) {
        reefs.splice(ei, 1)
        continue
      }
      const ship = ships.find(
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
      for (let seat = 0; seat < ships.length; seat++) {
        const ship = ships[seat]!
        if (ship.lives <= 0) continue
        const distance = Math.hypot(ship.x - bullet.x, ship.y - bullet.y)
        if (distance < CORE_RADIUS + 3 && ship.invulnerable === 0) {
          hitShip(ship)
          enemyShots.splice(bi, 1)
          consumed = true
          break
        }
        if (distance < GRAZE_RADIUS && (bullet.grazed & (1 << seat)) === 0) {
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
      const ship = ships.find(
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
      return 1
    },
    get lives() {
      return ships.reduce((total, ship) => total + Math.max(0, ship.lives), 0)
    },
    get over() {
      return over
    },
    get snapshot(): RainbowCombatSnapshot {
      return {
        tick,
        score,
        ships: ships.map((ship) => ({ ...ship })),
        shots: shots.map((shot) => ({ ...shot })),
        enemies: reefs.map((reef) => ({ ...reef })),
        enemyShots: enemyShots.map((bullet) => ({ ...bullet })),
        pickups: pickups.map((pickup) => ({ ...pickup })),
      }
    },
    update,
    render(g: CanvasRenderingContext2D) {
      const sky = g.createLinearGradient(0, 0, 0, H)
      sky.addColorStop(0, '#100d40')
      sky.addColorStop(0.55, '#6d427e')
      sky.addColorStop(1, '#ed9dbb')
      g.fillStyle = sky
      g.fillRect(0, 0, W, H)
      for (let plane = 0; plane < 3; plane++) {
        g.fillStyle = ['#f2d6ff88', '#9ffffa44', '#fff5c444'][plane]!
        const speed = [0.22, 0.54, 1.13][plane]!
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
      for (const reef of reefs) {
        g.save()
        g.translate(reef.x, reef.y)
        g.shadowColor = reef.kind === 'urchin' ? '#ffe38a' : '#ffa3e6'
        g.shadowBlur = 12
        g.fillStyle = reef.kind === 'urchin' ? '#ffd38a' : '#d09ffd'
        g.beginPath()
        g.ellipse(0, 0, reef.kind === 'urchin' ? 14 : 16, 10, 0, 0, Math.PI * 2)
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
        g.restore()
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
      for (let seat = 0; seat < ships.length; seat++) {
        const ship = ships[seat]!
        if (
          ship.lives <= 0 ||
          (ship.invulnerable && Math.floor(tick / 6) % 2 === 0)
        )
          continue
        g.save()
        g.translate(ship.x, ship.y)
        g.fillStyle = PILOT_COLORS[seat]!
        g.shadowColor = PILOT_COLORS[seat]!
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
        g.shadowBlur = 0
        g.fillStyle = '#44235c'
        g.fillRect(-3, -3, 6, 6)
        if (ship.focus) {
          g.strokeStyle = '#fff'
          g.beginPath()
          g.arc(0, 0, CORE_RADIUS, 0, Math.PI * 2)
          g.stroke()
        }
        g.strokeStyle = '#fff'
        g.font = 'bold 9px sans-serif'
        g.strokeText(String(seat + 1), -3, -17)
        g.restore()
      }
      g.fillStyle = '#180d38e8'
      g.fillRect(0, 0, W, 29)
      g.fillStyle = '#ffe7f5'
      g.font = 'bold 10px monospace'
      g.fillText('PINKWAKE / COMBAT PREVIEW', 9, 12)
      g.font = '9px monospace'
      g.fillText('A FIRE · HOLD B FOCUS · CHARGED B SUPER', 9, 24)
      g.textAlign = 'right'
      g.fillText(`SHOALS ${clearCount}  ·  NOVAS ${supers}`, W - 9, 12)
      for (let seat = 0; seat < ships.length; seat++) {
        const ship = ships[seat]!
        g.fillStyle = PILOT_COLORS[seat]!
        g.fillText(
          `${SHIP_NAMES[seat]} ${ship.lives}♥ ${ship.shield}◇ P${ship.power} ${ship.charge}%`,
          W - 9,
          24 + seat * 10,
        )
      }
      g.textAlign = 'left'
    },
  }
}

const module: ArcadeGameModule = { create: createRainbowPrincessPreview }
export default module
export const create = createRainbowPrincessPreview
