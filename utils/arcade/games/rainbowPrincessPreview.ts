import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const W = 480
const H = 270
const SPEED = 2.6
type Ship = { x: number; y: number; shield: number; cooldown: number; invulnerable: number }
type Shot = { x: number; y: number; seat: number }
type Reef = { x: number; y: number; phase: number; health: number }
const PILOT_COLORS = ['#ffd2ef', '#b8f8ff', '#ffe99f', '#b9a9ff']

export function createRainbowPrincessPreview(options: ArcadeGameOptions): ArcadeGameInstance {
  const count = Math.max(1, Math.min(4, options.players ?? 1))
  const ships: Ship[] = Array.from({ length: count }, (_, seat) => ({
    x: 65, y: 84 + seat * (105 / count),
    shield: 3, cooldown: 0, invulnerable: 60,
  }))
  const shots: Shot[] = []
  const reefs: Reef[] = []
  let tick = 0
  let score = 0
  let lives = count * 3
  let over = false
  let clearCount = 0

  function spawn() {
    reefs.push({
      x: W + 18,
      y: 40 + options.rng() * (H - 80),
      phase: options.rng() * 6.28,
      health: 2,
    })
  }

  return {
    get score() { return score },
    get level() { return 1 },
    get lives() { return lives },
    get over() { return over },
    update(input: InputFrame, seated = [input]) {
      if (over) return
      tick++
      if (tick % 52 === 0) spawn()
      for (let seat = 0; seat < ships.length; seat++) {
        const ship = ships[seat]!
        const keys = seated[seat] ?? input
        if (options.demo) {
          ship.y = 135 + Math.sin(tick / 33 + seat) * 56
        } else {
          ship.x = Math.max(20, Math.min(W - 40, ship.x + (Number(keys.held.right) - Number(keys.held.left)) * SPEED))
          ship.y = Math.max(34, Math.min(H - 25, ship.y + (Number(keys.held.down) - Number(keys.held.up)) * SPEED))
        }
        if (ship.cooldown > 0) ship.cooldown--
        if (ship.invulnerable > 0) ship.invulnerable--
        if ((options.demo || keys.held.a) && ship.cooldown === 0) {
          shots.push({ x: ship.x + 14, y: ship.y, seat })
          ship.cooldown = 11
        }
        if (!options.demo && keys.pressed.b && ship.shield < 3) {
          ship.shield++
          options.sound.play('pickup')
        }
      }
      for (const shot of shots) shot.x += 7
      for (const reef of reefs) {
        reef.x -= 1.25
        reef.y += Math.sin(tick / 24 + reef.phase) * 0.55
      }
      for (let si = shots.length - 1; si >= 0; si--) {
        const shot = shots[si]!
        if (shot.x > W + 10) { shots.splice(si, 1); continue }
        const hit = reefs.find(reef => Math.abs(reef.x - shot.x) < 13 && Math.abs(reef.y - shot.y) < 14)
        if (!hit) continue
        shots.splice(si, 1)
        hit.health--
        if (hit.health === 0) { reefs.splice(reefs.indexOf(hit), 1); score += 125; clearCount++ }
      }
      for (let ei = reefs.length - 1; ei >= 0; ei--) {
        const reef = reefs[ei]!
        if (reef.x < -20) { reefs.splice(ei, 1); continue }
        for (const ship of ships) {
          if (ship.invulnerable || Math.abs(ship.x - reef.x) >= 16 || Math.abs(ship.y - reef.y) >= 14) continue
          reefs.splice(ei, 1)
          ship.invulnerable = 90
          ship.shield--
          if (ship.shield <= 0) {
            lives--
            ship.shield = 3
            if (!options.demo && lives <= 0) over = true
          }
          break
        }
      }
    },
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
          const x = ((i * (47 + plane * 8) - tick * speed) % (W + 65) + W + 65) % (W + 65)
          const y = 36 + (i * 73 + plane * 29) % (H - 65)
          g.beginPath()
          g.ellipse(x, y, 2 + plane * 1.5, 1.3 + plane, 0, 0, Math.PI * 2)
          g.fill()
        }
      }
      g.fillStyle = '#f6c4e655'
      for (let i = 0; i < 6; i++) {
        const x = ((i * 108 - tick * 0.28) % 640 + 640) % 640 - 60
        g.beginPath()
        g.ellipse(x, 244 + Math.sin(i) * 12, 56, 25, 0, 0, Math.PI * 2)
        g.fill()
      }
      for (const reef of reefs) {
        g.save()
        g.translate(reef.x, reef.y)
        g.shadowColor = '#ffa3e6'
        g.shadowBlur = 12
        g.fillStyle = '#d09ffd'
        g.beginPath()
        g.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2)
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
      for (const shot of shots) {
        g.fillStyle = PILOT_COLORS[shot.seat]!
        g.fillRect(shot.x, shot.y - 2, 12, 4)
        g.fillStyle = '#fff'
        g.fillRect(shot.x + 8, shot.y - 1, 5, 2)
      }
      for (let seat = 0; seat < ships.length; seat++) {
        const ship = ships[seat]!
        if (ship.invulnerable && Math.floor(tick / 6) % 2 === 0) continue
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
        g.strokeStyle = '#fff'
        g.font = 'bold 9px sans-serif'
        g.strokeText(String(seat + 1), -3, -17)
        g.restore()
      }
      g.fillStyle = '#180d38cc'
      g.fillRect(0, 0, W, 26)
      g.fillStyle = '#ffe7f5'
      g.font = 'bold 11px monospace'
      g.fillText('PINKWAKE / ENGINE PREVIEW', 12, 17)
      g.textAlign = 'right'
      g.fillText(`SHOALS ${clearCount}  ·  ${count} PILOT${count > 1 ? 'S' : ''}`, W - 12, 17)
      g.textAlign = 'left'
    },
  }
}

const module: ArcadeGameModule = { create: createRainbowPrincessPreview }
export default module
export const create = createRainbowPrincessPreview
